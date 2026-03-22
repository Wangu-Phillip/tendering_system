import { db } from '@/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  addDoc,
} from 'firebase/firestore';

export interface AIBidEvaluation {
  id: string;
  tenderId: string;
  tenderTitle: string;
  evaluatedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalBidsEvaluated: number;
  topBids: AIRankedBid[];
  winnerId?: string;
  winnerName?: string;
  awardedAt?: string;
  awardedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIRankedBid {
  bidId: string;
  vendorId: string;
  vendorName: string;
  bidAmount: number;
  currency: string;
  rank: number;
  overallScore: number;
  breakdown: {
    priceCompetitiveness: number;
    technicalMerit: number;
    experienceRelevance: number;
    complianceAdherence: number;
    valueForMoney: number;
  };
  strengths: string[];
  weaknesses: string[];
  aiSummary: string;
  recommendation: string;
}

class AIBidEvaluationService {
  private geminiApiKey: string;
  private apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  constructor() {
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  /**
   * Check if a tender's submission deadline has passed
   */
  isTenderClosed(closeDate: any): boolean {
    if (!closeDate) return false;

    let deadline: Date;

    if (closeDate instanceof Date) {
      deadline = closeDate;
    } else if (closeDate?.toDate && typeof closeDate.toDate === 'function') {
      // Firestore Timestamp object
      deadline = closeDate.toDate();
    } else if (closeDate?.seconds) {
      // Raw Firestore Timestamp-like object {seconds, nanoseconds}
      deadline = new Date(closeDate.seconds * 1000);
    } else {
      // ISO string or other string format
      deadline = new Date(closeDate);
    }

    // Guard against Invalid Date
    if (isNaN(deadline.getTime())) return false;

    return new Date() > deadline;
  }

  /**
   * Get all closed tenders that have submitted bids and haven't been AI-evaluated yet
   */
  async getClosedTendersForEvaluation(procuringEntityId?: string): Promise<any[]> {
    try {
      const tendersRef = collection(db, 'tenders');
      const snapshot = await getDocs(tendersRef);
      const allTenders = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

      // Filter tenders that are closed (by date or status) and not yet awarded
      const closedTenders = allTenders.filter(tender => {
        const isClosed = this.isTenderClosed(tender.closeDate) 
          || tender.status === 'closed' 
          || tender.status === 'evaluated';
        const notAwarded = tender.status !== 'awarded';
        return isClosed && notAwarded;
      });

      // For each closed tender, check if it has submitted bids
      const tendersWithBids = [];
      for (const tender of closedTenders) {
        const bidsRef = collection(db, 'bids');
        const bidsQuery = query(bidsRef, where('tenderId', '==', tender.id));
        const bidsSnapshot = await getDocs(bidsQuery);
        const bidDocs = bidsSnapshot.docs;
        
        // Count bids regardless of status for closed tenders (all bids are relevant)
        const relevantBids = bidDocs.filter(d => {
          const status = d.data().status;
          return status === 'submitted' || status === 'evaluated' || status === 'draft';
        });

        if (relevantBids.length > 0) {
          tendersWithBids.push({
            ...tender,
            submittedBidCount: relevantBids.length,
          });
        }
      }

      return tendersWithBids;
    } catch (error) {
      console.error('Error fetching closed tenders for evaluation:', error);
      throw error;
    }
  }

  /**
   * Get submitted bids for a tender
   */
  async getSubmittedBidsForTender(tenderId: string): Promise<any[]> {
    try {
      const bidsRef = collection(db, 'bids');
      const q = query(bidsRef, where('tenderId', '==', tenderId));
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((bid: any) => bid.status === 'submitted' || bid.status === 'evaluated' || bid.status === 'draft') as any[];
    } catch (error) {
      console.error('Error fetching submitted bids:', error);
      throw error;
    }
  }

  /**
   * Run AI evaluation on all submitted bids for a closed tender
   * Returns the top 5 ranked bids
   */
  async evaluateBidsForTender(tenderId: string): Promise<AIBidEvaluation> {
    // Verify tender exists and is closed
    const tenderDoc = await getDoc(doc(db, 'tenders', tenderId));
    if (!tenderDoc.exists()) {
      throw new Error('Tender not found');
    }

    const tender = { id: tenderDoc.id, ...tenderDoc.data() } as any;

    if (!this.isTenderClosed(tender.closeDate) && tender.status !== 'closed' && tender.status !== 'evaluated') {
      throw new Error('Tender is still open for submissions. AI evaluation can only run after the submission deadline.');
    }

    // Get all submitted bids
    const bids = await this.getSubmittedBidsForTender(tenderId);
    if (bids.length === 0) {
      throw new Error('No submitted bids found for this tender.');
    }

    // Check if evaluation already exists
    const existingEval = await this.getEvaluationForTender(tenderId);
    if (existingEval && existingEval.status === 'completed') {
      return existingEval;
    }

    // Create or update evaluation record
    const evaluationId = existingEval?.id || await this.createEvaluationRecord(tenderId, tender.title, bids.length);

    try {
      // Update status to processing
      await updateDoc(doc(db, 'aiBidEvaluations', evaluationId), {
        status: 'processing',
        updatedAt: new Date().toISOString(),
      });

      // Call Gemini AI to evaluate bids
      const rankedBids = await this.callGeminiForEvaluation(tender, bids);

      // Take top 5
      const top5 = rankedBids.slice(0, 5);

      // Update evaluation record with results
      const evaluation: Partial<AIBidEvaluation> = {
        status: 'completed',
        totalBidsEvaluated: bids.length,
        topBids: top5,
        evaluatedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, 'aiBidEvaluations', evaluationId), evaluation);

      // Update tender status to indicate evaluation is done
      await updateDoc(doc(db, 'tenders', tenderId), {
        status: 'evaluated',
        updatedAt: new Date().toISOString(),
      });

      // Update bid statuses
      for (const rankedBid of top5) {
        await updateDoc(doc(db, 'bids', rankedBid.bidId), {
          status: 'evaluated',
          evaluationScore: rankedBid.overallScore,
          feedback: rankedBid.aiSummary,
          updatedAt: new Date().toISOString(),
        });
      }

      return {
        id: evaluationId,
        tenderId,
        tenderTitle: tender.title,
        ...evaluation,
        createdAt: existingEval?.createdAt || new Date().toISOString(),
      } as AIBidEvaluation;
    } catch (error) {
      // Mark as failed
      await updateDoc(doc(db, 'aiBidEvaluations', evaluationId), {
        status: 'failed',
        updatedAt: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * Call Gemini API to evaluate and rank bids
   */
  private async callGeminiForEvaluation(tender: any, bids: any[]): Promise<AIRankedBid[]> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in your environment.');
    }

    const prompt = this.buildEvaluationPrompt(tender, bids);

    const response = await fetch(`${this.apiEndpoint}?key=${this.geminiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return this.parseEvaluationResponse(responseText, bids);
  }

  /**
   * Build the evaluation prompt for Gemini
   */
  private buildEvaluationPrompt(tender: any, bids: any[]): string {
    const bidsInfo = bids.map((bid, index) => `
      BID ${index + 1}:
      - Bid ID: ${bid.id}
      - Vendor: ${bid.vendorName}
      - Amount: ${bid.amount} ${bid.currency || 'USD'}
      - Description: ${bid.description || 'No description provided'}
      - Status: ${bid.status}
    `).join('\n');

    return `
You are an expert procurement evaluation AI. Your task is to evaluate and rank the following bids submitted for a tender.

TENDER DETAILS:
- Title: ${tender.title}
- Description: ${tender.description || 'No description available'}
- Category: ${tender.category || 'General'}
- Budget: ${tender.budget || 'Not specified'} ${tender.currency || 'USD'}

SUBMITTED BIDS:
${bidsInfo}

EVALUATION CRITERIA (each scored 0-100):
1. Price Competitiveness (25%): How competitive is the bid price relative to budget and other bids?
2. Technical Merit (25%): Quality of the technical approach and solution described
3. Experience Relevance (20%): Vendor's apparent experience and capability
4. Compliance Adherence (15%): How well the bid meets tender requirements
5. Value for Money (15%): Overall value proposition considering price vs quality

INSTRUCTIONS:
- Evaluate each bid against all criteria
- Calculate an overall weighted score for each bid
- Rank all bids from highest to lowest score
- Return the TOP 5 bids (or all if fewer than 5)
- For each bid, provide strengths, weaknesses, a summary, and recommendation

RESPONSE FORMAT (JSON only, no other text):
{
  "rankedBids": [
    {
      "bidId": "exact bid ID from above",
      "vendorName": "vendor name",
      "rank": 1,
      "overallScore": 85.5,
      "breakdown": {
        "priceCompetitiveness": 90,
        "technicalMerit": 85,
        "experienceRelevance": 80,
        "complianceAdherence": 88,
        "valueForMoney": 82
      },
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1"],
      "aiSummary": "Brief evaluation summary",
      "recommendation": "Highly recommended / Recommended / Consider with conditions / Not recommended"
    }
  ]
}

Provide ONLY the JSON response.
    `;
  }

  /**
   * Parse the Gemini AI response
   */
  private parseEvaluationResponse(responseText: string, bids: any[]): AIRankedBid[] {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      const rankedBids: AIRankedBid[] = (parsed.rankedBids || []).map((rb: any, index: number) => {
        // Find the matching bid to get vendorId and amount
        const matchingBid = bids.find(b => b.id === rb.bidId) || bids[index];

        return {
          bidId: rb.bidId || matchingBid?.id || '',
          vendorId: matchingBid?.vendorId || '',
          vendorName: rb.vendorName || matchingBid?.vendorName || 'Unknown',
          bidAmount: matchingBid?.amount || 0,
          currency: matchingBid?.currency || 'USD',
          rank: rb.rank || index + 1,
          overallScore: Math.min(100, Math.max(0, rb.overallScore || 0)),
          breakdown: {
            priceCompetitiveness: Math.min(100, Math.max(0, rb.breakdown?.priceCompetitiveness || 0)),
            technicalMerit: Math.min(100, Math.max(0, rb.breakdown?.technicalMerit || 0)),
            experienceRelevance: Math.min(100, Math.max(0, rb.breakdown?.experienceRelevance || 0)),
            complianceAdherence: Math.min(100, Math.max(0, rb.breakdown?.complianceAdherence || 0)),
            valueForMoney: Math.min(100, Math.max(0, rb.breakdown?.valueForMoney || 0)),
          },
          strengths: rb.strengths || [],
          weaknesses: rb.weaknesses || [],
          aiSummary: rb.aiSummary || 'Evaluation completed',
          recommendation: rb.recommendation || 'Requires review',
        };
      });

      // Sort by score descending
      return rankedBids.sort((a, b) => b.overallScore - a.overallScore);
    } catch (error) {
      console.error('Error parsing AI evaluation response:', error);
      // Fallback: create basic rankings from bid data
      return bids
        .map((bid, index) => ({
          bidId: bid.id,
          vendorId: bid.vendorId || '',
          vendorName: bid.vendorName || 'Unknown',
          bidAmount: bid.amount || 0,
          currency: bid.currency || 'USD',
          rank: index + 1,
          overallScore: 50,
          breakdown: {
            priceCompetitiveness: 50,
            technicalMerit: 50,
            experienceRelevance: 50,
            complianceAdherence: 50,
            valueForMoney: 50,
          },
          strengths: ['Bid submitted on time'],
          weaknesses: ['AI evaluation parsing failed - manual review recommended'],
          aiSummary: 'AI evaluation could not be fully parsed. Please review manually.',
          recommendation: 'Requires manual review',
        }))
        .slice(0, 5);
    }
  }

  /**
   * Create initial evaluation record in Firestore
   */
  private async createEvaluationRecord(tenderId: string, tenderTitle: string, bidCount: number): Promise<string> {
    const evaluationsRef = collection(db, 'aiBidEvaluations');
    const docRef = await addDoc(evaluationsRef, {
      tenderId,
      tenderTitle: tenderTitle || '',
      status: 'pending',
      totalBidsEvaluated: bidCount,
      topBids: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return docRef.id;
  }

  /**
   * Get existing AI evaluation for a tender
   */
  async getEvaluationForTender(tenderId: string): Promise<AIBidEvaluation | null> {
    try {
      const evalsRef = collection(db, 'aiBidEvaluations');
      const q = query(evalsRef, where('tenderId', '==', tenderId));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      const d = snapshot.docs[0];
      return { id: d.id, ...d.data() } as AIBidEvaluation;
    } catch (error) {
      console.error('Error fetching AI evaluation:', error);
      return null;
    }
  }

  /**
   * Award a bid - chosen by the procurement entity from the top 5
   */
  async awardBid(evaluationId: string, bidId: string, awardedBy: string): Promise<void> {
    try {
      // Get the evaluation
      const evalDoc = await getDoc(doc(db, 'aiBidEvaluations', evaluationId));
      if (!evalDoc.exists()) throw new Error('Evaluation not found');

      const evaluation = evalDoc.data() as AIBidEvaluation;
      const winningBid = evaluation.topBids.find(b => b.bidId === bidId);
      if (!winningBid) throw new Error('Bid not found in top recommendations');

      // Update the evaluation record
      await updateDoc(doc(db, 'aiBidEvaluations', evaluationId), {
        winnerId: bidId,
        winnerName: winningBid.vendorName,
        awardedAt: new Date().toISOString(),
        awardedBy,
        updatedAt: new Date().toISOString(),
      });

      // Update the winning bid status
      await updateDoc(doc(db, 'bids', bidId), {
        status: 'awarded',
        awardedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update tender status 
      await updateDoc(doc(db, 'tenders', evaluation.tenderId), {
        status: 'awarded',
        updatedAt: new Date().toISOString(),
      });

      // Reject other bids for this tender
      const bidsRef = collection(db, 'bids');
      const q = query(bidsRef, where('tenderId', '==', evaluation.tenderId));
      const snapshot = await getDocs(q);

      for (const bidDoc of snapshot.docs) {
        if (bidDoc.id !== bidId) {
          await updateDoc(doc(db, 'bids', bidDoc.id), {
            status: 'rejected',
            feedback: 'Another bid was selected as the winner.',
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error awarding bid:', error);
      throw error;
    }
  }

  /**
   * Re-run evaluation (e.g., if previous attempt failed)
   */
  async reEvaluate(tenderId: string): Promise<AIBidEvaluation> {
    // Delete existing evaluation
    const existing = await this.getEvaluationForTender(tenderId);
    if (existing) {
      const { deleteDoc: delDoc } = await import('firebase/firestore');
      await delDoc(doc(db, 'aiBidEvaluations', existing.id));
    }

    // Reset bid statuses back to submitted
    const bidsRef = collection(db, 'bids');
    const q = query(bidsRef, where('tenderId', '==', tenderId));
    const snapshot = await getDocs(q);
    for (const bidDoc of snapshot.docs) {
      const data = bidDoc.data();
      if (data.status === 'evaluated') {
        await updateDoc(doc(db, 'bids', bidDoc.id), {
          status: 'submitted',
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Run fresh evaluation
    return this.evaluateBidsForTender(tenderId);
  }
}

export default new AIBidEvaluationService();
