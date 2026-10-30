import React from 'react';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  language: 'en' | 'hi';
  onLanguageChange: (lang: 'en' | 'hi') => void;
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-cream/95 dark:bg-brown-900/95 backdrop-blur-sm border-b border-line dark:border-brown-700">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <svg
            className="w-9 h-9 shrink-0"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="13" cy="13" r="8" stroke="#8B5E3C" strokeWidth="2.75" fill="#FFFDF7" />
            <path d="M9 10 A 5 5 0 0 1 15 8" stroke="#F6C453" strokeWidth="2" strokeLinecap="round" />
            <circle cx="14" cy="12" r="1.5" fill="#F6C453" />
            <line x1="19" y1="19" x2="27" y2="27" stroke="#8B5E3C" strokeWidth="3.25" strokeLinecap="round" />
          </svg>
          <div>
            <span className="text-xl font-bold font-heading text-ink dark:text-cream leading-tight block">
              Lie Detector Over Media
            </span>
            <span className="text-xs text-muted dark:text-brown-200 block">
              See what&apos;s real.
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <label htmlFor="lang-select" className="sr-only">Choose language</label>
          <select
            id="lang-select"
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as 'en' | 'hi')}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-line dark:border-brown-700 bg-paper dark:bg-brown-900 text-ink dark:text-cream hover:bg-sand/60 outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
          </select>

          <ThemeToggle />
        </div>
      </div>
      {/* Thin yellow accent line */}
      <div className="h-0.5 bg-yellow-400 w-full" aria-hidden="true" />
    </header>
  );
}

