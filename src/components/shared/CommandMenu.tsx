'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import {
  LayoutDashboard,
  PlusCircle,
  Settings,
  Key,
  Users,
  Search,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProjectItem {
  id: string;
  title: string;
  short_id: string;
}

/* ------------------------------------------------------------------ */
/*  Static navigation items                                            */
/* ------------------------------------------------------------------ */

const ACTIONS = [
  { id: 'new-project', label: 'Nuevo Proyecto', icon: PlusCircle, href: '/new' },
  { id: 'settings', label: 'Ajustes', icon: Settings, href: '/settings' },
  { id: 'api-keys', label: 'API Keys', icon: Key, href: '/settings/api-keys' },
  { id: 'users', label: 'Gestionar Usuarios', icon: Users, href: '/admin/users' },
] as const;

const NAVIGATION = [
  { id: 'nav-dashboard', label: 'Proyectos', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'nav-settings', label: 'Configuracion', icon: Settings, href: '/settings' },
  { id: 'nav-api-keys', label: 'API Keys', icon: Key, href: '/settings/api-keys' },
] as const;

/* ------------------------------------------------------------------ */
/*  CommandMenu                                                        */
/* ------------------------------------------------------------------ */

export function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  /* ---- Open with Cmd+K / Ctrl+K ---- */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ---- Fetch projects when opened ---- */
  useEffect(() => {
    if (!open) return;

    async function fetchProjects() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('projects')
        .select('id, title, short_id')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (data) setProjects(data);
    }

    fetchProjects();
  }, [open]);

  /* ---- Navigate and close ---- */
  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop — opaco, no transparente */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
      />

      {/* Dialog */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg px-4">
        <Command
          className={cn(
            'bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden',
          )}
          loop
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-4 border-b border-border/40">
            <Search size={16} className="shrink-0 text-foreground/30" />
            <Command.Input
              placeholder="Buscar proyectos, acciones, navegacion..."
              className={cn(
                'flex-1 h-12 bg-transparent text-sm text-foreground',
                'placeholder:text-foreground/30 outline-none',
              )}
            />
            <kbd className="text-[10px] font-medium text-foreground/30 bg-background px-1.5 py-0.5 rounded border border-border">
              ESC
            </kbd>
          </div>

          {/* Results list */}
          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="flex items-center justify-center py-8 text-sm text-foreground/40">
              Sin resultados
            </Command.Empty>

            {/* Projects group */}
            {projects.length > 0 && (
              <Command.Group
                heading={
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30 px-2">
                    Proyectos
                  </span>
                }
              >
                {projects.map((project) => (
                  <Command.Item
                    key={project.id}
                    value={`project ${project.title}`}
                    onSelect={() => handleSelect(`/project/${project.short_id}`)}
                    className={cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer',
                      'text-foreground/60 hover:text-foreground',
                      'aria-selected:bg-primary/10 aria-selected:text-primary',
                      'transition-colors duration-100',
                    )}
                  >
                    <FileText size={16} className="shrink-0" />
                    <span className="flex-1 truncate">{project.title}</span>
                    <ArrowRight size={12} className="shrink-0 opacity-0 group-aria-selected:opacity-100" />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Actions group */}
            <Command.Group
              heading={
                <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30 px-2">
                  Acciones
                </span>
              }
            >
              {ACTIONS.map((action) => (
                <Command.Item
                  key={action.id}
                  value={`action ${action.label}`}
                  onSelect={() => handleSelect(action.href)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer',
                    'text-foreground/60 hover:text-foreground',
                    'aria-selected:bg-primary/10 aria-selected:text-primary',
                    'transition-colors duration-100',
                  )}
                >
                  <action.icon size={16} className="shrink-0" />
                  <span className="flex-1 truncate">{action.label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            {/* Navigation group */}
            <Command.Group
              heading={
                <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30 px-2">
                  Navegacion
                </span>
              }
            >
              {NAVIGATION.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`nav ${item.label}`}
                  onSelect={() => handleSelect(item.href)}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer',
                    'text-foreground/60 hover:text-foreground',
                    'aria-selected:bg-primary/10 aria-selected:text-primary',
                    'transition-colors duration-100',
                  )}
                >
                  <item.icon size={16} className="shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
