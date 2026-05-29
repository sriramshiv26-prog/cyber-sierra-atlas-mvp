import * as pdfjsLib from 'pdfjs-dist';
import Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface OCRExtractionResult {
  text: string;
  confidence: number;
  ocrConfidence: number;
  pageNumber: number;
  method: 'ocr_tesseract';
  metadata: {
    fileName: string;
    language: string;
    extractedAt: string;
  };
}

async function pdfPageToImage(
  pdfBytes: Uint8Array,
  pageNumber: number
): Promise<string> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const page = await pdf.getPage(pageNumber);

    const scale = 2.0;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) throw new Error('Cannot create canvas context');

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: context, viewport }).promise;

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('[PDF to Image Error]', error);
    throw error;
  }
}

export async function extractWithOCR(
  pdfBytes: Uint8Array,
  fileName: string,
  pageNumber: number
): Promise<OCRExtractionResult> {
  try {
    const imageBase64 = await pdfPageToImage(pdfBytes, pageNumber);

    const result = await Tesseract.recognize(imageBase64, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const ocrText = result.data.text;
    const ocrConfidence = result.data.confidence / 100;

    let confidence = 0.6;
    if (ocrConfidence > 0.8) {
      confidence = 0.8;
    } else if (ocrConfidence > 0.6) {
      confidence = 0.7;
    } else if (ocrConfidence > 0.4) {
      confidence = 0.65;
    } else {
      confidence = 0.5;
    }

    return {
      text: ocrText,
      confidence,
      ocrConfidence,
      pageNumber,
      method: 'ocr_tesseract',
      metadata: {
        fileName,
        language: 'eng',
        extractedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[Tier 2 Error]', error);
    return {
      text: '',
      confidence: 0,
      ocrConfidence: 0,
      pageNumber,
      method: 'ocr_tesseract',
      metadata: {
        fileName,
        language: 'eng',
        extractedAt: new Date().toISOString(),
      },
    };
  }
}
