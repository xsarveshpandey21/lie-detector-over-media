import React from 'react';

interface ErrorStateProps {
  error: string;
  errorCode?: string | null;
  onRetry: () => void;
}

export default function ErrorState({ error, errorCode, onRetry }: ErrorStateProps) {
  let title = 'Check could not be completed';
  let advice = 'Please check the input and try again.';

  if (errorCode === '413' || errorCode === 'file_too_large') {
    title = 'File is too large';
    advice = 'Please choose a smaller file under 4 MB.';
  } else if (errorCode === '429' || errorCode === 'rate_limit_exceeded') {
    title = 'Too many requests';
    advice = 'You have run several checks recently. Please take a 5-minute break and try again.';
  } else if (errorCode === '504' || errorCode === 'timeout') {
    title = 'Check timed out';
    advice = 'The server took too long to analyze this content. Try testing with a shorter claim or smaller media file.';
  } else if (errorCode === 'empty_text' || errorCode === 'empty_url' || errorCode === 'missing_file') {
    title = 'Information needed';
    advice = 'Please provide text, a link, or select a file before clicking Check.';
  }

  return (
    <div
      role="alert"
      className="card p-6 border-l-4 border-l-bad bg-bad-bg/60 dark:bg-brown-900 border-line dark:border-brown-700 space-y-3 max-w-2xl mx-auto my-6"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none text-bad" aria-hidden="true">⚠</span>
        <div className="space-y-1 flex-1">
          <h3 className="font-bold text-ink dark:text-cream text-base">{title}</h3>
          <p className="text-sm text-ink dark:text-cream">{error}</p>
          <p className="text-xs text-muted dark:text-brown-200">{advice}</p>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          onClick={onRetry}
          className="btn-secondary text-xs px-4 py-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

