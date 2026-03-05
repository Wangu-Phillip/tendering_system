// Dummy Storage Service (Mock data for UI testing)

export class StorageService {
  async uploadFile(folder: string, filename: string, _file: File): Promise<string> {
    // Simulate file upload
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Return a mock URL
    return `https://example.com/storage/${folder}/${filename}`;
  }

  async deleteFile(_filePath: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  async getFileUrl(_filePath: string): Promise<string> {
    return `https://example.com/storage/file`;
  }
}

export default new StorageService();
