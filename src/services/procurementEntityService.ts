import { db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
  orderBy,
  addDoc,
} from 'firebase/firestore';
import { ClarificationRequest, Contract } from '@/types';

interface Tender {
  id: string;
  title: string;
  description: string;
  procuringEntityId: string;
  openDate: string;
  closeDate: string;
  budget: number;
  status: 'draft' | 'published' | 'closed' | 'evaluated' | 'awarded' | 'cancelled';
  category: string;
  documents: string[];
  evaluationCriteria: EvaluationCriteria[];
  createdAt: string;
  updatedAt: string;
}

interface EvaluationCriteria {
  name: string;
  weight: number;
  description: string;
}

interface BidEvaluation {
  id: string;
  bidId: string;
  tenderId: string;
  evaluatorId: string;
  evaluatorName: string;
  vendorName: string;
  bidAmount: number;
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
  updatedAt: string;
}

class ProcurementEntityService {
  // TENDER MANAGEMENT FOR PROCUREMENT ENTITIES
  async createTender(
    procuringEntityId: string,
    tenderData: Omit<Tender, 'id' | 'procuringEntityId' | 'createdAt' | 'updatedAt'>,
  ): Promise<string> {
    try {
      const tendersRef = collection(db, 'tenders');
      const docRef = await addDoc(tendersRef, {
        ...tenderData,
        procuringEntityId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating tender:', error);
      throw error;
    }
  }

  async publishTender(tenderId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'tenders', tenderId), {
        status: 'published',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error publishing tender:', error);
      throw error;
    }
  }

  async closeTender(tenderId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'tenders', tenderId), {
        status: 'closed',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error closing tender:', error);
      throw error;
    }
  }

