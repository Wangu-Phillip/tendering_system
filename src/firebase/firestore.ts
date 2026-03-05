// Dummy Firestore Service (Mock data for UI testing)

// Mock collections data
const MOCK_TENDERS = [
  {
    id: 'tender-1',
    title: 'Office Supplies Purchase',
    description: 'We are looking for a supplier to provide office supplies for our organization.',
    category: 'Supplies',
    budget: 5000,
    currency: 'BWP',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'open',
    createdBy: 'user-123',
    attachments: [],
    bidCount: 3,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'tender-2',
    title: 'Website Redesign Project',
    description: 'Need a professional web design agency to redesign our company website.',
    category: 'IT & Software',
    budget: 15000,
    currency: 'BWP',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: 'open',
    createdBy: 'user-123',
    attachments: [],
    bidCount: 5,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'tender-3',
    title: 'Construction Materials Supply',
    description: 'Looking for bulk construction materials for our ongoing project.',
    category: 'Construction',
    budget: 50000,
    currency: 'BWP',
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    status: 'open',
    createdBy: 'user-123',
    attachments: [],
    bidCount: 2,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

const MOCK_BIDS = [
  {
    id: 'bid-1',
    tenderId: 'tender-1',
    vendorId: 'vendor-1',
    vendorName: 'ABC Supplies Inc.',
    amount: 4800,
    currency: 'BWP',
    description: 'Quality office supplies at competitive prices. Fast delivery available.',
    attachments: [],
    status: 'submitted',
    evaluationScore: 85,
    feedback: 'Good pricing and reliable service history.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'bid-2',
    tenderId: 'tender-1',
    vendorId: 'vendor-2',
    vendorName: 'Office Plus LLC',
    amount: 5200,
    currency: 'BWP',
    description: 'Full range of office supplies with bulk discounts available.',
    attachments: [],
    status: 'submitted',
    evaluationScore: 78,
    feedback: 'Good selection but slightly higher pricing.',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: 'bid-3',
    tenderId: 'tender-2',
    vendorId: 'vendor-3',
    vendorName: 'Digital Designs Studio',
    amount: 14500,
    currency: 'BWP',
    description: 'Modern responsive design with full UX research and testing.',
    attachments: [],
    status: 'submitted',
    evaluationScore: 92,
    feedback: 'Excellent portfolio and proven track record.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
];

export class FirestoreService {
  async addDocument(_collectionName: string, _data: Record<string, any>): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const id = `doc-${Date.now()}`;
    return id;
  }

  async updateDocument(_collectionName: string, _docId: string, _data: Record<string, any>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async deleteDocument(_collectionName: string, _docId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async getDocument(collectionName: string, docId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (collectionName === 'tenders') {
      return MOCK_TENDERS.find(t => t.id === docId) || null;
    } else if (collectionName === 'bids') {
      return MOCK_BIDS.find(b => b.id === docId) || null;
    }
    return null;
  }

  async getDocuments(collectionName: string, _constraints?: any[]): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (collectionName === 'tenders') {
      return MOCK_TENDERS;
    } else if (collectionName === 'bids') {
      return MOCK_BIDS;
    }
    return [];
  }
}

export default new FirestoreService();
