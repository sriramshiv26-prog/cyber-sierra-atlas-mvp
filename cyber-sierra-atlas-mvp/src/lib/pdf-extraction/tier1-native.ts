import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ExtractionResult {
  text: string;
  confidence: number;
  textDensity: number;
  pageCount: number;
  method: 'native_text';
  metadata: {
    fileName: string;
    extractedAt: string;
  };
}

export async function extractNativeTextFromPDF(
  pdfBytes: Uint8Array,
  fileName: string
): Promise<ExtractionResult> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const pages: string[] = [];
    let totalTextLength = 0;

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      pages.push(pageText);
      totalTextLength += pageText.length;
    }

    const fullText = pages.join('\n---PAGE BREAK---\n');

    const avgCharsPerPage = totalTextLength / pdf.numPages;
    const textDensity = Math.min(1.0, avgCharsPerPage / 500);

    const confidence = textDensity > 0.3 ? 1.0 : textDensity * 0.2;

    return {
      text: fullText,
      confidence,
      textDensity,
      pageCount: pdf.numPages,
      method: 'native_text',
      metadata: {
        fileName,
        extractedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[Tier 1 Error]', error);
    return {
      text: '',
      confidence: 0,
      textDensity: 0,
      pageCount: 0,
      method: 'native_text',
      metadata: {
        fileName,
        extractedAt: new Date().toISOString(),
      },
    };
  }
}
