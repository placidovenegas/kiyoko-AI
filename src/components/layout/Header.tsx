'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  Bot,
  User,
  Key,
  LogOut,
  Shield,
  ChevronDown,
  Search,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserProfile {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string | null;
}

interface ProviderStatus {
  id: string;
  name: string;
  type: 'text' | 'image' | 'both';
  isFree: boolean;
  defaultModel: string;
  imageModel: string | null;
  status: 'available' | 'rate_limited' | 'budget_exhausted' | 'no_key' | 'inactive';
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Proyectos',
  '/new': 'Nuevo Proyecto',
  '/chat': 'Chat',
  '/agents': 'Agentes',
  '/workflows': 'Workflows',
  '/knowledge': 'Base de conocimiento',
  '/settings': 'Configuracion',
  '/settings/api-keys': 'API Keys',
  '/admin/users': 'Usuarios',
};

const PROVIDER_STORAGE_KEY = 'kiyoko-ai-provider';
const THEME_STORAGE_KEY = 'kiyoko-theme';

const PROVIDER_LABELS: Record<string, string> = {
  groq: 'Groq',
  gemini: 'Gemini',
  claude: 'Claude',
  openai: 'OpenAI',
  stability: 'Stability',
};

const MODEL_SHORT: Record<string, string> = {
  'llama-3.3-70b-versatile': 'LLaMA 3.3',
  'gemini-2.0-flash': 'Flash 2.0',
  'claude-sonnet-4-20250514': 'Sonnet 4',
  'gpt-4o-mini': 'GPT-4o Mini',
  'stable-diffusion-3': 'SD3',
};

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  editor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  viewer: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function buildBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  const crumbs: { label: string; href?: string }[] = [
    { label: 'Home', href: '/dashboard' },
  ];

  if (pathname === '/dashboard') {
    crumbs.push({ label: 'Proyectos' });
    return crumbs;
  }
  if (pathname === '/new') {
    crumbs.push({ label: 'Nuevo Proyecto' });
    return crumbs;
  }
  if (pathname.startsWith('/settings/api-keys')) {
    crumbs.push({ label: 'Ajustes', href: '/settings' });
    crumbs.push({ label: 'API Keys' });
    return crumbs;
  }
  if (pathname.startsWith('/settings')) {
    crumbs.push({ label: 'Ajustes' });
    return crumbs;
  }
  if (pathname.startsWith('/admin')) {
    crumbs.push({ label: 'Admin', href: '/admin/users' });
    crumbs.push({ label: 'Usuarios' });
    return crumbs;
  }

  // Project routes: /p/[slug]/[tab]
  const match = pathname.match(/^\/p\/([^/]+)(?:\/(.+))?$/);
  if (match) {
    const slug = match[1];
    const tab = match[2] || 'overview';
    crumbs.push({ label: 'Proyectos', href: '/dashboard' });
    crumbs.push({ label: decodeURIComponent(slug), href: `/p/${slug}` });
    const TAB_LABELS: Record<string, string> = {
      overview: 'Overview', storyboard: 'Storyboard', analysis: 'Diagnóstico',
      arc: 'Arco', scenes: 'Escenas', characters: 'Personajes',
      backgrounds: 'Fondos', timeline: 'Timeline', references: 'Referencias',
      chat: 'Chat IA', exports: 'Exportar', settings: 'Ajustes',
    };
    if (tab !== 'overview') {
      crumbs.push({ label: TAB_LABELS[tab] || tab });
    }
    return crumbs;
  }

  return crumbs;
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.[0]?.toUpperCase() ?? '?';
}

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function statusDotClass(status: ProviderStatus['status']) {
  switch (status) {
    case 'available':
      return 'bg-emerald-500';
    case 'rate_limited':
      return 'bg-amber-500';
    case 'budget_exhausted':
      return 'bg-red-500';
    case 'inactive':
    case 'no_key':
    default:
      return 'bg-foreground/20';
  }
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  onToggleChat?: () => void;
  chatOpen?: boolean;
}

