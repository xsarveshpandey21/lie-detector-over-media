import React from 'react';
import { Report, ReasonItem } from '../types';

export default function ShareReport({ report }: { report: Report }) {
  async function copy() {
    try {
      const text = `Satya Lens Report\n\nVerdict: ${report.verdict.headline}\nMeaning: ${report.verdict.meaning}\nScore: ${report.verdict.score !== null ? `${report.verdict.score}/100` : 'Not scored'}\nConfidence: ${report.verdict.confidenceLevel}\n\nReasons:\n${report.reasons.map((r: ReasonItem) => `- ${r.text}`).join('\n')}\n\nChecked with Satya Lens\n${report.disclaimer}`;
      await navigator.clipboard.writeText(text);
      alert('Report copied to clipboard');
    } catch {
      alert('Copy failed');
    }
  }

  return (
    <div className="card space-y-2">
      <h3 className="font-semibold text-sm text-ink dark:text-cream">Share</h3>
      <button
        type="button"
        className="btn-secondary text-xs px-3 py-1.5"
        onClick={copy}
      >
        Copy Report
      </button>
    </div>
  );
}
