import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  Filter,
  Edit2,
  Trash2,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBids } from "@hooks/useBids";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Button from "@components/Button";
import TextArea from "@components/TextArea";
import { formatCurrency, formatDate } from "@utils/formatters";
import { Bid } from "@types";
import bidService from "@/services/bidService";
import tenderService from "@/services/tenderService";
import procurementEntityService from "@/services/procurementEntityService";

export default function BidsPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { bids, loading, error, refetch } = useBids();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingBidId, setDeletingBidId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null,
  );
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState<Map<string, any>>(new Map());
  const [loadingEval, setLoadingEval] = useState<string | null>(null);
  const [evaluatingBidId, setEvaluatingBidId] = useState<string | null>(null);
  const [evaluationForm, setEvaluationForm] = useState({
    price: 0,
    quality: 0,
    experience: 0,
    compliance: 0,
    comments: "",
    recommendedForAward: false,
  });
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);

  // Filter bids based on user role and status
  const filteredBids = bids.filter((bid: Bid) => {
    // If user is a bidder, show only their bids
    if (currentUser?.role === "vendor") {
      return (
        bid.vendorId === currentUser.uid &&
        (statusFilter === "all" || bid.status === statusFilter)
      );
    }
    // If user is buyer/admin, show all bids with status filter
    return statusFilter === "all" || bid.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "evaluated":
        return "bg-purple-100 text-purple-800";
      case "awarded":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBidStats = () => {
    const stats = {
      total: filteredBids.length,
      submitted: filteredBids.filter((b) => b.status === "submitted").length,
      evaluated: filteredBids.filter((b) => b.status === "evaluated").length,
      awarded: filteredBids.filter((b) => b.status === "awarded").length,
      rejected: filteredBids.filter((b) => b.status === "rejected").length,
    };
    return stats;
  };

  const loadEvaluation = async (bidId: string) => {
    if (evaluations.has(bidId)) {
      return;
    }

    try {
      setLoadingEval(bidId);
      const evalData =
        await procurementEntityService.getEvaluationForBid(bidId);
      setEvaluations((prev) => new Map(prev).set(bidId, evalData));
    } catch (error) {
      console.error("Error loading evaluation:", error);
    } finally {
      setLoadingEval(null);
    }
  };

  const handleBidRowClick = async (bidId: string) => {
    if (expandedBidId === bidId) {
      setExpandedBidId(null);
    } else {
      setExpandedBidId(bidId);
      // Load evaluation if bid is evaluated
      const bid = filteredBids.find((b: Bid) => b.id === bidId);
      if (bid?.status === "evaluated") {
        await loadEvaluation(bidId);
      }
    }
  };

  const calculateTotalScore = () => {
    const { price, quality, experience, compliance } = evaluationForm;
    return (price + quality + experience + compliance) / 4;
  };

  const handleEvaluationChange = (
    field: string,
    value: number | string | boolean,
  ) => {
    setEvaluationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const startEvaluation = (bidId: string) => {
    setEvaluatingBidId(bidId);
    // Reset form
    setEvaluationForm({
      price: 0,
      quality: 0,
      experience: 0,
      compliance: 0,
      comments: "",
      recommendedForAward: false,
    });
  };

  const submitEvaluation = async () => {
    if (!evaluatingBidId || !currentUser?.uid) {
      return;
    }

    const bid = filteredBids.find((b: Bid) => b.id === evaluatingBidId);
    if (!bid) return;

    try {
      setSubmittingEvaluation(true);
      const score = calculateTotalScore();

      await procurementEntityService.createEvaluation({
        bidId: evaluatingBidId,
        tenderId: bid.tenderId,
        evaluatorId: currentUser.uid,
        evaluatorName: currentUser.displayName || "Evaluator",
        vendorName: bid.vendorName,
        bidAmount: bid.amount,
        score,
        breakdown: {
          price: evaluationForm.price,
          quality: evaluationForm.quality,
          experience: evaluationForm.experience,
          compliance: evaluationForm.compliance,
        },
        comments: evaluationForm.comments,
        recommendedForAward: evaluationForm.recommendedForAward,
      });

      // Reload bids
      await refetch();
      setEvaluatingBidId(null);
      setExpandedBidId(evaluatingBidId); // Keep expanded to show results
    } catch (error) {
      console.error("Error saving evaluation:", error);
    } finally {
      setSubmittingEvaluation(false);
    }
  };

  const stats = getBidStats();

  const handleDeleteBid = async (bid: Bid) => {
    setDeletingBidId(bid.id);
    try {
      // Delete the bid
      await bidService.deleteBid(bid.id);

      // Decrement the tender's bid count
      const tender = await tenderService.getTender(bid.tenderId);
      if (tender) {
        const newBidCount = Math.max(0, (tender.bidCount || 1) - 1);
        await tenderService.updateTender(bid.tenderId, {
          bidCount: newBidCount,
        });
      }

      setShowDeleteConfirm(null);
      refetch();
    } catch (error) {
      console.error("Error deleting bid:", error);
      alert("Failed to delete bid. Please try again.");
    } finally {
      setDeletingBidId(null);
    }
  };

  if (loading) return <Loading message="Loading bids..." />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {currentUser?.role === "vendor" ? "My Bids" : "All Bids"}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {currentUser?.role === "vendor"
              ? "Track and manage your submitted bids"
              : "Review and manage all submitted bids"}
          </p>
        </div>
        {currentUser?.role === "vendor" && (
          <Link to="/tenders">
            <Button variant="secondary">Submit New Bid</Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-xs font-medium uppercase">
            Total Bids
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <p className="text-blue-700 text-xs font-medium uppercase">
            Submitted
          </p>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            {stats.submitted}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg shadow p-4">
          <p className="text-purple-700 text-xs font-medium uppercase">
            Evaluated
          </p>
          <p className="text-2xl font-bold text-purple-900 mt-2">
            {stats.evaluated}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <p className="text-green-700 text-xs font-medium uppercase">
            Awarded
          </p>
          <p className="text-2xl font-bold text-green-900 mt-2">
            {stats.awarded}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-red-700 text-xs font-medium uppercase">Rejected</p>
          <p className="text-2xl font-bold text-red-900 mt-2">
            {stats.rejected}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center gap-2">
        <Filter size={18} className="text-gray-600" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="evaluated">Evaluated</option>
          <option value="awarded">Awarded</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Bids Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {filteredBids.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">
              {currentUser?.role === "vendor"
                ? "You haven't submitted any bids yet"
                : "No bids found"}
            </p>
            {currentUser?.role === "vendor" && (
              <Link
                to="/tenders"
                className="text-secondary hover:underline mt-2 inline-block"
              >
                View Available Tenders
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  {currentUser?.role === "vendor" ? "Tender" : "Vendor"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Bid Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredBids.map((bid: Bid) => (
                <>
                  <tr
                    key={bid.id}
                    onClick={() => handleBidRowClick(bid.id)}
                    className="hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <ChevronDown
                          size={16}
                          className={`transition-transform ${expandedBidId === bid.id ? "rotate-180" : ""}`}
                        />
                        {currentUser?.role === "vendor"
                          ? bid.tenderTitle
                          : bid.vendorName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {formatCurrency(bid.amount, bid.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(bid.status)}`}
                      >
                        {bid.status.charAt(0).toUpperCase() +
                          bid.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {bid.evaluationScore ? (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                bid.evaluationScore >= 80
                                  ? "bg-green-500"
                                  : bid.evaluationScore >= 60
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                              }`}
                              style={{
                                width: `${Math.min(bid.evaluationScore, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="font-medium">
                            {bid.evaluationScore}/100
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(bid.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          to={`/bids/${bid.id}`}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-secondary text-white rounded hover:bg-blue-600 transition text-xs font-medium"
                        >
                          <Eye size={16} />
                          View
                        </Link>
                        {currentUser?.role === "vendor" &&
                          currentUser?.uid === bid.vendorId &&
                          (bid.status === "draft" ||
                            bid.status === "submitted") && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/bids/${bid.id}?edit=true`);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-xs font-medium"
                                title="Edit bid"
                              >
                                <Edit2 size={16} />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowDeleteConfirm(bid.id);
                                }}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-xs font-medium"
                                title="Delete bid"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </>
                          )}
                        {(currentUser?.role === "buyer" ||
                          currentUser?.role === "admin") &&
                          bid.status === "submitted" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEvaluation(bid.id);
                                if (expandedBidId !== bid.id) {
                                  setExpandedBidId(bid.id);
                                }
                              }}
                              className="inline-flex items-center gap-2 px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition text-xs font-medium"
                              title="Evaluate bid"
                            >
                              Evaluate
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>

                  {/* Evaluation Form or Details Row */}
                  {expandedBidId === bid.id &&
                    (evaluatingBidId === bid.id ||
                      bid.status === "evaluated") && (
                      <tr className="bg-purple-50 hover:bg-purple-50">
                        <td colSpan={6} className="px-6 py-6">
                          {evaluatingBidId === bid.id ? (
                            // Evaluation Form
                            <div className="space-y-6">
                              <h3 className="text-lg font-semibold text-purple-900">
                                Evaluate Bid
                              </h3>

                              {/* Price Score */}
                              <div>
                                <label className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Price Score (0-100)
                                  </span>
                                  <span className="text-sm text-purple-600 font-semibold">
                                    {evaluationForm.price}
                                  </span>
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={evaluationForm.price}
                                  onChange={(e) =>
                                    handleEvaluationChange(
                                      "price",
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>

                              {/* Quality Score */}
                              <div>
                                <label className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Quality Score (0-100)
                                  </span>
                                  <span className="text-sm text-purple-600 font-semibold">
                                    {evaluationForm.quality}
                                  </span>
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={evaluationForm.quality}
                                  onChange={(e) =>
                                    handleEvaluationChange(
                                      "quality",
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>

                              {/* Experience Score */}
                              <div>
                                <label className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Experience Score (0-100)
                                  </span>
                                  <span className="text-sm text-purple-600 font-semibold">
                                    {evaluationForm.experience}
                                  </span>
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={evaluationForm.experience}
                                  onChange={(e) =>
                                    handleEvaluationChange(
                                      "experience",
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>

                              {/* Compliance Score */}
                              <div>
                                <label className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    Compliance Score (0-100)
                                  </span>
                                  <span className="text-sm text-purple-600 font-semibold">
                                    {evaluationForm.compliance}
                                  </span>
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={evaluationForm.compliance}
                                  onChange={(e) =>
                                    handleEvaluationChange(
                                      "compliance",
                                      parseInt(e.target.value),
                                    )
                                  }
                                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>

                              {/* Overall Score Display */}
                              <div className="bg-white rounded-lg p-4 border border-purple-100">
                                <p className="text-purple-600 text-sm font-semibold uppercase">
                                  Overall Score
                                </p>
                                <p className="text-2xl font-bold text-purple-900 mt-2">
                                  {calculateTotalScore().toFixed(1)}
                                  <span className="text-sm text-gray-600">
                                    {" "}
                                    / 100
                                  </span>
                                </p>
                              </div>

                              {/* Comments */}
                              <div>
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                  Evaluator's Comments
                                </label>
                                <TextArea
                                  value={evaluationForm.comments}
                                  onChange={(e) =>
                                    handleEvaluationChange(
                                      "comments",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Add your evaluation comments here..."
                                  rows={4}
                                />
                              </div>

                              {/* Recommended for Award */}
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`award-${bid.id}`}
                                  checked={evaluationForm.recommendedForAward}
                                  onChange={(e) =>
                                    handleEvaluationChange(
                                      "recommendedForAward",
                                      e.target.checked,
                                    )
                                  }
                                  className="w-4 h-4 rounded border-gray-300"
                                />
                                <label
                                  htmlFor={`award-${bid.id}`}
                                  className="text-sm font-medium text-gray-700"
                                >
                                  Recommend for Award
                                </label>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3 pt-4">
                                <Button
                                  onClick={() => setEvaluatingBidId(null)}
                                  variant="secondary"
                                  disabled={submittingEvaluation}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={submitEvaluation}
                                  disabled={submittingEvaluation}
                                >
                                  {submittingEvaluation
                                    ? "Saving..."
                                    : "Save Evaluation"}
                                </Button>
                              </div>
                            </div>
                          ) : loadingEval === bid.id ? (
                            <p className="text-gray-600 text-center">
                              Loading evaluation details...
                            </p>
                          ) : evaluations.has(bid.id) &&
                            evaluations.get(bid.id) ? (
                            // Evaluation Details Display
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-purple-900 mb-4">
                                Evaluation Details
                              </h3>

                              {/* Score Breakdown Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white rounded-lg p-3 border border-purple-100">
                                  <p className="text-purple-600 text-xs font-semibold uppercase">
                                    Price
                                  </p>
                                  <p className="text-xl font-bold text-purple-900 mt-2">
                                    {evaluations.get(bid.id).breakdown?.price ||
                                      0}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    out of 40
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-purple-100">
                                  <p className="text-purple-600 text-xs font-semibold uppercase">
                                    Quality
                                  </p>
                                  <p className="text-xl font-bold text-purple-900 mt-2">
                                    {evaluations.get(bid.id).breakdown
                                      ?.quality || 0}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    out of 30
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-purple-100">
                                  <p className="text-purple-600 text-xs font-semibold uppercase">
                                    Experience
                                  </p>
                                  <p className="text-xl font-bold text-purple-900 mt-2">
                                    {evaluations.get(bid.id).breakdown
                                      ?.experience || 0}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    out of 20
                                  </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-purple-100">
                                  <p className="text-purple-600 text-xs font-semibold uppercase">
                                    Compliance
                                  </p>
                                  <p className="text-xl font-bold text-purple-900 mt-2">
                                    {evaluations.get(bid.id).breakdown
                                      ?.compliance || 0}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    out of 10
                                  </p>
                                </div>
                              </div>

                              {/* Overall Score & Recommendation */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="bg-white rounded-lg p-4 border border-purple-100">
                                  <p className="text-purple-600 text-sm font-semibold uppercase">
                                    Overall Score
                                  </p>
                                  <p className="text-2xl font-bold text-purple-900 mt-2">
                                    {evaluations.get(bid.id).score}
                                    <span className="text-sm text-gray-600">
                                      {" "}
                                      / 100
                                    </span>
                                  </p>
                                </div>
                                {evaluations.get(bid.id)
                                  .recommendedForAward && (
                                  <div className="bg-green-50 rounded-lg p-4 border border-green-200 flex items-center gap-3">
                                    <CheckCircle
                                      className="text-green-600"
                                      size={32}
                                    />
                                    <div>
                                      <p className="text-green-900 font-semibold">
                                        Recommended for Award
                                      </p>
                                      <p className="text-xs text-green-700">
                                        This bid meets the selection criteria
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Comments */}
                              {evaluations.get(bid.id).comments && (
                                <div className="bg-white rounded-lg p-4 border border-purple-100">
                                  <p className="text-purple-900 font-semibold mb-2 text-sm">
                                    Evaluator's Comments
                                  </p>
                                  <p className="text-purple-800 text-sm whitespace-pre-wrap">
                                    {evaluations.get(bid.id).comments}
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Bid?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this bid? This action cannot be
              undone.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowDeleteConfirm(null)}
                variant="secondary"
                disabled={!!deletingBidId}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const bid = bids.find((b) => b.id === showDeleteConfirm);
                  if (bid) handleDeleteBid(bid);
                }}
                disabled={!!deletingBidId}
                className="!bg-red-600 !hover:bg-red-700"
              >
                {deletingBidId === showDeleteConfirm ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      {currentUser?.role === "vendor" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            Bid Tracking Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p className="font-medium">Draft</p>
              <p>Bid hasn't been submitted yet</p>
            </div>
            <div>
              <p className="font-medium">Submitted</p>
              <p>Bid successfully submitted and awaiting evaluation</p>
            </div>
            <div>
              <p className="font-medium">Evaluated</p>
              <p>Your bid has been scored and is under consideration</p>
            </div>
            <div>
              <p className="font-medium">Awarded / Rejected</p>
              <p>Final decision has been made on your bid</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
