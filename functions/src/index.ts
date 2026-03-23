import * as functions from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
// @ts-ignore - pdf-parse doesn't have type definitions
import * as pdfParse from 'pdf-parse';

admin.initializeApp();
const db = admin.firestore();
const storage = admin.storage().bucket();

const geminiApiKey = process.env.GEMINI_API_KEY || '';
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Trigger when a tender is created
export const onTenderCreated = functions.firestore
  .onDocumentCreated('tenders/{tenderId}', async (event) => {
    const tender = event.data?.data();
    console.log('New tender created:', tender);
    // Add custom logic here
  });

// Trigger when a bid is submitted
export const onBidUpdated = functions.firestore
  .onDocumentUpdated('bids/{bidId}', async (event) => {
    const newBid = event.data?.after.data();
    const oldBid = event.data?.before.data();

    if (newBid?.status === 'submitted' && oldBid?.status !== 'submitted') {
      console.log('Bid submitted:', newBid);
      // Trigger document analysis
      await analyzeSubmittedBidDocuments(newBid.id, newBid.tenderId, newBid.vendorId);
    }
  });

// Calculate average bid price when bids change
export const calculateBidStats = functions.firestore
  .onDocumentWritten('bids/{bidId}', async (event) => {
    const bidData = event.data?.after.data();
    const tenderId = bidData?.tenderId;
    if (!tenderId) return;

    const bidsSnapshot = await db.collection('bids').where('tenderId', '==', tenderId).get();
    const bids = bidsSnapshot.docs.map((doc) => doc.data());
    
    const amounts = bids
      .filter((bid: any) => bid.status === 'submitted')
      .map((bid: any) => bid.amount);
    
    const totalAmount = amounts.reduce((sum: number, amount: number) => sum + amount, 0);
    const averageAmount = amounts.length > 0 ? totalAmount / amounts.length : 0;

    await db.collection('tenders').doc(tenderId).update({
      bidCount: bids.length,
      averageBidPrice: averageAmount,
    });
  });

/**
 * HTTP Callable Function for manual document analysis
 * Analyzes bid documents using Gemini API
 */
