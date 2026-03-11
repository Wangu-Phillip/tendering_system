import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import procurementEntityService from "@/services/procurementEntityService";
import TextArea from "@/components/TextArea";
import Error from "@/components/Error";

interface EvaluationCriteria {
  name: string;
  weight: number;
  description: string;
}

export default function TenderCreationPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    currency: "BWP",
    openDate: "",
    closeDate: "",
  });

  const [evaluationCriteria, setEvaluationCriteria] = useState<
    EvaluationCriteria[]
  >([
    { name: "Price", weight: 40, description: "" },
    { name: "Quality", weight: 30, description: "" },
    { name: "Experience", weight: 20, description: "" },
    { name: "Compliance", weight: 10, description: "" },
  ]);

  const [documents, setDocuments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  // Validation
  const isFormValid = () => {
    return (
      formData.title.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.category.trim() !== "" &&
      formData.budget.trim() !== "" &&
      !isNaN(parseFloat(formData.budget)) &&
      parseFloat(formData.budget) > 0 &&
      formData.openDate !== "" &&
      formData.closeDate !== "" &&
      new Date(formData.closeDate) > new Date(formData.openDate) &&
      new Date(formData.openDate) > new Date() &&
      evaluationCriteria.every((c) => c.name.trim() !== "")
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
      [name]: name === "budget" ? value : value,
    }));
    setError(null);
  };

  const handleCriteriaChange = (
    index: number,
    field: keyof EvaluationCriteria,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser?.uid) {
      setError("You must be logged in to create a tender");
      return;
    }

    if (!isFormValid()) {
      setError("Please fill in all required fields with valid values");
      return;
    }

    // Validate total weight
    const totalWeight = evaluationCriteria.reduce(
      (sum, c) => sum + c.weight,
      0,
    );
    if (totalWeight !== 100) {
      setError(
        `Evaluation criteria weights must total 100% (current: ${totalWeight}%)`,
      );
      return;
    }

    try {
      setLoading(true);

      // Upload documents if any
      let documentUrls: string[] = [];
      if (documents.length > 0) {
        setUploadingFiles(true);
        // Note: In a real app, you'd upload these to storage
        // For now, we'll just store the file names
        documentUrls = documents.map((f) => f.name);
        setUploadingFiles(false);
      }

      // Create the tender
      await procurementEntityService.createTender(currentUser.uid, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category.trim(),
        budget: parseFloat(formData.budget),
        openDate: new Date(formData.openDate).toISOString(),
        closeDate: new Date(formData.closeDate).toISOString(),
        status: "draft",
        documents: documentUrls,
        evaluationCriteria,
      } as any);

      setSuccessMessage("Tender created successfully! Redirecting...");
      setTimeout(() => {
        navigate("/buyer/dashboard");
      }, 2000);
    } catch (err: unknown) {
      const errorMessage = (err as any)?.message || "Failed to create tender";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setUploadingFiles(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Tender
          </h1>
          <p className="text-gray-600 mt-1">
            Publish a tender to receive bids from vendors
          </p>
        </div>
      </div>

      {/* Messages */}
      {error && <Error message={error} />}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <div className="text-green-600 mt-0.5 flex-shrink-0">✓</div>
          <div>
            <h3 className="font-semibold text-green-900">{successMessage}</h3>
          </div>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow p-8 space-y-8"
      >
        {/* Basic Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Basic Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tender Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Office Renovation Project"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <TextArea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Provide a detailed description of the tender, requirements, and expectations"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
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
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="BWP">BWP (Botswana Pula)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="ZAR">ZAR (South African Rand)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
          </div>
        </div>

        {/* Dates */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Timeline</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opening Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="openDate"
                value={formData.openDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be in the future
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Closing Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="closeDate"
                value={formData.closeDate}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be after opening date
              </p>
            </div>
          </div>
        </div>

        {/* Evaluation Criteria */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Evaluation Criteria
            </h2>
            <span className="text-sm text-gray-600">
              Total Weight:{" "}
              <span
                className={
                  evaluationCriteria.reduce((sum, c) => sum + c.weight, 0) ===
                  100
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {evaluationCriteria.reduce((sum, c) => sum + c.weight, 0)}%
              </span>
            </span>
          </div>

          <div className="space-y-4">
            {evaluationCriteria.map((criteria, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Criterion Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={criteria.name}
                      onChange={(e) =>
                        handleCriteriaChange(index, "name", e.target.value)
                      }
                      placeholder="e.g., Price"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (%) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={criteria.weight}
                      onChange={(e) =>
                        handleCriteriaChange(index, "weight", e.target.value)
                      }
                      placeholder="0"
                      min="0"
                      max="100"
                      step="1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
                    />
                  </div>

                  <div className="flex items-end">
                    {evaluationCriteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCriterion(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={criteria.description}
                    onChange={(e) =>
                      handleCriteriaChange(index, "description", e.target.value)
                    }
                    placeholder="Describe how this criterion will be evaluated"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary text-sm resize-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addCriterion}
            className="mt-4 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Add Criterion
          </button>
        </div>

        {/* Documents */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Tender Documents
          </h2>

          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
            <label className="cursor-pointer block">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="text-gray-600">
                <p className="font-medium">Click to upload documents</p>
                <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
              </div>
            </label>
          </div>

          {documents.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Attached Documents:
              </p>
              {documents.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-4 pt-4 border-t">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || uploadingFiles || !isFormValid()}
            className="flex-1 px-4 py-3 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⏳</span> Creating...
              </>
            ) : uploadingFiles ? (
              <>
                <span className="animate-spin">⏳</span> Uploading...
              </>
            ) : (
              "Create & Publish Tender"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
