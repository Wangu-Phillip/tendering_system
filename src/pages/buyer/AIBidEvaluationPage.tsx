import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  Trophy,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import aiBidEvaluationService, {
  AIBidEvaluation,
  AIRankedBid,
} from "@/services/aiBidEvaluationService";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

export default function AIBidEvaluationPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [closedTenders, setClosedTenders] = useState<any[]>([]);
  const [selectedTenderId, setSelectedTenderId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<AIBidEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [awarding, setAwarding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadClosedTenders();
  }, [currentUser?.uid]);

  const loadClosedTenders = async () => {
    try {
      setLoading(true);
      setError(null);
      const tenders =
        await aiBidEvaluationService.getClosedTendersForEvaluation(
          currentUser?.uid,
        );
      setClosedTenders(tenders);
    } catch (err: any) {
      setError(err.message || "Failed to load tenders");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTender = async (tenderId: string) => {
    setSelectedTenderId(tenderId);
    setError(null);
    setSuccessMessage(null);

    // Check if evaluation already exists
    try {
      const existing =
        await aiBidEvaluationService.getEvaluationForTender(tenderId);
      setEvaluation(existing);
    } catch {
      setEvaluation(null);
    }
  };

  const runAIEvaluation = async () => {
    if (!selectedTenderId) return;

    try {
      setEvaluating(true);
      setError(null);
      setSuccessMessage(null);

      const result =
        await aiBidEvaluationService.evaluateBidsForTender(selectedTenderId);
      setEvaluation(result);
      setSuccessMessage(
        "AI evaluation completed successfully! Review the top 5 bids below.",
      );
    } catch (err: any) {
      setError(err.message || "AI evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  const reRunEvaluation = async () => {
    if (!selectedTenderId) return;

    try {
      setEvaluating(true);
      setError(null);
      setSuccessMessage(null);

      const result = await aiBidEvaluationService.reEvaluate(selectedTenderId);
      setEvaluation(result);
      setSuccessMessage("AI re-evaluation completed successfully!");
    } catch (err: any) {
      setError(err.message || "Re-evaluation failed");
    } finally {
      setEvaluating(false);
    }
  };

  const handleAwardBid = async (bidId: string, vendorName: string) => {
    if (!evaluation || !currentUser?.uid) return;

    if (
      !window.confirm(
        `Are you sure you want to award this tender to ${vendorName}? This action will reject all other bids.`,
      )
    ) {
      return;
    }

    try {
      setAwarding(true);
      setError(null);

      await aiBidEvaluationService.awardBid(
        evaluation.id,
        bidId,
        currentUser.uid,
      );
      setSuccessMessage(`Tender awarded to ${vendorName}!`);

      // Refresh evaluation
      const updated = await aiBidEvaluationService.getEvaluationForTender(
        selectedTenderId!,
      );
      setEvaluation(updated);

      // Refresh tenders list
      await loadClosedTenders();
    } catch (err: any) {
      setError(err.message || "Failed to award bid");
    } finally {
      setAwarding(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-400 text-yellow-900";
    if (rank === 2) return "bg-gray-300 text-gray-800";
    if (rank === 3) return "bg-amber-600 text-white";
    return "bg-gray-100 text-gray-600";
  };

  if (loading) return <Loading message="Loading closed tenders..." />;

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
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="text-secondary" size={32} />
            AI Bid Evaluation
          </h1>
          <p className="text-gray-600 mt-1">
            Gemini AI evaluates submitted bids after the tender closes and
            recommends the top 5 bids
          </p>
        </div>
      </div>

      {error && <Error message={error} />}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Closed Tenders List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">
                Closed Tenders ({closedTenders.length})
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Tenders past submission deadline
              </p>
            </div>

            {closedTenders.length === 0 ? (
              <div className="p-6 text-center">
                <Clock className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500 text-sm">
                  No closed tenders with submitted bids found.
                </p>
              </div>
            ) : (
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {closedTenders.map((tender) => (
                  <button
                    key={tender.id}
                    onClick={() => handleSelectTender(tender.id)}
                    className={`w-full p-4 text-left transition-colors ${
                      selectedTenderId === tender.id
                        ? "bg-blue-50 border-l-4 border-secondary"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm line-clamp-2">
                      {tender.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {tender.submittedBidCount} bid
                      {tender.submittedBidCount !== 1 ? "s" : ""} submitted
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          tender.status === "evaluated"
                            ? "bg-green-100 text-green-700"
                            : tender.status === "awarded"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {tender.status === "evaluated"
                          ? "AI Evaluated"
                          : tender.status === "awarded"
                            ? "Awarded"
                            : "Pending Evaluation"}
                      </span>
                    </div>
                    {tender.budget && (
                      <p className="text-xs text-gray-400 mt-1">
                        Budget: {Number(tender.budget).toLocaleString()}{" "}
                        {tender.currency || "BWP"}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Evaluation Panel */}
        <div className="lg:col-span-3">
          {!selectedTenderId ? (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
              <Bot className="mx-auto text-gray-400 mb-3" size={48} />
              <p className="text-gray-600 text-lg font-medium">
                Select a closed tender to evaluate
              </p>
              <p className="text-gray-400 text-sm mt-2">
                The AI will analyze all submitted bids and recommend the top 5
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Action Bar */}
              <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {
                      closedTenders.find((t) => t.id === selectedTenderId)
                        ?.title
                    }
                  </h3>
                  <p className="text-sm text-gray-500">
                    {
                      closedTenders.find((t) => t.id === selectedTenderId)
                        ?.submittedBidCount
                    }{" "}
                    submitted bids
                  </p>
                </div>

                <div className="flex gap-3">
                  {evaluation?.status === "completed" &&
                    !evaluation.winnerId && (
                      <button
                        onClick={reRunEvaluation}
                        disabled={evaluating}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          size={16}
                          className={evaluating ? "animate-spin" : ""}
                        />
                        Re-evaluate
                      </button>
                    )}

                  {(!evaluation || evaluation.status === "failed") && (
                    <button
                      onClick={runAIEvaluation}
                      disabled={evaluating}
                      className="flex items-center gap-2 px-6 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {evaluating ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <Bot size={16} />
                          Run AI Evaluation
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Evaluating State */}
              {evaluating && (
                <div className="bg-blue-50 rounded-lg p-8 text-center">
                  <RefreshCw
                    size={48}
                    className="animate-spin mx-auto text-secondary mb-4"
                  />
                  <h3 className="text-lg font-semibold text-gray-900">
                    AI is evaluating bids...
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Gemini AI is analyzing all submitted bids against the tender
                    requirements. This may take a moment.
                  </p>
                </div>
              )}

              {/* Winner Banner */}
              {evaluation?.winnerId && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <Trophy className="text-yellow-600" size={28} />
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Tender Awarded to {evaluation.winnerName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Awarded on{" "}
                        {new Date(evaluation.awardedAt!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Top 5 Bids */}
              {evaluation?.status === "completed" &&
                evaluation.topBids.length > 0 &&
                !evaluating && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Star className="text-yellow-500" size={20} />
                        Top {evaluation.topBids.length} Recommended Bids
                      </h3>
                      <p className="text-sm text-gray-500">
                        {evaluation.totalBidsEvaluated} total bids evaluated
                      </p>
                    </div>

                    {evaluation.topBids.map((bid) => (
                      <BidCard
                        key={bid.bidId}
                        bid={bid}
                        isWinner={evaluation.winnerId === bid.bidId}
                        isAwarded={!!evaluation.winnerId}
                        awarding={awarding}
                        onAward={() =>
                          handleAwardBid(bid.bidId, bid.vendorName)
                        }
                        getScoreColor={getScoreColor}
                        getRankBadge={getRankBadge}
                      />
                    ))}
                  </div>
                )}

              {/* Failed State */}
              {evaluation?.status === "failed" && !evaluating && (
                <div className="bg-red-50 rounded-lg p-6 text-center">
                  <AlertCircle
                    className="mx-auto text-red-500 mb-3"
                    size={40}
                  />
                  <h3 className="text-lg font-semibold text-red-800">
                    Evaluation Failed
                  </h3>
                  <p className="text-red-600 mt-2">
                    The AI evaluation encountered an error. Please try again.
                  </p>
                </div>
              )}

              {/* No Evaluation Yet */}
              {!evaluation && !evaluating && (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <Bot className="mx-auto text-gray-400 mb-3" size={48} />
                  <h3 className="text-lg font-semibold text-gray-700">
                    Ready for AI Evaluation
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Click "Run AI Evaluation" to let Gemini AI analyze all
                    submitted bids and recommend the top 5 candidates.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Bid Card Component
function BidCard({
  bid,
  isWinner,
  isAwarded,
  awarding,
  onAward,
  getScoreColor,
  getRankBadge,
}: {
  bid: AIRankedBid;
  isWinner: boolean;
  isAwarded: boolean;
  awarding: boolean;
  onAward: () => void;
  getScoreColor: (score: number) => string;
  getRankBadge: (rank: number) => string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`bg-white rounded-lg shadow overflow-hidden transition-all ${
        isWinner ? "ring-2 ring-yellow-400" : ""
      }`}
    >
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadge(bid.rank)}`}
            >
              {bid.rank}
            </span>
            <div>
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                {bid.vendorName}
                {isWinner && <Trophy className="text-yellow-500" size={16} />}
              </h4>
              <p className="text-sm text-gray-500">
                Bid: {bid.bidAmount.toLocaleString()} {bid.currency}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div
              className={`text-2xl font-bold ${getScoreColor(bid.overallScore)}`}
            >
              {bid.overallScore.toFixed(1)}
            </div>
            <p className="text-xs text-gray-500">Overall Score</p>
          </div>
        </div>

        {/* Score Breakdown Bar */}
        <div className="mt-4 grid grid-cols-5 gap-2">
          {[
            { label: "Price", value: bid.breakdown.priceCompetitiveness },
            { label: "Technical", value: bid.breakdown.technicalMerit },
            { label: "Experience", value: bid.breakdown.experienceRelevance },
            { label: "Compliance", value: bid.breakdown.complianceAdherence },
            { label: "Value", value: bid.breakdown.valueForMoney },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div
                className={`text-sm font-semibold ${getScoreColor(item.value)}`}
              >
                {item.value}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div
                  className={`h-1.5 rounded-full ${
                    item.value >= 80
                      ? "bg-green-500"
                      : item.value >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium text-secondary">AI Assessment:</span>{" "}
            {bid.aiSummary}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Recommendation:{" "}
            <span className="font-medium">{bid.recommendation}</span>
          </p>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-secondary hover:underline"
        >
          {expanded ? "Hide details" : "Show details"}
        </button>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 space-y-3">
            {bid.strengths.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-green-700 mb-1">
                  Strengths
                </h5>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {bid.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {bid.weaknesses.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-red-700 mb-1">
                  Weaknesses
                </h5>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {bid.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Award Button */}
      {!isAwarded && (
        <div className="px-5 py-3 bg-gray-50 border-t">
          <button
            onClick={onAward}
            disabled={awarding}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {awarding ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Awarding...
              </>
            ) : (
              <>
                <Trophy size={16} />
                Award Tender to {bid.vendorName}
              </>
            )}
          </button>
        </div>
      )}

      {isWinner && (
        <div className="px-5 py-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center justify-center gap-2 text-yellow-800 font-semibold">
            <CheckCircle size={16} />
            Winner
          </div>
        </div>
      )}
    </div>
  );
}
