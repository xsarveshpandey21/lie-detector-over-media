import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder: string;
}

const MAX_CHARS = 5000;

export default function TextInput({ value, onChange, disabled, placeholder }: TextInputProps) {
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const isNearLimit = charCount > 4500;
  const isAtLimit = charCount >= MAX_CHARS;

  async function handlePaste() {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onChange(clipText.slice(0, MAX_CHARS));
      }
    } catch {
      // Clipboard permission denied or unavailable, user can paste with Ctrl+V
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_CHARS))}
          disabled={disabled}
          placeholder={placeholder}
          rows={5}
          className={`w-full p-3.5 rounded-xl border bg-paper dark:bg-brown-900 text-ink dark:text-cream text-sm leading-relaxed outline-none transition-all placeholder:text-muted/60 focus:ring-2 focus:ring-yellow-400 ${
            isAtLimit
              ? 'border-bad'
              : isNearLimit
              ? 'border-warn'
              : 'border-line dark:border-brown-700'
          }`}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={handlePaste}
          className="absolute bottom-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-lg bg-sand dark:bg-brown-800 text-brown-700 dark:text-yellow-300 border border-line dark:border-brown-700 hover:bg-yellow-100 transition-colors"
        >
          Paste
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted dark:text-brown-300 px-1">
        <span>{wordCount} words</span>
        <span className={isNearLimit ? 'text-warn font-semibold' : ''}>
          {charCount} / {MAX_CHARS} characters
          {isNearLimit && ' (approaching limit)'}
        </span>
      </div>
    </div>
  );
}

