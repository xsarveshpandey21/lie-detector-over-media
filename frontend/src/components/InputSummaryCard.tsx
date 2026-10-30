import React, { useState } from 'react';
import { InputSummary } from '../types';

interface InputSummaryCardProps {
  input: InputSummary;
  onEdit: () => void;
  onReset: () => void;
  t: {
    step2Title: string;
    buttons: {
      editAgain: string;
      checkAnother: string;
    };
  };
}

export default function InputSummaryCard({
  input,
  onEdit,
  onReset,
  t
}: InputSummaryCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card space-y-4 bg-sand/30 dark:bg-brown-900 border border-line dark:border-brown-700">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted dark:text-brown-300">
          {t.step2Title}
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-line dark:border-brown-700 hover:bg-sand dark:hover:bg-brown-800 transition-colors"
          >
            {t.buttons.editAgain}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-line dark:border-brown-700 hover:bg-sand dark:hover:bg-brown-800 transition-colors"
          >
            {t.buttons.checkAnother}
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-paper dark:bg-brown-900/90 border border-line dark:border-brown-800">
        {input.kind === 'text' && (
          <div className="space-y-2">
            <p className={`text-sm text-ink dark:text-cream leading-relaxed ${!expanded ? 'line-clamp-4' : ''}`}>
              &ldquo;{input.preview}&rdquo;
            </p>
            {input.preview.length > 200 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-semibold text-brown-600 dark:text-yellow-400 hover:underline"
              >
                {expanded ? 'Show less' : 'Show more'}
              </button>
            )}
            <div className="text-xs text-muted dark:text-brown-300 pt-1">
              {input.meta.words || 0} words • {input.meta.chars || 0} characters
            </div>
          </div>
        )}

        {input.kind === 'url' && (
          <div className="space-y-1">
            <p className="text-sm font-medium text-ink dark:text-cream break-all">
              {input.preview}
            </p>
            {input.meta.domain && (
              <span className="inline-block px-2 py-0.5 rounded-md bg-yellow-100 dark:bg-brown-800 text-brown-700 dark:text-yellow-300 text-xs font-bold">
                Domain: {input.meta.domain}
              </span>
            )}
          </div>
        )}

        {input.kind === 'file' && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sand dark:bg-brown-800 flex items-center justify-center text-xl shrink-0">
              📁
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-ink dark:text-cream truncate">
                {input.preview}
              </p>
              <p className="text-xs text-muted dark:text-brown-300">
                {input.meta.fileType || 'file'} • {input.meta.sizeKB ? `${input.meta.sizeKB} KB` : `${input.meta.sizeMB} MB`}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

