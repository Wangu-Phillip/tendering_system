import firestoreService from '@/firebase/firestore';
import storageService from '@/firebase/storage';
import { Tender } from '@types';

export class TenderService {
  /**
   * Create a new tender (only buyers/procurement entities can do this)
   * @throws Error if user is not authorized
   */
  async createTender(data: Omit<Tender, 'id' | 'createdAt' | 'updatedAt' | 'bidCount'>, userRole?: string): Promise<string> {
    // Verify authorization
    if (userRole && userRole !== 'buyer' && userRole !== 'admin') {
      throw new Error('Only procurement entities can create tenders. Bidders cannot create tenders.');
    }

    return firestoreService.addDocument('tenders', {
      ...data,
      bidCount: 0,
    });
  }

  async updateTender(id: string, data: Partial<Tender>): Promise<void> {
    return firestoreService.updateDocument('tenders', id, data);
  }

  async deleteTender(id: string): Promise<void> {
    return firestoreService.deleteDocument('tenders', id);
  }

  async getTender(id: string): Promise<Tender | null> {
    return firestoreService.getDocument('tenders', id);
  }

  async getTenders(): Promise<Tender[]> {
    return firestoreService.getDocuments('tenders');
  }

  async uploadTenderAttachment(tenderId: string, file: File): Promise<string> {
    const filename = `${Date.now()}-${file.name}`;
    return storageService.uploadFile(`tenders/${tenderId}`, filename, file);
  }
}

export default new TenderService();
