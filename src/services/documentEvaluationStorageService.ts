import firestoreService from '@/firebase/firestore';
import { DocumentAnalysis, BidDocumentEvaluation } from '@/types';

/**
 * Service for managing document analyses and bid evaluations
 */
class DocumentEvaluationStorageService {
  /**
   * Get all document analyses for a bid
   */
  async getBidDocumentAnalyses(bidId: string): Promise<DocumentAnalysis[]> {
    try {
      const allAnalyses = await firestoreService.getDocuments('documentAnalyses');
      return allAnalyses.filter((doc: any) => doc.bidId === bidId);
    } catch (error) {
      console.error('Error fetching document analyses:', error);
      return [];
    }
  }

  /**
   * Get a single document analysis
   */
  async getDocumentAnalysis(analysisId: string): Promise<DocumentAnalysis | null> {
    try {
      return await firestoreService.getDocument('documentAnalyses', analysisId);
    } catch (error) {
      console.error('Error fetching document analysis:', error);
      return null;
    }
  }

  /**
   * Get bid evaluation
   */
  async getBidEvaluation(bidId: string): Promise<BidDocumentEvaluation | null> {
    try {
      const allEvaluations = await firestoreService.getDocuments('bidDocumentEvaluations');
      const evaluation = allEvaluations.find((e: any) => e.bidId === bidId);
      return evaluation || null;
    } catch (error) {
      console.error('Error fetching bid evaluation:', error);
      return null;
    }
  }

  /**
   * Get all evaluations for a tender
   */
  async getTenderEvaluations(tenderId: string): Promise<BidDocumentEvaluation[]> {
    try {
      const allEvaluations = await firestoreService.getDocuments('bidDocumentEvaluations');
      return allEvaluations.filter((e: any) => e.tenderId === tenderId);
    } catch (error) {
      console.error('Error fetching tender evaluations:', error);
      return [];
    }
  }

  /**
   * Get evaluations by recommendation
   */
  async getEvaluationsByRecommendation(
    tenderId: string,
    recommendation: 'approved' | 'conditional' | 'rejected' | 'requires_review'
  ): Promise<BidDocumentEvaluation[]> {
    const evaluations = await this.getTenderEvaluations(tenderId);
    return evaluations.filter(e => e.evaluation.recommendation === recommendation);
  }

  /**
   * Get evaluations by risk level
   */
  async getEvaluationsByRisk(
    tenderId: string,
    riskLevel: 'low' | 'medium' | 'high'
  ): Promise<BidDocumentEvaluation[]> {
    const evaluations = await this.getTenderEvaluations(tenderId);
    return evaluations.filter(e => e.overallRisk === riskLevel);
  }

  /**
   * Update evaluation (for overrides)
   */
  async updateEvaluation(evaluationId: string, updates: Partial<BidDocumentEvaluation>): Promise<void> {
    try {
      await firestoreService.updateDocument('bidDocumentEvaluations', evaluationId, {
        ...updates,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating evaluation:', error);
      throw error;
    }
  }

  /**
   * Add evaluation note
   */
  async addEvaluationNote(
    evaluationId: string,
    note: string,
    reviewer: string
  ): Promise<void> {
    try {
      const evaluation = await firestoreService.getDocument('bidDocumentEvaluations', evaluationId);
      if (!evaluation) throw new Error('Evaluation not found');

      const notes = evaluation.notes || [];
      notes.push({
        text: note,
        reviewer,
        timestamp: new Date(),
      });

      await firestoreService.updateDocument('bidDocumentEvaluations', evaluationId, {
        notes,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  /**
   * Export tender evaluations as JSON
   */
  async exportTenderEvaluations(tenderId: string): Promise<string> {
    try {
      const evaluations = await this.getTenderEvaluations(tenderId);
      const exportData = {
        tenderId,
        exportDate: new Date().toISOString(),
        totalEvaluations: evaluations.length,
        summary: {
          approved: evaluations.filter(e => e.evaluation.recommendation === 'approved').length,
          conditional: evaluations.filter(e => e.evaluation.recommendation === 'conditional').length,
          requiresReview: evaluations.filter(e => e.evaluation.recommendation === 'requires_review').length,
          rejected: evaluations.filter(e => e.evaluation.recommendation === 'rejected').length,
          averageScore: evaluations.length > 0 
            ? (evaluations.reduce((sum, e) => sum + e.overallScore, 0) / evaluations.length).toFixed(2)
            : 0,
        },
        evaluations: evaluations.map(e => ({
          bidId: e.bidId,
          vendorName: e.vendorName,
          overallScore: e.overallScore,
          recommendation: e.evaluation.recommendation,
          reasoning: e.evaluation.reasoning,
          averageRelevance: e.averageRelevance,
          averageTechnicalQuality: e.averageTechnicalQuality,
          averageCompliance: e.averageCompliance,
          overallRisk: e.overallRisk,
          documentsAnalyzed: e.documents.length,
          documentDetails: e.documents.map(d => ({
            fileName: d.fileName,
            type: d.documentType,
            relevance: d.analysisResults.relevanceScore,
            technicalQuality: d.analysisResults.technicalQualityScore,
            compliance: d.analysisResults.complianceScore,
          })),
        })),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting evaluations:', error);
      throw error;
    }
  }

  /**
   * Get detailed analysis for document
   */
  async getDocumentAnalysisDetail(analysisId: string): Promise<DocumentAnalysis | null> {
    try {
      const analysis = await firestoreService.getDocument('documentAnalyses', analysisId);
      return analysis || null;
    } catch (error) {
      console.error('Error fetching document analysis detail:', error);
      return null;
    }
  }

  /**
   * Get all documents by type for tender
   */
  async getDocumentsByType(
    tenderId: string,
    documentType: string
  ): Promise<DocumentAnalysis[]> {
    try {
      const allAnalyses = await firestoreService.getDocuments('documentAnalyses');
      return allAnalyses.filter((doc: any) => doc.tenderId === tenderId && doc.documentType === documentType);
    } catch (error) {
      console.error('Error fetching documents by type:', error);
      return [];
    }
  }
}

export default new DocumentEvaluationStorageService();
