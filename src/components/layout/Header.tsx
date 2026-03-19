'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Sun,
  Moon,
  Bot,
  User,
  Key,
  LogOut,
  Shield,
  ChevronsUpDown,
  Search,
  MessageCircle,
  Star,
  Check,
  Plus,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useFavorites } from '@/hooks/useFavorites';
// Video selector removed — video is now URL-based (/project/{slug}/video/{videoSlug})
import { FeedbackDialog } from '@/components/shared/FeedbackDialog';
import { NotificationBell } from '@/components/layout/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
  status: 'available' | 'rate_limited' | 'budget_exhausted' | 'no_key' | 'inactive' | 'cooldown';
  description?: string;
  signupUrl?: string;
  retryInSeconds?: number | null;
  lastError?: string | null;
}

interface ProjectInfo {
  id: string;
  slug: string;
  title: string;
  status: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PROVIDER_STORAGE_KEY = 'kiyoko-ai-provider';
const THEME_STORAGE_KEY = 'kiyoko-theme';

const PROVIDER_LABELS: Record<string, string> = {
  groq: 'Groq', cerebras: 'Cerebras', mistral: 'Mistral', gemini: 'Gemini', grok: 'Grok', deepseek: 'DeepSeek', claude: 'Claude', openai: 'OpenAI', stability: 'Stability',
};
const MODEL_SHORT: Record<string, string> = {
  'llama-3.3-70b-versatile': 'LLaMA 3.3', 'gemini-2.0-flash': 'Flash 2.0',
  'claude-sonnet-4-20250514': 'Sonnet 4', 'gpt-4o-mini': 'GPT-4o Mini', 'stable-diffusion-3': 'SD3',
};
const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-purple-500/15 text-purple-600', editor: 'bg-emerald-500/15 text-emerald-600', viewer: 'bg-blue-500/15 text-blue-600',
};
const ROLE_LABELS: Record<string, string> = { admin: 'Admin', editor: 'Editor', viewer: 'Viewer' };
/* Status labels used by project switcher */
const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', in_progress: 'En progreso', completed: 'Completado', archived: 'Archivado',
}; void STATUS_LABELS; // referenced dynamically

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  return email?.[0]?.toUpperCase() ?? '?';
}

function statusDotClass(status: ProviderStatus['status']) {
  switch (status) {
    case 'available': return 'bg-emerald-500';
    case 'rate_limited': return 'bg-amber-500';
    case 'cooldown': return 'bg-amber-500 animate-pulse';
    case 'budget_exhausted': return 'bg-red-500';
    default: return 'bg-foreground/20';
  }
}

