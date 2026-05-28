import Anthropic from '@anthropic-ai/sdk';
import { Finding } from './schema';

/**
 * LLM Client configuration.
 * Uses Vite's import.meta.env for environment variable access.
 */
const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert cybersecurity analyst. Your task is to extract security findings from provided documents into a strict JSON format.

### Extraction Schema:
For each finding, extract:
- title: A professional, concise title (e.g., "Lack of MFA on Admin Portal")
- description: A detailed explanation of the finding and the risk.
- severity: Must be one of: ["Critical", "High", "Medium", "Low", "Informational"]
- asset: The specific system, application, or infrastructure component affected.
- status: Must be one of: ["Open", "In Progress", "Resolved", "Closed", "Risk Accepted"]. Default to "Open".
- owner: The responsible team or person mentioned.
- due_date: ISO8601 date if mentioned, otherwise null.
- cve: CVE identifier (e.g., CVE-2023-1234) if mentioned, otherwise null.
- control_framework: The framework being mapped to (e.g., "ISO 27001", "NIST CSF").
- control_clause: The specific section/clause (e.g., "A.5.1").

### Output Requirements:
1. Return ONLY a JSON array of objects.
2. Do not include markdown formatting (no \`\`\`json blocks).
3. If no findings are found, return an empty array [].
4. Ensure all required fields are present. Use null for missing optional fields.`;

/**
 * Cleans LLM response by removing potential markdown artifacts.
 */
function cleanJsonResponse(text: string): string {
  return text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
}

/**
 * Parses raw text into structured Findings using Claude 3.5 Sonnet.
 */
export async function parseFindingsWithLLM(text: string, sourceFilename: string): Promise<Finding[]> {
  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Document Filename: ${sourceFilename}\n\nDocument Content:\n${text}`,
        },
      ],
    });

    const rawText = message.content[0];
    if (typeof rawText !== 'string') {
      throw new Error('Unexpected response format from LLM');
    }

    const cleanedText = cleanJsonResponse(rawText);
    const findings = JSON.parse(cleanedText);

    if (!Array.isArray(findings)) {
      throw new Error('LLM did not return an array of findings');
    }

    // Map raw LLM data to our internal Finding schema
    return findings.map((f, idx) => ({
      id: `F-${Date.now()}-${idx}`,
      title: f.title || 'Untitled Finding',
      description: f.description || '',
      severity: f.severity || 'Medium',
      status: f.status || 'Open',
      asset_id: '', // To be resolved during the Smart Ingest phase
      asset_name: f.asset || 'Unknown Asset',
      control_framework: f.control_framework || 'Unknown',
      control_clause: f.control_clause || 'Unknown',
      cve: f.cve || undefined,
      cvss_score: undefined,
      owner: f.owner || undefined,
      due_date: f.due_date || undefined,
      source_document: {
        filename: sourceFilename,
        upload_date: new Date().toISOString(),
        parser_confidence: 0.9,
      },
      related_findings: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      flags: {},
    }));
  } catch (error) {
    console.error('[LLM Parser Error]:', error);
    throw new Error(`Failed to parse document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generates professional executive summaries based on parsed findings.
 */
export async function generateBriefing(findings: Finding[], audience: string): Promise<string> {
  const findingsSummary = findings
    .slice(0, 20)
    .map(f => `- ${f.title} (${f.severity}, ${f.status})`)
    .join('\n');

  const audiencePrompts: Record<string, string> = {
    weekly_digest: `Generate a 1-page weekly briefing. Focus on operational trends, top 3critical items, and a simple by-asset summary.`,
    board_briefing: `Generate a 2-page board-level briefing. Focus on business risk, financial impact, overall risk posture, and progress against the quarterly goal.`,
    audit_memo: `Generate a formal audit-ready memorandum. Focus on compliance gaps, detailed evidence requirements, and strict remediation timelines.`,
    ciso_one_on_one: `Generate high-level talking points for a CISO 1-on-1. Focus on "what needs a decision" and "where we are winning".`,
  };

  const selectedPrompt = audiencePrompts[audience] || audiencePrompts.weekly_digest;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: "You are a CISO's Chief of Staff. Your tone is output-led, calm, professional, and specific. Avoid buzzwords and generic AI language.",
      messages: [
        {
          role: 'user',
          content: `${selectedPrompt}\n\nCurrent Findings Context:\n${findingsSummary}`,
        },
      ],
    });

    const content = message.content[0];
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (error) {
    console.error('[Briefing Generator Error]:', error);
    throw new Error('Failed to generate briefing');
  }
}

/**
 * Generates step-by-step remediation plan for a security finding.
 * Includes root cause analysis, immediate mitigation, long-term fixes, and testing steps.
 */
export async function generateRemediationPlan(finding: Finding): Promise<string> {
  const systemPrompt = `You are an expert cybersecurity engineer and remediation specialist. Generate professional, actionable remediation plans that include:
1. Root Cause Analysis - Why this vulnerability exists
2. Immediate Mitigation - Quick steps to reduce risk (24-48 hours)
3. Long-Term Fix - Comprehensive solution with Terraform/CLI commands where applicable
4. Testing & Validation - How to verify the fix works
5. Prevention - How to prevent this in the future

Be specific, technical, and cite tools/frameworks. Include actual code snippets and commands where relevant.`;

  const findingContext = `
Finding: ${finding.title}
Severity: ${finding.severity}
Asset: ${finding.asset_name}
Description: ${finding.description}
Framework: ${finding.control_framework}
Control: ${finding.control_clause}${finding.cvss_score ? `\nCVSS Score: ${finding.cvss_score}` : ''}${finding.cve ? `\nCVE: ${finding.cve}` : ''}`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a detailed remediation plan for this security finding:\n\n${findingContext}`,
        },
      ],
    });

    const content = message.content[0];
    return typeof content === 'string' ? content : JSON.stringify(content);
  } catch (error) {
    console.error('[Remediation Plan Error]:', error);
    throw new Error('Failed to generate remediation plan');
  }
}
