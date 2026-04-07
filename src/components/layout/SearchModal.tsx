'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { createPortal } from 'react-dom';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils/cn';
import {
  Search, FolderOpen, Film, Clapperboard, Users, Settings,
  LayoutDashboard, Calendar, Key, ArrowRight,
  CheckSquare, Share2, SlidersHorizontal,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ItemType = 'nav' | 'project' | 'video' | 'scene' | 'character';

interface SearchItem {
  type: ItemType;
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  action?: string; // 'settings' | 'settings:api-keys' — open modal instead of navigating
  coverUrl?: string | null;
  updatedAt?: string;
}

type TypeFilter = 'all' | 'projects' | 'videos' | 'scenes';

const RECENT_KEY = 'kiyoko-search-recent';
const MAX_RECENT = 20;

/* ------------------------------------------------------------------ */
/*  Recent items — stored in localStorage                              */
/* ------------------------------------------------------------------ */

function getRecentItems(): SearchItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as SearchItem[]) : [];
  } catch {
    return [];
  }
}

export function trackSearchVisit(item: SearchItem) {
  try {
    const items = getRecentItems().filter((i) => i.href !== item.href);
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify([{ ...item, updatedAt: new Date().toISOString() }, ...items].slice(0, MAX_RECENT)),
    );
  } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getTypeIcon(type: ItemType, size = 16) {
  const cls = `shrink-0 text-muted-foreground`;
  switch (type) {
    case 'project':   return <FolderOpen size={size} className={cls} />;
    case 'video':     return <Film size={size} className={cls} />;
    case 'scene':     return <Clapperboard size={size} className={cls} />;
    case 'character': return <Users size={size} className={cls} />;
    default:          return <ArrowRight size={size} className={cls} />;
  }
}

function groupByDate(items: SearchItem[]): Record<string, SearchItem[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86_400_000);
  const week = new Date(today.getTime() - 6 * 86_400_000);

  const groups: Record<string, SearchItem[]> = {
    Hoy: [],
    Ayer: [],
    'Últimos 7 días': [],
    Anterior: [],
  };

  for (const item of items) {
    const d = item.updatedAt ? new Date(item.updatedAt) : null;
    if (!d) { groups['Anterior'].push(item); continue; }
    if (d >= today) groups['Hoy'].push(item);
    else if (d >= yesterday) groups['Ayer'].push(item);
    else if (d >= week) groups['Últimos 7 días'].push(item);
    else groups['Anterior'].push(item);
  }

  return Object.fromEntries(Object.entries(groups).filter(([, v]) => v.length > 0));
}

/* ------------------------------------------------------------------ */
/*  NAV_ITEMS — quick navigation shortcuts                             */
/* ------------------------------------------------------------------ */

const NAV_ITEMS: SearchItem[] = [
  { type: 'nav', id: 'dashboard', title: 'Inicio', subtitle: 'Dashboard principal', href: '/dashboard' },
  { type: 'nav', id: 'publications', title: 'Publicaciones', subtitle: 'Calendario de publicaciones', href: '/dashboard/publications' },
  { type: 'nav', id: 'shared', title: 'Compartidos', subtitle: 'Proyectos compartidos contigo', href: '/dashboard/shared' },
  { type: 'nav', id: 'tasks', title: 'Tareas', subtitle: 'Tus tareas pendientes', href: '/dashboard/tasks' },
  { type: 'nav', id: 'settings', title: 'Ajustes', subtitle: 'Perfil y preferencias', href: '/settings', action: 'settings:perfil' },
  { type: 'nav', id: 'api-keys', title: 'API Keys', subtitle: 'Gestiona tus claves de API', href: '/settings/api-keys', action: 'settings:api-keys' },
];

const NAV_ICONS: Record<string, React.ReactNode> = {
  dashboard: <LayoutDashboard size={16} className="shrink-0 text-muted-foreground" />,
  publications: <Calendar size={16} className="shrink-0 text-muted-foreground" />,
  shared: <Share2 size={16} className="shrink-0 text-muted-foreground" />,
  tasks: <CheckSquare size={16} className="shrink-0 text-muted-foreground" />,
  settings: <Settings size={16} className="shrink-0 text-muted-foreground" />,
  'api-keys': <Key size={16} className="shrink-0 text-muted-foreground" />,
};

