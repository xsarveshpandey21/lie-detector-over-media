import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || (
      !localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button onClick={() => setDark(!dark)} className="px-3 py-1 rounded border">
      {dark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}
