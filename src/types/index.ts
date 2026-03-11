export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'vendor' | 'buyer' | 'reviewer';
  organizationName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tender {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  currency: string;
  deadline: Date;
  status: 'open' | 'closing_soon' | 'closed' | 'awarded';
  createdBy: string;
  attachments?: string[];
  bidCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bid {
  id: string;
  tenderId: string;
  tenderTitle: string;
  vendorId: string;
  vendorName: string;
  amount: number;
  currency: string;
  description: string;
  attachments?: string[];
  status: 'draft' | 'submitted' | 'evaluated' | 'rejected' | 'awarded';
  evaluationScore?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Evaluation {
  id: string;
  bidId: string;
  tenderId: string;
  evaluatorId: string;
  score: number;
  breakdown: {
    price: number;
    quality: number;
    experience: number;
    compliance: number;
  };
  comments: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  totalTenders: number;
  totalBids: number;
  averageBidPrice: number;
  openTenders: number;
  closedTenders: number;
  awardedTenders: number;
  tendersToday: number;
}

export interface DashboardStats {
  analytics: Analytics;
  recentTenders: Tender[];
  recentBids: Bid[];
  pendingEvaluations: number;
}

export interface ClarificationRequest {
  id: string;
  tenderId: string;
  tenderTitle: string;
  bidId?: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  subject: string;
  message: string;
  attachments?: string[];
  status: 'pending' | 'responded' | 'closed';
  response?: string;
  responseAttachments?: string[];
  respondedBy?: string;
  respondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenderExtension {
  id: string;
  tenderId: string;
  originalDeadline: Date;
  newDeadline: Date;
  reason: string;
  approvedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contract {
  id: string;
  tenderId: string;
  awardedBidId: string;
  awardedToVendor: string;
  vendorEmail: string;
  contractValue: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'terminated' | 'suspended';
  terms: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}
