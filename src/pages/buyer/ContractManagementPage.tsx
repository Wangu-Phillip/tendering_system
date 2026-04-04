import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import procurementEntityService from "@/services/procurementEntityService";
import Button from "@/components/Button";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { FileText, Plus, Edit2, Trash2 } from "lucide-react";
import { Contract } from "@/types";
import { formatAmountWhileTyping, blurFormatAmount } from "@/utils/formatters";

interface ContractForm {
  tenderId: string;
  awardedBidId: string;
  awardedToVendor: string;
  vendorEmail: string;
  contractValue: string;
  currency: string;
  startDate: string;
  endDate: string;
  terms: string;
}

export default function ContractManagementPage() {
  const { currentUser } = useAuth();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<ContractForm>({
    tenderId: "",
    awardedBidId: "",
    awardedToVendor: "",
    vendorEmail: "",
    contractValue: "",
    currency: "BWP",
    startDate: "",
    endDate: "",
    terms: "",
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      const data =
        await procurementEntityService.getContractsForProcuringEntity(
          currentUser.uid,
        );
      setContracts(data);
    } catch (err: unknown) {
      const errorMessage = (err as any)?.message || "Failed to load contracts";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    contractId: string,
    newStatus: Contract["status"],
  ) => {
    try {
      await procurementEntityService.updateContractStatus(
        contractId,
        newStatus,
      );
      await loadContracts();
    } catch (err: unknown) {
      const errorMessage = (err as any)?.message || "Failed to update contract";
      setError(errorMessage);
    }
  };

  const getStatusColor = (status: Contract["status"]) => {
    const colors: Record<Contract["status"], string> = {
      draft: "bg-gray-100 text-gray-800",
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      terminated: "bg-red-100 text-red-800",
      suspended: "bg-yellow-100 text-yellow-800",
    };
    return colors[status];
  };

  if (loading) return <Loading message="Loading contracts..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Contract Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and track all procurement contracts
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={18} className="mr-2" /> New Contract
        </Button>
      </div>

      {error && <Error message={error} />}

      {/* Contract Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Create New Contract
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Tender ID"
              value={formData.tenderId}
              onChange={(e) =>
                setFormData({ ...formData, tenderId: e.target.value })
              }
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="text"
              placeholder="Bid ID"
              value={formData.awardedBidId}
              onChange={(e) =>
                setFormData({ ...formData, awardedBidId: e.target.value })
              }
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="text"
              placeholder="Vendor Name"
              value={formData.awardedToVendor}
              onChange={(e) =>
                setFormData({ ...formData, awardedToVendor: e.target.value })
              }
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="email"
              placeholder="Vendor Email"
              value={formData.vendorEmail}
              onChange={(e) =>
                setFormData({ ...formData, vendorEmail: e.target.value })
              }
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Contract Value"
              value={formData.contractValue}
              onChange={(e) =>
                setFormData({ ...formData, contractValue: formatAmountWhileTyping(e.target.value) })
              }
              onBlur={() =>
                setFormData((prev) => ({ ...prev, contractValue: blurFormatAmount(prev.contractValue) }))
              }
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <p className="px-4 py-2 border border-gray-100 bg-gray-50 rounded-lg text-gray-700 text-sm">
              BWP (Botswana Pula)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) =>
                setFormData({ ...formData, endDate: e.target.value })
              }
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
          </div>

          <textarea
            placeholder="Contract Terms"
            value={formData.terms}
            onChange={(e) =>
              setFormData({ ...formData, terms: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle form submission
                setShowForm(false);
              }}
              className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600"
            >
              Create Contract
            </button>
          </div>
        </div>
      )}

      {/* Contracts List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Contract Value
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <FileText className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p>No contracts yet</p>
                  </td>
                </tr>
              ) : (
                contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {contract.awardedToVendor}
                        </p>
                        <p className="text-sm text-gray-500">
                          {contract.vendorEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {contract.contractValue.toLocaleString()}{" "}
                        {contract.currency}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(contract.startDate).toLocaleDateString()} -{" "}
                      {new Date(contract.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={contract.status}
                        onChange={(e) =>
                          handleStatusChange(
                            contract.id,
                            e.target.value as Contract["status"],
                          )
                        }
                        className={`px-3 py-1 rounded-full text-sm font-semibold border-none cursor-pointer ${getStatusColor(contract.status)}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="suspended">Suspended</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="p-2 text-secondary hover:bg-blue-50 rounded transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
