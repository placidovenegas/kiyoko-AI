'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Users,
  MapPin,
  Plus,
  AlertTriangle,
  ChevronRight,
  Upload,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

// ---- Types ----

export interface CharacterItem {
  id?: string;
  name: string;
  role?: string;
  image_url?: string;
  description?: string;
  prompt_snippet?: string;
  ai_prompt_description?: string;
  personality?: string;
  visual_description?: string;
  hair_description?: string;
  signature_clothing?: string;
  accessories?: string[];
  color_accent?: string;
  ai_visual_analysis?: Record<string, unknown>;
  rules?: Record<string, unknown>;
  scene_count?: number;
}

export interface BackgroundItem {
  id?: string;
  name: string;
  location_type?: string;
  time_of_day?: string;
  image_url?: string;
  prompt_snippet?: string;
  description?: string;
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

// ---- Character Detail (expanded) ----

// Full character data from Supabase (not from AI)
interface FullCharacter {
  id: string;
  name: string;
  role: string;
  description: string;
  visual_description: string;
  personality: string;
  hair_description: string;
  signature_clothing: string;
  accessories: string[];
  color_accent: string;
  prompt_snippet: string;
  ai_prompt_description: string;
  ai_visual_analysis: Record<string, unknown>;
  rules: Record<string, unknown>;
  reference_image_url: string | null;
  reference_image_path: string | null;
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-[11px] text-foreground/80">{children}</div>
    </div>
  );
}

