import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import procurementEntityService from "@/services/procurementEntityService";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

interface Bid {
  id: string;
  tenderId: string;
  vendorName: string;
  vendorId: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  createdAt: string;
}

interface Evaluation {
  id: string;
  bidId: string;
  score: number;
  breakdown: {
    price: number;
    quality: number;
    experience: number;
    compliance: number;
  };
  comments: string;
  recommendedForAward: boolean;
  createdAt: string;
}

export default function BidEvaluationPage() {
  const { tenderId } = useParams<{ tenderId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [bids, setBids] = useState<Bid[]>([]);
  const [evaluations, setEvaluations] = useState<Map<string, Evaluation>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBidId, setSelectedBidId] = useState<string | null>(null);
  const [evaluationForm, setEvaluationForm] = useState({
    price: 0,
    quality: 0,
    experience: 0,
    compliance: 0,
    comments: "",
    recommendedForAward: false,
  });

  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);

  useEffect(() => {
    loadData();
  }, [tenderId]);

  const loadData = async () => {
    if (!tenderId) return;

    try {
      setLoading(true);
      const [bidsData, evaluationsData] = await Promise.all([
        procurementEntityService.getBidsForTender(tenderId),
        procurementEntityService.getEvaluationsForTender(tenderId),
      ]);

      setBids(bidsData);

      const evaluationsMap = new Map();
      evaluationsData.forEach((e) => {
        evaluationsMap.set(e.bidId, e);
      });
      setEvaluations(evaluationsMap);
    } catch (err: unknown) {
      const errorMessage = (err as any)?.message || "Failed to load data";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalScore = () => {
    const { price, quality, experience, compliance } = evaluationForm;
    return (price + quality + experience + compliance) / 4;
  };

  const handleEvaluationChange = (
    field: string,
    value: number | string | boolean,
  ) => {
    setEvaluationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submitEvaluation = async () => {
    if (!selectedBidId || !currentUser?.uid) {
      setError("Unable to submit evaluation");
      return;
    }

    const selectedBid = bids.find((b) => b.id === selectedBidId);
    if (!selectedBid) return;

    try {
      setSubmittingEvaluation(true);
      const score = calculateTotalScore();

      await procurementEntityService.createEvaluation({
        bidId: selectedBidId,
        tenderId: tenderId || "",
        evaluatorId: currentUser.uid,
        evaluatorName: currentUser.displayName || "Evaluator",
        vendorName: selectedBid.vendorName,
        bidAmount: selectedBid.amount,
        score,
        breakdown: {
          price: evaluationForm.price,
          quality: evaluationForm.quality,
          experience: evaluationForm.experience,
          compliance: evaluationForm.compliance,
        },
        comments: evaluationForm.comments,
        recommendedForAward: evaluationForm.recommendedForAward,
      });

      // Reload data
      await loadData();
      setSelectedBidId(null);
      setEvaluationForm({
        price: 0,
        quality: 0,
        experience: 0,
        compliance: 0,
        comments: "",
        recommendedForAward: false,
      });
    } catch (err: unknown) {
      const errorMessage = (err as any)?.message || "Failed to save evaluation";
      setError(errorMessage);
    } finally {
      setSubmittingEvaluation(false);
    }
  };

  const getRankByScore = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Satisfactory";
    return "Below Average";
  };

  if (loading) return <Loading message="Loading bids..." />;

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
          <h1 className="text-3xl font-bold text-gray-900">Evaluate Bids</h1>
          <p className="text-gray-600 mt-1">
            Review and score bids for this tender
          </p>
        </div>
      </div>

      {error && <Error message={error} />}

      {bids.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600">
            No bids submitted yet for this tender.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bids List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Bids ({bids.length})
                </h2>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {bids.map((bid) => {
                  const evaluation = evaluations.get(bid.id);
                  const isSelected = selectedBidId === bid.id;

                  return (
                    <button
                      key={bid.id}
                      onClick={() => {
                        setSelectedBidId(bid.id);
                        if (evaluation) {
                          setEvaluationForm({
                            price: evaluation.breakdown.price,
                            quality: evaluation.breakdown.quality,
                            experience: evaluation.breakdown.experience,
                            compliance: evaluation.breakdown.compliance,
                            comments: evaluation.comments,
                            recommendedForAward: evaluation.recommendedForAward,
                          });
                        }
                      }}
                      className={`w-full p-4 text-left transition-colors ${
                        isSelected
                          ? "bg-blue-50 border-l-4 border-secondary"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <p className="font-semibold text-gray-900 text-sm">
                        {bid.vendorName}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {bid.amount.toLocaleString()} {bid.currency}
                      </p>
                      {evaluation && (
                        <div className="mt-2 flex items-center gap-1">
                          <span className="text-xs font-semibold text-secondary">
                            {evaluation.score.toFixed(1)}/100
                          </span>
                        </div>
                      )}
                      {evaluation?.recommendedForAward && (
                        <div className="mt-2 text-xs text-green-600 font-semibold">
                          ✓ Recommended
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Evaluation Form */}
          <div className="lg:col-span-2">
            {selectedBidId ? (
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                {(() => {
                  const bid = bids.find((b) => b.id === selectedBidId);
                  if (!bid) return null;

                  const evaluation = evaluations.get(selectedBidId);

                  return (
                    <>
                      {/* Bid Details */}
                      <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                          {bid.vendorName}
                        </h2>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Bid Amount</p>
                            <p className="text-xl font-bold text-gray-900">
                              {bid.amount.toLocaleString()} {bid.currency}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Status</p>
                            <p className="text-xl font-bold text-gray-900 capitalize">
                              {evaluation ? "Evaluated" : "Pending"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Bid Description
                          </p>
                          <p className="text-gray-700 text-sm">
                            {bid.description}
                          </p>
                        </div>
                      </div>

                      <hr />

                      {/* Evaluation Form */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Evaluation Criteria
                        </h3>

                        {/* Price */}
                        <div>
                          <label className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Price Score (0-100)
                            </span>
                            <span className="text-sm text-secondary font-semibold">
                              {evaluationForm.price}
                            </span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={evaluationForm.price}
                            onChange={(e) =>
                              handleEvaluationChange(
                                "price",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Quality */}
                        <div>
                          <label className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Quality Score (0-100)
                            </span>
                            <span className="text-sm text-secondary font-semibold">
                              {evaluationForm.quality}
                            </span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={evaluationForm.quality}
                            onChange={(e) =>
                              handleEvaluationChange(
                                "quality",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Experience */}
                        <div>
                          <label className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Experience Score (0-100)
                            </span>
                            <span className="text-sm text-secondary font-semibold">
                              {evaluationForm.experience}
                            </span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={evaluationForm.experience}
                            onChange={(e) =>
                              handleEvaluationChange(
                                "experience",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Compliance */}
                        <div>
                          <label className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              Compliance Score (0-100)
                            </span>
                            <span className="text-sm text-secondary font-semibold">
                              {evaluationForm.compliance}
                            </span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={evaluationForm.compliance}
                            onChange={(e) =>
                              handleEvaluationChange(
                                "compliance",
                                parseInt(e.target.value),
                              )
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Total Score */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              Overall Score
                            </span>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-secondary">
                                {calculateTotalScore().toFixed(1)}/100
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {getRankByScore(calculateTotalScore())}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Comments */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Evaluation Comments
                          </label>
                          <textarea
                            value={evaluationForm.comments}
                            onChange={(e) =>
                              handleEvaluationChange("comments", e.target.value)
                            }
                            placeholder="Provide detailed feedback on this bid..."
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                          />
                        </div>

                        {/* Recommendation */}
                        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={evaluationForm.recommendedForAward}
                            onChange={(e) =>
                              handleEvaluationChange(
                                "recommendedForAward",
                                e.target.checked,
                              )
                            }
                            className="w-4 h-4 text-secondary rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Recommend for award
                          </span>
                        </label>
                      </div>

                      <div className="flex gap-3 pt-4 border-t">
                        <button
                          type="button"
                          onClick={() => setSelectedBidId(null)}
                          className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitEvaluation}
                          disabled={submittingEvaluation}
                          className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
                        >
                          {submittingEvaluation
                            ? "Saving..."
                            : evaluation
                              ? "Update Evaluation"
                              : "Save Evaluation"}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
                <p className="text-gray-600">
                  Select a bid from the list to evaluate it
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
