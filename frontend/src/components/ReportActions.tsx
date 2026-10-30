import React, { useState } from 'react';
import { Report } from '../types';

interface ReportActionsProps {
  report: Report;
  onReset: () => void;
  onToast: (msg: string) => void;
  t: {
    buttons: {
      copy: string;
      print: string;
      checkAnother: string;
    };
  };
}

export default function ReportActions({
  report,
  onReset,
  onToast,
  t
}: ReportActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const lines = [
      `Lie Detector Over Media Report — See what's real`,
      `------------------------------------`,
      `Verdict: ${report.verdict.headline}`,
      `Meaning: ${report.verdict.meaning}`,
      report.verdict.score !== null ? `Score: ${report.verdict.score}/100` : `Score: Not scored from file alone`,
      `Confidence: ${report.verdict.confidenceLevel}`,
      ``,
      `Why we think this:`,
      ...report.reasons.map(r => `- ${r.text}`),
      ``,
      `What you can do next:`,
      ...report.nextSteps.map(s => `- ${s}`),
      ``,
      `Disclaimer: ${report.disclaimer}`,
      `Checked with Lie Detector Over Media`
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      onToast('Report copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onToast('Could not copy report to clipboard.');
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line dark:border-brown-700 no-print">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="btn-secondary text-xs px-4 py-2"
        >
          {copied ? '✔ Copied' : t.buttons.copy}
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="btn-secondary text-xs px-4 py-2"
        >
          {t.buttons.print}
        </button>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="btn-primary text-xs px-4 py-2"
      >
        {t.buttons.checkAnother}
      </button>
    </div>
  );
}

