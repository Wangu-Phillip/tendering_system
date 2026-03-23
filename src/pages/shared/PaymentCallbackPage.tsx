import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import demoPaymentService from "@services/demoPaymentService";
import Button from "@components/Button";

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const status = searchParams.get("status");
  const tenderId = searchParams.get("tenderId");
  const checkoutId = searchParams.get("id");

  const [verifying, setVerifying] = useState(true);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyPayment() {
      if (status === "cancelled") {
        setVerifying(false);
        return;
      }

      if (status === "failed") {
        setError("Payment failed. Please try again.");
        setVerifying(false);
        return;
      }

      if (!currentUser?.uid) {
        setVerifying(false);
        return;
      }

      // If we have a checkout ID, mark as confirmed (demo mode)
      if (checkoutId) {
        setPaymentConfirmed(true);
      } else if (tenderId) {
        // Fallback: check Firestore directly
        try {
          const purchased = await demoPaymentService.hasUserPurchasedTender(
            currentUser.uid,
            tenderId,
          );
          setPaymentConfirmed(purchased);
          if (!purchased) {
            setError(
              "Payment verification pending. It may take a moment to process.",
            );
          }
        } catch {
          setError("Unable to verify payment status.");
        }
      }

      setVerifying(false);
    }

    verifyPayment();
  }, [status, checkoutId, tenderId, currentUser?.uid]);

  if (verifying) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
        <Loader className="animate-spin text-secondary mx-auto" size={48} />
        <h2 className="text-xl font-semibold text-gray-900">
          Verifying Payment...
        </h2>
        <p className="text-gray-600">
          Please wait while we confirm your payment.
        </p>
      </div>
    );
  }

  // Cancelled
  if (status === "cancelled") {
    return (
      <div className="max-w-lg mx-auto mt-20 space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <AlertCircle className="text-yellow-600 mx-auto mb-4" size={56} />
          <h2 className="text-2xl font-bold text-yellow-900 mb-2">
            Payment Cancelled
          </h2>
          <p className="text-yellow-800 mb-6">
            You cancelled the payment. No charges were made.
          </p>
          <div className="flex justify-center gap-3">
            {tenderId && (
              <Button onClick={() => navigate(`/tenders/${tenderId}/purchase`)}>
                Try Again
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate("/tenders")}>
              Browse Tenders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Failed
  if (error || status === "failed") {
    return (
      <div className="max-w-lg mx-auto mt-20 space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <XCircle className="text-red-600 mx-auto mb-4" size={56} />
          <h2 className="text-2xl font-bold text-red-900 mb-2">
            Payment Failed
          </h2>
          <p className="text-red-800 mb-6">
            {error ||
              "Something went wrong with your payment. Please try again."}
          </p>
          <div className="flex justify-center gap-3">
            {tenderId && (
              <Button onClick={() => navigate(`/tenders/${tenderId}/purchase`)}>
                Try Again
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate("/tenders")}>
              Browse Tenders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success
  if (paymentConfirmed) {
    return (
      <div className="max-w-lg mx-auto mt-20 space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <CheckCircle className="text-green-600 mx-auto mb-4" size={56} />
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-green-800 mb-6">
            You now have full access to the tender documents. You can download
            them and submit your bid.
          </p>
          <div className="flex justify-center gap-3">
            {tenderId && (
              <>
                <Button onClick={() => navigate(`/tenders/${tenderId}`)}>
                  View Tender Documents
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate(`/bids/new/${tenderId}`)}
                >
                  Submit a Bid
                </Button>
              </>
            )}
            {!tenderId && (
              <Button onClick={() => navigate("/tenders")}>
                Browse Tenders
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
      <AlertCircle className="text-gray-400 mx-auto" size={48} />
      <h2 className="text-xl font-semibold text-gray-900">
        Payment Status Unknown
      </h2>
      <p className="text-gray-600">
        We couldn't determine your payment status.
      </p>
      <div className="flex justify-center gap-3">
        {tenderId && (
          <Button onClick={() => navigate(`/tenders/${tenderId}/purchase`)}>
            Try Again
          </Button>
        )}
        <Button variant="secondary" onClick={() => navigate("/tenders")}>
          Browse Tenders
        </Button>
      </div>
    </div>
  );
}
