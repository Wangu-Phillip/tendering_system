import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Clock, CheckCircle } from "lucide-react";
import procurementEntityService from "@/services/procurementEntityService";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { ClarificationRequest } from "@/types";

export default function ClarificationRequestsPage() {
  const { tenderId } = useParams<{ tenderId: string }>();
  const navigate = useNavigate();

  const [clarifications, setClarifications] = useState<ClarificationRequest[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showNewRequest, setShowNewRequest] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<ClarificationRequest | null>(null);
  const [responseForm, setResponseForm] = useState({
    response: "",
    attachments: [] as File[],
  });

  const [newRequestForm, setNewRequestForm] = useState({
    vendorName: "",
    vendorEmail: "",
    subject: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadClarifications();
  }, [tenderId]);

  const loadClarifications = async () => {
    if (!tenderId) return;

    try {
      setLoading(true);
      const data =
        await procurementEntityService.getClarificationsForTender(tenderId);
      setClarifications(data);
    } catch (err: unknown) {
      const errorMessage =
        (err as any)?.message || "Failed to load clarifications";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async () => {
    if (!selectedRequest || !responseForm.response.trim()) {
      setError("Please enter a response");
      return;
    }

    try {
      setSubmitting(true);
      await procurementEntityService.respondToClarification(
        selectedRequest.id,
        responseForm.response,
      );

      await loadClarifications();
      setSelectedRequest(null);
      setResponseForm({ response: "", attachments: [] });
    } catch (err: unknown) {
      const errorMessage = (err as any)?.message || "Failed to send response";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendNewRequest = async () => {
    if (
      !newRequestForm.vendorEmail.trim() ||
      !newRequestForm.subject.trim() ||
      !newRequestForm.message.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const tender = await procurementEntityService.getTenderById(
        tenderId || "",
      );
      await procurementEntityService.sendClarificationRequest({
        tenderId: tenderId || "",
        tenderTitle: tender?.title || "Tender",
        subject: newRequestForm.subject,
        message: newRequestForm.message,
        vendorName: newRequestForm.vendorName || "Vendor",
        vendorId: "unknown",
        vendorEmail: newRequestForm.vendorEmail,
        status: "pending",
      } as any);

      await loadClarifications();
      setShowNewRequest(false);
      setNewRequestForm({
        vendorName: "",
        vendorEmail: "",
        subject: "",
        message: "",
      });
    } catch (err: unknown) {
      const errorMessage = (err as any)?.message || "Failed to send request";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Loading clarification requests..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Clarification Requests
            </h1>
            <p className="text-gray-600 mt-1">
              Communicate with bidders about tender details
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowNewRequest(!showNewRequest)}
          className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
        >
          New Request
        </button>
      </div>

      {error && <Error message={error} />}

      {/* New Request Form */}
      {showNewRequest && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Send Clarification Request
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Name
                </label>
                <input
                  type="text"
                  value={newRequestForm.vendorName}
                  onChange={(e) =>
                    setNewRequestForm({
                      ...newRequestForm,
                      vendorName: e.target.value,
                    })
                  }
                  placeholder="e.g., ABC Construction Ltd"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newRequestForm.vendorEmail}
                  onChange={(e) =>
                    setNewRequestForm({
                      ...newRequestForm,
                      vendorEmail: e.target.value,
                    })
                  }
                  placeholder="vendor@example.com"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newRequestForm.subject}
                onChange={(e) =>
                  setNewRequestForm({
                    ...newRequestForm,
                    subject: e.target.value,
                  })
                }
                placeholder="e.g., Clarification on specifications"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={newRequestForm.message}
                onChange={(e) =>
                  setNewRequestForm({
                    ...newRequestForm,
                    message: e.target.value,
                  })
                }
                placeholder="Provide your clarification request..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowNewRequest(false)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendNewRequest}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clarifications List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Requests ({clarifications.length})
              </h2>
            </div>

            <div className="divide-y max-h-96 overflow-y-auto">
              {clarifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p className="text-sm">No clarification requests yet</p>
                </div>
              ) : (
                clarifications.map((request) => (
                  <button
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className={`w-full p-4 text-left transition-colors ${
                      selectedRequest?.id === request.id
                        ? "bg-blue-50 border-l-4 border-secondary"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {request.vendorName}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {request.subject}
                        </p>
                      </div>
                      {request.status === "responded" && (
                        <CheckCircle
                          size={16}
                          className="text-green-600 flex-shrink-0"
                        />
                      )}
                      {request.status === "pending" && (
                        <Clock
                          size={16}
                          className="text-yellow-600 flex-shrink-0"
                        />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2">
          {selectedRequest ? (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              {/* Request Details */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedRequest.subject}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedRequest.vendorName}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      selectedRequest.status === "responded"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedRequest.status.charAt(0).toUpperCase() +
                      selectedRequest.status.slice(1)}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedRequest.message}
                  </p>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  Sent: {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Response Section */}
              {selectedRequest.status === "responded" &&
              selectedRequest.response ? (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900">Your Response</h3>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedRequest.response}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Responded:{" "}
                    {new Date(selectedRequest.respondedAt!).toLocaleString()}
                  </p>
                </div>
              ) : selectedRequest.status === "pending" ? (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-gray-900">Send Response</h3>
                  <textarea
                    value={responseForm.response}
                    onChange={(e) =>
                      setResponseForm({
                        ...responseForm,
                        response: e.target.value,
                      })
                    }
                    placeholder="Type your response here..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSendResponse}
                      disabled={submitting || !responseForm.response.trim()}
                      className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Send size={18} />{" "}
                      {submitting ? "Sending..." : "Send Response"}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
              <p className="text-gray-600">
                Select a clarification request to view details and respond
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
