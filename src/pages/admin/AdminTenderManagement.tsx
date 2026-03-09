import { useState, useEffect } from "react";
import { Search, Filter, FileText, Eye, X, CheckCircle } from "lucide-react";
import tenderManagementService, {
  Tender,
  Contract,
} from "@/services/tenderManagementService";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

export default function AdminTenderManagement() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredTenders, setFilteredTenders] = useState<Tender[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"tenders" | "contracts">(
    "tenders",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterTenders();
  }, [tenders, searchTerm, filterStatus]);

  const getErrorMessage = (err: unknown): string => {
    if (err && typeof err === "object" && "message" in err) {
      return String((err as any).message);
    }
    return String(err) || "An error occurred";
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tendersData, contractsData] = await Promise.all([
        tenderManagementService.getAllTenders(),
        tenderManagementService.getAllContracts(),
      ]);

      setTenders(tendersData);
      setContracts(contractsData);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filterTenders = () => {
    let result = tenders;

    if (searchTerm) {
      result = result.filter(
        (tender) =>
          tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tender.id.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((tender) => tender.status === filterStatus);
    }

    setFilteredTenders(result);
  };

  const handleCancelTender = async () => {
    if (!selectedTender) return;

    try {
      await tenderManagementService.cancelTender(
        selectedTender.id,
        cancellationReason,
      );
      setTenders(
        tenders.map((t) =>
          t.id === selectedTender.id ? { ...t, status: "cancelled" } : t,
        ),
      );
      setShowModal(false);
      setCancellationReason("");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleUpdateTenderStatus = async (
    tenderId: string,
    newStatus: string,
  ) => {
    try {
      await tenderManagementService.updateTenderStatus(tenderId, newStatus);
      setTenders(
        tenders.map((t) =>
          t.id === tenderId ? { ...t, status: newStatus as any } : t,
        ),
      );
    } catch (err) {
      setError(getErrorMessage(err));
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

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">
          Tender & Contract Management
        </h1>
        <p className="text-gray-600 mt-1">
          Manage tenders, evaluations, and contracts
        </p>
      </div>

      {error && <Error message={error} />}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("tenders")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "tenders"
              ? "border-primary text-primary"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <FileText className="inline mr-2" size={20} />
          Tenders ({tenders.length})
        </button>
        <button
          onClick={() => setActiveTab("contracts")}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === "contracts"
              ? "border-primary text-primary"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          <CheckCircle className="inline mr-2" size={20} />
          Contracts ({contracts.length})
        </button>
      </div>

      {activeTab === "tenders" && (
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

              <div className="flex items-end">
                <button className="w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Filter size={18} />
                  More Filters
                </button>
              </div>
            </div>
          </div>

          {/* Tenders Table */}
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
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
                  {filteredTenders.length > 0 ? (
                    filteredTenders.map((tender) => (
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
                            {tender.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          BWP {tender.budget.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(tender.openDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(tender.closeDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => {
                              setSelectedTender(tender);
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
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No tenders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "contracts" && (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Tender ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Contractor ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Start Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    End Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {contracts.length > 0 ? (
                  contracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {contract.tenderId.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {contract.contractorId.substring(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        BWP {contract.value.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}
                        >
                          {contract.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(contract.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(contract.endDate).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No contracts found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tender Details Modal */}
      {showModal && selectedTender && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-primary">
                {selectedTender.title}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">Description</p>
                <p className="mt-1">{selectedTender.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="font-medium">
                    BWP {selectedTender.budget.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTender.status)}`}
                  >
                    {selectedTender.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Open Date</p>
                  <p className="font-medium">
                    {new Date(selectedTender.openDate).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Close Date</p>
                  <p className="font-medium">
                    {new Date(selectedTender.closeDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <select
                onChange={(e) =>
                  handleUpdateTenderStatus(selectedTender.id, e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
              >
                <option value="">Update Status...</option>
                <option value="published">Publish</option>
                <option value="closed">Close</option>
                <option value="evaluated">Mark as Evaluated</option>
                <option value="awarded">Mark as Awarded</option>
              </select>

              {selectedTender.status !== "cancelled" && (
                <>
                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Enter cancellation reason..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm resize-none"
                    rows={2}
                  />

                  <button
                    onClick={handleCancelTender}
                    className="w-full px-4 py-2 border border-danger text-danger rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
                  >
                    Cancel Tender
                  </button>
                </>
              )}

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
