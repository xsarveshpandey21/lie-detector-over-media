import { useEffect, useState } from 'react';

// Migrate legacy theme keys to 'liedetector:theme' once
if (typeof window !== 'undefined') {
  const legacy = localStorage.getItem('satyalens:theme') || localStorage.getItem('theme');
  if (legacy && !localStorage.getItem('liedetector:theme')) {
    localStorage.setItem('liedetector:theme', legacy);
  }
}

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('liedetector:theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('liedetector:theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('liedetector:theme', 'light');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label={dark ? 'Switch to warm light theme' : 'Switch to warm dark theme'}
      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-line bg-paper text-ink hover:bg-sand transition-colors"
    >
      {dark ? '☀ Light' : '🌙 Dark'}
    </button>
  );
}
