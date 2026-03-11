import { useParams, useNavigate } from "react-router-dom";
import { Download, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTenderDetail } from "@hooks/useTenders";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Badge from "@components/Badge";
import Button from "@components/Button";
import { formatCurrency, formatDate, formatDateTime } from "@utils/formatters";

export default function TenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { tender, loading, error } = useTenderDetail(id || "");

  if (loading) return <Loading message="Loading tender..." />;
  if (error) return <Error message={error} />;
  if (!tender) return <Error message="Tender not found" />;

  const isVendor = currentUser?.role === "vendor";

  // Handle both tender types (from tenderManagementService and legacy Tender type)
  const tenderStatus = (tender as any).status || tender.status;
  const tenderDeadline = new Date(
    (tender as any).closeDate || (tender as any).deadline || tender.closeDate,
  );
  const isTenderOpen =
    tenderStatus === "open" ||
    tenderStatus === "published" ||
    tenderStatus === "draft";
  const isDeadlinePassed = tenderDeadline < new Date();
  const daysUntilDeadline = Math.ceil(
    (tenderDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  const handleSubmitBid = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    navigate(`/bids/new/${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{tender.title}</h1>
          <p className="text-gray-600 mt-2">{tender.description}</p>
        </div>
        <Badge label={tenderStatus.toUpperCase()} status={tenderStatus} />
      </div>

      {/* Deadline Warning */}
      {isDeadlinePassed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <div>
            <p className="font-medium text-red-900">Deadline Passed</p>
            <p className="text-sm text-red-800">
              This tender is no longer accepting bids
            </p>
          </div>
        </div>
      )}

      {isTenderOpen && daysUntilDeadline <= 7 && !isDeadlinePassed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={20} />
          <div>
            <p className="font-medium text-yellow-900">Deadline Approaching</p>
            <p className="text-sm text-yellow-800">
              {daysUntilDeadline === 1
                ? "Only 1 day left"
                : `Only ${daysUntilDeadline} days left`}{" "}
              to submit your bid
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Details Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
          <div className="space-y-4">
            <div>
              <p className="text-gray-600 text-sm">Budget</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(
                  tender.budget,
                  (tender as any).currency || tender.currency,
                )}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Category</p>
              <p className="font-semibold text-gray-900">
                {(tender as any).category || tender.category}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Deadline</p>
              <p className="font-semibold text-gray-900">
                {formatDate(tenderDeadline, "long")}
              </p>
              <p
                className={`text-sm mt-1 font-medium ${
                  isDeadlinePassed ? "text-red-600" : "text-green-600"
                }`}
              >
                {isDeadlinePassed
                  ? "Closed"
                  : daysUntilDeadline <= 0
                    ? "Closes Today"
                    : `${daysUntilDeadline} day${daysUntilDeadline !== 1 ? "s" : ""} left`}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Bids</p>
              <p className="font-semibold text-gray-900">
                {tender.bidCount || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Created</p>
              <p className="font-semibold text-gray-900">
                {formatDateTime(tender.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Last Updated</p>
              <p className="font-semibold text-gray-900">
                {formatDateTime(tender.updatedAt)}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Submission Deadline</p>
              <p className="font-semibold text-gray-900">
                {formatDateTime(tender.closeDate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Description */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Full Description
        </h3>
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {tender.description}
        </div>
      </div>

      {/* Tender Documents */}
      {tender.attachments && tender.attachments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tender Documents
          </h3>
          <div className="space-y-3">
            {tender.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment}
                download
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <Download className="text-secondary" size={20} />
                  <div>
                    <p className="font-medium text-gray-900">
                      Tender Document {index + 1}
                    </p>
                    <p className="text-sm text-gray-500">Click to download</p>
                  </div>
                </div>
                <Download className="text-gray-400" size={18} />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {isVendor && isTenderOpen && !isDeadlinePassed ? (
            <>
              <Button onClick={handleSubmitBid}>Submit Bid</Button>
              <Button variant="secondary">Download All Documents</Button>
            </>
          ) : isVendor && isDeadlinePassed ? (
            <div className="text-gray-600">
              <p className="font-medium">
                The deadline for this tender has passed.
              </p>
              <p className="text-sm mt-1">
                You can no longer submit a bid for this tender.
              </p>
            </div>
          ) : !isVendor && currentUser?.role === "buyer" ? (
            <>
              <Button variant="secondary">View All Bids</Button>
              <Button variant="secondary">Manage Evaluation</Button>
            </>
          ) : !currentUser ? (
            <div className="text-gray-600">
              <p className="font-medium">
                To submit a bid, please log in or create an account.
              </p>
              <div className="flex gap-2 mt-2">
                <Button variant="secondary" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate("/register")}
                >
                  Register
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-gray-600">
              <p className="text-sm">
                Contact support for bid submission assistance
              </p>
            </div>
          )}
        </div>
      </div>

      {/* How to Submit */}
      {isVendor && isTenderOpen && !isDeadlinePassed && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            📋 How to Submit Your Bid
          </h3>
          <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
            <li>Click the "Submit Bid" button above</li>
            <li>Enter your proposed bid amount</li>
            <li>Describe your approach and why you're the best choice</li>
            <li>Attach supporting documents if needed</li>
            <li>Review all details carefully and submit</li>
            <li>You'll receive a confirmation and can track your bid status</li>
          </ol>
        </div>
      )}
    </div>
  );
}
