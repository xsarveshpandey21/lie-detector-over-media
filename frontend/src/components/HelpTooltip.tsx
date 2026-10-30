import React, { useState, useRef, useEffect, useId } from 'react';

interface HelpTooltipProps {
  label: string;
  text: string;
}

export default function HelpTooltip({ label, text }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        aria-label={`Help about ${label}`}
        className="w-5 h-5 rounded-full inline-flex items-center justify-center text-xs font-bold text-muted hover:text-ink bg-sand/70 dark:bg-brown-800 hover:bg-yellow-100 border border-line dark:border-brown-700 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        ?
      </button>

      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute z-40 top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-3 bg-paper dark:bg-brown-900 text-ink dark:text-cream text-xs leading-relaxed rounded-xl shadow-hover border border-line dark:border-brown-700 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="font-semibold text-brown-700 dark:text-yellow-300 mb-1">{label}</div>
          <p>{text}</p>
        </div>
      )}
    </div>
  );
}
