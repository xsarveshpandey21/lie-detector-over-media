import React from 'react';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3;
  t: {
    heroTitle: string;
    steps: {
      add: string;
      check: string;
      result: string;
    };
  };
}

export default function StepIndicator({ currentStep, t }: StepIndicatorProps) {
  const steps = [
    { num: 1, label: t.steps.add },
    { num: 2, label: t.steps.check },
    { num: 3, label: t.steps.result }
  ];

  return (
    <div className="text-center py-6 sm:py-8 space-y-3">
      <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-ink dark:text-cream max-w-xl mx-auto leading-tight">
        {t.heroTitle}
      </h2>

      {/* 3-Step Pill Bar */}
      <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-sand/80 dark:bg-brown-900 border border-line dark:border-brown-700 text-xs font-semibold text-muted dark:text-brown-200">
        {steps.map((step, idx) => {
          const isActive = currentStep === step.num;
          const isDone = currentStep > step.num;

          return (
            <React.Fragment key={step.num}>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-brown-600 text-white'
                    : isDone
                    ? 'text-brown-700 dark:text-brown-300'
                    : 'text-muted dark:text-brown-400'
                }`}
              >
                {step.label}
              </span>
              {idx < steps.length - 1 && (
                <span className="text-line dark:text-brown-700" aria-hidden="true">→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

