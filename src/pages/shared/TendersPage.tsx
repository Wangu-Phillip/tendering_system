import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTenders } from "@hooks/useTenders";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Badge from "@components/Badge";
import { formatCurrency, formatDate } from "@utils/formatters";
import { Tender } from "@types";

export default function TendersPage() {
  const { currentUser } = useAuth();
  const { tenders, loading, error } = useTenders();

  if (loading) return <Loading message="Loading tenders..." />;
  if (error) return <Error message={error} />;

  // Only buyers can create tenders
  const isBuyer = currentUser?.role === "buyer";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Tenders</h1>
        {isBuyer && (
          <Link
            to="/tenders/new"
            className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600"
          >
            Create Tender
          </Link>
        )}
      </div>

      {tenders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Tenders Available
            </h3>
            <p className="text-gray-600 mb-6">
              {isBuyer
                ? "You haven't created any tenders yet. Start by creating your first tender to begin receiving bids."
                : "There are currently no tenders available. Check back soon for new opportunities."}
            </p>
            {isBuyer && (
              <Link
                to="/tenders/new"
                className="inline-block px-6 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Create Your First Tender
              </Link>
            )}
          </div>
        </div>
      ) : (
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
      )}
      </div>
  );
}
