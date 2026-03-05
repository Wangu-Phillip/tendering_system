import { Link } from "react-router-dom";
import { useTenders } from "@hooks/useTenders";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Badge from "@components/Badge";
import { formatCurrency, formatDate } from "@utils/formatters";
import { Tender } from "@types";

export default function TendersPage() {
  const { tenders, loading, error } = useTenders();

  if (loading) return <Loading message="Loading tenders..." />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tenders</h1>
        <Link
          to="/tenders/new"
          className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600"
        >
          Create Tender
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tenders.map((tender: Tender) => (
          <Link
            key={tender.id}
            to={`/tenders/${tender.id}`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {tender.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {tender.description}
                </p>
              </div>
              <Badge
                label={tender.status.toUpperCase()}
                status={tender.status}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Budget</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(tender.budget, tender.currency)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Deadline</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(tender.deadline)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Bids</p>
                <p className="font-semibold text-gray-900">{tender.bidCount}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
