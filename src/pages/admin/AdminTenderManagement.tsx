import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  Eye,
  X,
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
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

  // Form modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [evaluationCriteria, setEvaluationCriteria] = useState<any[]>([
    { name: "Price", weight: 40, description: "" },
    { name: "Quality", weight: 30, description: "" },
    { name: "Experience", weight: 20, description: "" },
    { name: "Compliance", weight: 10, description: "" },
  ]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    procuringEntityId: "admin",
    openDate: "",
    closeDate: "",
    budget: 0,
    currency: "BWP",
    status: "draft" as
      | "draft"
      | "published"
      | "closed"
      | "evaluated"
      | "awarded"
      | "cancelled",
    category: "",
    documents: [] as string[],
    evaluationCriteria: [] as any[],
  });

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

  const handleCriteriaChange = (
    index: number,
    field: string,
    value: string | number,
  ) => {
    const newCriteria = [...evaluationCriteria];
    newCriteria[index] = {
      ...newCriteria[index],
      [field]: field === "weight" ? parseFloat(value as string) || 0 : value,
    };
    setEvaluationCriteria(newCriteria);
  };

  const addCriterion = () => {
    setEvaluationCriteria([
      ...evaluationCriteria,
      { name: "", weight: 0, description: "" },
    ]);
  };

  const removeCriterion = (index: number) => {
    setEvaluationCriteria(evaluationCriteria.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments([...documents, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const openCreateForm = () => {
    setIsEditing(false);
    setFormData({
      title: "",
      description: "",
      procuringEntityId: "admin",
      openDate: "",
      closeDate: "",
      budget: 0,
      currency: "BWP",
      status: "draft",
      category: "",
      documents: [],
      evaluationCriteria: [],
    });
    setEvaluationCriteria([
      { name: "Price", weight: 40, description: "" },
      { name: "Quality", weight: 30, description: "" },
      { name: "Experience", weight: 20, description: "" },
      { name: "Compliance", weight: 10, description: "" },
    ]);
    setDocuments([]);
    setShowFormModal(true);
  };

  const openEditForm = (tender: Tender) => {
    setIsEditing(true);
    setFormData({
      title: tender.title,
      description: tender.description,
      procuringEntityId: tender.procuringEntityId,
      openDate: tender.openDate.split("T")[0],
      closeDate: tender.closeDate.split("T")[0],
      budget: tender.budget,
      currency: (tender as any).currency || "BWP",
      status: tender.status,
      category: tender.category,
      documents: tender.documents,
      evaluationCriteria: tender.evaluationCriteria,
    });
    setEvaluationCriteria(tender.evaluationCriteria || []);
    setDocuments([]);
    setSelectedTender(tender);
    setShowFormModal(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "budget" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleCreateTender = async () => {
    try {
      if (
        !formData.title ||
        !formData.description ||
        !formData.openDate ||
        !formData.closeDate
      ) {
        setError("Please fill in all required fields");
        return;
      }

      if (new Date(formData.closeDate) <= new Date(formData.openDate)) {
        setError("Close date must be after open date");
        return;
      }

      await tenderManagementService.createTender({
        ...formData,
        openDate: new Date(formData.openDate).toISOString(),
        closeDate: new Date(formData.closeDate).toISOString(),
        evaluationCriteria,
        documents: documents.map((f) => f.name),
      });

      setShowFormModal(false);
      setError(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleEditTender = async () => {
    if (!selectedTender) return;

    try {
      if (
        !formData.title ||
        !formData.description ||
        !formData.openDate ||
        !formData.closeDate
      ) {
        setError("Please fill in all required fields");
        return;
      }

      if (new Date(formData.closeDate) <= new Date(formData.openDate)) {
        setError("Close date must be after open date");
        return;
      }

      await tenderManagementService.updateTender(selectedTender.id, {
        ...formData,
        openDate: new Date(formData.openDate).toISOString(),
        closeDate: new Date(formData.closeDate).toISOString(),
        evaluationCriteria,
        documents:
          documents.length > 0
            ? documents.map((f) => f.name)
            : formData.documents,
      });

      setShowFormModal(false);
      setError(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
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
      await tenderManagementService.deleteTender(tenderId);
      setError(null);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
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

              <div className="flex items-end gap-2">
                <button
                  onClick={openCreateForm}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus size={18} />
                  Create Tender
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
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedTender(tender);
                                setShowModal(true);
                              }}
                              className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => openEditForm(tender)}
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

      {/* Tender Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-6xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-bold text-primary">
                {isEditing ? "Edit Tender" : "Create New Tender"}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tender Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Enter tender title"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Enter tender description"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="">Select a category</option>
                    <option value="Construction">Construction</option>
                    <option value="IT & Technology">IT & Technology</option>
                    <option value="Services">Services</option>
                    <option value="Supplies & Materials">
                      Supplies & Materials
                    </option>
                    <option value="Consulting">Consulting</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget
                  </label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleFormChange}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={formData.currency}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                  >
                    <option value="BWP">BWP (Botswana Pula)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="ZAR">ZAR (South African Rand)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-semibold text-gray-700">
                      Evaluation Criteria
                    </label>
                    <span className="text-xs text-green-600">
                      Total Weight:{" "}
                      {evaluationCriteria.reduce((sum, c) => sum + c.weight, 0)}
                      %
                    </span>
                  </div>

                  <div className="space-y-4">
                    {evaluationCriteria.map((criteria, index) => (
                      <div
                        key={index}
                        className="space-y-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Criterion Name{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={criteria.name}
                              onChange={(e) =>
                                handleCriteriaChange(
                                  index,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="e.g., Price"
                              className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Weight (%) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              value={criteria.weight}
                              onChange={(e) =>
                                handleCriteriaChange(
                                  index,
                                  "weight",
                                  e.target.value,
                                )
                              }
                              placeholder="0"
                              min="0"
                              max="100"
                              step="1"
                              className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                            />
                          </div>

                          <div className="flex items-end">
                            {evaluationCriteria.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeCriterion(index)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X size={18} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={criteria.description}
                            onChange={(e) =>
                              handleCriteriaChange(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Describe how this criterion will be evaluated"
                            rows={2}
                            className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm resize-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addCriterion}
                    className="mt-2 px-3 py-1 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Plus size={16} /> Add Criterion
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Tender Documents
                  </label>

                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                    <label className="cursor-pointer block">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="text-gray-600 text-sm">
                        <p className="font-medium">Click to upload documents</p>
                        <p className="text-xs text-gray-500 mt-1">
                          or drag and drop
                        </p>
                      </div>
                    </label>
                  </div>

                  {documents.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-700">
                        Attached Documents:
                      </p>
                      {documents.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm"
                        >
                          <span className="text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Open Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="openDate"
                      value={formData.openDate}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Close Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="closeDate"
                      value={formData.closeDate}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    />
                  </div>
                </div>

                {!isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </div>
                )}

                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="closed">Closed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={isEditing ? handleEditTender : handleCreateTender}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                >
                  {isEditing ? "Update Tender" : "Create Tender"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
