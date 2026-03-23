import { db } from '@/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { TenderPurchase } from '@/types';

/**
 * Demo Payment Service — simulates payment processing for presentation purposes.
 * No external accounts or API keys required.
 *
 * Test card numbers:
 *   4111 1111 1111 1111 → Success
 *   4000 0000 0000 0000 → Decline
 *   Any other valid-looking number → Success
 */
class DemoPaymentService {
  /**
   * Simulate processing a card payment.
   * Returns after a realistic delay.
   */
  async processPayment(card: {
    number: string;
    expiry: string;
    cvv: string;
    name: string;
  }): Promise<{ success: boolean; message: string; transactionId: string }> {
    // Simulate network delay (1.5–2.5s)
    await new Promise((resolve) =>
      setTimeout(resolve, 1500 + Math.random() * 1000),
    );

    const cleanNumber = card.number.replace(/\s/g, '');

    // Decline card
    if (cleanNumber === '4000000000000000') {
      return {
        success: false,
        message: 'Card declined. Please try a different card.',
        transactionId: '',
      };
    }

    // Generate a mock transaction ID
    const transactionId = `DEMO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return {
      success: true,
      message: 'Payment approved',
      transactionId,
    };
  }

  /**
   * Record a purchase in Firestore
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
   * Get all purchases for a tender
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

const demoPaymentService = new DemoPaymentService();
export default demoPaymentService;
