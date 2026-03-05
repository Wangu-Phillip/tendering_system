import { useParams } from "react-router-dom";
import { useBidDetail } from "@hooks/useBids";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Badge from "@components/Badge";
import Button from "@components/Button";
import { formatCurrency, formatDate } from "@utils/formatters";

export default function BidDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { bid, loading, error } = useBidDetail(id || "");

  if (loading) return <Loading message="Loading bid..." />;
  if (error) return <Error message={error} />;
  if (!bid) return <Error message="Bid not found" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bid from {bid.vendorName}
          </h1>
          <p className="text-gray-600 mt-2">{bid.description}</p>
        </div>
        <Badge label={bid.status.toUpperCase()} status={bid.status} />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Bid Amount</p>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(bid.amount, bid.currency)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Evaluation Score</p>
          <p className="text-3xl font-bold text-secondary">
            {bid.evaluationScore || "-"}/100
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Submitted Date</p>
          <p className="font-semibold text-gray-900">
            {formatDate(bid.createdAt, "long")}
          </p>
        </div>
      </div>

      {bid.feedback && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Evaluation Feedback
          </h3>
          <p className="text-blue-800">{bid.feedback}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="flex gap-3">
          <Button>Approve</Button>
          <Button>Reject</Button>
          <Button variant="secondary">View Documents</Button>
        </div>
      </div>
    </div>
  );
}
