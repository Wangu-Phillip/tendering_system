import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Eye, Edit2, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTenders } from "@hooks/useTenders";
import procurementEntityService from "@/services/procurementEntityService";
import Loading from "@components/Loading";
import Error from "@components/Error";
import { Tender } from "@types";

export default function TendersPage() {
  const { currentUser } = useAuth();
  const { tenders, loading, error } = useTenders();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [pageError, setPageError] = useState<string | null>(null);

  const isBuyer = currentUser?.role === "buyer";

  const filteredTenders = tenders.filter((tender: Tender) => {
    const matchesSearch =
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || tender.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
      window.location.reload();
    } catch (err) {
      const errorMessage = (err as Error)?.message || "Failed to delete tender";
      setPageError(errorMessage);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "published":
        return "bg-blue-100 text-blue-800";
      case "closed":
        return "bg-yellow-100 text-yellow-800";
      case "evaluated":
        return "bg-purple-100 text-purple-800";
      case "awarded":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) return <Loading message="Loading tenders..." />;
  if (error) return <Error message={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Tenders</h1>
        <p className="text-gray-600 mt-1">
          Browse and manage all available tenders
        </p>
      </div>

      {pageError && <Error message={pageError} />}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="closed">Closed</option>
              <option value="evaluated">Evaluated</option>
              <option value="awarded">Awarded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {isBuyer && (
            <div className="flex items-end gap-2">
              <Link
                to="/tenders/new"
                className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Plus size={18} />
                Create Tender
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tenders Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        {filteredTenders.length === 0 ? (
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
            <p className="font-medium">No tenders found</p>
            <p className="text-sm mt-1">
              {isBuyer
                ? "Create your first tender to get started."
                : "Check back soon for new tender opportunities."}
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
                    Budget
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Open Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Close Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTenders.map((tender: Tender) => (
                  <tr
                    key={tender.id}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {tender.title}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tender.status)}`}
                      >
                        {tender.status.charAt(0).toUpperCase() +
                          tender.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {tender.currency} {tender.budget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tender.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tender.closeDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2">
                        <Link
                          to={`/tenders/${tender.id}`}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                          title="View"
                        >
                          <Eye size={18} />
                        </Link>
                        {isBuyer && (
                          <>
                            <Link
                              to={`/tenders/edit/${tender.id}`}
                              state={{ tender }}
                              className="p-2 hover:bg-amber-100 rounded-lg transition-colors text-amber-600"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </Link>
                            <button
                              onClick={() => handleDeleteTender(tender.id)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
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
