import React from 'react';
import { Verdict } from '../types';

interface VerdictBannerProps {
  verdict: Verdict;
}

export default function VerdictBanner({ verdict }: VerdictBannerProps) {
  const isScoreNull = verdict.score === null;
  const label = verdict.label;

  // Determine appearance based on verdict and score null state
  let bgClass = 'bg-warn-bg text-warn border-warn/30';
  let icon = '❓';
  let badgeText = 'Uncertain';

  if (isScoreNull) {
    bgClass = 'bg-sand dark:bg-brown-800 text-ink dark:text-cream border-line dark:border-brown-600';
    icon = '🔍';
    badgeText = 'Needs more context';
  } else if (label === 'likely_true') {
    bgClass = 'bg-good-bg text-good border-good/30';
    icon = '✔';
    badgeText = 'Looks Reliable';
  } else if (label === 'likely_false') {
    bgClass = 'bg-bad-bg text-bad border-bad/30';
    icon = '✖';
    badgeText = 'Misleading or False';
  } else {
    bgClass = 'bg-warn-bg text-warn border-warn/30';
    icon = '⚠';
    badgeText = 'Unverified';
  }

  return (
    <div className={`p-6 rounded-2xl border shadow-card space-y-2.5 transition-all ${bgClass}`}>
      <div className="flex items-center gap-2">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg bg-paper/80 shadow-sm"
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-paper/70">
          {badgeText}
        </span>
      </div>

      <h3 className="text-2xl sm:text-3xl font-extrabold font-heading leading-tight">
        {verdict.headline}
      </h3>

      <p className="text-sm sm:text-base leading-relaxed opacity-95">
        {verdict.meaning}
      </p>
    </div>
  );
}

