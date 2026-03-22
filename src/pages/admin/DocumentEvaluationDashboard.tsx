import { useState, useEffect } from "react";
import {
  Search,
  FileText,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
  Play,
  Loader2,
} from "lucide-react";
import Loading from "@/components/Loading";
import ErrorDisplay from "@/components/Error";
import { BidDocumentEvaluation, DocumentAnalysis, Bid } from "@/types";
import documentEvaluationStorageService from "@/services/documentEvaluationStorageService";
import documentAnalysisService from "@/services/documentAnalysisService";
import firestoreService from "@/firebase/firestore";

export default function DocumentEvaluationDashboard() {
  const [evaluations, setEvaluations] = useState<BidDocumentEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenderId, setSelectedTenderId] = useState<string>("");
  const [tenders, setTenders] = useState<any[]>([]);
  const [filterRecommendation, setFilterRecommendation] =
    useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEval, setSelectedEval] =
    useState<BidDocumentEvaluation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailDocuments, setDetailDocuments] = useState<DocumentAnalysis[]>(
    [],
  );
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentAnalysis | null>(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState("");

  useEffect(() => {
    loadTenders();
  }, []);

  useEffect(() => {
    if (selectedTenderId) {
      loadEvaluations(selectedTenderId);
    }
  }, [selectedTenderId]);

  const loadTenders = async () => {
    try {
      const allTenders = await firestoreService.getDocuments("tenders");
      setTenders(
        allTenders.filter((t: any) => t.status === "closed" || t.bidCount > 0),
      );
    } catch (err) {
      console.error("Error loading tenders:", err);
    }
  };

  const loadEvaluations = async (tenderId: string) => {
    try {
      setLoading(true);
      setError(null);
      const evals =
        await documentEvaluationStorageService.getTenderEvaluations(tenderId);
      setEvaluations(evals.sort((a, b) => b.overallScore - a.overallScore));
    } catch (err: any) {
      console.error("Error loading evaluations:", err);
      setError((err as any)?.message || "Failed to load evaluations");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (evaluation: BidDocumentEvaluation) => {
    setSelectedEval(evaluation);
    setDetailDocuments(evaluation.documents || []);
    setShowDetailModal(true);
  };

  const handleViewDocument = (document: DocumentAnalysis) => {
    setSelectedDocument(document);
    setShowDocumentModal(true);
  };

  const handleExport = async () => {
    if (!selectedTenderId) return;
    try {
      const json =
        await documentEvaluationStorageService.exportTenderEvaluations(
          selectedTenderId,
        );
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bid-evaluations-${selectedTenderId}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert((err as any)?.message || "Export failed");
    }
  };

  const classifyDocumentType = (
    fileName: string,
  ): DocumentAnalysis["documentType"] => {
    const lower = fileName.toLowerCase();
    if (lower.includes("technical") || lower.includes("proposal"))
      return "technical_proposal";
    if (lower.includes("company") || lower.includes("profile"))
      return "company_profile";
    if (lower.includes("method") || lower.includes("approach"))
      return "methodology";
    if (lower.includes("financ") || lower.includes("price")) return "financial";
    if (lower.includes("sample") || lower.includes("portfolio"))
      return "work_sample";
    return "technical_proposal";
  };

  const fetchPdfText = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    return text;
  };

  const handleRunAnalysis = async () => {
    if (!selectedTenderId) return;

    try {
      setAnalyzing(true);
      setError(null);

      // Get the tender
      const tender = tenders.find((t) => t.id === selectedTenderId);
      if (!tender) throw new Error("Tender not found");

      // Get all submitted bids for this tender
      setAnalysisProgress("Loading bids...");
      const allBids: Bid[] = await firestoreService.getDocuments("bids");
      const tenderBids = allBids.filter(
        (b) => b.tenderId === selectedTenderId && b.status === "submitted",
      );

      if (tenderBids.length === 0) {
        setError("No submitted bids found for this tender");
        return;
      }

      let processedCount = 0;
      for (const bid of tenderBids) {
        processedCount++;
        setAnalysisProgress(
          `Analyzing bid ${processedCount}/${tenderBids.length}: ${bid.vendorName}`,
        );

        const attachments = bid.attachments || [];
        if (attachments.length === 0) continue;

        const documentAnalyses: DocumentAnalysis[] = [];

        for (const attachmentUrl of attachments) {
          try {
            // Extract filename from URL
            const urlPath = decodeURIComponent(new URL(attachmentUrl).pathname);
            const fileName =
              urlPath.split("/").pop()?.replace(/^\d+-/, "") || "document.pdf";
            const documentType = classifyDocumentType(fileName);

            setAnalysisProgress(
              `Bid ${processedCount}/${tenderBids.length}: Extracting text from ${fileName}...`,
            );

            // Download and extract text from PDF
            let extractedText = "";
            try {
              extractedText = await fetchPdfText(attachmentUrl);
            } catch {
              extractedText = `[Could not extract text from ${fileName}]`;
            }

            if (!extractedText || extractedText.trim().length < 10) {
              extractedText = `[Document: ${fileName} - minimal text content extracted]`;
            }

            setAnalysisProgress(
              `Bid ${processedCount}/${tenderBids.length}: AI analyzing ${fileName}...`,
            );

            // Analyze with Gemini
            const analysisResults =
              await documentAnalysisService.analyzeDocument(
                extractedText,
                documentType,
                tender.description || tender.title || "",
              );

            const docAnalysis: DocumentAnalysis = {
              id: `doc_${bid.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              bidId: bid.id,
              tenderId: selectedTenderId,
              documentType,
              fileName,
              fileUrl: attachmentUrl,
              extractedText: extractedText.substring(0, 5000),
              analysisResults: {
                relevanceScore: analysisResults.relevanceScore,
                technicalQualityScore: analysisResults.technicalQualityScore,
                riskAssessment: analysisResults.riskAssessment,
                complianceScore: analysisResults.complianceScore,
                keyFindings: analysisResults.keyFindings,
                strengths: analysisResults.strengths,
                weaknesses: analysisResults.weaknesses,
                recommendations: analysisResults.recommendations,
              },
              geminiAnalysis: {
                summary: analysisResults.summary,
                detailedAnalysis: analysisResults.detailedAnalysis,
                suggestedQuestions: analysisResults.suggestedQuestions,
              },
              processingStatus: "completed",
              processedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            documentAnalyses.push(docAnalysis);

            // Save individual analysis
            await documentEvaluationStorageService.saveDocumentAnalysis(
              docAnalysis,
            );
          } catch (docErr) {
            console.error("Error analyzing document:", docErr);
          }
        }

        if (documentAnalyses.length > 0) {
          // Generate and save bid evaluation
          const evaluation = documentAnalysisService.generateBidEvaluation(
            bid.id,
            selectedTenderId,
            bid.vendorId,
            bid.vendorName,
            documentAnalyses,
          );

          const fullEvaluation: BidDocumentEvaluation = {
            ...evaluation,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await documentEvaluationStorageService.saveBidEvaluation(
            fullEvaluation,
          );
        }
      }

      setAnalysisProgress("Analysis complete! Refreshing results...");
      await loadEvaluations(selectedTenderId);
      setAnalysisProgress("");
    } catch (err: any) {
      console.error("Error running analysis:", err);
      setError(err?.message || "Failed to run document analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (
      filterRecommendation !== "all" &&
      evaluation.evaluation.recommendation !== filterRecommendation
    )
      return false;
    if (filterRisk !== "all" && evaluation.overallRisk !== filterRisk)
      return false;
    if (
      searchTerm &&
      !evaluation.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    )
      return false;
    return true;
  });

  const stats = {
    total: evaluations.length,
    approved: evaluations.filter(
      (evaluation) => evaluation.evaluation.recommendation === "approved",
    ).length,
    conditional: evaluations.filter(
      (evaluation) => evaluation.evaluation.recommendation === "conditional",
    ).length,
    review: evaluations.filter(
      (evaluation) =>
        evaluation.evaluation.recommendation === "requires_review",
    ).length,
    rejected: evaluations.filter(
      (evaluation) => evaluation.evaluation.recommendation === "rejected",
    ).length,
    avgScore:
      evaluations.length > 0
        ? (
            evaluations.reduce(
              (sum, evaluation) => sum + evaluation.overallScore,
              0,
            ) / evaluations.length
          ).toFixed(1)
        : "0",
    highRisk: evaluations.filter(
      (evaluation) => evaluation.overallRisk === "high",
    ).length,
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "conditional":
        return "bg-blue-100 text-blue-800";
      case "requires_review":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">
            Document Evaluation Dashboard
          </h1>
          <p className="text-slate-600 mt-2">
            AI-powered analysis of bid documents using Gemini
          </p>
        </div>
      </div>

      {/* Tender Selection */}
      <div className="bg-white rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Tender
        </label>
        <select
          value={selectedTenderId}
          onChange={(e) => setSelectedTenderId(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Choose a tender --</option>
          {tenders.map((tender) => (
            <option key={tender.id} value={tender.id}>
              {tender.title} ({tender.bidCount} bids)
            </option>
          ))}
        </select>

        {selectedTenderId && (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {analyzing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Play size={18} />
              )}
              {analyzing ? "Analyzing..." : "Run AI Document Analysis"}
            </button>
            {analysisProgress && (
              <span className="text-sm text-purple-600 font-medium">
                {analysisProgress}
              </span>
            )}
          </div>
        )}
      </div>

      {selectedTenderId && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
            <div className="bg-white rounded-lg shadow p-3">
              <p className="text-xs text-slate-600">Total</p>
              <p className="text-xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-3 border-l-4 border-green-500">
              <p className="text-xs text-slate-600">Approved</p>
              <p className="text-xl font-bold text-green-600">
                {stats.approved}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg shadow p-3 border-l-4 border-blue-500">
              <p className="text-xs text-slate-600">Conditional</p>
              <p className="text-xl font-bold text-blue-600">
                {stats.conditional}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg shadow p-3 border-l-4 border-yellow-500">
              <p className="text-xs text-slate-600">Review</p>
              <p className="text-xl font-bold text-yellow-600">
                {stats.review}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg shadow p-3 border-l-4 border-red-500">
              <p className="text-xs text-slate-600">Rejected</p>
              <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="bg-orange-50 rounded-lg shadow p-3">
              <p className="text-xs text-slate-600">High Risk</p>
              <p className="text-xl font-bold text-orange-600">
                {stats.highRisk}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg shadow p-3">
              <p className="text-xs text-slate-600">Avg Score</p>
              <p className="text-xl font-bold text-purple-600">
                {stats.avgScore}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48 relative">
              <Search
                size={18}
                className="absolute left-3 top-3 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search vendor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterRecommendation}
              onChange={(e) => setFilterRecommendation(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Recommendations</option>
              <option value="approved">Approved</option>
              <option value="conditional">Conditional</option>
              <option value="requires_review">Requires Review</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
            >
              <Download size={18} /> Export
            </button>
          </div>

          {/* Results */}
          {loading ? (
            <Loading />
          ) : error ? (
            <ErrorDisplay message={error} />
          ) : filteredEvaluations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-slate-600">No evaluations found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvaluations.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 text-lg">
                        {item.vendorName}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Documents: {item.documents.length} | Technical Quality:{" "}
                        {item.averageTechnicalQuality.toFixed(1)}/100
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getRecommendationColor(item.evaluation.recommendation)}`}
                        >
                          {item.evaluation.recommendation
                            .replace("_", " ")
                            .toUpperCase()}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700`}
                        >
                          Risk: {item.overallRisk.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-4xl font-bold text-slate-900">
                        {item.overallScore.toFixed(1)}
                        <span className="text-sm text-slate-500">/100</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-2 space-y-1">
                        <p>Relevance: {item.averageRelevance.toFixed(1)}</p>
                        <p>Compliance: {item.averageCompliance.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="bg-blue-50 p-2 rounded text-center">
                      <p className="text-xs text-slate-600">Relevance</p>
                      <p className="text-sm font-bold text-blue-600">
                        {item.averageRelevance.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-green-50 p-2 rounded text-center">
                      <p className="text-xs text-slate-600">Technical</p>
                      <p className="text-sm font-bold text-green-600">
                        {item.averageTechnicalQuality.toFixed(0)}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded text-center">
                      <p className="text-xs text-slate-600">Compliance</p>
                      <p className="text-sm font-bold text-purple-600">
                        {item.averageCompliance.toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200">
                    <p className="text-xs font-semibold text-slate-700 mb-1">
                      Evaluation:
                    </p>
                    <p className="text-sm text-slate-600">
                      {item.evaluation.reasoning}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                    >
                      <Eye size={16} /> Documents
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {selectedEval.vendorName} - Documents
              </h2>
              <p className="text-sm text-slate-600">
                Overall Score: {selectedEval.overallScore.toFixed(1)}/100
              </p>
            </div>

            <div className="p-6 space-y-4">
              {detailDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-start gap-3">
                      <FileText className="text-blue-500 mt-1" size={24} />
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {doc.fileName}
                        </h3>
                        <p className="text-xs text-slate-600 capitalize">
                          {doc.documentType.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDocument(doc)}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm font-medium"
                    >
                      View Analysis
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <p className="text-xs text-slate-600">Relevance</p>
                      <p className="text-lg font-bold text-blue-600">
                        {doc.analysisResults.relevanceScore}
                      </p>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-xs text-slate-600">Quality</p>
                      <p className="text-lg font-bold text-green-600">
                        {doc.analysisResults.technicalQualityScore}
                      </p>
                    </div>
                    <div className="bg-purple-50 p-2 rounded">
                      <p className="text-xs text-slate-600">Compliance</p>
                      <p className="text-lg font-bold text-purple-600">
                        {doc.analysisResults.complianceScore}
                      </p>
                    </div>
                  </div>

                  {doc.analysisResults.riskAssessment.overallRisk ===
                    "high" && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                      <p className="text-xs font-semibold text-red-700 mb-1">
                        ⚠️ High Risk
                      </p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {doc.analysisResults.riskAssessment.technicalRisks.map(
                          (risk, idx) => (
                            <li key={idx}>• {risk}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                  <div className="text-xs text-slate-600">
                    <p className="font-medium mb-1">Key Findings:</p>
                    <ul className="space-y-1">
                      {doc.analysisResults.keyFindings
                        .slice(0, 3)
                        .map((finding, idx) => (
                          <li key={idx}>• {finding}</li>
                        ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Analysis Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold">
                {selectedDocument.fileName}
              </h2>
              <p className="text-sm text-slate-600">
                {selectedDocument.documentType.replace("_", " ")} | Score:{" "}
                {selectedDocument.analysisResults.relevanceScore.toFixed(1)}/100
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Scores */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Scores</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">
                      Relevance to Requirements
                    </p>
                    <p className="text-3xl font-bold text-blue-600">
                      {selectedDocument.analysisResults.relevanceScore}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      How well it addresses requirements
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Technical Quality</p>
                    <p className="text-3xl font-bold text-green-600">
                      {selectedDocument.analysisResults.technicalQualityScore}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Quality and professionalism
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Compliance</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {selectedDocument.analysisResults.complianceScore}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Meeting specifications
                    </p>
                  </div>
                </div>
              </div>

              {/* Risk Assessment */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Risk Assessment</h3>
                <div
                  className={`p-4 rounded-lg border-l-4 ${
                    selectedDocument.analysisResults.riskAssessment
                      .overallRisk === "high"
                      ? "bg-red-50 border-red-500"
                      : selectedDocument.analysisResults.riskAssessment
                            .overallRisk === "medium"
                        ? "bg-yellow-50 border-yellow-500"
                        : "bg-green-50 border-green-500"
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      selectedDocument.analysisResults.riskAssessment
                        .overallRisk === "high"
                        ? "text-red-700"
                        : selectedDocument.analysisResults.riskAssessment
                              .overallRisk === "medium"
                          ? "text-yellow-700"
                          : "text-green-700"
                    }`}
                  >
                    Overall Risk:{" "}
                    {selectedDocument.analysisResults.riskAssessment.overallRisk.toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-600 mt-2">
                    Risk Score:{" "}
                    {selectedDocument.analysisResults.riskAssessment.riskScore}
                    /100
                  </p>
                </div>

                {selectedDocument.analysisResults.riskAssessment.technicalRisks
                  .length > 0 && (
                  <div className="mt-3 p-3 bg-slate-50 rounded">
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Technical Risks:
                    </p>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {selectedDocument.analysisResults.riskAssessment.technicalRisks.map(
                        (risk, idx) => (
                          <li key={idx}>• {risk}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Analysis Summary */}
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  AI Analysis Summary
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-slate-700">
                    {selectedDocument.geminiAnalysis.summary}
                  </p>
                </div>
              </div>

              {/* Detailed Analysis */}
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  Detailed Analysis
                </h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {selectedDocument.geminiAnalysis.detailedAnalysis}
                  </p>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-green-700">
                    Strengths
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-2">
                    {selectedDocument.analysisResults.strengths.map(
                      (strength, idx) => (
                        <li key={idx} className="flex gap-2">
                          <CheckCircle
                            size={16}
                            className="text-green-600 flex-shrink-0 mt-0.5"
                          />
                          <span>{strength}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2 text-red-700">
                    Weaknesses
                  </h3>
                  <ul className="text-sm text-slate-600 space-y-2">
                    {selectedDocument.analysisResults.weaknesses.map(
                      (weakness, idx) => (
                        <li key={idx} className="flex gap-2">
                          <AlertTriangle
                            size={16}
                            className="text-red-600 flex-shrink-0 mt-0.5"
                          />
                          <span>{weakness}</span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="font-semibold text-lg mb-2">Recommendations</h3>
                <ul className="text-sm text-slate-600 space-y-2">
                  {selectedDocument.analysisResults.recommendations.map(
                    (rec, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-600 font-bold">→</span>
                        <span>{rec}</span>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              {/* Suggested Questions */}
              {selectedDocument.geminiAnalysis.suggestedQuestions &&
                selectedDocument.geminiAnalysis.suggestedQuestions.length >
                  0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">
                      Questions for Vendor
                    </h3>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <ul className="text-sm text-slate-700 space-y-2">
                        {selectedDocument.geminiAnalysis.suggestedQuestions.map(
                          (question, idx) => (
                            <li key={idx} className="flex gap-2">
                              <span className="text-amber-600 font-bold">
                                Q{idx + 1}.
                              </span>
                              <span>{question}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                )}
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-2">
              <button
                onClick={() => setShowDocumentModal(false)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300"
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
