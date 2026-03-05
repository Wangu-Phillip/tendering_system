import { useParams } from "react-router-dom";
import { useTenderDetail } from "@hooks/useTenders";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Badge from "@components/Badge";
import Button from "@components/Button";
import { formatCurrency, formatDate, formatDateTime } from "@utils/formatters";

export default function TenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tender, loading, error } = useTenderDetail(id || "");

  if (loading) return <Loading message="Loading tender..." />;
  if (error) return <Error message={error} />;
  if (!tender) return <Error message="Tender not found" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tender.title}</h1>
          <p className="text-gray-600 mt-2">{tender.description}</p>
        </div>
        <Badge label={tender.status.toUpperCase()} status={tender.status} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 text-sm">Budget</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(tender.budget, tender.currency)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Category</p>
              <p className="font-semibold text-gray-900">{tender.category}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Deadline</p>
              <p className="font-semibold text-gray-900">
                {formatDate(tender.deadline, "long")}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Bids</p>
              <p className="font-semibold text-gray-900">{tender.bidCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Created</p>
              <p className="font-semibold text-gray-900">
                {formatDateTime(tender.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Last Updated</p>
              <p className="font-semibold text-gray-900">
                {formatDateTime(tender.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="flex gap-3">
          <Button>Submit Bid</Button>
          <Button variant="secondary">View Bids</Button>
          <Button variant="secondary">Download Documents</Button>
        </div>
      </div>
    </div>
  );
}
