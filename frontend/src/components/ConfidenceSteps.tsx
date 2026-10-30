import React from 'react';
import { ConfidenceLevel } from '../types';
import HelpTooltip from './HelpTooltip';

interface ConfidenceStepsProps {
  level: ConfidenceLevel;
}

export default function ConfidenceSteps({ level }: ConfidenceStepsProps) {
  const steps: Array<{ id: ConfidenceLevel; label: string; activeIndex: number }> = [
    { id: 'low', label: 'Low', activeIndex: 1 },
    { id: 'medium', label: 'Medium', activeIndex: 2 },
    { id: 'high', label: 'High', activeIndex: 3 }
  ];

  const currentStep = level === 'high' ? 3 : level === 'medium' ? 2 : 1;

  return (
    <div className="card space-y-3 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold font-heading text-ink dark:text-cream">
            How sure are we?
          </h4>
          <HelpTooltip
            label="Confidence Level"
            text="This shows how strong our evidence is, not whether the content is true."
          />
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sand dark:bg-brown-800 text-brown-700 dark:text-yellow-300 capitalize">
          {level} confidence
        </span>
      </div>

      {/* 3-Step Horizontal Bar */}
      <div className="grid grid-cols-3 gap-2" role="img" aria-label={`Evidence strength: ${level} confidence`}>
        {steps.map((step) => {
          const isFilled = currentStep >= step.activeIndex;
          return (
            <div key={step.id} className="space-y-1.5 text-center">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  isFilled
                    ? 'bg-brown-600 dark:bg-yellow-400'
                    : 'bg-sand dark:bg-brown-800'
                }`}
              />
              <span className={`text-[11px] font-medium ${
                isFilled
                  ? 'text-ink dark:text-cream font-bold'
                  : 'text-muted/60 dark:text-brown-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