function CharacterDetail({ item, onClose }: { item: CharacterItem; onClose: () => void }) {
  const [data, setData] = useState<FullCharacter | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Fetch FULL data from Supabase on mount
  useEffect(() => {
    const supabase = createClient();
    const query = item.id
      ? supabase.from('characters').select('*').eq('id', item.id).single()
      : supabase.from('characters').select('*').ilike('name', item.name ?? '').limit(1).single();

    query.then(({ data: row }) => {
      if (row) setData(row as unknown as FullCharacter);
      setLoading(false);
    });
  }, [item.id, item.name]);

  const charId = data?.id ?? item.id;

  const handleUploadImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !charId) { toast.error('No se puede subir sin ID del personaje'); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'png';
      const path = `characters/${charId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('project-assets').upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('project-assets').getPublicUrl(path);
      const url = urlData?.publicUrl;
      if (url) {
        await supabase.from('characters').update({
          reference_image_url: url,
          reference_image_path: path,
        } as never).eq('id', charId);
        setData((prev) => prev ? { ...prev, reference_image_url: url, reference_image_path: path } : prev);
        toast.success('Imagen subida');
      }
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setUploading(false);
    }
  }, [charId]);

  if (loading) {
    return (
      <div className="border-t border-border bg-muted/20 px-4 py-4 animate-pulse space-y-2">
        <div className="flex gap-3">
          <div className="size-20 rounded-lg bg-muted-foreground/10" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 rounded bg-muted-foreground/10" />
            <div className="h-2 w-48 rounded bg-muted-foreground/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border-t border-border bg-muted/20 px-4 py-3">
        <p className="text-[11px] text-muted-foreground">No se encontraron datos del personaje.</p>
      </div>
    );
  }

  const imgUrl = data.reference_image_url;
  const hasAnyContent = data.description || data.visual_description || data.prompt_snippet;

  return (
    <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2.5">
      {/* Image + basic info */}
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {imgUrl ? (
            <div className="relative">
              <img src={imgUrl} alt={data.name} className="size-20 rounded-lg object-cover border border-border" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="absolute -bottom-1 -right-1 size-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                {uploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex flex-col items-center justify-center size-20 rounded-lg border-2 border-dashed border-border hover:border-teal-500/40 hover:bg-teal-500/5 text-muted-foreground transition-all">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              <span className="text-[8px] mt-1">{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {data.description && <DetailSection label="Descripcion">{data.description}</DetailSection>}
          {data.personality && <DetailSection label="Personalidad">{data.personality}</DetailSection>}
        </div>
      </div>

      {/* Visual grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {data.visual_description && <DetailSection label="Visual">{data.visual_description}</DetailSection>}
        {data.hair_description && <DetailSection label="Pelo">{data.hair_description}</DetailSection>}
        {data.signature_clothing && <DetailSection label="Ropa">{data.signature_clothing}</DetailSection>}
        {data.accessories?.length > 0 && <DetailSection label="Accesorios">{data.accessories.join(', ')}</DetailSection>}
        {data.color_accent && data.color_accent !== '#6B7280' && (
          <DetailSection label="Color">
            <span className="inline-flex items-center gap-1">
              <span className="size-3 rounded-full border border-border" style={{ backgroundColor: data.color_accent }} />
              <span className="font-mono text-[10px]">{data.color_accent}</span>
            </span>
          </DetailSection>
        )}
      </div>

      {/* Prompts */}
      {(data.prompt_snippet || data.ai_prompt_description) && (
        <div className="rounded-md bg-card border border-border p-2 space-y-1">
          {data.prompt_snippet && <DetailSection label="Prompt snippet"><p className="font-mono text-[10px]">{data.prompt_snippet}</p></DetailSection>}
          {data.ai_prompt_description && data.ai_prompt_description !== data.prompt_snippet && (
            <DetailSection label="IA description"><p className="font-mono text-[10px]">{data.ai_prompt_description}</p></DetailSection>
          )}
        </div>
      )}

      {/* AI analysis */}
      {data.ai_visual_analysis && Object.keys(data.ai_visual_analysis).length > 0 && (
        <DetailSection label="Analisis visual IA">
          <pre className="text-[9px] font-mono bg-card rounded p-1.5 border border-border overflow-x-auto max-h-24">
            {JSON.stringify(data.ai_visual_analysis, null, 2)}
          </pre>
        </DetailSection>
      )}

      {/* Rules */}
      {data.rules && Object.keys(data.rules).length > 0 && (
        <DetailSection label="Reglas de consistencia">
          <pre className="text-[9px] font-mono bg-card rounded p-1.5 border border-border overflow-x-auto max-h-24">
            {JSON.stringify(data.rules, null, 2)}
          </pre>
        </DetailSection>
      )}

      {!hasAnyContent && (
        <p className="text-[11px] text-amber-500 flex items-center gap-1">
          <AlertTriangle size={10} /> Sin datos. Sube una imagen para que Kiyoko la analice.
        </p>
      )}

      <button type="button" onClick={onClose} className="text-[10px] text-muted-foreground hover:text-foreground">
        Cerrar
      </button>
    </div>
  );
}

// ---- Characters ----

function CharacterList({ items, onAction }: { items: CharacterItem[]; onAction?: (a: string) => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="mt-2 rounded-lg border border-border bg-card overflow-hidden text-xs">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Users size={14} className="text-purple-500" />
          <span className="font-semibold text-foreground">Personajes</span>
          <span className="text-muted-foreground">({items.length})</span>
        </div>
        {onAction && (
          <button type="button" onClick={() => onAction('Crear personaje')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors">
            <Plus size={10} /> Nuevo
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <Users size={20} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">Sin personajes en el proyecto</p>
          {onAction && (
            <button type="button" onClick={() => onAction('Crear personaje')}
              className="mt-2 text-teal-600 dark:text-teal-400 font-medium hover:underline">
              Crear el primero
            </button>
          )}
        </div>
      ) : (
        <div>
          {items.map((c, i) => (
            <div key={i}>
              <div
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors cursor-pointer border-b border-border last:border-b-0"
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              >
                {c.image_url ? (
                  <img src={c.image_url} alt={c.name ?? ''} className="size-9 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="size-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 text-xs font-bold">
                    {(c.name ?? '??').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{c.name ?? 'Sin nombre'}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{c.role || 'sin rol'}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {c.prompt_snippet ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-medium">
                      prompt OK
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[9px] text-amber-500">
                      <AlertTriangle size={9} /> sin snippet
                    </span>
                  )}
                  <ChevronRight size={12} className={cn('text-muted-foreground transition-transform', expandedIdx === i && 'rotate-90')} />
                </div>
              </div>
              {expandedIdx === i && (
                <CharacterDetail item={c} onClose={() => setExpandedIdx(null)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Background Detail (expanded) ----

function BackgroundDetail({ item, onClose }: { item: BackgroundItem; onClose: () => void }) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const query = item.id
      ? supabase.from('backgrounds').select('*').eq('id', item.id).single()
      : supabase.from('backgrounds').select('*').ilike('name', item.name ?? '').limit(1).single();
    query.then(({ data: row }) => {
      if (row) setData(row as Record<string, unknown>);
      setLoading(false);
    });
  }, [item.id, item.name]);

  const bgId = (data?.id ?? item.id) as string | undefined;
  const imgUrl = (data?.reference_image_url ?? item.image_url) as string | null;

  const handleUploadImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bgId) { toast.error('No se puede subir sin ID'); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || 'png';
      const path = `backgrounds/${bgId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('project-assets').upload(path, file, { contentType: file.type });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('project-assets').getPublicUrl(path);
      const url = urlData?.publicUrl;
      if (url) {
        await supabase.from('backgrounds').update({ reference_image_url: url, reference_image_path: path } as never).eq('id', bgId);
        setData((prev) => prev ? { ...prev, reference_image_url: url } : prev);
        toast.success('Imagen subida');
      }
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setUploading(false);
    }
  }, [bgId]);

  if (loading) {
    return (
      <div className="border-t border-border bg-muted/20 px-4 py-4 animate-pulse">
        <div className="flex gap-3"><div className="w-24 h-16 rounded-lg bg-muted-foreground/10" /><div className="flex-1 space-y-2"><div className="h-3 w-32 rounded bg-muted-foreground/10" /></div></div>
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {imgUrl ? (
            <div className="relative">
              <img src={imgUrl} alt={(data?.name as string) ?? ''} className="w-28 h-20 rounded-lg object-cover border border-border" />
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="absolute -bottom-1 -right-1 size-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                {uploading ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex flex-col items-center justify-center w-28 h-20 rounded-lg border-2 border-dashed border-border hover:border-teal-500/40 hover:bg-teal-500/5 text-muted-foreground transition-all">
              {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              <span className="text-[8px] mt-0.5">{uploading ? 'Subiendo...' : 'Subir imagen'}</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadImage} className="hidden" />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          {data?.description ? <DetailSection label="Descripcion">{String(data.description)}</DetailSection> : null}
          {data?.prompt_snippet ? (
            <DetailSection label="Prompt snippet">
              <p className="font-mono text-[10px]">{String(data.prompt_snippet)}</p>
            </DetailSection>
          ) : null}
          {data?.ai_prompt_description && data.ai_prompt_description !== data.prompt_snippet ? (
            <DetailSection label="IA description">
              <p className="font-mono text-[10px]">{String(data.ai_prompt_description)}</p>
            </DetailSection>
          ) : null}
          {!data?.description && !data?.prompt_snippet && (
            <p className="text-[11px] text-amber-500 flex items-center gap-1">
              <AlertTriangle size={10} /> Sin datos. Sube una imagen.
            </p>
          )}
        </div>
      </div>
      <button type="button" onClick={onClose} className="text-[10px] text-muted-foreground hover:text-foreground">Cerrar</button>
    </div>
  );
}

// ---- Backgrounds ----

function BackgroundList({ items, onAction }: { items: BackgroundItem[]; onAction?: (a: string) => void }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="mt-2 rounded-lg border border-border bg-card overflow-hidden text-xs">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-emerald-500" />
          <span className="font-semibold text-foreground">Fondos / Locaciones</span>
          <span className="text-muted-foreground">({items.length})</span>
        </div>
        {onAction && (
          <button type="button" onClick={() => onAction('Crear fondo')}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 transition-colors">
            <Plus size={10} /> Nuevo
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <MapPin size={20} className="mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-muted-foreground">Sin fondos en el proyecto</p>
          {onAction && (
            <button type="button" onClick={() => onAction('Crear fondo')}
              className="mt-2 text-teal-600 dark:text-teal-400 font-medium hover:underline">
              Crear el primero
            </button>
          )}
        </div>
      ) : (
        <div>
          {items.map((b, i) => (
            <div key={i}>
              <div
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors cursor-pointer border-b border-border last:border-b-0"
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
              >
                {b.image_url ? (
                  <img src={b.image_url} alt={b.name ?? ''} className="w-14 h-9 rounded-md object-cover border border-border" />
                ) : (
                  <div className="w-14 h-9 rounded-md bg-emerald-500/5 border border-border flex items-center justify-center">
                    <MapPin size={12} className="text-emerald-500/40" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{b.name ?? 'Sin nombre'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {[b.location_type, b.time_of_day].filter(Boolean).join(' · ') || 'sin datos'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {b.prompt_snippet ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px]">
                      prompt OK
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[9px] text-amber-500">
                      <AlertTriangle size={8} /> sin snippet
                    </span>
                  )}
                  <ChevronRight size={12} className={cn('text-muted-foreground transition-transform', expandedIdx === i && 'rotate-90')} />
                </div>
              </div>
              {expandedIdx === i && (
                <BackgroundDetail item={b} onClose={() => setExpandedIdx(null)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
