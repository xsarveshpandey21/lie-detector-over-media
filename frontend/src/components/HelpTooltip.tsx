import { useState } from 'react';

export default function HelpTooltip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button aria-label={label} className="ml-2 text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700" onClick={() => setOpen(!open)}>?</button>
      {open && (
        <span className="absolute z-10 mt-1 w-64 text-xs p-2 rounded bg-black text-white">
          {text}
        </span>
      )}
    </span>
  );
}
