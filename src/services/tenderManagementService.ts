import { db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  orderBy,
} from 'firebase/firestore';

export interface Tender {
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

export interface EvaluationCriteria {
  name: string;
  weight: number;
  description: string;
}

export interface Contract {
  id: string;
  tenderId: string;
  awardedBidId: string;
  contractorId: string;
  value: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'terminated' | 'suspended';
  terms: string;
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

class TenderManagementService {
  // TENDER MANAGEMENT
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
      console.error('Error fetching tenders:', error);
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

  async getTendersByStatus(status: string): Promise<Tender[]> {
    try {
      const tendersRef = collection(db, 'tenders');
      const q = query(tendersRef, where('status', '==', status), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tender[];
    } catch (error) {
      console.error('Error fetching tenders by status:', error);
      throw error;
    }
  }

  async getTendersByProcuringEntity(procuringEntityId: string): Promise<Tender[]> {
    try {
      const tendersRef = collection(db, 'tenders');
      const q = query(
        tendersRef,
        where('procuringEntityId', '==', procuringEntityId),
        orderBy('createdAt', 'desc')
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

  async updateTenderStatus(tenderId: string, status: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'tenders', tenderId), {
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating tender status:', error);
      throw error;
    }
  }

  async updateTender(
    tenderId: string,
    updates: Partial<Tender>
  ): Promise<void> {
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

  async cancelTender(tenderId: string, reason: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'tenders', tenderId), {
        status: 'cancelled',
        cancellationReason: reason,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error cancelling tender:', error);
      throw error;
    }
  }

  // CONTRACT MANAGEMENT
  async getAllContracts(): Promise<Contract[]> {
    try {
      const contractsRef = collection(db, 'contracts');
      const q = query(contractsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Contract[];
    } catch (error) {
      console.error('Error fetching contracts:', error);
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

  async getContractsByStatus(status: string): Promise<Contract[]> {
    try {
      const contractsRef = collection(db, 'contracts');
      const q = query(contractsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Contract[];
    } catch (error) {
      console.error('Error fetching contracts by status:', error);
      throw error;
    }
  }

  async getContractsByTender(tenderId: string): Promise<Contract[]> {
    try {
      const contractsRef = collection(db, 'contracts');
      const q = query(contractsRef, where('tenderId', '==', tenderId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Contract[];
    } catch (error) {
      console.error('Error fetching contracts by tender:', error);
      throw error;
    }
  }

  async updateContractStatus(contractId: string, status: string): Promise<void> {
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

  async suspendContract(contractId: string, reason: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'contracts', contractId), {
        status: 'suspended',
        suspensionReason: reason,
        suspendedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error suspending contract:', error);
      throw error;
    }
  }

  async terminateContract(contractId: string, reason: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'contracts', contractId), {
        status: 'terminated',
        terminationReason: reason,
        terminatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error terminating contract:', error);
      throw error;
    }
  }

  async completeContract(contractId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'contracts', contractId), {
        status: 'completed',
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error completing contract:', error);
      throw error;
    }
  }
}

export default new TenderManagementService();
