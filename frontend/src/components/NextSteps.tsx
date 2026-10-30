import React from 'react';

interface NextStepsProps {
  steps: string[];
}

export default function NextSteps({ steps }: NextStepsProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="card space-y-3 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
      <h4 className="text-sm font-bold font-heading text-ink dark:text-cream">
        What you can do next
      </h4>

      <ol className="space-y-2 text-xs sm:text-sm">
        {steps.map((step, idx) => (
          <li key={idx} className="flex items-start gap-2.5">
            <span
              className="w-5 h-5 rounded-full bg-sand dark:bg-brown-800 text-brown-700 dark:text-yellow-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-line dark:border-brown-700"
              aria-hidden="true"
            >
              {idx + 1}
            </span>
            <span className="text-ink dark:text-cream leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

