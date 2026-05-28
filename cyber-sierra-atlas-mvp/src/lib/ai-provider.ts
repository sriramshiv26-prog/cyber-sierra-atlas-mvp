/**
 * AI PROVIDER ABSTRACTION LAYER
 * 
 * This layer decouples the application from any specific AI vendor.
 * To add a new provider (e.g., Google Gemini, DeepSeek), simply implement 
 * the LLMProvider interface.
 */

export interface LLMProvider {
  name: string;
  generateText(prompt: string, systemPrompt: string): Promise<string>;
}

/**
 * Anthropic (Claude) Implementation
 */
import Anthropic from '@anthropic-ai/sdk';

class ClaudeProvider implements LLMProvider {
  name = 'Claude';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
    });
  }

  async generateText(prompt: string, systemPrompt: string): Promise<string> {
    const message = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });
    return (message.content[0] as any).text;
  }
}

/**
 * OpenAI Implementation
 */
class OpenAIProvider implements LLMProvider {
  name = 'OpenAI';
  
  async generateText(prompt: string, systemPrompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    });
    const data = await response.json();
    return data.choices[0].message.content;
  }
}

/**
 * Local LLM Implementation (Ollama / Local AI)
 * Default is configured for a standard Ollama setup on localhost:11434
 */
class LocalLLMProvider implements LLMProvider {
  name = 'LocalLLM';
  private endpoint = import.meta.env.VITE_LOCAL_LLM_ENDPOINT || 'http://localhost:11434/api/generate';

  async generateText(prompt: string, systemPrompt: string): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: import.meta.env.VITE_LOCAL_LLM_MODEL || 'llama3',
        prompt: `${systemPrompt}\n\n${prompt}`,
        stream: false,
      }),
    });
    const data = await response.json();
    return data.response;
  }
}

/**
 * PROVIDER FACTORY
 * Determines which AI engine to use based on the environment configuration.
 */
export function getAIProvider(): LLMProvider {
  const provider = import.meta.env.VITE_AI_PROVIDER?.toLowerCase();

  switch (provider) {
    case 'openai':
      return new OpenAIProvider();
    case 'local':
      return new LocalLLMProvider();
    case 'claude':
    default:
      return new ClaudeProvider();
  }
}
