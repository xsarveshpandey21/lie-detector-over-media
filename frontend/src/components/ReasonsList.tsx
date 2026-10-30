import React from 'react';
import { ReasonItem } from '../types';

interface ReasonsListProps {
  reasons: ReasonItem[];
}

export default function ReasonsList({ reasons }: ReasonsListProps) {
  if (!reasons || reasons.length === 0) return null;

  const iconMap: Record<string, { icon: string; style: string }> = {
    good: { icon: '✔', style: 'text-good bg-good-bg border-good/30' },
    warn: { icon: '⚠', style: 'text-warn bg-warn-bg border-warn/30' },
    bad: { icon: '✖', style: 'text-bad bg-bad-bg border-bad/30' },
    info: { icon: 'ℹ', style: 'text-brown-700 bg-sand border-line' }
  };

  return (
    <div className="card space-y-3 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
      <h4 className="text-sm font-bold font-heading text-ink dark:text-cream">
        Why we think this
      </h4>

      <ul className="space-y-2.5">
        {reasons.map((r, idx) => {
          const cfg = iconMap[r.tone] || iconMap.info;
          return (
            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border mt-0.5 ${cfg.style}`}
                aria-hidden="true"
              >
                {cfg.icon}
              </span>
              <div className="text-ink dark:text-cream leading-relaxed">
                <span>{r.text}</span>
                {r.refIds && r.refIds.length > 0 && (
                  <span className="inline-flex gap-1 ml-1.5" aria-label="Reference markers">
                    {r.refIds.map((refId, i) => (
                      <a
                        key={refId}
                        href={`#ref-${refId}`}
                        className="inline-flex items-center justify-center px-1.5 py-0.2 rounded text-[11px] font-bold bg-yellow-200/90 dark:bg-yellow-900/70 text-brown-950 dark:text-yellow-200 hover:underline border border-yellow-400/40"
                        title={`Jump to reference evidence ${refId}`}
                        aria-label={`Jump to reference evidence ${refId}`}
                      >
                        [{i + 1}]
                      </a>
                    ))}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
