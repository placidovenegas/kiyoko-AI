'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sun,
  Moon,
  User,
  Key,
  LogOut,
  Shield,
  Search,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { FeedbackDialog } from '@/components/shared/FeedbackDialog';
import { NotificationBell } from '@/components/layout/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const THEME_STORAGE_KEY = 'kiyoko-theme';
const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-purple-500/15 text-purple-600', editor: 'bg-emerald-500/15 text-emerald-600', viewer: 'bg-blue-500/15 text-blue-600',
};
const ROLE_LABELS: Record<string, string> = { admin: 'Admin', editor: 'Editor', viewer: 'Viewer' };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  return email?.[0]?.toUpperCase() ?? '?';
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  onToggleChat?: () => void;
  chatOpen?: boolean;
}

export function Header({ onToggleChat, chatOpen }: HeaderProps) {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
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

  /* ---- Handlers ---- */
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
  const displayName = profile?.full_name || profile?.email || '';
  const initials = getInitials(profile?.full_name ?? null, profile?.email ?? '');
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="flex items-center h-full px-3 w-full">
      {/* Spacer left */}
      <div className="flex-1" />

      {/* Search — center of navbar, always visible */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
        className={cn(
          'flex items-center gap-2 h-8 w-64 px-3 rounded-lg',
          'bg-foreground/4 border border-foreground/8',
          'text-sm text-foreground/40 hover:text-foreground/70 hover:bg-foreground/6 hover:border-foreground/15',
          'transition-all duration-150',
        )}
      >
        <Search size={14} className="shrink-0" />
        <span className="flex-1 text-left text-[13px]">Buscar...</span>
        <kbd className="shrink-0 text-[10px] font-medium text-foreground/25 bg-foreground/6 border border-foreground/10 rounded px-1 py-0.5">
          ⌘K
        </kbd>
      </Button>

      {/* Spacer right */}
      <div className="flex-1" />

      {/* Feedback */}
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={() => setFeedbackOpen(true)}
        className="shrink-0 mr-1.5 px-2.5 py-1 rounded-md border border-foreground/8 text-[12px] text-foreground/40 hover:text-foreground/70 hover:bg-foreground/4"
      >
        Feedback
      </Button>

      {/* RIGHT: icons */}
      <div className="flex items-center gap-1 shrink-0">
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
              <Button
                type="button"
                variant="ghost"
                size="xs"
                isIconOnly
                className="size-8 rounded-md border border-foreground/6 hover:bg-foreground/4 ml-0.5"
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={displayName} className="size-5 rounded-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center size-5 rounded-full bg-foreground/10 text-foreground/50 text-[9px] font-semibold">
                    {initials}
                  </div>
                )}
              </Button>
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
