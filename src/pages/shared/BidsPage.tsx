import { Link } from "react-router-dom";
import { useBids } from "@hooks/useBids";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Badge from "@components/Badge";
import { formatCurrency, formatDate } from "@utils/formatters";
import { Bid } from "@types";

export default function BidsPage() {
  const { bids, loading, error } = useBids();

  if (loading) return <Loading message="Loading bids..." />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Bids</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                Amount
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
            {bids.map((bid: Bid) => (
              <tr key={bid.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  {bid.vendorName}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  {formatCurrency(bid.amount, bid.currency)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <Badge label={bid.status.toUpperCase()} status={bid.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {bid.evaluationScore ? `${bid.evaluationScore}/100` : "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(bid.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <Link
                    to={`/bids/${bid.id}`}
                    className="text-secondary hover:underline font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
