import React from 'react';

interface EmptyStateProps {
  t: {
    emptyState: {
      howItWorks: string;
      card1Title: string;
      card1Desc: string;
      card2Title: string;
      card2Desc: string;
      card3Title: string;
      card3Desc: string;
    };
    privacyNote: string;
    disclaimer: string;
  };
}

export default function EmptyState({ t }: EmptyStateProps) {
  return (
    <div className="mt-12 space-y-8 max-w-3xl mx-auto">
      <div className="text-center">
        <h3 className="text-lg font-bold font-heading text-ink dark:text-cream">
          {t.emptyState.howItWorks}
        </h3>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {/* Card 1 */}
        <div className="card space-y-2 p-5 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
          <div className="w-8 h-8 rounded-full bg-sand dark:bg-brown-800 text-brown-700 dark:text-yellow-300 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h4 className="font-bold text-ink dark:text-cream text-base">
            {t.emptyState.card1Title}
          </h4>
          <p className="text-xs text-muted dark:text-brown-200 leading-relaxed">
            {t.emptyState.card1Desc}
          </p>
        </div>

        {/* Card 2 */}
        <div className="card space-y-2 p-5 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
          <div className="w-8 h-8 rounded-full bg-sand dark:bg-brown-800 text-brown-700 dark:text-yellow-300 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h4 className="font-bold text-ink dark:text-cream text-base">
            {t.emptyState.card2Title}
          </h4>
          <p className="text-xs text-muted dark:text-brown-200 leading-relaxed">
            {t.emptyState.card2Desc}
          </p>
        </div>

        {/* Card 3 */}
        <div className="card space-y-2 p-5 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
          <div className="w-8 h-8 rounded-full bg-sand dark:bg-brown-800 text-brown-700 dark:text-yellow-300 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h4 className="font-bold text-ink dark:text-cream text-base">
            {t.emptyState.card3Title}
          </h4>
          <p className="text-xs text-muted dark:text-brown-200 leading-relaxed">
            {t.emptyState.card3Desc}
          </p>
        </div>
      </div>

      {/* Privacy Guarantee & Honest Disclaimer */}
      <div className="rounded-xl p-4 bg-sand/60 dark:bg-brown-900/60 border border-line dark:border-brown-800 text-center space-y-1.5 text-xs text-muted dark:text-brown-200">
        <p className="font-medium text-ink dark:text-cream flex items-center justify-center gap-1.5">
          <span aria-hidden="true">🔒</span>
          {t.privacyNote}
        </p>
        <p>
          {t.disclaimer}
        </p>
      </div>
    </div>
  );
}

