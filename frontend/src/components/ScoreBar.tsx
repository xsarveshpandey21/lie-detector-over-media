import React from 'react';
import HelpTooltip from './HelpTooltip';

interface ScoreBarProps {
  score: number | null;
}

export default function ScoreBar({ score }: ScoreBarProps) {
  if (score === null || score === undefined) {
    return (
      <div className="card space-y-2.5 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold font-heading text-ink dark:text-cream">
              Reliability Score
            </h4>
            <HelpTooltip
              label="Reliability Score"
              text="A numeric score is computed when verified fact-checks, linguistic patterns, or domain reputation signals exist."
            />
          </div>
          <span className="font-semibold text-xs px-2.5 py-1 rounded-md bg-sand dark:bg-brown-800 text-muted dark:text-brown-300">
            Not scored
          </span>
        </div>
        <p className="text-xs text-muted dark:text-brown-300">
          File headers alone cannot guarantee authenticity. Review the camera provenance and file technical details below.
        </p>
      </div>
    );
  }

  const boundedScore = Math.max(0, Math.min(100, score));

  // Determine bar indicator color
  let barColor = 'bg-warn';
  if (boundedScore >= 70) barColor = 'bg-good';
  else if (boundedScore <= 40) barColor = 'bg-bad';

  return (
    <div className="card space-y-3 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold font-heading text-ink dark:text-cream">
            Reliability Score
          </h4>
          <HelpTooltip
            label="Reliability Score"
            text="Estimated rating from 0 to 100 based on verified sources, domain reputation, and writing style."
          />
        </div>
        <span className="font-extrabold text-lg text-ink dark:text-cream">
          {boundedScore}<span className="text-xs text-muted font-normal"> / 100</span>
        </span>
      </div>

      <div
        className="w-full h-3 rounded-full bg-sand dark:bg-brown-800 overflow-hidden relative"
        role="progressbar"
        aria-valuenow={boundedScore}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${boundedScore}%` }}
        />
      </div>

      <div className="flex justify-between text-[11px] text-muted dark:text-brown-300 font-medium">
        <span>Unlikely to be true</span>
        <span>Neutral / Uncertain</span>
        <span>Likely to be true</span>
      </div>
    </div>
  );
}
