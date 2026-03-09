import { useParams, useNavigate } from "react-router-dom";
import {
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useBidDetail } from "@hooks/useBids";
import { useTenderDetail } from "@hooks/useTenders";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Button from "@components/Button";
import { formatCurrency, formatDate, formatDateTime } from "@utils/formatters";

export default function BidDetailPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const { bid, loading: bidLoading, error: bidError } = useBidDetail(id || "");
  const { tender, loading: tenderLoading } = useTenderDetail(
    bid?.tenderId || "",
  );

  if (bidLoading || tenderLoading)
    return <Loading message="Loading bid details..." />;
  if (bidError) return <Error message={bidError} />;
  if (!bid) return <Error message="Bid not found" />;

  const isOwner = currentUser?.uid === bid.vendorId;
  const isReviewer =
    currentUser?.role === "buyer" || currentUser?.role === "admin";

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

      {/* Status Card */}
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
            <p className="text-gray-700 mt-1">{getStatusMessage(bid.status)}</p>
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
                  style={{ width: `${Math.min(bid.evaluationScore, 100)}%` }}
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
                    <p className="text-sm text-gray-500">Click to download</p>
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
          <p className="text-blue-800 whitespace-pre-wrap">{bid.feedback}</p>
        </div>
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

      {/* Actions */}
      {isReviewer && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Reviewer Actions
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            These actions would typically be performed through an admin
            interface
          </p>
          <div className="flex gap-3">
            <Button className="!bg-green-600 !hover:bg-green-700 !text-white">
              Approve Bid
            </Button>
            <Button
              variant="secondary"
              className="!border-red-600 !text-red-600"
            >
              Reject Bid
            </Button>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-center">
        <Button variant="secondary" onClick={() => navigate("/bids")}>
          Back to Bids
        </Button>
      </div>
    </div>
  );
}
