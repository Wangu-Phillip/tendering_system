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

export interface Bid {
  id: string;
  tenderId: string;
  bidderId: string;
  bidAmount: number;
  submissionDate: string;
  status: 'submitted' | 'compliant' | 'non_compliant' | 'shortlisted' | 'rejected' | 'awarded';
  documents: string[];
  complianceCheckResult?: ComplianceCheckResult;
  evaluationScore?: number;
  feedback?: string;
}

export interface ComplianceCheckResult {
  isCompliant: boolean;
  issues: ComplianceIssue[];
  checkedAt: string;
  checkedBy: string;
}

export interface ComplianceIssue {
  field: string;
  rule: string;
  severity: 'critical' | 'major' | 'minor';
  description: string;
}

export interface BidEvaluation {
  bidId: string;
  score: number;
  feedback: string;
  evaluatedBy: string;
  evaluatedAt: string;
}

class BidProcessingService {
  // COMPLIANCE VALIDATION
  async validateBidCompliance(bidId: string, tenderId: string): Promise<ComplianceCheckResult> {
    try {
      const bidDoc = await getDoc(doc(db, 'bids', bidId));
      const tenderDoc = await getDoc(doc(db, 'tenders', tenderId));

      if (!bidDoc.exists() || !tenderDoc.exists()) {
        throw new Error('Bid or tender not found');
      }

      const bidData = bidDoc.data();
      const tenderData = tenderDoc.data();
      const issues: ComplianceIssue[] = [];

      // Check required documents
      if (!bidData.documents || bidData.documents.length === 0) {
        issues.push({
          field: 'documents',
          rule: 'At least one document required',
          severity: 'critical',
          description: 'Bid must include supporting documents',
        });
      }

      // Check bid amount
      if (!bidData.bidAmount || bidData.bidAmount <= 0) {
        issues.push({
          field: 'bidAmount',
          rule: 'Valid bid amount required',
          severity: 'critical',
          description: 'Bid amount must be greater than zero',
        });
      }

      // Check submission date is before deadline
      if (new Date(bidData.submissionDate) > new Date(tenderData.closeDate)) {
        issues.push({
          field: 'submissionDate',
          rule: 'Submission before deadline',
          severity: 'critical',
          description: `Bid submitted after tender close date (${tenderData.closeDate})`,
        });
      }

      // Check if bidder is active
      const bidderDoc = await getDoc(doc(db, 'users', bidData.bidderId));
      if (bidderDoc.exists() && !bidderDoc.data().isActive) {
        issues.push({
          field: 'bidder',
          rule: 'Bidder account must be active',
          severity: 'critical',
          description: 'Bidder account is inactive',
        });
      }

      const isCompliant = issues.filter((i) => i.severity === 'critical').length === 0;

      const result: ComplianceCheckResult = {
        isCompliant,
        issues,
        checkedAt: new Date().toISOString(),
        checkedBy: 'system',
      };

      // Update bid with compliance result
      await updateDoc(doc(db, 'bids', bidId), {
        status: isCompliant ? 'compliant' : 'non_compliant',
        complianceCheckResult: result,
      });

      return result;
    } catch (error) {
      console.error('Error validating bid compliance:', error);
      throw error;
    }
  }

  // GET COMPLIANT BIDS FOR A TENDER
  async getCompliantBids(tenderId: string): Promise<Bid[]> {
    try {
      const bidsRef = collection(db, 'bids');
      const q = query(
        bidsRef,
        where('tenderId', '==', tenderId),
        where('status', 'in', ['compliant', 'shortlisted', 'awarded']),
        orderBy('evaluationScore', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Bid[];
    } catch (error) {
      console.error('Error fetching compliant bids:', error);
      throw error;
    }
  }

  // SHORTLIST TOP BIDS
  async shortlistBids(tenderId: string, topCount: number = 5): Promise<Bid[]> {
    try {
      const compliantBids = await this.getCompliantBids(tenderId);

      // Sort by evaluation score and take top N
      const shortlistedBids = compliantBids.slice(0, topCount);

      // Update status to shortlisted
      for (const bid of shortlistedBids) {
        await updateDoc(doc(db, 'bids', bid.id), {
          status: 'shortlisted',
          updatedAt: new Date().toISOString(),
        });
      }

      return shortlistedBids;
    } catch (error) {
      console.error('Error shortlisting bids:', error);
      throw error;
    }
  }

  // EVALUATE BID
  async evaluateBid(
    bidId: string,
    score: number,
    feedback: string,
    evaluatedBy: string
  ): Promise<void> {
    try {
      if (score < 0 || score > 100) {
        throw new Error('Score must be between 0 and 100');
      }

      await updateDoc(doc(db, 'bids', bidId), {
        evaluationScore: score,
        feedback,
        evaluatedBy,
        evaluatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error evaluating bid:', error);
      throw error;
    }
  }

  // REJECT BID
  async rejectBid(bidId: string, reason: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'bids', bidId), {
        status: 'rejected',
        feedback: reason,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error rejecting bid:', error);
      throw error;
    }
  }

  // AWARD BID
  async awardBid(bidId: string, tenderId: string): Promise<void> {
    try {
      // Update bid status
      await updateDoc(doc(db, 'bids', bidId), {
        status: 'awarded',
        awardedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Reject all other bids for this tender
      const bidsRef = collection(db, 'bids');
      const q = query(
        bidsRef,
        where('tenderId', '==', tenderId),
        where('status', '!=', 'awarded')
      );
      const snapshot = await getDocs(q);

      for (const bidDoc of snapshot.docs) {
        if (bidDoc.id !== bidId) {
          await updateDoc(doc(db, 'bids', bidDoc.id), {
            status: 'rejected',
            feedback: 'Bid not selected. Another bid was awarded.',
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error awarding bid:', error);
      throw error;
    }
  }

  // GET BIDS BY STATUS
  async getBidsByStatus(tenderId: string, status: string): Promise<Bid[]> {
    try {
      const bidsRef = collection(db, 'bids');
      const q = query(bidsRef, where('tenderId', '==', tenderId), where('status', '==', status));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Bid[];
    } catch (error) {
      console.error('Error fetching bids by status:', error);
      throw error;
    }
  }

  // AUTO-PROCESS ALL BIDS FOR A TENDER
  async autoProcessBidsForTender(tenderId: string): Promise<void> {
    try {
      const bidsRef = collection(db, 'bids');
      const q = query(bidsRef, where('tenderId', '==', tenderId), where('status', '==', 'submitted'));
      const snapshot = await getDocs(q);

      for (const bidDoc of snapshot.docs) {
        await this.validateBidCompliance(bidDoc.id, tenderId);
      }
    } catch (error) {
      console.error('Error auto-processing bids:', error);
      throw error;
    }
  }
}

export default new BidProcessingService();
