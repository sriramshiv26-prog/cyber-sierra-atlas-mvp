import React, { useState } from 'react';
import { FileText, Download, Copy, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { generateBriefing } from '../lib/llm';

const AUDIENCES = [
  { id: 'weekly_digest', label: 'Weekly Digest', description: 'Summary for leadership' },
  { id: 'board_briefing', label: 'Board Briefing', description: 'Strategic overview' },
  { id: 'audit_memo', label: 'Audit Memo', description: 'Compliance-focused' },
  { id: 'ciso_one_on_one', label: 'CISO One-on-One', description: 'Technical deep-dive' },
];

export function ReportsView() {
  const { store } = useStore();
  const [selectedAudience, setSelectedAudience] = useState('weekly_digest');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const briefing = await generateBriefing(store.findings, selectedAudience);
      setReport(briefing);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
      console.error('Report generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(report).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(report));
    element.setAttribute('download', `atlas-report-${selectedAudience}-${new Date().toISOString().split('T')[0]}.md`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  return (
    <div className="p-8 h-full flex flex-col gap-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Briefings</h1>
        <p className="text-slate-500 dark:text-slate-400">Generate executive summaries tailored to your audience.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Audience Selector */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm h-fit sticky top-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">Select Audience</h3>
          <div className="space-y-3 mb-8">
            {AUDIENCES.map(audience => (
              <label key={audience.id} className="flex items-start gap-3 p-3 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <input
                  type="radio"
                  name="audience"
                  value={audience.id}
                  checked={selectedAudience === audience.id}
                  onChange={(e) => setSelectedAudience(e.target.value)}
                  className="mt-1 w-4 h-4"
                />
                <div>
                  <div className="font-medium text-slate-900 dark:text-white text-sm">{audience.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{audience.description}</div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || store.findings.length === 0}
            className="w-full px-4 py-3 bg-cs-navy dark:bg-cs-cyan-600 text-white font-medium rounded-lg hover:bg-cs-navy-700 dark:hover:bg-cs-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            {isGenerating ? 'Generating...' : 'Generate Report'}
          </button>

          {store.findings.length === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">Import findings first to generate reports.</p>
          )}
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-2">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex gap-3 text-red-700 dark:text-red-400 text-sm mb-6 animate-in slide-in-from-top">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error generating report</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {report ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 dark:text-white">Report Preview</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                    title="Download as Markdown"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
              {copied && (
                <div className="px-6 py-2 bg-green-50 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs font-medium">
                  Copied to clipboard
                </div>
              )}
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-mono leading-relaxed">{report}</pre>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 p-12 text-center h-96">
              <FileText size={48} className="mb-4 opacity-30" />
              <p className="text-sm">Select an audience and click "Generate Report" to create a briefing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