export function Header({ onToggleChat, chatOpen }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const providerRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useClickOutside(providerRef, useCallback(() => setProviderDropdownOpen(false), []));
  useClickOutside(userRef, useCallback(() => setUserDropdownOpen(false), []));

  /* ---- Fetch profile ---- */
  useEffect(() => {
    const supabase = createClient();
    async function fetchProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, avatar_url, role')
        .eq('id', user.id)
        .single();

      setProfile({
        full_name: data?.full_name ?? null,
        email: data?.email ?? user.email ?? '',
        avatar_url: data?.avatar_url ?? null,
        role: data?.role ?? null,
      });
    }
    fetchProfile();
  }, []);

  /* ---- Fetch providers ---- */
  useEffect(() => {
    async function fetchProviders() {
      try {
        const res = await fetch('/api/ai/providers/status');
        if (!res.ok) return;
        const json = await res.json();
        if (json.success && Array.isArray(json.providers)) {
          setProviders(json.providers);
        }
      } catch {
        // silently fail
      }
    }
    fetchProviders();
  }, []);

  /* ---- Provider from localStorage ---- */
  useEffect(() => {
    const stored = localStorage.getItem(PROVIDER_STORAGE_KEY);
    if (stored) setSelectedProvider(stored);
  }, []);

  useEffect(() => {
    if (selectedProvider || providers.length === 0) return;
    const available = providers.find((p) => p.status === 'available' && p.type !== 'image');
    if (available) {
      setSelectedProvider(available.id);
      localStorage.setItem(PROVIDER_STORAGE_KEY, available.id);
    }
  }, [providers, selectedProvider]);

  /* ---- Theme ---- */
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
    } else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  }, []);

  /* ---- Handlers ---- */
  function handleSelectProvider(id: string) {
    setSelectedProvider(id);
    localStorage.setItem(PROVIDER_STORAGE_KEY, id);
    setProviderDropdownOpen(false);
  }

  function handleToggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    document.documentElement.setAttribute('data-theme', next);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  /* ---- Derived ---- */
  const breadcrumbs = buildBreadcrumbs(pathname);
  const currentProvider = providers.find((p) => p.id === selectedProvider);
  const displayName = profile?.full_name || profile?.email || '';
  const initials = getInitials(profile?.full_name ?? null, profile?.email ?? '');
  const isAdmin = profile?.role === 'admin';
  const textProviders = providers.filter((p) => p.type !== 'image');

  return (
    <div className="flex items-center h-full px-3 w-full">
      {/* LEFT: Breadcrumbs */}
      <nav className="flex items-center gap-1 min-w-0 shrink-0 mr-4">
        {breadcrumbs.map((crumb, i) => (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-foreground/20 text-xs">/</span>}
            {crumb.href && i < breadcrumbs.length - 1 ? (
              <a
                href={crumb.href}
                className="text-xs text-foreground/40 hover:text-foreground/70 transition-colors truncate max-w-32"
              >
                {crumb.label}
              </a>
            ) : (
              <span className={cn(
                'text-xs truncate max-w-40',
                i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-foreground/40'
              )}>
                {crumb.label}
              </span>
            )}
          </div>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search — compact, next to right icons */}
      <div className="shrink-0 mr-1.5">
        <button
          type="button"
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', metaKey: true })
            );
          }}
          className={cn(
            'flex items-center gap-1.5 h-6 px-2 rounded-full',
            'bg-surface-tertiary/40 border border-border/15',
            'text-[11px] text-foreground/25 hover:text-foreground/50 hover:border-border/30',
            'transition-all duration-150',
          )}
        >
          <Search size={12} />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] font-medium text-foreground/20">⌘K</kbd>
        </button>
      </div>

      {/* RIGHT: icons row with subtle borders */}
      <div className="flex items-center gap-1 shrink-0">
        {/* AI Provider */}
        <div ref={providerRef} className="relative">
          <button
            type="button"
            onClick={() => setProviderDropdownOpen((v) => !v)}
            title={currentProvider ? `IA: ${PROVIDER_LABELS[currentProvider.id] ?? currentProvider.name}` : 'Sin proveedor'}
            className={cn(
              'relative flex items-center justify-center size-8 rounded-md',
              'border border-foreground/[0.06]',
              'text-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.04]',
              'transition-all duration-150',
              providerDropdownOpen && 'bg-foreground/[0.06] text-foreground/70',
            )}
          >
            <Bot size={15} />
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 size-2 rounded-full border border-surface',
                currentProvider ? statusDotClass(currentProvider.status) : 'bg-foreground/20',
              )}
            />
          </button>

          {/* Provider dropdown */}
          {providerDropdownOpen && (
            <div
              className={cn(
                'absolute right-0 top-full mt-2 z-50 w-60',
                'bg-surface-secondary border border-border/20 rounded-lg shadow-xl',
                'py-1',
              )}
            >
              <div className="px-3 py-1.5 mb-1">
                <p className="text-[11px] font-medium text-foreground/40 uppercase tracking-wider">
                  Proveedor de IA
                </p>
              </div>

              {textProviders.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-foreground/40">
                  Cargando proveedores...
                </div>
              )}

              {textProviders.map((provider) => {
                const isSelected = provider.id === selectedProvider;
                const isAvailable = provider.status === 'available';

                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => isAvailable && handleSelectProvider(provider.id)}
                    disabled={!isAvailable}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors duration-100',
                      'disabled:opacity-40 disabled:cursor-not-allowed',
                      isSelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground/60 hover:text-foreground hover:bg-card',
                    )}
                  >
                    <span
                      className={cn('size-2 rounded-full shrink-0', statusDotClass(provider.status))}
                    />
                    <Bot size={14} className="shrink-0" />
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className={cn('font-medium truncate', isSelected && 'text-primary')}>
                        {PROVIDER_LABELS[provider.id] ?? provider.name}
                      </span>
                      <span className="text-[11px] text-foreground/40 truncate">
                        {MODEL_SHORT[provider.defaultModel] ?? provider.defaultModel}
                        {provider.isFree && ' - Gratis'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="flex items-center justify-center size-8 rounded-md border border-foreground/[0.06] text-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.04] transition-all duration-150"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        {/* Chat toggle */}
        {onToggleChat && (
          <button
            type="button"
            onClick={onToggleChat}
            className={cn(
              'flex items-center justify-center size-8 rounded-md border transition-all duration-150',
              chatOpen
                ? 'border-primary/30 text-primary bg-primary/10'
                : 'border-foreground/[0.06] text-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.04]',
            )}
            title="Chat IA"
          >
            <MessageCircle size={14} />
          </button>
        )}

        {/* User avatar */}
        {profile && (
          <div ref={userRef} className="relative ml-0.5">
            <button
              type="button"
              onClick={() => setUserDropdownOpen((v) => !v)}
              className="flex items-center justify-center size-8 rounded-md border border-foreground/[0.06] transition-all duration-150 hover:bg-foreground/[0.04]"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="size-5 rounded-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center size-5 rounded-full bg-foreground/10 text-foreground/50 text-[9px] font-semibold">
                  {initials}
                </div>
              )}
            </button>

            {/* User dropdown */}
            {userDropdownOpen && (
              <div
                className={cn(
                  'absolute right-0 top-full mt-2 z-50 w-56',
                  'bg-surface-secondary border border-border/20 rounded-lg shadow-xl',
                  'py-1',
                )}
              >
                {/* User info */}
                <div className="px-3 py-2.5 border-b border-border/40">
                  <div className="flex items-center gap-2.5">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="size-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="flex items-center justify-center size-9 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {profile.full_name || 'Usuario'}
                      </p>
                      <p className="text-xs text-foreground/40 truncate">
                        {profile.email}
                      </p>
                    </div>
                    {profile.role && (
                      <span
                        className={cn(
                          'shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider',
                          ROLE_STYLES[profile.role] ?? 'bg-foreground/10 text-foreground/40',
                        )}
                      >
                        {ROLE_LABELS[profile.role] ?? profile.role}
                      </span>
                    )}
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => { router.push('/settings'); setUserDropdownOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground/60 hover:text-foreground hover:bg-background transition-colors"
                  >
                    <User size={16} className="text-foreground/40" />
                    Perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => { router.push('/settings/api-keys'); setUserDropdownOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground/60 hover:text-foreground hover:bg-background transition-colors"
                  >
                    <Key size={16} className="text-foreground/40" />
                    API Keys
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => { router.push('/admin/users'); setUserDropdownOpen(false); }}
                      className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-foreground/60 hover:text-foreground hover:bg-background transition-colors"
                    >
                      <Shield size={16} className="text-foreground/40" />
                      Panel Admin
                    </button>
                  )}
                </div>

                <div className="my-1 h-px bg-border" />

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => { handleSignOut(); setUserDropdownOpen(false); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Cerrar sesion
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
