import React from 'react';

interface LinkInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder: string;
}

export default function LinkInput({ value, onChange, disabled, placeholder }: LinkInputProps) {
  let detectedDomain: string | null = null;
  let isValid = false;

  const trimmed = value.trim();
  if (trimmed) {
    try {
      const urlToTest = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
      const parsed = new URL(urlToTest);
      if (parsed.hostname && parsed.hostname.includes('.')) {
        detectedDomain = parsed.hostname.replace(/^www\./, '');
        isValid = true;
      }
    } catch {
      detectedDomain = null;
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full p-3.5 pr-10 rounded-xl border border-line dark:border-brown-700 bg-paper dark:bg-brown-900 text-ink dark:text-cream text-sm outline-none focus:ring-2 focus:ring-yellow-400 placeholder:text-muted/60"
        />
        {trimmed && (
          <span className="absolute right-3.5 top-3.5 text-sm" aria-hidden="true">
            {isValid ? '✔' : '…'}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs px-1">
        {detectedDomain ? (
          <span className="text-brown-700 dark:text-yellow-300 font-medium">
            Domain: <strong className="font-semibold">{detectedDomain}</strong>
          </span>
        ) : (
          <span className="text-muted dark:text-brown-300">
            Paste any web address (e.g., https://example.com/news)
          </span>
        )}
      </div>
    </div>
  );
}

