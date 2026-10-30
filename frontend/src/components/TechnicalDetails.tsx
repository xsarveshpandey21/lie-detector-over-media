import React, { useState } from 'react';

interface TechnicalDetailsProps {
  technical: Record<string, unknown>;
  rawReport: unknown;
}

export default function TechnicalDetails({ technical, rawReport }: TechnicalDetailsProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(rawReport, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const entries = Object.entries(technical || {}).filter(([_, v]) => v !== undefined);

  return (
    <div className="card space-y-2 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-muted dark:text-brown-300 hover:text-ink transition-colors py-1"
      >
        <span>Technical Details & Metadata</span>
        <span className="text-sm font-mono">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="pt-3 space-y-4 border-t border-line dark:border-brown-800 text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody>
                {entries.map(([key, val]) => (
                  <tr key={key} className="border-b border-line/50 dark:border-brown-800">
                    <td className="py-1.5 pr-4 font-mono font-medium text-muted dark:text-brown-300 w-1/3">
                      {key}
                    </td>
                    <td className="py-1.5 font-mono text-ink dark:text-cream break-all">
                      {typeof val === 'object' && val !== null
                        ? JSON.stringify(val)
                        : String(val)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-line dark:border-brown-700 hover:bg-sand dark:hover:bg-brown-800 transition-colors"
            >
              {copied ? '✔ Copied JSON' : 'Copy raw JSON'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