function formatCooldown(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
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
  const [selectedProvider, setSelectedProvider] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem(PROVIDER_STORAGE_KEY);
    return null;
  });
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Feedback
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Org switcher
  const { organizations, currentOrg, currentOrgId, switchOrg } = useOrganizations();

  // Favorites
  const { isFavorite, toggleFavorite } = useFavorites();

  // Project switcher state
  const [projects, setProjects] = useState<ProjectInfo[]>([]);

  // Detect current project from URL
  const projectMatch = pathname.match(/^\/project\/([^/]+)/);
  const currentProjectSlug = projectMatch ? projectMatch[1] : null;
  const currentProject = projects.find((p) => p.slug === currentProjectSlug);

  /* ---- Fetch profile ---- */
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('full_name, email, avatar_url, role').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) setProfile({ full_name: data.full_name, email: data.email ?? user.email ?? '', avatar_url: data.avatar_url, role: data.role });
        });
    });
  }, []);

  /* ---- Fetch projects for switcher ---- */
  useEffect(() => {
    async function loadProjects() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('projects')
        .select('id, slug, title, status')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (currentOrgId) {
        query = query.eq('organization_id', currentOrgId);
      }

      const { data, error } = await query;
      if (error) console.error('[Header] projects error:', error.message);
      if (data) setProjects(data as ProjectInfo[]);
    }
    loadProjects();
  }, [currentOrgId]);

  // User API keys from DB
  const [userKeyProviders, setUserKeyProviders] = useState<Set<string>>(new Set());

  /* ---- Fetch providers + user keys (poll every 30s) ---- */
  useEffect(() => {
    function fetchProviders() {
      Promise.all([
        fetch('/api/ai/providers/status').then((r) => r.ok ? r.json() : null),
        fetch('/api/user/api-keys').then((r) => r.ok ? r.json() : null),
      ]).then(([statusJson, keysJson]) => {
        if (statusJson?.success && Array.isArray(statusJson.providers)) {
          setProviders(statusJson.providers);
        }
        if (keysJson?.keys && Array.isArray(keysJson.keys)) {
          const activeProviders = new Set<string>(
            keysJson.keys
              .filter((k: { is_active: boolean }) => k.is_active)
              .map((k: { provider: string }) => k.provider),
          );
          setUserKeyProviders(activeProviders);
        }
      }).catch(() => {});
    }
    fetchProviders();
    const interval = setInterval(fetchProviders, 30_000);
    return () => clearInterval(interval);
  }, []);

  /* ---- Handlers ---- */
  function handleSelectProvider(id: string) {
    setSelectedProvider(id);
    localStorage.setItem(PROVIDER_STORAGE_KEY, id);
  }

  function handleToggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    // shadcn dark mode uses class 'dark' on <html>
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.setAttribute('data-theme', next);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  /* ---- Derived ---- */
  const effectiveProvider = selectedProvider ?? (providers.find((p) => (p.status === 'available' || userKeyProviders.has(p.id)) && p.type !== 'image')?.id ?? null);
  const currentProvider = providers.find((p) => p.id === effectiveProvider);
  const displayName = profile?.full_name || profile?.email || '';
  const initials = getInitials(profile?.full_name ?? null, profile?.email ?? '');
  const isAdmin = profile?.role === 'admin';
  const textProviders = providers.filter((p) => p.type !== 'image');

  // Hide org/project switcher on /organizations pages
  const isOrganizationsPage = pathname.startsWith('/organizations');

  // Search filters for dropdowns
  const [orgSearch, setOrgSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const filteredOrgs = organizations.filter((o) => o.name.toLowerCase().includes(orgSearch.toLowerCase()));
  const filteredProjects = projects.filter((p) => p.title.toLowerCase().includes(projectSearch.toLowerCase()));

  return (
    <div className="flex items-center h-full px-3 w-full">
      {/* LEFT: Org / Project Switcher — hidden on /organizations */}
      {!isOrganizationsPage && (
        <div className="flex items-center min-w-0 shrink-0 mr-4">
          {/* Org icon */}
          <Settings2 size={15} className="shrink-0 text-foreground/30 mr-1.5" />

          {/* Org Switcher */}
          <DropdownMenu onOpenChange={() => setOrgSearch('')}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-1.5 py-1 rounded-md text-sm transition-colors text-foreground hover:bg-foreground/5"
              >
                <span className="font-medium truncate max-w-36">{currentOrg?.name ?? 'Organizacion'}</span>
                <ChevronsUpDown size={14} className="shrink-0 text-foreground/30" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-0">
              {/* Search */}
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar organizacion..."
                    value={orgSearch}
                    onChange={(e) => setOrgSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-sm bg-transparent border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="p-1 max-h-64 overflow-y-auto">
                {filteredOrgs.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => switchOrg(org.id)}
                    className="justify-between"
                  >
                    <span className="truncate">{org.name}</span>
                    {org.id === currentOrgId && <Check size={16} className="shrink-0 text-foreground" />}
                  </DropdownMenuItem>
                ))}
                {filteredOrgs.length === 0 && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">Sin resultados</div>
                )}
              </div>
              <DropdownMenuSeparator className="m-0" />
              <div className="p-1">
                <DropdownMenuItem asChild>
                  <Link href="/organizations" className="text-muted-foreground">
                    Todas las organizaciones
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/organizations/new" className="gap-2">
                    <Plus size={14} /> Nueva organizacion
                  </Link>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Separator / */}
          <span className="mx-1.5 text-foreground/15 text-lg select-none">/</span>

          {/* Project icon */}
          <Settings2 size={15} className="shrink-0 text-foreground/30 mr-1.5" />

          {/* Project Switcher */}
          <DropdownMenu onOpenChange={() => setProjectSearch('')}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 px-1.5 py-1 rounded-md text-sm transition-colors text-foreground hover:bg-foreground/5"
              >
                <span className="font-medium truncate max-w-44">{currentProject?.title ?? 'Proyecto'}</span>
                <ChevronsUpDown size={14} className="shrink-0 text-foreground/30" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 p-0">
              {/* Search */}
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar proyecto..."
                    value={projectSearch}
                    onChange={(e) => setProjectSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 text-sm bg-transparent border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <div className="p-1 max-h-64 overflow-y-auto">
                {filteredProjects.map((project) => (
                  <DropdownMenuItem key={project.id} asChild>
                    <Link href={`/project/${project.slug}`} className="justify-between">
                      <span className="truncate">{project.title}</span>
                      {project.slug === currentProjectSlug && <Check size={16} className="shrink-0 text-foreground" />}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {filteredProjects.length === 0 && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">Sin resultados</div>
                )}
              </div>
              <DropdownMenuSeparator className="m-0" />
              <div className="p-1">
                <DropdownMenuItem asChild>
                  <Link href="/new" className="gap-2">
                    <Plus size={14} /> Nuevo proyecto
                  </Link>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Favorite toggle — visible when inside a project */}
          {currentProject && (
            <button
              type="button"
              onClick={() => toggleFavorite(currentProject.id)}
              className={cn(
                'ml-2 flex items-center justify-center size-7 rounded-md transition-colors',
                isFavorite(currentProject.id)
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-foreground/25 hover:text-amber-500 hover:bg-amber-500/10',
              )}
              title={isFavorite(currentProject.id) ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Star size={16} fill={isFavorite(currentProject.id) ? 'currentColor' : 'none'} />
            </button>
          )}

          {/* Video indicator — shown when inside a video route */}
          {pathname.includes('/video/') && (
            <>
              <span className="mx-1.5 text-foreground/15 text-lg select-none">/</span>
              <span className="text-sm font-medium text-foreground/60 truncate max-w-36">
                {pathname.match(/\/video\/([^/]+)/)?.[1]?.replace(/-/g, ' ') ?? 'Video'}
              </span>
            </>
          )}
        </div>
      )}

      {/* On organizations page, show page title instead */}
      {isOrganizationsPage && (
        <span className="text-sm font-medium text-foreground mr-4">Organizaciones</span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Feedback */}
      <button
        type="button"
        onClick={() => setFeedbackOpen(true)}
        className="shrink-0 mr-1.5 px-2.5 py-1 rounded-md border border-foreground/8 text-[12px] text-foreground/40 hover:text-foreground/70 hover:bg-foreground/4 transition-all"
      >
        Feedback
      </button>

      {/* Search */}
      <div className="shrink-0 mr-1.5">
        <button
          type="button"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className={cn(
            'flex items-center gap-1.5 h-6 px-2 rounded-full',
            'bg-surface-tertiary/40 border border-border/15',
            'text-[11px] text-foreground/25 hover:text-foreground/50 hover:border-border/30',
            'transition-all duration-150',
          )}
        >
          <Search size={12} />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] font-medium text-foreground/20">&#8984;K</kbd>
        </button>
      </div>

      {/* RIGHT: icons */}
      <div className="flex items-center gap-1 shrink-0">
        {/* AI Provider */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={currentProvider ? `IA: ${PROVIDER_LABELS[currentProvider.id] ?? currentProvider.name}` : 'Sin proveedor'}
              className={cn(
                'relative flex items-center justify-center size-8 rounded-md',
                'border border-foreground/6',
                'text-foreground/40 hover:text-foreground/70 hover:bg-foreground/4',
                'transition-all duration-150',
              )}
            >
              <Bot size={15} />
              <span className={cn('absolute -top-0.5 -right-0.5 size-2 rounded-full border border-surface', currentProvider ? statusDotClass(currentProvider.status) : 'bg-foreground/20')} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="text-[11px] font-medium text-foreground/40 uppercase tracking-wider">
              Proveedor de IA
            </DropdownMenuLabel>
            {textProviders.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-foreground/40">Cargando...</div>
            )}
            <DropdownMenuGroup>
              {textProviders.map((provider) => {
                const isSelected = provider.id === effectiveProvider;
                const hasUserKey = userKeyProviders.has(provider.id);
                const serverAvailable = provider.status === 'available';
                const isAvailable = serverAvailable || hasUserKey;
                const onCooldown = provider.status === 'cooldown' && !hasUserKey;

                // Dot color: green = user key or server available, amber = free/server, gray = unavailable
                const dotColor = hasUserKey
                  ? 'bg-emerald-500'
                  : serverAvailable
                    ? (provider.isFree ? 'bg-amber-400' : 'bg-emerald-500')
                    : onCooldown
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-foreground/20';

                // Subtitle text
                let subtitle = '';
                if (onCooldown && provider.retryInSeconds) {
                  subtitle = `Cuota agotada · vuelve en ${formatCooldown(provider.retryInSeconds)}`;
                } else if (!isAvailable) {
                  subtitle = 'Sin API key';
                } else if (hasUserKey) {
                  subtitle = `${MODEL_SHORT[provider.defaultModel] ?? provider.defaultModel} · Tu key`;
                } else if (provider.isFree) {
                  subtitle = `${MODEL_SHORT[provider.defaultModel] ?? provider.defaultModel} · Gratis`;
                } else {
                  subtitle = MODEL_SHORT[provider.defaultModel] ?? provider.defaultModel;
                }

                return (
                  <DropdownMenuItem
                    key={provider.id}
                    onClick={() => isAvailable && handleSelectProvider(provider.id)}
                    disabled={!isAvailable}
                    className={cn(
                      'flex items-center gap-2.5 text-sm',
                      isSelected ? 'bg-primary/10 text-primary' : 'text-foreground/60',
                    )}
                  >
                    <span className={cn('size-2 rounded-full shrink-0', dotColor)} />
                    <Bot size={14} className="shrink-0" />
                    <div className="flex flex-col items-start min-w-0 flex-1">
                      <span className={cn('font-medium truncate', isSelected && 'text-primary')}>
                        {PROVIDER_LABELS[provider.id] ?? provider.name}
                      </span>
                      <span className="text-[11px] text-foreground/40 truncate">
                        {subtitle}
                      </span>
                    </div>
                    {/* Check mark for selected */}
                    {isSelected && (
                      <Check size={14} className="shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme */}
        <Tooltip>
          <TooltipTrigger
            render={<button type="button" />}
            onClick={handleToggleTheme}
            className="flex items-center justify-center size-8 rounded-md border border-foreground/6 text-foreground/40 hover:text-foreground/70 hover:bg-foreground/4 transition-all duration-150"
            aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</p>
          </TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <NotificationBell />

        {/* Chat */}
        {onToggleChat && (
          <Tooltip>
            <TooltipTrigger
              render={<button type="button" />}
              onClick={onToggleChat}
              className={cn(
                'flex items-center justify-center size-8 rounded-md border transition-all duration-150',
                chatOpen
                  ? 'border-primary/30 text-primary bg-primary/10'
                  : 'border-foreground/6 text-foreground/40 hover:text-foreground/70 hover:bg-foreground/4',
              )}
            >
              <MessageCircle size={14} />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="text-xs">Chat IA</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* User */}
        {profile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center size-8 rounded-md border border-foreground/6 transition-all duration-150 hover:bg-foreground/4 ml-0.5"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="size-5 rounded-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center size-5 rounded-full bg-foreground/10 text-foreground/50 text-[9px] font-semibold">
                    {initials}
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* User info header */}
              <div className="px-3 py-2.5 border-b border-border/40">
                <div className="flex items-center gap-2.5">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="size-9 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="flex items-center justify-center size-9 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{profile.full_name || 'Usuario'}</p>
                    <p className="text-xs text-foreground/40 truncate">{profile.email}</p>
                  </div>
                  {profile.role && (
                    <span className={cn('shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wider', ROLE_STYLES[profile.role] ?? 'bg-foreground/10 text-foreground/40')}>
                      {ROLE_LABELS[profile.role] ?? profile.role}
                    </span>
                  )}
                </div>
              </div>
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <User size={16} className="text-foreground/40 mr-2" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings/api-keys')}>
                  <Key size={16} className="text-foreground/40 mr-2" />
                  API Keys
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push('/admin/users')}>
                    <Shield size={16} className="text-foreground/40 mr-2" />
                    Panel Admin
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-red-500 focus:text-red-500"
              >
                <LogOut size={16} className="mr-2" />
                Cerrar sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
