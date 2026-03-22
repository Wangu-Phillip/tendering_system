import { useState, useEffect } from "react";
import { Search, Filter, CheckCircle, Star, Eye } from "lucide-react";
import bidProcessingService from "@/services/bidProcessingService";
import { Bid } from "@/types";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

export default function AdminBidProcessing() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [filteredBids, setFilteredBids] = useState<Bid[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [evaluationScore, setEvaluationScore] = useState(0);
  const [evaluationFeedback, setEvaluationFeedback] = useState("");

  useEffect(() => {
    loadBids();
  }, []);

  useEffect(() => {
    filterBids();
  }, [bids, searchTerm, filterStatus]);

  const getErrorMessage = (err: unknown): string => {
    if (err && typeof err === "object" && "message" in err) {
      return String((err as any).message);
    }
    return String(err) || "An error occurred";
  };

  const loadBids = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Starting to fetch bids...");
      const allBids = await bidProcessingService.getAllBidsForProcessing();
      console.log("Fetched bids from service:", allBids);
      // Filter out invalid bids that don't have required fields
      const validBids = allBids.filter(
        (bid) =>
          bid &&
          bid.id &&
          bid.tenderId &&
          bid.vendorId &&
          bid.amount !== undefined,
      );
      console.log("Valid bids after filtering:", validBids);
      setBids(validBids);
    } catch (err) {
      console.error("Error loading bids:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filterBids = () => {
    let result = bids;

    if (searchTerm) {
      result = result.filter(
        (bid) =>
          bid.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          false ||
          bid.tenderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          false ||
          bid.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          false,
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((bid) => bid.status === filterStatus);
    }

    setFilteredBids(result);
  };

  const handleEvaluateBid = async () => {
    if (!selectedBid) return;

    try {
      await bidProcessingService.evaluateBid(
        selectedBid.id,
        evaluationScore,
        evaluationFeedback,
        "admin",
      );
      setSelectedBid({
        ...selectedBid,
        evaluationScore,
        feedback: evaluationFeedback,
      });
      loadBids();
      setShowModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleRejectBid = async (bidId: string, reason: string) => {
    try {
      await bidProcessingService.rejectBid(bidId, reason);
      loadBids();
      setShowModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleAwardBid = async (bidId: string, tenderId: string) => {
    if (!confirm("Are you sure you want to award this bid?")) return;

    try {
      await bidProcessingService.awardBid(bidId, tenderId);
      loadBids();
      setShowModal(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "compliant":
        return "bg-green-100 text-green-800";
      case "non_compliant":
        return "bg-red-100 text-red-800";
      case "shortlisted":
        return "bg-purple-100 text-purple-800";
      case "awarded":
        return "bg-success/20 text-success";
      case "rejected":
        return "bg-danger/20 text-danger";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Bid Processing</h1>
        <p className="text-gray-600 mt-1">
          Validate, evaluate, and process bids from bidders
        </p>
      </div>

      {error && <Error message={error} />}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Bid ID, Tender ID, or Bidder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="compliant">Compliant</option>
              <option value="non_compliant">Non-Compliant</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="awarded">Awarded</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <Filter size={18} />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bids Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  #
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Vendor Name
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Score
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Submitted
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBids.length > 0 ? (
                filteredBids.map((bid, index) => (
                  <tr
                    key={bid.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {bid.vendorName || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {bid.amount
                        ? `${bid.currency} ${bid.amount.toLocaleString()}`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(bid.status || "")}`}
                      >
                        {bid.status ? bid.status.replace("_", " ") : "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {bid.evaluationScore ? (
                        <div className="flex items-center gap-1">
                          <Star className="text-warning" size={16} />
                          <span>{bid.evaluationScore}/100</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {bid.createdAt
                        ? new Date(
                            typeof bid.createdAt === "object" &&
                              "seconds" in bid.createdAt
                              ? (bid.createdAt as any).seconds * 1000
                              : bid.createdAt,
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          setSelectedBid(bid);
                          setShowModal(true);
                        }}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No bids found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bid Details Modal */}
      {showModal && selectedBid && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold text-primary mb-4">Bid Details</h3>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Bid ID</p>
                <p className="font-medium">{selectedBid.id}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBid.status)}`}
                >
                  {selectedBid.status.replace("_", " ")}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-600">Amount</p>
                <p className="font-medium">
                  {selectedBid.currency} {selectedBid.amount.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Evaluation Score</p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={evaluationScore}
                  onChange={(e) => setEvaluationScore(Number(e.target.value))}
                  placeholder="Enter score (0-100)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                />
              </div>

              <div>
                <p className="text-sm text-gray-600">Feedback</p>
                <textarea
                  value={evaluationFeedback}
                  onChange={(e) => setEvaluationFeedback(e.target.value)}
                  placeholder="Enter evaluation feedback..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleEvaluateBid}
                className="w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors font-medium text-sm"
              >
                <CheckCircle className="inline mr-2" size={16} />
                Save Evaluation
              </button>

              <button
                onClick={() => {
                  const reason = prompt("Enter rejection reason:");
                  if (reason) handleRejectBid(selectedBid.id, reason);
                }}
                className="w-full px-4 py-2 border border-danger text-danger rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
              >
                Reject Bid
              </button>

              <button
                onClick={() =>
                  handleAwardBid(selectedBid.id, selectedBid.tenderId)
                }
                className="w-full px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors font-medium text-sm"
              >
                Award Bid
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
