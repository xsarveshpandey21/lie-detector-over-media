import React from 'react';

interface NoticesProps {
  notices: string[];
}

export default function Notices({ notices }: NoticesProps) {
  if (!notices || notices.length === 0) return null;

  return (
    <div className="space-y-2">
      {notices.map((n, idx) => (
        <div
          key={idx}
          className="p-3 rounded-xl bg-sand dark:bg-brown-800 text-xs text-ink dark:text-cream border border-line dark:border-brown-700 flex items-center gap-2"
        >
          <span aria-hidden="true" className="text-base text-yellow-600 dark:text-yellow-400">ℹ</span>
          <span>{n}</span>
        </div>
      ))}
    </div>
  );
}

