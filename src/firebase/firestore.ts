import { db } from './config';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';

export class FirestoreService {
  /**
   * Add a new document to a collection
   */
  async addDocument(collectionName: string, data: Record<string, any>): Promise<string> {
    try {
      // Convert Date objects to Firestore Timestamps
      const processedData = this.processDateFields(data);
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, {
        ...processedData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing document
   */
  async updateDocument(collectionName: string, docId: string, data: Record<string, any>): Promise<void> {
    try {
      const processedData = this.processDateFields(data);
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...processedData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get a single document by ID
   */
  async getDocument(collectionName: string, docId: string): Promise<any> {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return this.convertDocumentData(docSnap.id, docSnap.data());
      }
      return null;
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple documents from a collection with optional constraints
   */
  async getDocuments(collectionName: string, constraints?: QueryConstraint[]): Promise<any[]> {
    try {
      const collectionRef = collection(db, collectionName);
      const q = constraints && constraints.length > 0
        ? query(collectionRef, ...constraints)
        : collectionRef;

      const querySnapshot = await getDocs(q);
      const documents: any[] = [];

      querySnapshot.forEach((doc) => {
        documents.push(this.convertDocumentData(doc.id, doc.data()));
      });

      return documents;
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Convert Firestore Timestamps to JavaScript Date objects
   */
  private convertDocumentData(docId: string, data: any): any {
    const converted = { id: docId, ...data };

    // Convert Firestore Timestamps to Date objects
    Object.keys(converted).forEach((key) => {
      if (converted[key] instanceof Timestamp) {
        converted[key] = converted[key].toDate();
      } else if (typeof converted[key] === 'object' && converted[key] !== null) {
        // Recursively convert nested objects
        if (converted[key] instanceof Timestamp) {
          converted[key] = converted[key].toDate();
        }
      }
    });

    return converted;
  }

  /**
   * Process Date objects and convert them to Firestore Timestamps
   */
  private processDateFields(data: Record<string, any>): Record<string, any> {
    const processed = { ...data };

    Object.keys(processed).forEach((key) => {
      if (processed[key] instanceof Date) {
        processed[key] = Timestamp.fromDate(processed[key]);
      }
    });

    return processed;
  }
}

export default new FirestoreService();
