'use client';

import { useState, useEffect, useRef } from 'react';
import { IconSun, IconMoon, IconDeviceDesktop } from '@tabler/icons-react';
import { cn } from '@/lib/utils/cn';

type Theme = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Claro', icon: <IconSun className="size-4" /> },
  { value: 'dark', label: 'Oscuro', icon: <IconMoon className="size-4" /> },
  { value: 'system', label: 'Sistema', icon: <IconDeviceDesktop className="size-4" /> },
];

const STORAGE_KEY = 'kiyoko-theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

  root.classList.toggle('dark', isDark);
  root.setAttribute('data-theme', isDark ? 'dark' : 'light');
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) ?? 'system') as Theme;
    setTheme(stored);
    applyTheme(stored);

    // Re-apply when system preference changes (only relevant when theme === 'system')
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      const current = (localStorage.getItem(STORAGE_KEY) ?? 'system') as Theme;
      if (current === 'system') applyTheme('system');
    };
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function handleSelect(value: Theme) {
    setTheme(value);
    localStorage.setItem(STORAGE_KEY, value);
    applyTheme(value);
    setOpen(false);
  }

  const currentOption = THEME_OPTIONS.find((o) => o.value === theme)!;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center justify-center size-9 rounded-md',
          'text-muted-foreground hover:text-foreground hover:bg-secondary',
          'transition-colors',
        )}
        aria-label={`Tema: ${currentOption.label}`}
      >
        {currentOption.icon}
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1 z-50 w-40',
            'bg-card border border-foreground/10 rounded-lg shadow-card-hover',
            'py-1',
          )}
        >
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                'flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors',
                theme === option.value
                  ? 'text-primary/90 bg-primary/10 font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
              )}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
