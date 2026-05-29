import Anthropic from '@anthropic-ai/sdk';

export interface VisionExtractionResult {
  text: string;
  confidence: number;
  pageNumber: number;
  method: 'claude_vision';
  metadata: {
    fileName: string;
    model: string;
    extractedAt: string;
  };
}

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
});

export async function extractWithClaudeVision(
  imageBase64: string,
  fileName: string,
  pageNumber: number
): Promise<VisionExtractionResult> {
  try {
    if (!imageBase64 || imageBase64.trim().length === 0) {
      return {
        text: '',
        confidence: 0,
        pageNumber,
        method: 'claude_vision',
        metadata: {
          fileName,
          model: 'claude-3-5-sonnet-20241022',
          extractedAt: new Date().toISOString(),
        },
      };
    }

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Extract all security findings, audit findings, or issues from this document page.

              Return the extracted text as-is, preserving structure and formatting.
              Focus on:
              - Finding titles/descriptions
              - Severity/risk levels
              - Asset names
              - Control references
              - Status information

              Preserve all text content exactly as shown.`,
            },
          ],
        },
      ],
    });

    const extractedText =
      response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      text: extractedText,
      confidence: 0.95,
      pageNumber,
      method: 'claude_vision',
      metadata: {
        fileName,
        model: 'claude-3-5-sonnet-20241022',
        extractedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('[Tier 3 Error]', error);
    return {
      text: '',
      confidence: 0,
      pageNumber,
      method: 'claude_vision',
      metadata: {
        fileName,
        model: 'claude-3-5-sonnet-20241022',
        extractedAt: new Date().toISOString(),
      },
    };
  }
}
