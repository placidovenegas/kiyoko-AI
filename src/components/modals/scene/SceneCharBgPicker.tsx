'use client';

import { useState } from 'react';
import { X, Plus, Search, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Character, Background } from '@/types';

/* ── Character Chips ─────────────────────────────────────── */

export function CharacterChips({ selected, all, onChange }: {
  selected: string[];
  all: Character[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const chars = all.filter(c => selected.includes(c.id));
  const available = all.filter(c => !selected.includes(c.id) && c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground">Personajes</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {chars.map(c => (
          <span key={c.id} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium text-foreground">
            <span className="flex size-4 items-center justify-center rounded-full text-[8px] font-bold text-white shrink-0"
              style={{ backgroundColor: c.color_accent ?? '#666' }}>
              {c.initials ?? c.name[0]}
            </span>
            <span className="max-w-[80px] truncate">{c.name}</span>
            <button type="button" onClick={() => onChange(selected.filter(id => id !== c.id))}
              className="text-muted-foreground hover:text-foreground ml-0.5"><X className="size-3" /></button>
          </span>
        ))}
        <div className="relative">
          <button type="button" onClick={() => setOpen(!open)}
            className="flex size-7 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
            <Plus className="size-3.5" />
          </button>
          {open && (
            <div className="absolute left-0 top-full mt-1 z-20 w-56 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="size-3 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                  autoFocus className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50" />
              </div>
              <div className="max-h-40 overflow-y-auto p-1">
                {available.length === 0 && <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">Sin personajes disponibles</p>}
                {available.map(c => (
                  <button key={c.id} type="button" onClick={() => { onChange([...selected, c.id]); setSearch(''); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-accent transition-colors">
                    <span className="flex size-5 items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0"
                      style={{ backgroundColor: c.color_accent ?? '#666' }}>
                      {c.initials ?? c.name[0]}
                    </span>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
    </div>
  );
}

/* ── Background Chips ────────────────────────────────────── */

export function BackgroundChips({ selected, all, onChange }: {
  selected: string[];
  all: Background[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const bgs = all.filter(b => selected.includes(b.id));
  const available = all.filter(b => !selected.includes(b.id) && b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground">Fondo</p>
      <div className="flex flex-wrap items-center gap-1.5">
        {bgs.map(b => (
          <span key={b.id} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs font-medium text-foreground">
            <MapPin className="size-3 text-muted-foreground shrink-0" />
            <span className="max-w-[100px] truncate">{b.name}</span>
            <button type="button" onClick={() => onChange(selected.filter(id => id !== b.id))}
              className="text-muted-foreground hover:text-foreground ml-0.5"><X className="size-3" /></button>
          </span>
        ))}
        <div className="relative">
          <button type="button" onClick={() => setOpen(!open)}
            className="flex size-7 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-colors">
            <Plus className="size-3.5" />
          </button>
          {open && (
            <div className="absolute left-0 top-full mt-1 z-20 w-56 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="size-3 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                  autoFocus className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50" />
              </div>
              <div className="max-h-40 overflow-y-auto p-1">
                {available.length === 0 && <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">Sin fondos disponibles</p>}
                {available.map(b => (
                  <button key={b.id} type="button" onClick={() => { onChange([...selected, b.id]); setSearch(''); }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-accent transition-colors">
                    <MapPin className="size-3.5 text-muted-foreground" />
                    <span className="flex-1 text-left">{b.name}</span>
                    {b.location_type && <span className="text-[10px] text-muted-foreground">{b.location_type}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
    </div>
  );
}
