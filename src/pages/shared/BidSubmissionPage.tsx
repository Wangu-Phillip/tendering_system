import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AlertCircle, Check, Upload, X, Loader } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTenderDetail } from "@hooks/useTenders";
import bidService from "@services/bidService";
import Button from "@components/Button";
import TextArea from "@components/TextArea";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Badge from "@components/Badge";
import { formatCurrency, formatDate } from "@utils/formatters";
import { Bid } from "@types";

export default function BidSubmissionPage() {
  const { tenderId } = useParams<{ tenderId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    tender,
    loading: tenderLoading,
    error: tenderError,
  } = useTenderDetail(tenderId || "");

  // Form states
  const [formData, setFormData] = useState({
    amount: "",
    currency: "BWP",
    description: "",
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Validation
  const isFormValid = () => {
    return (
      formData.amount.trim() !== "" &&
      !isNaN(parseFloat(formData.amount)) &&
      parseFloat(formData.amount) > 0 &&
      formData.description.trim() !== ""
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);

      // Validate file sizes (max 5MB per file)
      const validFiles = newFiles.filter((file) => {
        if (file.size > 5 * 1024 * 1024) {
          setError(`File ${file.name} exceeds 5MB limit`);
          return false;
        }
        return true;
      });

      if (validFiles.length + attachments.length > 5) {
        setError("Maximum 5 attachments allowed");
        return;
      }

      setAttachments((prev) => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitBid = async () => {
    if (!currentUser?.uid) {
      setError("You must be logged in to submit a bid");
      return;
    }

    if (!tender) {
      setError("Tender information is not available");
      return;
    }

    if (!isFormValid()) {
      setError("Please fill in all required fields with valid data");
      return;
    }

    try {
      setLoading(true);

      // Upload attachments
      let attachmentUrls: string[] = [];
      if (attachments.length > 0) {
        setUploadingFiles(true);
        for (const file of attachments) {
          try {
            const url = await bidService.uploadBidAttachment(
              `${currentUser.uid}`,
              file,
            );
            attachmentUrls.push(url);
          } catch (uploadError) {
            console.error(`Failed to upload ${file.name}:`, uploadError);
            setError(`Failed to upload ${file.name}`);
            return;
          }
        }
        setUploadingFiles(false);
      }

      // Create bid with status already set to "submitted"
      const bidData: Omit<Bid, "id" | "createdAt" | "updatedAt"> = {
        tenderId: tender.id,
        vendorId: currentUser.uid,
        vendorName:
          currentUser.displayName || currentUser.email || "Unknown Vendor",
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description.trim(),
        attachments: attachmentUrls,
        status: "submitted",
      };

      // Submit the bid (already created with status "submitted")
      await bidService.createBid(bidData);

      setSuccessMessage("Bid submitted successfully!");
      setTimeout(() => {
        navigate("/bids");
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to submit bid";
      setError(errorMessage);
      setLoading(false);
    }
  };

  if (tenderLoading) return <Loading message="Loading tender details..." />;
  if (tenderError) return <Error message={tenderError} />;
  if (!tender) return <Error message="Tender not found" />;
  if (!currentUser)
    return <Error message="You must be logged in to submit a bid" />;

  // Check if tender is still open
  const tenderStatus = (tender as any).status || tender.status;
  const tenderDeadline = new Date(
    (tender as any).closeDate || (tender as any).deadline || tender.deadline,
  );
  const isDeadlinePassed = tenderDeadline < new Date();
  const daysUntilDeadline = Math.ceil(
    (tenderDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Submit Bid</h1>
          <p className="text-gray-600 mt-2">{tender.title}</p>
        </div>
        <Badge label={tenderStatus.toUpperCase()} status={tenderStatus} />
      </div>

      {/* Messages */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Loader className="text-blue-600 animate-spin" size={20} />
          <div>
            <p className="font-medium text-blue-900">Submitting your bid...</p>
            <p className="text-sm text-blue-800">
              {uploadingFiles
                ? "Uploading documents..."
                : "Please wait while we submit your bid"}
            </p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <Check className="text-green-600" size={20} />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {isDeadlinePassed && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-yellow-600" size={20} />
          <p className="text-yellow-800">
            <strong>Warning:</strong> The deadline for this tender has passed.
            You cannot submit a bid.
          </p>
        </div>
      )}

      {/* Tender Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Tender Details
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            {tender.budget}, {(tender as any).currency || tender.currency}
            <p className="text-gray-600 text-sm">Budget</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(tender.budget, tender.currency)}
            </p>
          </div>
          {(tender as any).category || tender.category}

          <div>
            <p className="text-gray-600 text-sm">Category</p>
            <p className="font-sDibold text-gray-900">{tender.category}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Deadline</p>
            <p className="font-semibold text-gray-900">
              {formatDate(tender.deadline, "short")}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Days Left</p>
            <p
              className={`text-lg font-bold ${daysUntilDeadline <= 0 ? "text-red-600" : "text-green-600"}`}
            >
              {daysUntilDeadline <= 0 ? "Closed" : `${daysUntilDeadline} days`}
            </p>
          </div>
        </div>
      </div>

      {/* Bid Submission Form */}
      {!isDeadlinePassed && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Submit Your Bid
          </h2>

          <div className="space-y-6">
            {/* Bid Amount */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bid Amount <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="Enter your bid amount"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
                {formData.amount && !isNaN(parseFloat(formData.amount)) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Your bid:{" "}
                    {formatCurrency(
                      parseFloat(formData.amount),
                      formData.currency,
                    )}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency <span className="text-red-600">*</span>
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="BWP">BWP (Botswana Pula)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="ZAR">ZAR (South African Rand)</option>
                </select>
              </div>
            </div>

            {/* Bid Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proposal / Description <span className="text-red-600">*</span>
              </label>
              <TextArea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your bid, approach, timeline, and why you're the best choice for this tender"
                rows={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 50 characters required for a clear proposal
              </p>
            </div>

            {/* Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Attach supporting documents (max 5 files, 5MB each):
                certificates, portfolio, references, etc.
              </p>

              {/* File Upload Input */}
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-secondary hover:bg-blue-50 transition">
                <div className="text-center">
                  <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                  <p className="text-sm text-gray-600">
                    Click to select files or drag and drop
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  disabled={uploadingFiles || loading}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.png"
                />
              </label>

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Attached Files ({attachments.length}/5)
                  </p>
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        disabled={loading}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
                disabled={loading || uploadingFiles}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitBid}
                disabled={
                  !isFormValid() ||
                  loading ||
                  uploadingFiles ||
                  isDeadlinePassed
                }
              >
                {loading || uploadingFiles ? "Submitting..." : "Submit Bid"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">
          💡 Bid Submission Tips
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            • Be clear and specific about your bid amount and what it includes
          </li>
          <li>
            • Your proposal should demonstrate understanding of the tender
            requirements
          </li>
          <li>• Attach relevant documents to strengthen your application</li>
          <li>• Double-check all information before submitting</li>
          <li>
            • You cannot edit your bid after submission, so review carefully
          </li>
        </ul>
      </div>
    </div>
  );
}
