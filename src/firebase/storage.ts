import { storage } from './config';
import {
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL,
} from 'firebase/storage';

export class StorageService {
  /**
   * Upload a file to Firebase Storage
   */
  async uploadFile(folder: string, filename: string, file: File): Promise<string> {
    try {
      const fileRef = ref(storage, `${folder}/${filename}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (error) {
      console.error(`Error uploading file to ${folder}/${filename}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const fileRef = ref(storage, filePath);
      await deleteObject(fileRef);
    } catch (error) {
      console.error(`Error deleting file at ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Get the download URL for a file
   */
  async getFileUrl(filePath: string): Promise<string> {
    try {
      const fileRef = ref(storage, filePath);
      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (error) {
      console.error(`Error getting file URL for ${filePath}:`, error);
      throw error;
    }
  }
}

export default new StorageService();
