import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  CreditCard,
  CheckCircle,
  AlertCircle,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTenderDetail } from "@hooks/useTenders";
import yocoPaymentService from "@services/yocoPaymentService";
import Loading from "@components/Loading";
import Error from "@components/Error";
import Button from "@components/Button";
import { formatCurrency } from "@utils/formatters";

export default function TenderPurchasePage() {
  const { tenderId } = useParams<{ tenderId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const {
    tender,
    loading: tenderLoading,
    error: tenderError,
  } = useTenderDetail(tenderId || "");

  const [alreadyPurchased, setAlreadyPurchased] = useState(false);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if the user has already purchased this tender
  useEffect(() => {
    async function checkPurchaseStatus() {
      if (!currentUser?.uid || !tenderId) return;
      try {
        const purchased = await yocoPaymentService.hasUserPurchasedTender(
          currentUser.uid,
          tenderId,
        );
        setAlreadyPurchased(purchased);
      } catch (err) {
        console.error("Error checking purchase status:", err);
      } finally {
        setCheckingPurchase(false);
      }
    }
    checkPurchaseStatus();
  }, [currentUser?.uid, tenderId]);

  const handlePurchase = async () => {
    if (!currentUser?.uid || !tender || !tenderId) return;

    const fee = (tender as any).tenderFee || 0;
    const currency = (tender as any).tenderFeeCurrency || "ZAR";

    if (fee <= 0) {
      // Free tender — mark as purchased directly
      try {
        setProcessing(true);
        await yocoPaymentService.recordPurchase({
          tenderId,
          tenderTitle: tender.title,
          userId: currentUser.uid,
          userEmail: currentUser.email || "",
          userName: currentUser.displayName || currentUser.email || "Unknown",
          amount: 0,
          currency,
          yocoCheckoutId: "free",
          status: "completed",
        });
        setPaymentSuccess(true);
        setAlreadyPurchased(true);
      } catch (err) {
        setError("Failed to record free purchase. Please try again.");
      } finally {
        setProcessing(false);
      }
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Create Yoco checkout and redirect to hosted payment page
      await yocoPaymentService.initiateCheckout(
        tenderId,
        currentUser.uid,
        currentUser.email || "",
        currentUser.displayName || currentUser.email || "Unknown",
        tender.title,
        Math.round(fee * 100),
        currency,
      );
      // User is redirected to Yoco — this code won't continue
    } catch (err: any) {
      setError(err?.message || "Failed to initiate payment. Please try again.");
      setProcessing(false);
    }
  };

  if (tenderLoading || checkingPurchase)
    return <Loading message="Loading..." />;
  if (tenderError) return <Error message={tenderError} />;
  if (!tender) return <Error message="Tender not found" />;
  if (!currentUser)
    return (
      <Error message="You must be logged in to purchase tender documents" />
    );

  const tenderFee = (tender as any).tenderFee || 0;
  const feeCurrency = (tender as any).tenderFeeCurrency || "ZAR";
  const isFree = tenderFee <= 0;

  // If already purchased, redirect to tender detail
  if (alreadyPurchased && !paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="text-green-600 mx-auto mb-3" size={48} />
          <h2 className="text-xl font-bold text-green-900 mb-2">
            Already Purchased
          </h2>
          <p className="text-green-800 mb-4">
            You have already purchased this tender. You can access all
            documents.
          </p>
          <Button onClick={() => navigate(`/tenders/${tenderId}`)}>
            View Tender Documents
          </Button>
        </div>
      </div>
    );
  }

  // Payment success screen
  if (paymentSuccess) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="text-green-600 mx-auto mb-4" size={56} />
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-green-800 mb-6">
            You now have full access to all documents for{" "}
            <strong>{tender.title}</strong>.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => navigate(`/tenders/${tenderId}`)}>
              View Tender Documents
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/bids/new/${tenderId}`)}
            >
              Submit a Bid
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
            Purchase Tender Documents
          </h1>
          <p className="text-gray-600 mt-1">
            Complete payment to access tender documents and submit bids
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Tender Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Tender Summary
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Tender Title</p>
            <p className="font-medium text-gray-900">{tender.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <p className="font-medium text-gray-900">
              {(tender as any).category || tender.category}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Budget</p>
            <p className="font-medium text-gray-900">
              {formatCurrency(
                tender.budget,
                (tender as any).currency || tender.currency,
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Documents Available</p>
            <p className="font-medium text-gray-900">
              {tender.attachments?.length ||
                (tender as any).documents?.length ||
                0}{" "}
              document(s)
            </p>
          </div>
        </div>
      </div>

      {/* What You Get */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What You Get
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <FileText className="text-secondary mt-0.5" size={20} />
            <div>
              <p className="font-medium text-gray-900">Full Tender Documents</p>
              <p className="text-sm text-gray-600">
                Download all tender documents including specifications and
                requirements
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CreditCard className="text-secondary mt-0.5" size={20} />
            <div>
              <p className="font-medium text-gray-900">Bid Submission Access</p>
              <p className="text-sm text-gray-600">
                Submit your bid for this tender after reviewing the documents
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-secondary mt-0.5" size={20} />
            <div>
              <p className="font-medium text-gray-900">Secure Payment</p>
              <p className="text-sm text-gray-600">
                Payments processed securely via Yoco payment gateway
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment</h3>

        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Tender Document Fee</span>
            <span className="text-2xl font-bold text-primary">
              {isFree ? "FREE" : formatCurrency(tenderFee, feeCurrency)}
            </span>
          </div>
        </div>

        <Button
          onClick={handlePurchase}
          loading={processing}
          disabled={processing}
          size="lg"
          className="w-full"
        >
          {processing
            ? "Processing..."
            : isFree
              ? "Get Free Access"
              : `Pay ${formatCurrency(tenderFee, feeCurrency)}`}
        </Button>

        <p className="text-xs text-center text-gray-500 mt-4">
          By purchasing, you agree to the terms and conditions of this
          procurement process.
          {!isFree && " Payment is processed securely via Yoco."}
        </p>
      </div>
    </div>
  );
}
