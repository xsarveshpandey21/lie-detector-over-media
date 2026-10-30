import React from 'react';
import { Sources } from '../types';

interface FactCheckCardsProps {
  sources: Sources;
}

export default function FactCheckCards({ sources }: FactCheckCardsProps) {
  const { status, items } = sources || { status: 'not_checked', items: [] };

  return (
    <div className="card space-y-3 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
      <h4 className="text-sm font-bold font-heading text-ink dark:text-cream">
        What other sources say
      </h4>

      {status === 'not_checked' && (
        <div className="p-3.5 rounded-xl bg-sand/40 dark:bg-brown-800 text-xs text-muted dark:text-brown-200">
          Fact-check search is turned off in this version (no Google Fact Check API key configured).
        </div>
      )}

      {status === 'no_matches_found' && (
        <div className="p-3.5 rounded-xl bg-sand/40 dark:bg-brown-800 text-xs text-muted dark:text-brown-200">
          We did not find any published fact-checks for this claim. That does not mean it is true.
        </div>
      )}

      {status === 'checked' && items && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-line dark:border-brown-800 bg-cream/50 dark:bg-brown-800/60 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-ink dark:text-cream">
                  {item.publisher}
                </span>
                <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-yellow-100 dark:bg-brown-700 text-brown-800 dark:text-yellow-200 border border-yellow-300/40">
                  Rating: {item.rating}
                </span>
              </div>

              <p className="text-muted dark:text-brown-200 italic line-clamp-2">
                &ldquo;{item.claim}&rdquo;
              </p>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-muted/80">{item.date}</span>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-brown-600 dark:text-yellow-400 hover:underline"
                  >
                    Read full check ↗
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

