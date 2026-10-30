import React, { useEffect } from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
  tone?: 'good' | 'warn' | 'bad' | 'info';
}

export default function Toast({ message, onClose, tone = 'info' }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const toneClasses = {
    good: 'bg-good-bg text-good border-good/30',
    warn: 'bg-warn-bg text-warn border-warn/30',
    bad: 'bg-bad-bg text-bad border-bad/30',
    info: 'bg-sand text-ink border-line'
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 max-w-sm p-4 rounded-xl shadow-card border flex items-center justify-between gap-3 ${toneClasses[tone]}`}
    >
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className="text-muted hover:text-ink font-bold text-lg p-1"
      >
        ×
      </button>
    </div>
  );
}

