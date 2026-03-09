import { useEffect, useState } from "react";
import { useTenders } from "@hooks/useTenders";
import { useBids } from "@hooks/useBids";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Badge from "@components/Badge";
import { formatCurrency, formatDate } from "@utils/formatters";
import type { Tender } from "@types";

export default function DashboardPage() {
  const {
    tenders,
    loading: tendersLoading,
    error: tendersError,
  } = useTenders();
  const { bids, loading: bidsLoading, error: bidsError } = useBids();
  const [stats, setStats] = useState({
    totalTenders: 0,
    openTenders: 0,
    closedTenders: 0,
    totalBids: 0,
  });

  useEffect(() => {
    setStats({
      totalTenders: tenders.length,
      openTenders: tenders.filter((t) => t.status === "open").length,
      closedTenders: tenders.filter((t) => t.status === "closed").length,
      totalBids: bids.length,
    });
  }, [tenders, bids]);

  if (tendersLoading || bidsLoading)
    return <Loading message="Loading dashboard..." />;
  if (tendersError || bidsError)
    return (
      <Error message={tendersError || bidsError || "Error loading data"} />
    );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Tenders</p>
          <p className="text-3xl font-bold text-primary">
            {stats.totalTenders}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Open Tenders</p>
          <p className="text-3xl font-bold text-success">{stats.openTenders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Closed Tenders</p>
          <p className="text-3xl font-bold text-danger">
            {stats.closedTenders}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Bids</p>
          <p className="text-3xl font-bold text-secondary">{stats.totalBids}</p>
        </div>
      </div>

      {/* Recent Tenders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Tenders</h2>
        </div>
        {tenders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-gray-400 mb-3">
              <svg
                className="w-12 h-12 mx-auto"
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
            <p className="font-medium">No tenders available at the moment</p>
            <p className="text-sm mt-1">
              Procurement entities will publish tenders here soon.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Budget
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Deadline
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenders.slice(0, 5).map((tender: Tender) => (
                  <tr key={tender.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {tender.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(tender.budget, tender.currency)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge
                        label={tender.status.toUpperCase()}
                        status={tender.status}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(tender.deadline)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
    </div>
 );
}
