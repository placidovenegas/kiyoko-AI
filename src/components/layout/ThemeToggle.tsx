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
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      setTheme(stored);
      applyTheme(stored);
    }
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
          'text-foreground-muted hover:text-foreground hover:bg-surface-tertiary',
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
            'bg-surface border border-foreground/10 rounded-lg shadow-card-hover',
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
                  ? 'text-brand-600 bg-brand-500/10 font-medium'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-surface-tertiary',
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
