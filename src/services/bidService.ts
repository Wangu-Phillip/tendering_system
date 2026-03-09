import firestoreService from '@/firebase/firestore';
import storageService from '@/firebase/storage';
import { Bid } from '@types';

export class BidService {
  async createBid(data: Omit<Bid, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return firestoreService.addDocument('bids', {
      ...data,
    });
  }

  async updateBid(id: string, data: Partial<Bid>): Promise<void> {
    return firestoreService.updateDocument('bids', id, data);
  }

  async deleteBid(id: string): Promise<void> {
    return firestoreService.deleteDocument('bids', id);
  }

  async getBid(id: string): Promise<Bid | null> {
    return firestoreService.getDocument('bids', id);
  }

  async getBids(tenderId?: string): Promise<Bid[]> {
    let bids = await firestoreService.getDocuments('bids');
    if (tenderId) {
      bids = bids.filter((bid) => bid.tenderId === tenderId);
    }
    return bids;
  }

  async submitBid(id: string): Promise<void> {
    return this.updateBid(id, { status: 'submitted' });
  }

  async uploadBidAttachment(bidId: string, file: File): Promise<string> {
    const filename = `${Date.now()}-${file.name}`;
    return storageService.uploadFile(`bids/${bidId}`, filename, file);
  }
}

export default new BidService();
