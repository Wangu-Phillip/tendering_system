import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBidDetail } from "@hooks/useBids";
import { useTenderDetail } from "@hooks/useTenders";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Button from "@components/Button";
import Input from "@components/Input";
import TextArea from "@components/TextArea";
import { formatCurrency, formatDate, formatDateTime, formatAmountWhileTyping, blurFormatAmount, parseAmountInput } from "@utils/formatters";
import bidService from "@/services/bidService";
import tenderService from "@/services/tenderService";
import procurementEntityService from "@/services/procurementEntityService";

export default function BidDetailPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const shouldStartInEditMode = searchParams.get("edit") === "true";

  const {
    bid,
    loading: bidLoading,
    error: bidError,
    refetch,
  } = useBidDetail(id || "");
  const { tender, loading: tenderLoading } = useTenderDetail(
    bid?.tenderId || "",
  );

  const [isEditMode, setIsEditMode] = useState(shouldStartInEditMode);
  const [editData, setEditData] = useState({
    amount: bid?.amount
      ? bid.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "",
    currency: bid?.currency || "USD",
    description: bid?.description || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loadingEvaluation, setLoadingEvaluation] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [approvingBid, setApprovingBid] = useState(false);
  const [rejectingBid, setRejectingBid] = useState(false);

  // Fetch evaluation notes when bid is loaded
  useEffect(() => {
    if (id && bid?.status === "evaluated") {
      const fetchEvaluation = async () => {
        try {
          setLoadingEvaluation(true);
          const evalData =
            await procurementEntityService.getEvaluationForBid(id);
          setEvaluation(evalData);
        } catch (error) {
          console.error("Error fetching evaluation:", error);
        } finally {
          setLoadingEvaluation(false);
        }
      };
      fetchEvaluation();
    }
  }, [id, bid?.status]);

  if (bidLoading || tenderLoading)
    return <Loading message="Loading bid details..." />;
  if (bidError) return <Error message={bidError} />;
  if (!bid) return <Error message="Bid not found" />;

  const isOwner = currentUser?.uid === bid.vendorId;
  const isReviewer =
    currentUser?.role === "buyer" || currentUser?.role === "admin";
  const MAX_EDITS = 3;
  const editCount = bid.editCount ?? 0;
  const editsRemaining = MAX_EDITS - editCount;
  const canEdit =
    isOwner &&
    (bid.status === "draft" || bid.status === "submitted") &&
    editsRemaining > 0;
  const canDelete =
    isOwner && (bid.status === "draft" || bid.status === "submitted");

  const approveBid = async () => {
    setApprovingBid(true);
    try {
      await bidService.updateBid(bid.id, { status: "awarded" });
      setShowApproveConfirm(false);
      refetch();
    } catch (error) {
      console.error("Error approving bid:", error);
      alert("Failed to approve bid. Please try again.");
    } finally {
      setApprovingBid(false);
    }
  };

  const rejectBidHandler = async () => {
    setRejectingBid(true);
    try {
      await bidService.updateBid(bid.id, {
        status: "rejected",
      });
      setShowRejectConfirm(false);
      setRejectReason("");
      refetch();
    } catch (error) {
      console.error("Error rejecting bid:", error);
      alert("Failed to reject bid. Please try again.");
    } finally {
      setRejectingBid(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "awarded":
        return <CheckCircle className="text-green-600" size={24} />;
      case "rejected":
        return <XCircle className="text-red-600" size={24} />;
      case "submitted":
      case "evaluated":
        return <Clock className="text-blue-600" size={24} />;
      case "draft":
        return <AlertCircle className="text-gray-600" size={24} />;
      default:
        return <AlertCircle className="text-gray-600" size={24} />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "draft":
        return "This bid is still in draft and has not been submitted yet.";
      case "submitted":
        return "Your bid has been successfully submitted and is awaiting evaluation.";
      case "evaluated":
        return "Your bid has been evaluated and scored.";
      case "awarded":
        return "Congratulations! Your bid has been selected and awarded.";
      case "rejected":
        return "Unfortunately, your bid was not selected for this tender.";
      default:
        return "Bid status under review.";
    }
  };

  const handleEditSave = async () => {
    const parsedAmount = parseAmountInput(editData.amount);
    if (!editData.amount || parsedAmount <= 0) {
      alert("Please enter a valid bid amount");
      return;
    }
    if (!editData.description.trim()) {
      alert("Please enter a bid description");
      return;
    }

    setIsSaving(true);
    try {
      await bidService.updateBid(bid.id, {
        amount: parsedAmount,
        currency: editData.currency,
        description: editData.description,
        editCount: editCount + 1,
        updatedAt: new Date(),
      });
      setIsEditMode(false);
      // Clean up the query parameter
      navigate(`/bids/${bid.id}`, { replace: true });
      refetch();
    } catch (error) {
      console.error("Error updating bid:", error);
      alert("Failed to update bid. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBid = async () => {
    setIsDeleting(true);
    try {
      // Delete the bid
      await bidService.deleteBid(bid.id);

      // Decrement the tender's bid count
      if (tender) {
        const newBidCount = Math.max(0, (tender.bidCount || 1) - 1);
        await tenderService.updateTender(tender.id, {
          bidCount: newBidCount,
        });
      }

      setShowDeleteConfirm(false);
      navigate("/bids", { replace: true });
    } catch (error) {
      console.error("Error deleting bid:", error);
      alert("Failed to delete bid. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bid Details</h1>
          <p className="text-gray-600 mt-1">
            {tender?.title || "Tender"} - {formatDate(bid.createdAt, "short")}
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-secondary hover:underline font-medium text-sm"
        >
          ← Back
        </button>
      </div>

      {/* Owner Actions */}
      {(canEdit || canDelete) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-900">
              Your Actions
            </h2>
            {isOwner &&
              (bid.status === "draft" || bid.status === "submitted") && (
                <span
                  className={`text-sm font-medium ${editsRemaining > 0 ? "text-blue-700" : "text-red-600"}`}
                >
                  {editsRemaining > 0
                    ? `${editsRemaining} edit${editsRemaining === 1 ? "" : "s"} remaining`
                    : "No edits remaining"}
                </span>
              )}
          </div>
          {isEditMode ? (
            <div className="space-y-4">
              <p className="text-blue-800 text-sm">
                You can edit your bid details until it's evaluated.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => setIsEditMode(false)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button onClick={handleEditSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              {canEdit && (
                <Button
                  onClick={() => {
                    setEditData({
                      amount: bid.amount,
                      currency: bid.currency,
                      description: bid.description,
                    });
                    setIsEditMode(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Edit2 size={18} />
                  Edit Bid
                </Button>
              )}
              {canDelete && (
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="secondary"
                  className="!border-red-600 !text-red-600 flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Bid
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Form */}
      {isEditMode && (
        <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Bid</h2>
          <div className="space-y-4">
            {/* Bid Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bid Amount *
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editData.amount}
                  onChange={(e) =>
                    setEditData({ ...editData, amount: formatAmountWhileTyping(e.target.value) })
                  }
                  onBlur={() =>
                    setEditData((prev) => ({ ...prev, amount: blurFormatAmount(prev.amount) }))
                  }
                  disabled={isSaving}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <p className="w-full px-4 py-2 border border-gray-100 bg-gray-50 rounded-lg text-gray-700 text-sm">
                  BWP (Botswana Pula)
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposal / Description *
              </label>
              <TextArea
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
                disabled={isSaving}
                rows={5}
                placeholder="Describe your proposal, approach, and why you're the best choice for this tender..."
              />
              <p className="text-xs text-gray-500 mt-1">
                {editData.description.length} characters
              </p>
            </div>

            <p className="text-sm text-gray-600">
              You cannot edit attachments. To change files, please delete this
              bid and create a new one.
            </p>
          </div>
        </div>
      )}

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
                onClick={() => setShowDeleteConfirm(false)}
                variant="secondary"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteBid}
                disabled={isDeleting}
                className="!bg-red-600 !hover:bg-red-700"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Card */}
      {!isEditMode && (
        <>
          <div
            className={`rounded-lg p-6 border-l-4 ${
              bid.status === "awarded"
                ? "bg-green-50 border-green-400"
                : bid.status === "rejected"
                  ? "bg-red-50 border-red-400"
                  : bid.status === "submitted"
                    ? "bg-blue-50 border-blue-400"
                    : "bg-gray-50 border-gray-400"
            }`}
          >
            <div className="flex items-start gap-4">
              {getStatusIcon(bid.status)}
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 capitalize">
                  {bid.status}
                </h3>
                <p className="text-gray-700 mt-1">
                  {getStatusMessage(bid.status)}
                </p>
              </div>
            </div>
          </div>

          {/* Bid Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bid Amount */}
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium uppercase">
                Bid Amount
              </p>
              <p className="text-3xl font-bold text-primary mt-2">
                {formatCurrency(bid.amount, bid.currency)}
              </p>
              <p className="text-xs text-gray-500 mt-2">{bid.currency}</p>
            </div>

            {/* Evaluation Score */}
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium uppercase">
                Evaluation Score
              </p>
              {bid.evaluationScore ? (
                <div className="mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-secondary">
                      {bid.evaluationScore}
                    </span>
                    <span className="text-gray-600">/100</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3 overflow-hidden">
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
                  <p className="text-xs text-gray-500 mt-2">
                    {bid.evaluationScore >= 80
                      ? "Excellent"
                      : bid.evaluationScore >= 60
                        ? "Good"
                        : "Needs improvement"}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 mt-2">Pending evaluation</p>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-medium uppercase">
                Timeline
              </p>
              <div className="space-y-3 mt-2">
                <div>
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(bid.createdAt)}
                  </p>
                </div>
                {bid.updatedAt && (
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="font-medium text-gray-900">
                      {formatDateTime(bid.updatedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bid Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Proposal / Description
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {bid.description}
            </div>
          </div>

          {/* Vendor Information */}
          {!isOwner && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Vendor Information
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-600 text-sm">Vendor Name</p>
                  <p className="font-medium text-gray-900">{bid.vendorName}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Vendor ID</p>
                  <p className="font-medium text-gray-900 font-mono text-sm">
                    {bid.vendorId}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          {bid.attachments && bid.attachments.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Attachments
              </h2>
              <div className="space-y-3">
                {bid.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment}
                    download
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="text-secondary" size={20} />
                      <div>
                        <p className="font-medium text-gray-900">
                          Document {index + 1}
                        </p>
                        <p className="text-sm text-gray-500">
                          Click to download
                        </p>
                      </div>
                    </div>
                    <Download className="text-gray-400" size={18} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Evaluation Feedback */}
          {bid.feedback && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">
                Evaluator Feedback
              </h2>
              <p className="text-blue-800 whitespace-pre-wrap">
                {bid.feedback}
              </p>
            </div>
          )}

          {/* Evaluation Notes */}
          {bid.status === "evaluated" && (
            <>
              {loadingEvaluation ? (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  <p>Loading evaluation notes...</p>
                </div>
              ) : evaluation ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-purple-900 mb-4">
                    Evaluation Notes & Breakdown
                  </h2>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-purple-600 text-xs font-semibold uppercase">
                        Price
                      </p>
                      <p className="text-2xl font-bold text-purple-900 mt-2">
                        {evaluation.breakdown?.price || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">out of 40</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-purple-600 text-xs font-semibold uppercase">
                        Quality
                      </p>
                      <p className="text-2xl font-bold text-purple-900 mt-2">
                        {evaluation.breakdown?.quality || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">out of 30</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-purple-600 text-xs font-semibold uppercase">
                        Experience
                      </p>
                      <p className="text-2xl font-bold text-purple-900 mt-2">
                        {evaluation.breakdown?.experience || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">out of 20</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <p className="text-purple-600 text-xs font-semibold uppercase">
                        Compliance
                      </p>
                      <p className="text-2xl font-bold text-purple-900 mt-2">
                        {evaluation.breakdown?.compliance || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">out of 10</p>
                    </div>
                  </div>

                  {/* Overall Score */}
                  <div className="bg-white rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-600 text-sm font-semibold uppercase">
                          Overall Score
                        </p>
                        <p className="text-3xl font-bold text-purple-900 mt-2">
                          {evaluation.score}
                          <span className="text-lg text-gray-600"> / 100</span>
                        </p>
                      </div>
                      {evaluation.recommendedForAward && (
                        <div className="text-green-600 flex flex-col items-center">
                          <CheckCircle size={40} />
                          <p className="text-sm font-semibold mt-2">
                            Recommended for Award
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Evaluator Comments */}
                  {evaluation.comments && (
                    <div className="bg-white rounded-lg p-4 border border-purple-100">
                      <p className="text-purple-900 font-semibold mb-2 text-sm">
                        Evaluator's Comments
                      </p>
                      <p className="text-purple-800 whitespace-pre-wrap text-sm">
                        {evaluation.comments}
                      </p>
                    </div>
                  )}

                  {/* Evaluator Info */}
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-xs text-purple-700">
                      Evaluated by:{" "}
                      <span className="font-semibold">
                        {evaluation.evaluatorName}
                      </span>
                      <br />
                      Evaluation Date:{" "}
                      <span className="font-semibold">
                        {formatDateTime(evaluation.createdAt)}
                      </span>
                    </p>
                  </div>

                  {/* Reviewer Actions */}
                  {isReviewer && (
                    <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
                      <p className="text-gray-700 font-semibold mb-2 text-sm">
                        Reviewer Actions
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setShowApproveConfirm(true)}
                          disabled={approvingBid}
                          className="!bg-green-600 !hover:bg-green-700 flex-1"
                        >
                          {approvingBid ? "Approving..." : "Approve Bid"}
                        </Button>
                        <Button
                          onClick={() => setShowRejectConfirm(true)}
                          disabled={rejectingBid}
                          className="!bg-red-600 !hover:bg-red-700 flex-1"
                        >
                          {rejectingBid ? "Rejecting..." : "Reject Bid"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </>
          )}

          {/* Tender Reference */}
          {tender && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Tender Information
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 text-xs font-medium uppercase">
                    Title
                  </p>
                  <p className="font-medium text-gray-900">{tender.title}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs font-medium uppercase">
                    Budget
                  </p>
                  <p className="font-medium text-gray-900">
                    {formatCurrency(tender.budget, tender.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs font-medium uppercase">
                    Category
                  </p>
                  <p className="font-medium text-gray-900">{tender.category}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => navigate(`/tenders/${tender.id}`)}
                className="mt-4"
              >
                View Tender Details
              </Button>
            </div>
          )}
        </>
      )}

      {/* Back Button */}
      <div className="flex justify-center">
        <Button variant="secondary" onClick={() => navigate("/bids")}>
          Back to Bids
        </Button>
      </div>

      {/* Approve Confirmation Dialog */}
      {showApproveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Approve Bid?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to approve this bid and award the contract?
              This bid will be marked as awarded.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowApproveConfirm(false)}
                variant="secondary"
                disabled={approvingBid}
              >
                Cancel
              </Button>
              <Button
                onClick={approveBid}
                disabled={approvingBid}
                className="!bg-green-600 !hover:bg-green-700"
              >
                {approvingBid ? "Approving..." : "Approve"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Dialog */}
      {showRejectConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reject Bid?
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to reject this bid? Please provide a reason
              for the rejection.
            </p>
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Rejection Reason
              </label>
              <TextArea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this bid is being rejected..."
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowRejectConfirm(false);
                  setRejectReason("");
                }}
                variant="secondary"
                disabled={rejectingBid}
              >
                Cancel
              </Button>
              <Button
                onClick={rejectBidHandler}
                disabled={rejectingBid || !rejectReason.trim()}
                className="!bg-red-600 !hover:bg-red-700"
              >
                {rejectingBid ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