export const analyzeBidDocuments = functions.https.onCall(async (data: any, context: any) => {
  if (!context?.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { bidId, tenderId } = data as { bidId: string; tenderId: string };

  if (!bidId || !tenderId) {
    throw new functions.https.HttpsError('invalid-argument', 'bidId and tenderId are required');
  }

  return analyzeSubmittedBidDocuments(bidId, tenderId);
});

/**
 * Analyze documents submitted with a bid
 */
async function analyzeSubmittedBidDocuments(bidId: string, tenderId: string, vendorId?: string) {
  try {
    console.log(`Starting document analysis for bid ${bidId}`);

    // Get bid and tender data
    const bidSnapshot = await db.collection('bids').doc(bidId).get();
    const tenderSnapshot = await db.collection('tenders').doc(tenderId).get();

    if (!bidSnapshot.exists || !tenderSnapshot.exists) {
      throw new Error('Bid or tender not found');
    }

    const bidData = bidSnapshot.data();
    const tenderData = tenderSnapshot.data();
    const attachments = bidData?.attachments || [];

    if (attachments.length === 0) {
      console.log(`No attachments found for bid ${bidId}`);
      return { success: false, message: 'No documents to analyze' };
    }

    const documentAnalyses: any[] = [];

    // Download and analyze each attachment
    for (const attachment of attachments) {
      try {
        const filePath = attachment; // This should be the full storage path
        const file = storage.file(filePath);

        // Download file
        const [buffer] = await file.download();
        console.log(`Downloaded ${filePath}, size: ${buffer.length} bytes`);

        // Extract text from PDF
        let extractedText = '';
        try {
          const data = await pdfParse(buffer);
          extractedText = data.text;
          console.log(`Extracted ${extractedText.length} characters from ${filePath}`);
        } catch (pdfError) {
          console.error(`Error parsing PDF ${filePath}:`, pdfError);
          extractedText = `[Error extracting PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}]`;
        }

        // Determine document type from filename
        const fileName = filePath.split('/').pop() || '';
        const documentType = classifyDocument(fileName);

        // Analyze with Gemini
        const analysis = await analyzeDocumentWithGemini(
          extractedText,
          documentType,
          tenderData?.description || '',
          fileName
        );

        const documentAnalysis = {
          id: `doc_${bidId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          bidId,
          tenderId,
          documentType,
          fileName,
          fileUrl: filePath,
          extractedText: extractedText.substring(0, 5000), // Store first 5000 chars
          analysisResults: {
            relevanceScore: analysis.relevanceScore || 50,
            technicalQualityScore: analysis.technicalQualityScore || 50,
            riskAssessment: analysis.riskAssessment || {
              overallRisk: 'medium',
              technicalRisks: [],
              financialRisks: [],
              deliveryRisks: [],
              complianceRisks: [],
              riskScore: 50,
            },
            complianceScore: analysis.complianceScore || 50,
            keyFindings: analysis.keyFindings || [],
            strengths: analysis.strengths || [],
            weaknesses: analysis.weaknesses || [],
            recommendations: analysis.recommendations || [],
          },
          geminiAnalysis: {
            summary: analysis.summary || 'Analysis completed',
            detailedAnalysis: analysis.detailedAnalysis || 'See findings above',
            suggestedQuestions: analysis.suggestedQuestions || [],
          },
          processingStatus: 'completed',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        documentAnalyses.push(documentAnalysis);

        // Store analysis in Firestore
        await db.collection('documentAnalyses').doc(documentAnalysis.id).set(documentAnalysis);
        console.log(`Stored analysis for ${fileName}`);
      } catch (error) {
        console.error(`Error analyzing attachment:`, error);
      }
    }

    // Generate comprehensive bid evaluation
    const bidEvaluation = generateBidEvaluation(bidId, tenderId, bidData, documentAnalyses);

    // Store bid evaluation
    await db.collection('bidDocumentEvaluations').doc(bidEvaluation.id).set(bidEvaluation);

    // Update bid with evaluation score
    await db.collection('bids').doc(bidId).update({
      documentEvaluationScore: bidEvaluation.overallScore,
      documentEvaluationId: bidEvaluation.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Completed document analysis for bid ${bidId}, score: ${bidEvaluation.overallScore.toFixed(2)}`);

    return {
      success: true,
      bidId,
      evaluationId: bidEvaluation.id,
      overallScore: bidEvaluation.overallScore,
      recommendation: bidEvaluation.evaluation.recommendation,
      documentsAnalyzed: documentAnalyses.length,
    };
  } catch (error) {
    console.error('Error in document analysis:', error);
    throw new functions.https.HttpsError('internal', `Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Classify document type based on filename
 */
function classifyDocument(fileName: string): string {
  const nameLower = fileName.toLowerCase();

  if (nameLower.includes('technical') || nameLower.includes('proposal')) return 'technical_proposal';
  if (nameLower.includes('company') || nameLower.includes('profile') || nameLower.includes('organization')) return 'company_profile';
  if (nameLower.includes('method') || nameLower.includes('approach') || nameLower.includes('plan')) return 'methodology';
  if (nameLower.includes('financial') || nameLower.includes('financial') || nameLower.includes('accounting')) return 'financial';
  if (nameLower.includes('work') || nameLower.includes('portfolio') || nameLower.includes('case') || nameLower.includes('sample')) return 'work_sample';

  return 'technical_proposal'; // Default
}

/**
 * Analyze document with Gemini API
 */
async function analyzeDocumentWithGemini(
  documentText: string,
  documentType: string,
  tenderDescription: string,
  fileName: string
): Promise<any> {
  try {
    if (!genAI) {
      console.warn('Gemini API not configured, returning default analysis');
      return getDefaultAnalysis();
    }

    const prompt = getAnalysisPrompt(documentText, documentType, tenderDescription);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const analysisText = response.text();

    console.log(`Got Gemini response for ${fileName}, length: ${analysisText.length}`);

    return parseGeminiResponse(analysisText);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return getDefaultAnalysis();
  }
}

/**
 * Get analysis prompt for Gemini
 */
function getAnalysisPrompt(documentText: string, documentType: string, tenderDescription: string): string {
  const typePrompts: Record<string, string> = {
    technical_proposal: `
      Evaluate this technical proposal for:
      1. Alignment with tender requirements
      2. Technical feasibility and soundness
      3. Clarity of proposed approach
      4. Risk awareness and mitigation strategies
      5. Resource allocation and scheduling
    `,
    company_profile: `
      Evaluate this company profile for:
      1. Relevant experience in similar projects
      2. Company stability and financial health indicators
      3. Team qualifications and expertise levels
      4. Past performance track record
      5. Compliance with required certifications
    `,
    methodology: `
      Evaluate this methodology for:
      1. Alignment with tender scope
      2. Realistic timeline and milestones
      3. Risk management approach
      4. Quality assurance procedures
      5. Resource planning and allocation
    `,
    financial: `
      Evaluate this financial documentation for:
      1. Financial viability and stability
      2. Cost breakdown clarity
      3. Value for money assessment
      4. Financial risk factors
      5. Compliance with financial requirements
    `,
    work_sample: `
      Evaluate this work sample for:
      1. Relevance to tender requirements
      2. Quality and professional execution
      3. Evidence of required capabilities
      4. Innovation and best practices
      5. Applicability to current project
    `,
  };

  return `
You are an expert procurement auditor. Analyze the following ${documentType} document.

TENDER REQUIREMENTS:
${tenderDescription.substring(0, 1000)}

EVALUATION FOCUS:
${typePrompts[documentType] || typePrompts.technical_proposal}

DOCUMENT CONTENT:
${documentText.substring(0, 10000)}

Provide analysis in this JSON format (and ONLY this JSON, no other text):
{
  "relevanceScore": <0-100>,
  "technicalQualityScore": <0-100>,
  "complianceScore": <0-100>,
  "riskLevel": "low|medium|high",
  "riskScore": <0-100>,
  "keyFindings": ["finding1", "finding2", ...],
  "strengths": ["strength1", "strength2", ...],
  "weaknesses": ["weakness1", "weakness2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "technicalRisks": ["risk1", ...],
  "financialRisks": ["risk1", ...],
  "deliveryRisks": ["risk1", ...],
  "complianceRisks": ["risk1", ...],
  "summary": "Brief summary",
  "detailedAnalysis": "Detailed analysis paragraph",
  "suggestedQuestions": ["question1", ...]
}
  `;
}

/**
 * Parse Gemini response
 */
function parseGeminiResponse(responseText: string): any {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : responseText;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    return getDefaultAnalysis();
  }
}

/**
 * Get default analysis if Gemini fails
 */
function getDefaultAnalysis(): any {
  return {
    relevanceScore: 60,
    technicalQualityScore: 60,
    complianceScore: 60,
    riskLevel: 'medium',
    riskScore: 50,
    keyFindings: ['Document processed'],
    strengths: [],
    weaknesses: [],
    recommendations: ['Manual review recommended'],
    technicalRisks: [],
    financialRisks: [],
    deliveryRisks: [],
    complianceRisks: [],
    summary: 'Analysis completed with default scoring',
    detailedAnalysis: 'Please review manually',
    suggestedQuestions: [],
  };
}

/**
 * Generate comprehensive bid evaluation from document analyses
 */
function generateBidEvaluation(bidId: string, tenderId: string, bidData: any, documentAnalyses: any[]): any {
  const averageRelevance =
    documentAnalyses.reduce((sum, doc) => sum + doc.analysisResults.relevanceScore, 0) / (documentAnalyses.length || 1);

  const averageTechnicalQuality =
    documentAnalyses.reduce((sum, doc) => sum + doc.analysisResults.technicalQualityScore, 0) / (documentAnalyses.length || 1);

  const averageCompliance =
    documentAnalyses.reduce((sum, doc) => sum + doc.analysisResults.complianceScore, 0) / (documentAnalyses.length || 1);

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
    const docScore = doc.analysisResults.relevanceScore * 0.35 + doc.analysisResults.technicalQualityScore * 0.35 + doc.analysisResults.complianceScore * 0.3;
    weightedScore += docScore * weight;
    totalWeight += weight;
  }

  const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;

  const riskLevels = documentAnalyses.map(doc => doc.analysisResults.riskAssessment.overallRisk);
  let overallRisk: 'low' | 'medium' | 'high' = 'low';
  if (riskLevels.includes('high')) overallRisk = 'high';
  else if (riskLevels.includes('medium')) overallRisk = 'medium';

  let recommendation: 'approved' | 'conditional' | 'rejected' | 'requires_review' = 'requires_review';
  let reasoning = '';

  if (overallScore >= 80 && averageCompliance >= 80 && overallRisk !== 'high') {
    recommendation = 'approved';
    reasoning = `Documents demonstrate strong capability with good compliance. Overall Score: ${overallScore.toFixed(1)}/100`;
  } else if (overallScore >= 65 && averageCompliance >= 65 && overallRisk === 'low') {
    recommendation = 'approved';
    reasoning = `Documents meet requirements with acceptable quality. Overall Score: ${overallScore.toFixed(1)}/100`;
  } else if (overallScore >= 50 && averageCompliance >= 50) {
    if (overallRisk === 'high') {
      recommendation = 'requires_review';
      reasoning = `Documents meet minimum requirements but significant risks identified. Safe Score: ${overallScore.toFixed(1)}/100`;
    } else {
      recommendation = 'conditional';
      reasoning = `Acceptable with clarifications needed. Overall Score: ${overallScore.toFixed(1)}/100`;
    }
  } else {
    recommendation = 'rejected';
    reasoning = `Documents do not meet minimum quality or compliance standards. Overall Score: ${overallScore.toFixed(1)}/100`;
  }

  return {
    id: `eval_${bidId}_${Date.now()}`,
    bidId,
    tenderId,
    vendorId: bidData?.vendorId,
    vendorName: bidData?.vendorName,
    documents: documentAnalyses,
    overallScore: Math.round(overallScore * 100) / 100,
    averageRelevance: Math.round(averageRelevance * 100) / 100,
    averageTechnicalQuality: Math.round(averageTechnicalQuality * 100) / 100,
    averageCompliance: Math.round(averageCompliance * 100) / 100,
    overallRisk,
    evaluation: {
      meetsRequirements: averageRelevance >= 70,
      technicalFeasibility: averageTechnicalQuality >= 75 ? 'high' : averageTechnicalQuality >= 50 ? 'medium' : 'low',
      financialViability: 'medium',
      complianceStatus: averageCompliance >= 75 ? 'compliant' : averageCompliance >= 50 ? 'minor_gaps' : 'major_gaps',
      recommendation,
      reasoning,
    },
    evaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
    evaluatedBy: 'system',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

/**
 * Create a Yoco Checkout session for purchasing tender documents.
 * Returns a redirectUrl that the frontend navigates to.
 */
export const createYocoCheckout = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Verify Firebase Auth token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let userId: string;
  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    userId = decoded.uid;
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const { tenderId } = req.body;
  if (!tenderId) {
    res.status(400).json({ error: 'tenderId is required' });
    return;
  }

  const yocoSecretKey = process.env.YOCO_SECRET_KEY || '';
  if (!yocoSecretKey) {
    res.status(500).json({ error: 'Yoco secret key is not configured' });
    return;
  }

  try {
    // Check if already purchased
    const existingPurchase = await db
      .collection('tenderPurchases')
      .where('userId', '==', userId)
      .where('tenderId', '==', tenderId)
      .where('status', '==', 'completed')
      .get();

    if (!existingPurchase.empty) {
      res.status(409).json({ error: 'Already purchased' });
      return;
    }

    // Get tender to determine the fee
    const tenderSnapshot = await db.collection('tenders').doc(tenderId).get();
    if (!tenderSnapshot.exists) {
      res.status(404).json({ error: 'Tender not found' });
      return;
    }

    const tenderData = tenderSnapshot.data();
    const tenderFee = tenderData?.tenderFee || 0;
    const currency = tenderData?.tenderFeeCurrency || 'ZAR';

    if (tenderFee <= 0) {
      res.status(400).json({ error: 'This tender is free and does not require payment' });
      return;
    }

    const amountInCents = Math.round(tenderFee * 100);
    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';

    // Create Yoco checkout session
    const response = await fetch('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${yocoSecretKey}`,
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
          tenderTitle: tenderData?.title || '',
        },
      }),
    });

    const checkout = await response.json() as {
      id: string;
      redirectUrl: string;
      status: string;
    };

    if (!checkout.id || !checkout.redirectUrl) {
      console.error('Yoco checkout creation failed:', checkout);
      res.status(500).json({ error: 'Failed to create checkout session' });
      return;
    }

    // Create a pending purchase record
    const userRecord = await admin.auth().getUser(userId);
    await db.collection('tenderPurchases').add({
      tenderId,
      tenderTitle: tenderData?.title || '',
      userId,
      userEmail: userRecord.email || '',
      userName: userRecord.displayName || userRecord.email || '',
      amount: tenderFee,
      currency,
      yocoCheckoutId: checkout.id,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Checkout ${checkout.id} created for tender ${tenderId} by user ${userId}`);
    res.status(200).json({ checkoutId: checkout.id, redirectUrl: checkout.redirectUrl });
  } catch (error: any) {
    console.error('Checkout creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create checkout';
    res.status(500).json({ error: message });
  }
});

/**
 * Verify a Yoco Checkout status after the user returns from the payment page.
 */
export const verifyYocoCheckout = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Verify Firebase Auth token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    await admin.auth().verifyIdToken(token);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const { checkoutId } = req.body;
  if (!checkoutId) {
    res.status(400).json({ error: 'checkoutId is required' });
    return;
  }

  const yocoSecretKey = process.env.YOCO_SECRET_KEY || '';
  if (!yocoSecretKey) {
    res.status(500).json({ error: 'Yoco secret key is not configured' });
    return;
  }

  try {
    // Find the purchase record
    const purchaseSnapshot = await db
      .collection('tenderPurchases')
      .where('yocoCheckoutId', '==', checkoutId)
      .limit(1)
      .get();

    if (purchaseSnapshot.empty) {
      res.status(404).json({ error: 'Purchase record not found' });
      return;
    }

    const purchaseDoc = purchaseSnapshot.docs[0];
    const purchaseData = purchaseDoc.data();

    if (purchaseData.status === 'completed') {
      res.status(200).json({ success: true, tenderId: purchaseData.tenderId, status: 'completed' });
      return;
    }

    // Check checkout status with Yoco
    const response = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${yocoSecretKey}`,
      },
    });

    const checkout = await response.json() as { id: string; status: string };

    if (checkout.status === 'completed') {
      await purchaseDoc.ref.update({
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Payment completed for checkout ${checkoutId}, tender ${purchaseData.tenderId}`);
      res.status(200).json({ success: true, tenderId: purchaseData.tenderId, status: 'completed' });
    } else {
      const mappedStatus = checkout.status === 'expired' || checkout.status === 'failed'
        ? 'failed'
        : 'pending';

      await purchaseDoc.ref.update({
        status: mappedStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).json({ success: false, tenderId: purchaseData.tenderId, status: checkout.status });
    }
  } catch (error: any) {
    console.error('Checkout verification error:', error);
    const message = error instanceof Error ? error.message : 'Failed to verify checkout';
    res.status(500).json({ error: message });
  }
});
