'use client';

import {
  Users,
  MapPin,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ---- Types ----

export interface CharacterItem {
  name: string;
  role?: string;
  image_url?: string;
  prompt_snippet?: string;
  personality?: string;
}

export interface BackgroundItem {
  name: string;
  location_type?: string;
  time_of_day?: string;
  image_url?: string;
  prompt_snippet?: string;
}

export interface ResourceListData {
  type: 'characters' | 'backgrounds';
  characters?: CharacterItem[];
  backgrounds?: BackgroundItem[];
}

interface ResourceListCardProps {
  data: ResourceListData;
  onAction?: (action: string) => void;
}

export function ResourceListCard({ data, onAction }: ResourceListCardProps) {
  if (data.type === 'characters') {
    return <CharacterList items={data.characters ?? []} onAction={onAction} />;
  }
  return <BackgroundList items={data.backgrounds ?? []} onAction={onAction} />;
}

// ---- Characters ----

function CharacterList({ items, onAction }: { items: CharacterItem[]; onAction?: (a: string) => void }) {
  return (
    <div className="mt-2 rounded-lg border border-border bg-card overflow-hidden text-xs">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-purple-500" />
          <span className="font-semibold text-foreground">Personajes</span>
          <span className="text-muted-foreground">({items.length})</span>
        </div>
        {onAction && (
          <button
            type="button"
            onClick={() => onAction('Crear personaje')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors"
          >
            <Plus size={10} /> Nuevo
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <Users size={20} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">Sin personajes en el proyecto</p>
          {onAction && (
            <button
              type="button"
              onClick={() => onAction('Crear personaje')}
              className="mt-2 text-teal-600 dark:text-teal-400 font-medium hover:underline"
            >
              Crear el primero
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors">
              {c.image_url ? (
                <img src={c.image_url} alt={c.name} className="size-10 rounded-lg object-cover border border-border" />
              ) : (
                <div className="size-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 text-sm font-bold">
                  {c.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{c.role || 'sin rol'}</p>
                {c.personality && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{c.personality}</p>
                )}
              </div>
              {c.prompt_snippet ? (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-medium shrink-0">
                  prompt OK
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-[9px] text-amber-500 shrink-0">
                  <AlertTriangle size={9} /> sin snippet
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Backgrounds ----

function BackgroundList({ items, onAction }: { items: BackgroundItem[]; onAction?: (a: string) => void }) {
  return (
    <div className="mt-2 rounded-lg border border-border bg-card overflow-hidden text-xs">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-emerald-500" />
          <span className="font-semibold text-foreground">Fondos / Locaciones</span>
          <span className="text-muted-foreground">({items.length})</span>
        </div>
        {onAction && (
          <button
            type="button"
            onClick={() => onAction('Crear fondo')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors"
          >
            <Plus size={10} /> Nuevo
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <MapPin size={20} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">Sin fondos en el proyecto</p>
          {onAction && (
            <button
              type="button"
              onClick={() => onAction('Crear fondo')}
              className="mt-2 text-teal-600 dark:text-teal-400 font-medium hover:underline"
            >
              Crear el primero
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-border">
          {items.map((b, i) => (
            <div key={i} className="bg-card p-2.5 hover:bg-accent/30 transition-colors">
              {b.image_url ? (
                <img src={b.image_url} alt={b.name} className="w-full h-16 rounded-md object-cover border border-border mb-1.5" />
              ) : (
                <div className="w-full h-16 rounded-md bg-emerald-500/5 border border-border flex items-center justify-center mb-1.5">
                  <MapPin size={16} className="text-emerald-500/40" />
                </div>
              )}
              <p className="font-semibold text-foreground truncate">{b.name}</p>
              <p className="text-[10px] text-muted-foreground">
                {[b.location_type, b.time_of_day].filter(Boolean).join(' · ') || 'sin datos'}
              </p>
              {b.prompt_snippet ? (
                <span className="inline-block mt-0.5 px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px]">
                  prompt OK
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 mt-0.5 text-[9px] text-amber-500">
                  <AlertTriangle size={8} /> sin snippet
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
