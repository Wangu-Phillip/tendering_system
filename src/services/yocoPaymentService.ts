import { db, auth } from '@/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { TenderPurchase } from '@/types';

const YOCO_SECRET_KEY = import.meta.env.VITE_YOCO_SECRET_KEY || '';
const YOCO_CHECKOUT_URL = '/api/yoco/checkouts';

class YocoPaymentService {
  /**
   * Create a Yoco Checkout session and redirect the user to the hosted payment page.
   * Records a pending purchase in Firestore before redirecting.
   */
  async initiateCheckout(
    tenderId: string,
    userId: string,
    userEmail: string,
    userName: string,
    tenderTitle: string,
    amountInCents: number,
    currency: string,
  ): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    if (!YOCO_SECRET_KEY) {
      throw new Error('Yoco secret key is not configured');
    }

    const appBaseUrl = window.location.origin;

    // Create Yoco checkout session
    const response = await fetch(YOCO_CHECKOUT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency,
        successUrl: `${appBaseUrl}/payment/callback?status=success&tenderId=${tenderId}`,
        cancelUrl: `${appBaseUrl}/payment/callback?status=cancelled&tenderId=${tenderId}`,
        failureUrl: `${appBaseUrl}/payment/callback?status=failed&tenderId=${tenderId}`,
        metadata: {
          tenderId,
          userId,
          tenderTitle,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Checkout creation failed (${response.status})`);
    }

    const checkout = await response.json() as {
      id: string;
      redirectUrl: string;
      status: string;
    };

    if (!checkout.id || !checkout.redirectUrl) {
      throw new Error('Invalid checkout response from Yoco');
    }

    // Record pending purchase in Firestore before redirecting
    await this.recordPurchase({
      tenderId,
      tenderTitle,
      userId,
      userEmail,
      userName,
      amount: amountInCents / 100,
      currency,
      yocoCheckoutId: checkout.id,
      status: 'pending',
    });

    // Redirect to Yoco hosted payment page
    window.location.href = checkout.redirectUrl;
  }

  /**
   * Verify a checkout after the user is redirected back.
   * Checks Yoco's API for the checkout status and updates Firestore.
   */
  async verifyCheckout(checkoutId: string): Promise<{ success: boolean; tenderId: string }> {
    if (!YOCO_SECRET_KEY) {
      throw new Error('Yoco secret key is not configured');
    }

    // Find the pending purchase
    const purchase = await this.getPurchaseByCheckoutId(checkoutId);
    if (!purchase) {
      throw new Error('Purchase record not found');
    }

    if (purchase.status === 'completed') {
      return { success: true, tenderId: purchase.tenderId };
    }

    // Check checkout status with Yoco
    const response = await fetch(`${YOCO_CHECKOUT_URL}/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to verify checkout with Yoco');
    }

    const checkout = await response.json() as { id: string; status: string };

    // Update purchase status in Firestore
    const purchasesRef = collection(db, 'tenderPurchases');
    const q = query(purchasesRef, where('yocoCheckoutId', '==', checkoutId));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const purchaseDoc = snapshot.docs[0];
      const newStatus = checkout.status === 'completed' ? 'completed' : 'failed';
      await updateDoc(doc(db, 'tenderPurchases', purchaseDoc.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      success: checkout.status === 'completed',
      tenderId: purchase.tenderId,
    };
  }

  /**
   * Record a purchase in Firestore (for free tenders)
   */
  async recordPurchase(
    purchase: Omit<TenderPurchase, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    const purchasesRef = collection(db, 'tenderPurchases');
    const docRef = await addDoc(purchasesRef, {
      ...purchase,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  /**
   * Check if a user has already purchased a specific tender
   */
  async hasUserPurchasedTender(
    userId: string,
    tenderId: string,
  ): Promise<boolean> {
    const purchasesRef = collection(db, 'tenderPurchases');
    const q = query(
      purchasesRef,
      where('userId', '==', userId),
      where('tenderId', '==', tenderId),
      where('status', '==', 'completed'),
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  /**
   * Get a purchase by its Yoco checkout ID
   */
  async getPurchaseByCheckoutId(checkoutId: string): Promise<TenderPurchase | null> {
    const purchasesRef = collection(db, 'tenderPurchases');
    const q = query(purchasesRef, where('yocoCheckoutId', '==', checkoutId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as TenderPurchase;
  }

  /**
   * Get all purchases for a user
   */
  async getUserPurchases(userId: string): Promise<TenderPurchase[]> {
    const purchasesRef = collection(db, 'tenderPurchases');
    const q = query(purchasesRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TenderPurchase[];
  }

  /**
   * Get all purchases for a tender (for admin/buyer view)
   */
  async getTenderPurchases(tenderId: string): Promise<TenderPurchase[]> {
    const purchasesRef = collection(db, 'tenderPurchases');
    const q = query(purchasesRef, where('tenderId', '==', tenderId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TenderPurchase[];
  }
}

const yocoPaymentService = new YocoPaymentService();
export default yocoPaymentService;