  async getTendersByProcuringEntity(procuringEntityId: string): Promise<Tender[]> {
    try {
      const tendersRef = collection(db, 'tenders');
      const q = query(
        tendersRef,
        where('procuringEntityId', '==', procuringEntityId),
        orderBy('createdAt', 'desc'),
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tender[];
    } catch (error) {
      console.error('Error fetching tenders by procuring entity:', error);
      throw error;
    }
  }

  async getAllTenders(): Promise<Tender[]> {
    try {
      const tendersRef = collection(db, 'tenders');
      const q = query(tendersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tender[];
    } catch (error) {
      console.error('Error fetching all tenders:', error);
      throw error;
    }
  }

  async getTenderById(tenderId: string): Promise<Tender | null> {
    try {
      const tenderDoc = await getDoc(doc(db, 'tenders', tenderId));
      if (!tenderDoc.exists()) return null;
      return {
        id: tenderDoc.id,
        ...tenderDoc.data(),
      } as Tender;
    } catch (error) {
      console.error('Error fetching tender:', error);
      throw error;
    }
  }

  async updateTender(tenderId: string, updates: Partial<Tender>): Promise<void> {
    try {
      await updateDoc(doc(db, 'tenders', tenderId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating tender:', error);
      throw error;
    }
  }

  async deleteTender(tenderId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'tenders', tenderId));
    } catch (error) {
      console.error('Error deleting tender:', error);
      throw error;
    }
  }

  // BID MANAGEMENT AND EVALUATION
  async getBidsForTender(tenderId: string): Promise<any[]> {
    try {
      const bidsRef = collection(db, 'bids');
      const q = query(bidsRef, where('tenderId', '==', tenderId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error fetching bids for tender:', error);
      throw error;
    }
  }

  async getPendingEvaluations(procuringEntityId: string): Promise<any[]> {
    try {
      // Get all tenders for this procuring entity
      const tenders = await this.getTendersByProcuringEntity(procuringEntityId);
      const tenderIds = tenders.map((t) => t.id);

      if (tenderIds.length === 0) {
        return [];
      }

      // Get all bids for these tenders
      const bidsRef = collection(db, 'bids');
      const q = query(bidsRef, where('status', '==', 'submitted'));
      const snapshot = await getDocs(q);

      const allBids = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      // Filter bids for tenders of this procuring entity
      return allBids.filter((bid: any) => tenderIds.includes(bid.tenderId));
    } catch (error) {
      console.error('Error fetching pending evaluations:', error);
      throw error;
    }
  }

  async getAllBids(): Promise<any[]> {
    try {
      const bidsRef = collection(db, 'bids');
      const q = query(bidsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];
    } catch (error) {
      console.error('Error fetching all bids:', error);
      throw error;
    }
  
    } catch (error: any) {
      console.error('Error fetching pending evaluations:', error);
      throw error;
    }
  

  async createEvaluation(evaluation: Omit<BidEvaluation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const evaluationsRef = collection(db, 'evaluations');
      const docRef = await addDoc(evaluationsRef, {
        ...evaluation,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update bid status to evaluated
      await updateDoc(doc(db, 'bids', evaluation.bidId), {
        status: 'evaluated',
        evaluationScore: evaluation.score,
        updatedAt: new Date().toISOString(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating evaluation:', error);
      throw error;
    }
  }

  async updateEvaluation(evaluationId: string, updates: Partial<BidEvaluation>): Promise<void> {
    try {
      await updateDoc(doc(db, 'evaluations', evaluationId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating evaluation:', error);
      throw error;
    }
  }

  async getEvaluationsForTender(tenderId: string): Promise<BidEvaluation[]> {
    try {
      const evaluationsRef = collection(db, 'evaluations');
      const q = query(evaluationsRef, where('tenderId', '==', tenderId), orderBy('score', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BidEvaluation[];
    } catch (error) {
      console.error('Error fetching evaluations for tender:', error);
      throw error;
    }
  }

  async getEvaluationForBid(bidId: string): Promise<BidEvaluation | null> {
    try {
      const evaluationsRef = collection(db, 'evaluations');
      const q = query(evaluationsRef, where('bidId', '==', bidId));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as BidEvaluation;
    } catch (error) {
      console.error('Error fetching evaluation for bid:', error);
      throw error;
    }
  }

  // CLARIFICATION REQUESTS
  async sendClarificationRequest(request: Omit<ClarificationRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const requestsRef = collection(db, 'clarificationRequests');
      const docRef = await addDoc(requestsRef, {
        ...request,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error sending clarification request:', error);
      throw error;
    }
  }

  async respondToClarification(clarificationId: string, response: string, attachments?: string[]): Promise<void> {
    try {
      await updateDoc(doc(db, 'clarificationRequests', clarificationId), {
        response,
        responseAttachments: attachments || [],
        status: 'responded',
        respondedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error responding to clarification:', error);
      throw error;
    }
  }

  async getClarificationsForTender(tenderId: string): Promise<ClarificationRequest[]> {
    try {
      const requestsRef = collection(db, 'clarificationRequests');
      const q = query(requestsRef, where('tenderId', '==', tenderId), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ClarificationRequest[];
    } catch (error) {
      console.error('Error fetching clarifications for tender:', error);
      throw error;
    }
  }

  async getPendingClarifications(procuringEntityId: string): Promise<ClarificationRequest[]> {
    try {
      // Get all tenders for this procuring entity
      const tenders = await this.getTendersByProcuringEntity(procuringEntityId);
      const tenderIds = tenders.map((t) => t.id);

      if (tenderIds.length === 0) {
        return [];
      }

      // Get all pending clarifications
      const requestsRef = collection(db, 'clarificationRequests');
      const q = query(requestsRef, where('status', '==', 'pending'));
      const snapshot = await getDocs(q);

      const allClarifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ClarificationRequest[];

      // Filter for tenders of this procuring entity
      return allClarifications.filter((c) => tenderIds.includes(c.tenderId));
    } catch (error) {
      console.error('Error fetching pending clarifications:', error);
      throw error;
    }
  }

  // TENDER DEADLINE EXTENSION
  async extendTenderDeadline(
    tenderId: string,
    newDeadline: Date,
    reason: string,
    approvedBy: string,
  ): Promise<string> {
    try {
      // Create extension record
      const extensionsRef = collection(db, 'tenderExtensions');
      const existingTender = await this.getTenderById(tenderId);

      if (!existingTender) {
        throw new Error('Tender not found');
      }

      const docRef = await addDoc(extensionsRef, {
        tenderId,
        originalDeadline: new Date(existingTender.closeDate).toISOString(),
        newDeadline: newDeadline.toISOString(),
        reason,
        approvedBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update tender with new deadline
      await updateDoc(doc(db, 'tenders', tenderId), {
        closeDate: newDeadline.toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error extending tender deadline:', error);
      throw error;
    }
  }

  // CONTRACT MANAGEMENT
  async createContract(contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const contractsRef = collection(db, 'contracts');
      const docRef = await addDoc(contractsRef, {
        ...contract,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update bid status to awarded
      if (contract.awardedBidId) {
        await updateDoc(doc(db, 'bids', contract.awardedBidId), {
          status: 'awarded',
          updatedAt: new Date().toISOString(),
        });
      }

      // Update tender status to awarded
      await updateDoc(doc(db, 'tenders', contract.tenderId), {
        status: 'awarded',
        updatedAt: new Date().toISOString(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  async updateContractStatus(contractId: string, status: Contract['status']): Promise<void> {
    try {
      await updateDoc(doc(db, 'contracts', contractId), {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating contract status:', error);
      throw error;
    }
  }

  async getContractsForProcuringEntity(procuringEntityId: string): Promise<Contract[]> {
    try {
      // First get all tenders for this procuring entity
      const tenders = await this.getTendersByProcuringEntity(procuringEntityId);
      const tenderIds = tenders.map((t) => t.id);

      if (tenderIds.length === 0) {
        return [];
      }

      // Get all contracts for these tenders
      const contractsRef = collection(db, 'contracts');
      const q = query(contractsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const allContracts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Contract[];

      // Filter for contracts of tenders belonging to this procuring entity
      return allContracts.filter((contract) => tenderIds.includes(contract.tenderId));
    } catch (error) {
      console.error('Error fetching contracts for procuring entity:', error);
      throw error;
    }
  }

  async getContractById(contractId: string): Promise<Contract | null> {
    try {
      const contractDoc = await getDoc(doc(db, 'contracts', contractId));
      if (!contractDoc.exists()) return null;
      return {
        id: contractDoc.id,
        ...contractDoc.data(),
      } as Contract;
    } catch (error) {
      console.error('Error fetching contract:', error);
      throw error;
    }
  }
}

export default new ProcurementEntityService();