/* ------------------------------------------------------------------ */
/*  TYPE_FILTER labels                                                 */
/* ------------------------------------------------------------------ */

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'Todo' },
  { key: 'projects', label: 'Proyectos' },
  { key: 'videos', label: 'Videos' },
  { key: 'scenes', label: 'Escenas' },
];

/* ------------------------------------------------------------------ */
/*  ResultItem                                                         */
/* ------------------------------------------------------------------ */

function ResultItem({
  item,
  active,
  onSelect,
  onHover,
}: {
  item: SearchItem;
  active: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const icon = item.type === 'nav' ? NAV_ICONS[item.id] : getTypeIcon(item.type);

  return (
    <button
      type="button"
      onMouseEnter={onHover}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
        active ? 'bg-accent' : 'hover:bg-accent/50',
      )}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block truncate text-[13px] text-foreground">{item.title}</span>
        {item.subtitle && (
          <span className="block truncate text-[11px] text-muted-foreground">{item.subtitle}</span>
        )}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  PreviewPanel                                                       */
/* ------------------------------------------------------------------ */

function PreviewPanel({ item }: { item: SearchItem | null }) {
  if (!item) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 gap-3 px-6">
        <Search size={40} strokeWidth={1} />
        <p className="text-[12px] text-center leading-relaxed">
          Selecciona un elemento para ver una vista previa
        </p>
      </div>
    );
  }

  const icon = item.type === 'nav' ? NAV_ICONS[item.id] ?? <ArrowRight size={40} strokeWidth={1} /> : null;

  return (
    <div className="flex flex-col h-full">
      {/* Cover / icon area */}
      <div className="flex items-center justify-center h-40 bg-muted/30 border-b border-border/50">
        {item.coverUrl ? (
          <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="opacity-40">
              {item.type === 'nav'
                ? <span className="block">{icon}</span>
                : <span className="block">{getTypeIcon(item.type, 40)}</span>
              }
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        {item.subtitle && (
          <p className="text-[11px] text-muted-foreground">{item.subtitle}</p>
        )}
        <p className="text-[15px] font-semibold text-foreground leading-snug">{item.title}</p>
        <div className="flex items-center gap-1.5 mt-3">
          <span className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider',
            item.type === 'project' && 'bg-blue-500/15 text-blue-400',
            item.type === 'video' && 'bg-purple-500/15 text-purple-400',
            item.type === 'scene' && 'bg-amber-500/15 text-amber-400',
            item.type === 'character' && 'bg-emerald-500/15 text-emerald-400',
            item.type === 'nav' && 'bg-foreground/10 text-muted-foreground',
          )}>
            {item.type === 'project' ? 'Proyecto'
              : item.type === 'video' ? 'Video'
              : item.type === 'scene' ? 'Escena'
              : item.type === 'character' ? 'Personaje'
              : 'Navegación'}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SearchModal                                                        */
/* ------------------------------------------------------------------ */

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredItem, setHoveredItem] = useState<SearchItem | null>(null);
  const [recentItems, setRecentItems] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();
  const { openSettingsModal } = useUIStore();

  /* ---- Open/close ---- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  /* ---- On open: load recents, focus input ---- */
  useEffect(() => {
    if (open) {
      setRecentItems(getRecentItems());
      setQuery('');
      setActiveIndex(0);
      setHoveredItem(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* ---- Fetch recent projects when query is empty ---- */
  const { data: recentProjects } = useQuery({
    queryKey: ['search-recent-projects'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, short_id, title, client_name, cover_image_url, updated_at')
        .order('updated_at', { ascending: false })
        .limit(15);
      return (data ?? []).map((p): SearchItem => ({
        type: 'project',
        id: p.id,
        title: p.title,
        subtitle: p.client_name ?? undefined,
        href: `/project/${p.short_id}`,
        coverUrl: p.cover_image_url,
        updatedAt: p.updated_at ?? undefined,
      }));
    },
    enabled: open,
    staleTime: 30_000,
  });

  /* ---- Search query ---- */
  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['search', query, typeFilter],
    queryFn: async () => {
      const q = `%${query}%`;
      const items: SearchItem[] = [];

      const shouldFetch = (t: TypeFilter) => typeFilter === 'all' || typeFilter === t;

      const fetches = await Promise.all([
        shouldFetch('projects')
          ? supabase.from('projects').select('id, short_id, title, client_name, cover_image_url, updated_at').ilike('title', q).limit(6)
          : null,
        shouldFetch('videos')
          ? supabase.from('videos').select('id, short_id, title, project_id, updated_at, projects!inner(short_id, title)').ilike('title', q).limit(6)
          : null,
        shouldFetch('scenes')
          ? supabase.from('scenes').select('id, short_id, title, scene_number, video_id, videos!inner(short_id, project_id, projects!inner(short_id, title))').ilike('title', q).limit(6)
          : null,
        typeFilter === 'all'
          ? supabase.from('characters').select('id, name, role, project_id, projects!inner(short_id, title)').ilike('name', q).limit(4)
          : null,
      ]);

      const [projects, videos, scenes, chars] = fetches;

      (projects?.data ?? []).forEach((p: Record<string, unknown>) =>
        items.push({ type: 'project', id: p.id as string, title: p.title as string, subtitle: p.client_name as string | undefined, href: `/project/${p.short_id}`, coverUrl: p.cover_image_url as string | null, updatedAt: p.updated_at as string }),
      );
      (videos?.data ?? []).forEach((v: Record<string, unknown>) => {
        const proj = v.projects as { short_id: string; title: string } | null;
        items.push({ type: 'video', id: v.id as string, title: v.title as string, subtitle: proj?.title, href: `/project/${proj?.short_id}/video/${v.short_id}` });
      });
      (scenes?.data ?? []).forEach((s: Record<string, unknown>) => {
        const vid = s.videos as { short_id: string; project_id: string; projects: { short_id: string; title: string } | null } | null;
        items.push({ type: 'scene', id: s.id as string, title: `#${s.scene_number} ${s.title}`, subtitle: vid?.projects?.title, href: `/project/${vid?.projects?.short_id}/video/${vid?.short_id}/scene/${s.short_id}` });
      });
      (chars?.data ?? []).forEach((c: Record<string, unknown>) => {
        const proj = c.projects as { short_id: string; title: string } | null;
        items.push({ type: 'character', id: c.id as string, title: c.name as string, subtitle: `${c.role} · ${proj?.title}`, href: `/project/${proj?.short_id}/resources/characters` });
      });

      return items;
    },
    enabled: open && query.length >= 2,
    staleTime: 10_000,
  });

  /* ---- Build flat list of items for keyboard nav ---- */
  const flatItems: SearchItem[] = query.length >= 2
    ? (searchResults ?? [])
    : [
        ...NAV_ITEMS,
        ...(recentItems.length > 0 ? recentItems : (recentProjects ?? [])),
      ];

  // Filter nav items by query if partial
  const displayItems = query.length > 0 && query.length < 2
    ? NAV_ITEMS.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()))
    : flatItems;

  /* ---- Keyboard navigation ---- */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, displayItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = displayItems[activeIndex];
      if (item) navigateTo(item, e.ctrlKey || e.metaKey);
    }
  }, [displayItems, activeIndex]);

  /* ---- Navigation ---- */
  function navigateTo(item: SearchItem, newTab = false) {
    if (item.type !== 'nav') trackSearchVisit(item);
    setOpen(false);

    // Items with action open a modal instead of navigating
    if (item.action?.startsWith('settings:')) {
      const section = item.action.split(':')[1] ?? 'perfil';
      setTimeout(() => openSettingsModal(section), 150);
      return;
    }

    if (newTab) {
      window.open(item.href, '_blank');
    } else {
      router.push(item.href);
    }
  }

  /* ---- Sync hover with activeIndex ---- */
  useEffect(() => {
    setHoveredItem(displayItems[activeIndex] ?? null);
  }, [activeIndex, displayItems]);

  /* ---- Scroll active item into view ---- */
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  /* ---- Grouped recents (when no query) ---- */
  const recentSource = recentItems.length > 0 ? recentItems : (recentProjects ?? []);
  const grouped = groupByDate(recentSource);

  /* ---- Render ---- */
  return (
    <>
      {open && createPortal(
        <>
        {/* Overlay */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0" onClick={() => setOpen(false)} />
        {/* Content */}
        <div
          className={cn(
            'fixed left-1/2 top-[8vh] z-50 -translate-x-1/2',
            'w-full max-w-180 overflow-hidden',
            'border border-border/60 bg-background shadow-2xl rounded-xl',
            'animate-in fade-in-0 zoom-in-95',
          )}
          style={{ height: 600 }}
          role="dialog"
          aria-label="Buscar"
        >
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div onKeyDown={handleKeyDown}>
        <div className="flex h-full">
          {/* ── Left panel ───────────────────────────────────────────── */}
          <div className="flex flex-col flex-1 min-w-0 border-r border-border/50">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
              <Search size={16} className="shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
                placeholder="Buscar o hacer una pregunta..."
                className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/50 outline-none"
              />
              {isFetching && (
                <div className="size-4 rounded-full border-2 border-primary/40 border-t-primary animate-spin shrink-0" />
              )}
            </div>

            {/* Type filter chips */}
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border/40">
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setTypeFilter(f.key)}
                  className={cn(
                    'flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium transition-colors',
                    typeFilter === f.key
                      ? 'bg-primary/15 text-primary'
                      : 'bg-foreground/6 text-muted-foreground hover:bg-foreground/10 hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
              <div className="flex-1" />
              <button
                type="button"
                className="flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium bg-foreground/6 text-muted-foreground hover:bg-foreground/10 hover:text-foreground transition-colors"
              >
                <SlidersHorizontal size={10} />
                Filtros
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="flex-1 overflow-y-auto py-1">
              {query.length >= 2 ? (
                /* ── Search results ── */
                displayItems.length === 0 && !isFetching ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground/40">
                    <Search size={32} strokeWidth={1} />
                    <p className="text-[13px]">Sin resultados para &quot;{query}&quot;</p>
                  </div>
                ) : (
                  <>
                    {displayItems.map((item, idx) => (
                      <div key={item.id + item.type} data-index={idx}>
                        <ResultItem
                          item={item}
                          active={activeIndex === idx}
                          onSelect={() => navigateTo(item)}
                          onHover={() => { setHoveredItem(item); setActiveIndex(idx); }}
                        />
                      </div>
                    ))}
                  </>
                )
              ) : (
                /* ── Quick nav + recents ── */
                <>
                  {/* Navigation shortcuts */}
                  <div className="px-4 pt-2 pb-1">
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider mb-1">
                      Navegación rápida
                    </p>
                  </div>
                  {NAV_ITEMS.filter((i) =>
                    query.length === 0 || i.title.toLowerCase().includes(query.toLowerCase())
                  ).map((item, idx) => (
                    <div key={item.id} data-index={idx}>
                      <ResultItem
                        item={item}
                        active={activeIndex === idx}
                        onSelect={() => navigateTo(item)}
                        onHover={() => { setHoveredItem(item); setActiveIndex(idx); }}
                      />
                    </div>
                  ))}

                  {/* Recent items grouped */}
                  {Object.entries(grouped).map(([label, items]) => (
                    <div key={label}>
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                          {label}
                        </p>
                      </div>
                      {items.map((item) => {
                        const globalIdx = displayItems.findIndex((d) => d.id === item.id && d.type === item.type);
                        return (
                          <div key={item.id + item.type} data-index={globalIdx >= 0 ? globalIdx : undefined}>
                            <ResultItem
                              item={item}
                              active={activeIndex === globalIdx && globalIdx >= 0}
                              onSelect={() => navigateTo(item)}
                              onHover={() => { setHoveredItem(item); if (globalIdx >= 0) setActiveIndex(globalIdx); }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {recentSource.length === 0 && !recentProjects && (
                    <div className="flex items-center justify-center h-24 text-muted-foreground/30">
                      <p className="text-[12px]">Empieza a escribir para buscar</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-border/40 bg-muted/20">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                  <kbd className="bg-foreground/8 border border-foreground/12 rounded px-1 text-[10px]">↑↓</kbd>
                  Navegar
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                  <kbd className="bg-foreground/8 border border-foreground/12 rounded px-1 text-[10px]">↵</kbd>
                  Abrir
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50">
                  <kbd className="bg-foreground/8 border border-foreground/12 rounded px-1 text-[10px]">Ctrl+↵</kbd>
                  Nueva pestaña
                </span>
              </div>
              <button type="button" className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-accent transition-colors">
                <Settings size={13} />
              </button>
            </div>
          </div>

          {/* ── Right panel: preview ─────────────────────────────────── */}
          <div className="w-60 shrink-0 hidden sm:flex flex-col bg-muted/10">
            <PreviewPanel item={hoveredItem} />
          </div>
        </div>
        </div>
        </div>
        </>,
        document.body
      )}
    </>
  );
}
