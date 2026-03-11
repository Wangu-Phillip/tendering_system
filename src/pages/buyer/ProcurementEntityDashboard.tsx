import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Filter, Trash2, Eye, Edit2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import procurementEntityService from "@/services/procurementEntityService";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

interface Bid {
  id: string;
  tenderId: string;
  tenderTitle: string;
  vendorName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

// Use type from service - matches the actual data structure

export default function ProcurementEntityDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [myTenders, setMyTenders] = useState<any[]>([]);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [stats, setStats] = useState({
    activeTenders: 0,
    totalBids: 0,
    closedTenders: 0,
    contractsAwarded: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, [currentUser?.uid]);

  const loadDashboardData = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const [tenders, allBids] = await Promise.all([
        procurementEntityService.getAllTenders(),
        procurementEntityService.getAllBids(),
      ]);

      setMyTenders(tenders);

      // Calculate stats
      const active = tenders.filter(
        (t) => t.status === "published" || t.status === "draft",
      ).length;
      const closed = tenders.filter((t) => t.status === "closed").length;

      setStats({
        activeTenders: active,
        totalBids: allBids.length,
        closedTenders: closed,
        contractsAwarded: 0, // Will update when we fetch contracts
      });

      // Get recent bids
      const recentBidsData = allBids.slice(0, 5);
      setRecentBids(recentBidsData);
    } catch (err) {
      const errorMessage =
        (err as Error)?.message || "Failed to load dashboard data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTender = async (tenderId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this tender? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await procurementEntityService.deleteTender(tenderId);
      setMyTenders(myTenders.filter((t) => t.id !== tenderId));
      // Update stats
      const active = myTenders.filter(
        (t) =>
          t.id !== tenderId &&
          (t.status === "published" || t.status === "draft"),
      ).length;
      const closed = myTenders.filter(
        (t) => t.id !== tenderId && t.status === "closed",
      ).length;
      setStats({
        ...stats,
        activeTenders: active,
        closedTenders: closed,
      });
    } catch (err) {
      const errorMessage = (err as Error)?.message || "Failed to delete tender";
      setError(errorMessage);
    }
  };

  if (loading) return <Loading message="Loading dashboard..." />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">
          Procurement Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Manage your tenders and review bids from vendors
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Active Tenders</p>
          <p className="text-3xl font-bold text-primary mt-2">
            {stats.activeTenders}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Total Bids Received</p>
          <p className="text-3xl font-bold text-secondary mt-2">
            {stats.totalBids}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Closed Tenders</p>
          <p className="text-3xl font-bold text-success mt-2">
            {stats.closedTenders}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-sm">Contracts Awarded</p>
          <p className="text-3xl font-bold text-warning mt-2">
            {stats.contractsAwarded}
          </p>
        </div>
      </div>

      {/* My Tenders */}
      <>
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
                  placeholder="Title or Tender ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            <div className="flex items-end gap-2">
              <button className="w-full px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium">
                <Filter size={18} />
                More Filters
              </button>
            </div>

            <div className="flex items-end gap-2">
              <Link
                to="/tenders/new"
                className="w-full px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={18} />
                Create Tender
              </Link>
            </div>
          </div>
        </div>

        {/* Tenders Table */}
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          {myTenders.length === 0 ? (
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
              <p className="font-medium">No tenders published yet</p>
              <p className="text-sm mt-1">
                Start by publishing your first tender to receive bids.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Open Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Close Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Bids
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {myTenders.map((tender) => (
                    <tr
                      key={tender.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {tender.title}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            tender.status === "published"
                              ? "bg-blue-100 text-blue-800"
                              : tender.status === "draft"
                                ? "bg-gray-100 text-gray-800"
                                : tender.status === "closed"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {tender.status.charAt(0).toUpperCase() +
                            tender.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(tender.openDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(tender.closeDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {
                          recentBids.filter((b) => b.tenderId === tender.id)
                            .length
                        }
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              navigate(`/bids/evaluate/${tender.id}`)
                            }
                            className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                            title="View Bids"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/tenders/edit/${tender.id}`, {
                                state: { tender },
                              })
                            }
                            className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-amber-600"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteTender(tender.id)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>

      {/* Recent Bid Submissions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-primary">
            Recent Bid Submissions
          </h2>
        </div>
        {recentBids.length === 0 ? (
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="font-medium">No bids received yet</p>
            <p className="text-sm mt-1">
              Bids from vendors will appear here once they submit responses to
              your tenders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-light border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                    Tender
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                    Bid Amount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-primary">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentBids.map((bid) => (
                  <tr
                    key={bid.id}
                    className="border-b hover:bg-light transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {bid.tenderTitle}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {bid.vendorName}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {bid.amount.toLocaleString()} {bid.currency}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          bid.status === "submitted"
                            ? "bg-success/20 text-success"
                            : "bg-warning/20 text-warning"
                        }`}
                      >
                        {bid.status.charAt(0).toUpperCase() +
                          bid.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(bid.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        to={`/bids/evaluate/${bid.tenderId}`}
                        className="text-secondary hover:text-blue-700 font-semibold"
                      >
                        Review & Evaluate
                      </Link>
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
