import { DocumentAnalysis, BidDocumentEvaluation } from '@/types';

/**
 * Service for analyzing documents using Google Gemini API
 * Evaluates technical proposals, company profiles, methodologies, financial statements, and work samples
 */
class DocumentAnalysisService {
  private geminiApiKey: string;
  private apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!this.geminiApiKey) {
      console.warn('VITE_GEMINI_API_KEY not configured. Document analysis will not work.');
    }
  }

  /**
   * Analyze a single document using Gemini API
   */
  async analyzeDocument(
    documentText: string,
    documentType: 'technical_proposal' | 'company_profile' | 'methodology' | 'financial' | 'work_sample',
    tenderRequirements: string,
  ): Promise<DocumentAnalysis['analysisResults'] & DocumentAnalysis['geminiAnalysis']> {
    try {
      const prompt = this.buildAnalysisPrompt(documentText, documentType, tenderRequirements);

      const response = await fetch(`${this.apiEndpoint}?key=${this.geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const analysisText = data.contents?.[0]?.parts?.[0]?.text || '';

      return this.parseAnalysisResponse(analysisText);
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw error;
    }
  }

  /**
   * Build the prompt for Gemini API
   */
  private buildAnalysisPrompt(
    documentText: string,
    documentType: string,
    tenderRequirements: string
  ): string {
    const typeGuidance = {
      technical_proposal: `
        For this technical proposal, evaluate:
        1. How well it addresses the tender's technical requirements
        2. The feasibility of the proposed approach
        3. Technical risks and mitigation strategies
        4. Innovation and quality of technical solution
        5. Clarity and completeness of technical documentation
      `,
      company_profile: `
        For this company profile, evaluate:
        1. Relevant experience in similar projects
        2. Company financial health and stability
        3. Team qualifications and expertise
        4. Past performance and track record
        5. Compliance with key certifications
      `,
      methodology: `
        For this methodology document, evaluate:
        1. Alignment with tender requirements
        2. Realistic timeline and milestones
        3. Risk management approach
        4. Quality assurance procedures
        5. Resource allocation and planning
      `,
      financial: `
        For this financial statement, evaluate:
        1. Financial viability and stability
        2. Transparency and completeness
        3. Value for money considerations
        4. Financial risk assessment
        5. Compliance with accounting standards
      `,
      work_sample: `
        For this work sample, evaluate:
        1. Relevance to tender requirements
        2. Quality and professionalism
        3. Evidence of capability
        4. Potential applicability to this project
        5. Innovation and best practices demonstrated
      `,
    };

    return `
You are an expert procurement evaluator. Analyze the following document and provide a detailed assessment.

DOCUMENT TYPE: ${documentType}
TENDER REQUIREMENTS:
${tenderRequirements}

EVALUATION GUIDANCE:
${typeGuidance[documentType as keyof typeof typeGuidance]}

DOCUMENT CONTENT:
${documentText.substring(0, 15000)}

EVALUATION RESPONSE FORMAT:
Please provide your analysis in the following JSON structure:
{
  "relevanceScore": [0-100 number indicating how well document addresses requirements],
  "technicalQualityScore": [0-100 number for technical quality],
  "complianceScore": [0-100 number for compliance],
  "riskLevel": ["low" | "medium" | "high"],
  "riskScore": [0-100, higher = more risk],
  "keyFindings": ["finding 1", "finding 2", ...],
  "strengths": ["strength 1", "strength 2", ...],
  "weaknesses": ["weakness 1", "weakness 2", ...],
  "recommendations": ["recommendation 1", ...],
  "technicalRisks": ["risk 1", ...],
  "financialRisks": ["risk 1", ...],
  "deliveryRisks": ["risk 1", ...],
  "complianceRisks": ["risk 1", ...],
  "summary": "Brief 2-3 line summary",
  "detailedAnalysis": "1-2 paragraph detailed analysis",
  "suggestedQuestions": ["question 1 to ask vendor", ...]
}

Provide ONLY the JSON response, no other text.
    `;
  }

  /**
   * Parse Gemini API response
   */
  private parseAnalysisResponse(
    responseText: string
  ): DocumentAnalysis['analysisResults'] & DocumentAnalysis['geminiAnalysis'] {
    try {
      // Extract JSON from response (it might be wrapped in markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : responseText;
      const parsed = JSON.parse(jsonString);

      return {
        relevanceScore: Math.min(100, Math.max(0, parsed.relevanceScore || 50)),
        technicalQualityScore: Math.min(100, Math.max(0, parsed.technicalQualityScore || 50)),
        riskAssessment: {
          overallRisk: parsed.riskLevel || 'medium',
          technicalRisks: parsed.technicalRisks || [],
          financialRisks: parsed.financialRisks || [],
          deliveryRisks: parsed.deliveryRisks || [],
          complianceRisks: parsed.complianceRisks || [],
          riskScore: Math.min(100, Math.max(0, parsed.riskScore || 50)),
        },
        complianceScore: Math.min(100, Math.max(0, parsed.complianceScore || 50)),
        keyFindings: parsed.keyFindings || [],
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        recommendations: parsed.recommendations || [],
        summary: parsed.summary || 'Analysis completed',
        detailedAnalysis: parsed.detailedAnalysis || 'See key findings above',
        suggestedQuestions: parsed.suggestedQuestions || [],
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      // Return default response if parsing fails
      return {
        relevanceScore: 50,
        technicalQualityScore: 50,
        riskAssessment: {
          overallRisk: 'medium',
          technicalRisks: [],
          financialRisks: [],
          deliveryRisks: [],
          complianceRisks: [],
          riskScore: 50,
        },
        complianceScore: 50,
        keyFindings: ['Unable to fully parse analysis'],
        strengths: [],
        weaknesses: [],
        recommendations: ['Retrigger analysis or review manually'],
        summary: 'Analysis completed with partial results',
        detailedAnalysis: responseText.substring(0, 500),
        suggestedQuestions: [],
      };
    }
  }

  /**
   * Calculate overall bid score from document analyses
   */
  calculateBidScore(documentAnalyses: DocumentAnalysis[]): number {
    if (documentAnalyses.length === 0) return 0;

    const weights: Record<string, number> = {
      technical_proposal: 0.35,
      company_profile: 0.20,
      methodology: 0.25,
      financial: 0.15,
      work_sample: 0.05,
    };

    let weightedScore = 0;
    let totalWeight = 0;

    for (const doc of documentAnalyses) {
      const weight = weights[doc.documentType] || 0.1;
      const docScore = (
        doc.analysisResults.relevanceScore * 0.35 +
        doc.analysisResults.technicalQualityScore * 0.35 +
        doc.analysisResults.complianceScore * 0.30
      );
      weightedScore += docScore * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedScore / totalWeight : 0;
  }

  /**
   * Generate bid evaluation from document analyses
   */
  generateBidEvaluation(
    bidId: string,
    tenderId: string,
    vendorId: string,
    vendorName: string,
    documentAnalyses: DocumentAnalysis[],
  ): Omit<BidDocumentEvaluation, 'createdAt' | 'updatedAt'> {
    const averageRelevance =
      documentAnalyses.reduce((sum, doc) => sum + doc.analysisResults.relevanceScore, 0) /
      (documentAnalyses.length || 1);

    const averageTechnicalQuality =
      documentAnalyses.reduce((sum, doc) => sum + doc.analysisResults.technicalQualityScore, 0) /
      (documentAnalyses.length || 1);

    const averageCompliance =
      documentAnalyses.reduce((sum, doc) => sum + doc.analysisResults.complianceScore, 0) /
      (documentAnalyses.length || 1);

    const overallScore = this.calculateBidScore(documentAnalyses);

    // Determine overall risk
    const riskLevels = documentAnalyses.map(doc => doc.analysisResults.riskAssessment.overallRisk);
    let overallRisk: 'low' | 'medium' | 'high' = 'low';
    if (riskLevels.includes('high')) overallRisk = 'high';
    else if (riskLevels.includes('medium')) overallRisk = 'medium';

    // Evaluate recommendation
    let recommendation: 'approved' | 'conditional' | 'rejected' | 'requires_review' = 'requires_review';
    let reasoning = '';

    if (overallScore >= 80 && averageCompliance >= 80 && overallRisk !== 'high') {
      recommendation = 'approved';
      reasoning = `Strong technical proposal with good compliance and low risk. Score: ${overallScore.toFixed(1)}/100`;
    } else if (overallScore >= 65 && averageCompliance >= 65 && overallRisk === 'low') {
      recommendation = 'approved';
      reasoning = `Meets requirements with acceptable quality. Score: ${overallScore.toFixed(1)}/100`;
    } else if (overallScore >= 50 && averageCompliance >= 50) {
      if (overallRisk === 'high') {
        recommendation = 'requires_review';
        reasoning = `Meets minimum requirements but has identified high risks requiring review. Score: ${overallScore.toFixed(1)}/100`;
      } else {
        recommendation = 'conditional';
        reasoning = `Acceptable with conditions. Requires clarification on ${documentAnalyses[0]?.analysisResults.weaknesses[0] || 'weak areas'}. Score: ${overallScore.toFixed(1)}/100`;
      }
    } else {
      recommendation = 'rejected';
      reasoning = `Does not meet minimum quality or compliance requirements. Score: ${overallScore.toFixed(1)}/100`;
    }

    return {
      id: `eval_${bidId}_${Date.now()}`,
      bidId,
      tenderId,
      vendorId,
      vendorName,
      documents: documentAnalyses,
      overallScore,
      averageRelevance,
      averageTechnicalQuality,
      averageCompliance,
      overallRisk,
      evaluation: {
        meetsRequirements: averageRelevance >= 70,
        technicalFeasibility: averageTechnicalQuality >= 75 ? 'high' : averageTechnicalQuality >= 50 ? 'medium' : 'low',
        financialViability: 'medium', // Would be analyzed from financial documents
        complianceStatus: averageCompliance >= 75 ? 'compliant' : averageCompliance >= 50 ? 'minor_gaps' : 'major_gaps',
        recommendation,
        reasoning,
      },
      evaluatedAt: new Date(),
      evaluatedBy: 'system',
    };
  }
}

export default new DocumentAnalysisService();
