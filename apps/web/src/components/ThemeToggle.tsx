import { useEffect, useState } from 'react';
import { getTheme, saveTheme } from '../lib/storage';

function effectiveTheme(): 'light' | 'dark' {
  // Dark-first: dark unless the user explicitly chose light.
  return getTheme() === 'light' ? 'light' : 'dark';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(effectiveTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    setTheme(next);
  };

  return (
    <button
      className="btn btn-ghost theme-toggle"
      onClick={toggle}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      [{theme === 'dark' ? 'light' : 'dark'}]
    </button>
  );
}
