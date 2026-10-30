import React from 'react';
import { CheckItem } from '../types';

interface ChecksTransparencyProps {
  checks: CheckItem[];
}

export default function ChecksTransparency({ checks }: ChecksTransparencyProps) {
  if (!checks || checks.length === 0) return null;

  return (
    <div className="card space-y-3 bg-sand/30 dark:bg-brown-900 border border-line dark:border-brown-700">
      <h4 className="text-sm font-bold font-heading text-ink dark:text-cream">
        How we checked (Transparency)
      </h4>

      <ul className="space-y-2 text-xs">
        {checks.map((chk, idx) => (
          <li
            key={idx}
            className={`flex items-start justify-between gap-3 p-2.5 rounded-lg border ${
              chk.ran
                ? 'bg-paper dark:bg-brown-800 border-line dark:border-brown-700 text-ink dark:text-cream'
                : 'bg-sand/40 dark:bg-brown-900/60 border-line/60 dark:border-brown-800 text-muted/80 dark:text-brown-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`font-bold text-sm ${chk.ran ? 'text-good' : 'text-muted/60'}`}
                aria-hidden="true"
              >
                {chk.ran ? '✔' : '–'}
              </span>
              <span className="font-semibold">{chk.name}</span>
            </div>
            <span className="text-[11px] text-right italic shrink-0 max-w-[200px]">
              {chk.note || (chk.ran ? 'Completed' : 'Not run')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

