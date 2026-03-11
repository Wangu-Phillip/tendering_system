import * as pdfjs from 'pdfjs-dist';

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

/**
 * Service for extracting text from PDF files
 */
class PDFExtractionService {
  /**
   * Extract text from a PDF file
   */
  async extractTextFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from multiple PDF files
   */
  async extractTextFromMultiplePDFs(files: File[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    for (const file of files) {
      try {
        const text = await this.extractTextFromPDF(file);
        results.set(file.name, text);
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        results.set(file.name, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  /**
   * Get file size in MB
   */
  getFileSizeInMB(file: File): number {
    return file.size / (1024 * 1024);
  }

  /**
   * Check if file is a valid PDF
   */
  isValidPDF(file: File): boolean {
    return file.type === 'application/pdf' && file.size > 0;
  }
}

export default new PDFExtractionService();
