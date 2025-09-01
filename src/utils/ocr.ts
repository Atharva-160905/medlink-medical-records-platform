import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  confidence: number;
}

export async function extractTextFromImage(imageFile: File | string): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(
      imageFile,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    return {
      text: result.data.text.trim(),
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractTextFromImageUrl(imageUrl: string, onProgress?: (progress: number) => void): Promise<OCRResult> {
  try {
    const result = await Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const progress = Math.round(m.progress * 100);
            console.log(`OCR Progress: ${progress}%`);
            onProgress?.(progress);
          }
        }
      }
    );

    return {
      text: result.data.text.trim(),
      confidence: result.data.confidence
    };
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw new Error(`OCR extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
