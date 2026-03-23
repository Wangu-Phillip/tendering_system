import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTenderDetail } from "@hooks/useTenders";
import demoPaymentService from "@services/demoPaymentService";
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

  const [hasPurchased, setHasPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Check if the vendor has purchased this tender
  useEffect(() => {
    async function checkPurchaseStatus() {
      if (!currentUser?.uid || !id) {
        setCheckingPurchase(false);
        return;
      }
      // Buyers/admins always have access
      if (currentUser.role !== "vendor") {
        setHasPurchased(true);
        setCheckingPurchase(false);
        return;
      }
      try {
        const purchased = await demoPaymentService.hasUserPurchasedTender(
          currentUser.uid,
          id,
        );
        setHasPurchased(purchased);
      } catch (err) {
        console.error("Error checking purchase status:", err);
      } finally {
        setCheckingPurchase(false);
      }
    }
    checkPurchaseStatus();
  }, [currentUser?.uid, currentUser?.role, id]);

  if (loading || checkingPurchase)
    return <Loading message="Loading tender..." />;
  if (error) return <Error message={error} />;
  if (!tender) return <Error message="Tender not found" />;

  // Vendors cannot view draft tenders
  if (currentUser?.role === "vendor" && (tender as any).status === "draft") {
    return <Error message="This tender is not available yet" />;
  }

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

  // Tender fee logic
  const tenderFee = (tender as any).tenderFee || 0;
  const feeCurrency = (tender as any).tenderFeeCurrency || "ZAR";
  const requiresPurchase = isVendor && tenderFee > 0 && !hasPurchased;

  // Resolve document URLs: tenders may store them as 'attachments' or 'documents'
  const tenderDocuments: string[] =
    tender.attachments && tender.attachments.length > 0
      ? tender.attachments
      : (tender as any).documents && (tender as any).documents.length > 0
        ? (tender as any).documents
        : [];

  const handleSubmitBid = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    navigate(`/bids/new/${id}`);
  };

  const handleDownloadAll = async () => {
    if (!tenderDocuments.length) return;
    setDownloading(true);
    try {
      for (const url of tenderDocuments) {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        // Extract filename from URL or use a default
        const urlPath = new URL(url).pathname;
        const fileName = decodeURIComponent(
          urlPath.split("/").pop() || `document`,
        );
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error("Error downloading documents:", err);
      alert(
        "Failed to download some documents. Please try downloading them individually.",
      );
    } finally {
      setDownloading(false);
    }
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
              {isVendor ? "to submit your bid" : "before this tender closes"}
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
            {tenderFee > 0 && (
              <div>
                <p className="text-gray-600 text-sm">Document Fee</p>
                <p className="font-semibold text-amber-700">
                  {formatCurrency(tenderFee, feeCurrency)}
                </p>
              </div>
            )}
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

      {/* Tender Fee Banner (for vendors who need to purchase) */}
      {requiresPurchase && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Lock className="text-amber-600 flex-shrink-0 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 text-lg mb-1">
                Purchase Required
              </h3>
              <p className="text-amber-800 mb-3">
                You must purchase this tender to access the documents and submit
                a bid.
              </p>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-amber-900">
                  {formatCurrency(tenderFee, feeCurrency)}
                </span>
                <Button onClick={() => navigate(`/tenders/${id}/purchase`)}>
                  Purchase Tender Documents
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchased Confirmation (for vendors who already purchased) */}
      {isVendor && hasPurchased && tenderFee > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <ShieldCheck className="text-green-600" size={20} />
          <p className="text-green-800 font-medium">
            You have purchased this tender. Full document access granted.
          </p>
        </div>
      )}

      {/* Tender Documents */}
      {tenderDocuments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tender Documents
          </h3>
          {requiresPurchase ? (
            <div className="text-center py-8">
              <Lock className="text-gray-400 mx-auto mb-3" size={40} />
              <p className="text-gray-600 font-medium mb-1">Documents Locked</p>
              <p className="text-gray-500 text-sm mb-4">
                Purchase this tender ({formatCurrency(tenderFee, feeCurrency)})
                to download the documents.
              </p>
              <Button
                variant="primary"
                onClick={() => navigate(`/tenders/${id}/purchase`)}
              >
                Purchase to Unlock
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {tenderDocuments.map((attachment, index) => (
                <a
                  key={index}
                  href={attachment}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
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
          )}
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          {isVendor && requiresPurchase ? (
            <div>
              <p className="text-gray-700 font-medium mb-2">
                Purchase this tender to access documents and submit a bid.
              </p>
              <Button onClick={() => navigate(`/tenders/${id}/purchase`)}>
                Purchase Tender — {formatCurrency(tenderFee, feeCurrency)}
              </Button>
            </div>
          ) : isVendor && isTenderOpen && !isDeadlinePassed ? (
            <>
              <Button onClick={handleSubmitBid}>Submit Bid</Button>
              <Button
                variant="secondary"
                onClick={handleDownloadAll}
                disabled={downloading}
              >
                {downloading ? "Downloading..." : "Download All Documents"}
              </Button>
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
          ) : currentUser?.role === "admin" ? (
            <div className="text-gray-600">
              <p className="font-medium">Admin View</p>
              <p className="text-sm mt-1">
                Admins cannot submit bids for tenders.
              </p>
            </div>
          ) : !isVendor && currentUser?.role === "buyer" ? (
            <>
              <Button variant="secondary">View All Bids</Button>
              <Button variant="secondary">Manage Evaluation</Button>
              <p className="text-sm text-gray-500 mt-2">
                Procurement entities cannot submit bids for tenders.
              </p>
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
      {isVendor && isTenderOpen && !isDeadlinePassed && !requiresPurchase && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">
            📋 How to Submit Your Bid
          </h3>
          <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
            <li>Review all tender documents carefully</li>
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
