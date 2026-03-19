'use client';

import { useState, useEffect, useCallback } from 'react';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Users, MapPin, Link2, Plus, Sparkles, Save, Pencil, Trash2, X, Download, Upload } from 'lucide-react';
import { CopyButton } from '@/components/ui/CopyButton';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import type { Character } from '@/types/character';
import type { Background } from '@/types/background';

type EditingResource =
  | { type: 'character'; data: Character }
  | { type: 'background'; data: Background }
  | null;

export default function ResourcesPage() {
  const { project, loading: projectLoading } = useProject();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingResource>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    const supabase = createClient();
    const [charsRes, bgsRes] = await Promise.all([
      supabase.from('characters').select('*').eq('project_id', project.id).order('sort_order'),
      supabase.from('backgrounds').select('*').eq('project_id', project.id).order('sort_order'),
    ]);
    setCharacters((charsRes.data as Character[]) ?? []);
    setBackgrounds((bgsRes.data as Background[]) ?? []);
    setLoading(false);
  }, [project?.id]);

  useEffect(() => {
    if (!projectLoading && project?.id) fetchData();
  }, [fetchData, projectLoading, project?.id]);

  const openCharacterEdit = (char: Character) => {
    setEditing({ type: 'character', data: char });
    setEditForm({
      name: char.name || '',
      role: char.role || '',
      description: char.description || '',
      visual_description: char.visual_description || '',
      prompt_snippet: char.prompt_snippet || '',
      color_accent: char.color_accent || '#6B7280',
    });
  };

  const openBackgroundEdit = (bg: Background) => {
    setEditing({ type: 'background', data: bg });
    setEditForm({
      name: bg.name || '',
      code: bg.code || '',
      description: bg.description || '',
      prompt_snippet: bg.prompt_snippet || '',
      location_type: bg.location_type || 'interior',
      time_of_day: bg.time_of_day || 'day',
    });
  };

  const handleSave = useCallback(async () => {
    if (!editing) return;
    setSaving(true);
    const supabase = createClient();
    try {
      if (editing.type === 'character') {
        const { error } = await supabase.from('characters').update(editForm).eq('id', editing.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('backgrounds').update(editForm).eq('id', editing.data.id);
        if (error) throw error;
      }
      toast.success('Recurso guardado');
      setEditing(null);
      await fetchData();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  }, [editing, editForm, fetchData]);

  const handleDelete = useCallback(async () => {
    if (!editing || !confirm('Eliminar este recurso?')) return;
    const supabase = createClient();
    try {
      const table = editing.type === 'character' ? 'characters' : 'backgrounds';
      const { error } = await supabase.from(table).delete().eq('id', editing.data.id);
      if (error) throw error;
      toast.success('Recurso eliminado');
      setEditing(null);
      await fetchData();
    } catch {
      toast.error('Error al eliminar');
    }
  }, [editing, fetchData]);

  if (loading || projectLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-secondary" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-surface-secondary" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-surface-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Recursos</h2>
          <p className="text-sm text-foreground-muted">Personajes, fondos y referencias del proyecto</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toast.info('Proximamente: generar recursos con IA')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-tertiary px-3 py-2 text-sm font-medium text-foreground-secondary transition hover:bg-surface-secondary"
          >
            <Sparkles className="h-4 w-4" /> Generar con IA
          </button>
          <button
            onClick={() => toast.info('Proximamente: crear recurso')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        </div>
      </div>

      <Tabs defaultValue="characters" className="w-full">
        <TabsList>
          <TabsTrigger value="characters" className="gap-1.5">
            <Users className="h-4 w-4" /> Personajes ({characters.length})
          </TabsTrigger>
          <TabsTrigger value="backgrounds" className="gap-1.5">
            <MapPin className="h-4 w-4" /> Fondos ({backgrounds.length})
          </TabsTrigger>
          <TabsTrigger value="references" className="gap-1.5">
            <Link2 className="h-4 w-4" /> Referencias
          </TabsTrigger>
        </TabsList>

        {/* Characters */}
        <TabsContent value="characters" className="mt-4">
          {characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-tertiary py-16">
              <Users className="mb-3 h-10 w-10 text-foreground-muted/30" />
              <h3 className="mb-1 text-lg font-semibold text-foreground">No hay personajes</h3>
              <p className="mb-4 text-sm text-foreground-muted">Crea personajes manualmente o genera con IA</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {characters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => openCharacterEdit(char)}
                  className="group rounded-xl border border-surface-tertiary bg-surface-secondary p-4 text-left transition hover:border-brand-500/30"
                >
                  <div className="mb-3 flex items-center gap-3">
                    {char.reference_image_url ? (
                      <img src={char.reference_image_url} alt={char.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: char.color_accent || '#6B7280' }}>
                        {char.initials || char.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-foreground">{char.name}</h3>
                      {char.role && <p className="truncate text-xs text-foreground-muted">{char.role}</p>}
                    </div>
                    <Pencil className="h-3.5 w-3.5 text-foreground-muted opacity-0 transition group-hover:opacity-100" />
                  </div>
                  {char.description && <p className="mb-2 line-clamp-2 text-xs text-foreground-secondary">{char.description}</p>}
                  {char.prompt_snippet && (
                    <div className="rounded-md bg-surface-tertiary/50 px-2 py-1">
                      <p className="line-clamp-2 text-[10px] font-mono text-foreground-muted">{char.prompt_snippet}</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Backgrounds */}
        <TabsContent value="backgrounds" className="mt-4">
          {backgrounds.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-tertiary py-16">
              <MapPin className="mb-3 h-10 w-10 text-foreground-muted/30" />
              <h3 className="mb-1 text-lg font-semibold text-foreground">No hay fondos</h3>
              <p className="mb-4 text-sm text-foreground-muted">Crea fondos manualmente o genera con IA</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {backgrounds.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => openBackgroundEdit(bg)}
                  className="group rounded-xl border border-surface-tertiary bg-surface-secondary text-left transition hover:border-brand-500/30"
                >
                  {bg.reference_image_url ? (
                    <div className="aspect-video overflow-hidden rounded-t-xl">
                      <img src={bg.reference_image_url} alt={bg.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-t-xl bg-surface-tertiary">
                      <MapPin className="h-8 w-8 text-foreground-muted/20" />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">{bg.name}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-mono text-foreground-muted">{bg.code}</span>
                        <Pencil className="h-3 w-3 text-foreground-muted opacity-0 transition group-hover:opacity-100" />
                      </div>
                    </div>
                    {bg.description && <p className="mt-1 line-clamp-2 text-xs text-foreground-secondary">{bg.description}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        {/* References */}
        <TabsContent value="references" className="mt-4">
          <div className="rounded-xl border border-surface-tertiary bg-surface-secondary p-6">
            <div className="mb-4 flex items-center gap-2">
              <Link2 className="h-5 w-5 text-foreground-muted" />
              <h3 className="text-sm font-semibold text-foreground">Mapa de Referencias</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-tertiary">
                    <th className="px-3 py-2 text-left font-semibold text-foreground-muted">Recurso</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground-muted">Tipo</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground-muted">Prompt Snippet</th>
                  </tr>
                </thead>
                <tbody>
                  {characters.map((char) => (
                    <tr key={char.id} className="border-b border-surface-tertiary/50 transition hover:bg-surface-tertiary/30">
                      <td className="px-3 py-2">
                        <button onClick={() => openCharacterEdit(char)} className="flex items-center gap-2 hover:underline">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: char.color_accent || '#6B7280' }}>
                            {char.initials || char.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-foreground">{char.name}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2"><span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">Personaje</span></td>
                      <td className="max-w-xs truncate px-3 py-2 font-mono text-[10px] text-foreground-muted">{char.prompt_snippet || '-'}</td>
                    </tr>
                  ))}
                  {backgrounds.map((bg) => (
                    <tr key={bg.id} className="border-b border-surface-tertiary/50 transition hover:bg-surface-tertiary/30">
                      <td className="px-3 py-2">
                        <button onClick={() => openBackgroundEdit(bg)} className="flex items-center gap-2 hover:underline">
                          <MapPin className="h-4 w-4 text-foreground-muted" />
                          <span className="text-foreground">{bg.name}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2"><span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] text-green-400">Fondo</span></td>
                      <td className="max-w-xs truncate px-3 py-2 font-mono text-[10px] text-foreground-muted">{bg.prompt_snippet || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Edit Sheet (right slider) ── */}
      <Sheet open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null); }}>
        <SheetContent side="right" className="w-105 overflow-y-auto sm:max-w-105">
          <SheetHeader>
            <SheetTitle>
              {editing?.type === 'character' ? 'Editar Personaje' : 'Editar Fondo'}
            </SheetTitle>
            <SheetDescription>
              Modifica los datos del recurso. Los cambios se guardan al pulsar Guardar.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {editing?.type === 'character' && (
              <>
                {/* Header: Avatar + Name inline */}
                <div className="flex items-center gap-4 rounded-xl bg-surface-secondary p-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ backgroundColor: editForm.color_accent || '#6B7280' }}
                  >
                    {(editForm.name || 'P').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Nombre del personaje"
                      aria-label="Nombre"
                      className="w-full border-0 bg-transparent text-lg font-semibold text-foreground outline-none placeholder:text-foreground-muted"
                    />
                    <input
                      value={editForm.role || ''}
                      onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                      placeholder="Rol (ej: Director, Estilista...)"
                      aria-label="Rol"
                      className="mt-0.5 w-full border-0 bg-transparent text-sm text-foreground-muted outline-none placeholder:text-foreground-muted"
                    />
                  </div>
                  <input
                    type="color"
                    value={editForm.color_accent || '#6B7280'}
                    onChange={(e) => setEditForm((p) => ({ ...p, color_accent: e.target.value }))}
                    aria-label="Color del personaje"
                    className="h-8 w-8 cursor-pointer rounded-lg border-0"
                  />
                </div>

                {/* Reference Image (large, downloadable) */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Imagen de referencia
                  </label>
                  {editing.data.reference_image_url ? (
                    <div className="group relative overflow-hidden rounded-xl border border-surface-tertiary">
                      <img
                        src={editing.data.reference_image_url}
                        alt={editForm.name}
                        className="w-full object-cover"
                        style={{ maxHeight: '240px' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                        <a
                          href={editing.data.reference_image_url}
                          download={`${editForm.name || 'personaje'}.jpg`}
                          target="_blank"
                          rel="noopener"
                          className="flex h-9 items-center gap-1.5 rounded-lg bg-white/20 px-3 text-xs font-medium text-white backdrop-blur hover:bg-white/30"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="h-3.5 w-3.5" /> Descargar
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            const supabase = createClient();
                            if (editing.data.reference_image_path) {
                              await supabase.storage.from('project-assets').remove([editing.data.reference_image_path]);
                            }
                            await supabase.from('characters').update({ reference_image_url: null, reference_image_path: null }).eq('id', editing!.data.id);
                            await fetchData();
                            toast.success('Imagen eliminada');
                          }}
                          className="flex h-9 items-center gap-1.5 rounded-lg bg-red-500/30 px-3 text-xs font-medium text-white backdrop-blur hover:bg-red-500/50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-tertiary py-8 transition hover:border-brand-500/50 hover:bg-brand-500/5">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !project?.id) return;
                          try {
                            const supabase = createClient();
                            const ext = file.name.split('.').pop();
                            const path = `${project.id}/references/characters/${editing!.data.id}.${ext}`;
                            const { error } = await supabase.storage.from('project-assets').upload(path, file, { cacheControl: '3600', upsert: true });
                            if (error) throw error;
                            const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(path);
                            await supabase.from('characters').update({ reference_image_url: publicUrl, reference_image_path: path }).eq('id', editing!.data.id);
                            await fetchData();
                            toast.success('Imagen subida');
                          } catch (err) {
                            console.error(err);
                            toast.error('Error al subir imagen');
                          }
                          e.target.value = '';
                        }}
                      />
                      <Upload className="mb-2 h-6 w-6 text-foreground-muted" />
                      <span className="text-xs text-foreground-muted">Subir imagen de referencia</span>
                      <span className="mt-0.5 text-[10px] text-foreground-muted/60">PNG, JPG hasta 10MB</span>
                    </label>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Descripcion</label>
                  <textarea value={editForm.description || ''} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Descripcion del personaje..." className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none" />
                </div>

                {/* Visual Description */}
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Descripcion Visual</label>
                  <textarea value={editForm.visual_description || ''} onChange={(e) => setEditForm((p) => ({ ...p, visual_description: e.target.value }))} rows={3} placeholder="Como se ve fisicamente..." className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-brand-500 focus:outline-none" />
                </div>

                {/* Prompt Snippet */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Prompt Snippet (EN)</label>
                    {editForm.prompt_snippet && <CopyButton text={editForm.prompt_snippet} className="h-6 text-[10px]" />}
                  </div>
                  <textarea value={editForm.prompt_snippet || ''} onChange={(e) => setEditForm((p) => ({ ...p, prompt_snippet: e.target.value }))} rows={4} placeholder="English prompt snippet for image generation..." className="w-full rounded-lg border border-surface-tertiary bg-[#0d1117] px-3 py-2 font-mono text-xs text-gray-300 placeholder:text-gray-600 focus:border-brand-500 focus:outline-none" />
                </div>
              </>
            )}

            {editing?.type === 'background' && (
              <>
                {/* Background image (large, downloadable) */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">
                    Imagen de referencia
                  </label>
                  {editing.data.reference_image_url ? (
                    <div className="group relative overflow-hidden rounded-xl border border-surface-tertiary">
                      <img src={editing.data.reference_image_url} alt={editForm.name} className="aspect-video w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                        <a
                          href={editing.data.reference_image_url}
                          download={`${editForm.name || 'fondo'}.jpg`}
                          target="_blank"
                          rel="noopener"
                          className="flex h-9 items-center gap-1.5 rounded-lg bg-white/20 px-3 text-xs font-medium text-white backdrop-blur hover:bg-white/30"
                        >
                          <Download className="h-3.5 w-3.5" /> Descargar
                        </a>
                        <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-white/20 px-3 text-xs font-medium text-white backdrop-blur hover:bg-white/30">
                          <Upload className="h-3.5 w-3.5" /> Cambiar
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file || !project?.id) return;
                            try {
                              const supabase = createClient();
                              const ext = file.name.split('.').pop();
                              const path = `${project.id}/references/backgrounds/${editing!.data.id}.${ext}`;
                              const { error } = await supabase.storage.from('project-assets').upload(path, file, { cacheControl: '3600', upsert: true });
                              if (error) throw error;
                              const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(path);
                              await supabase.from('backgrounds').update({ reference_image_url: publicUrl, reference_image_path: path }).eq('id', editing!.data.id);
                              await fetchData();
                              toast.success('Imagen actualizada');
                            } catch { toast.error('Error al subir imagen'); }
                            e.target.value = '';
                          }} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-tertiary py-8 transition hover:border-brand-500/50 hover:bg-brand-500/5">
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !project?.id) return;
                        try {
                          const supabase = createClient();
                          const ext = file.name.split('.').pop();
                          const path = `${project.id}/references/backgrounds/${editing!.data.id}.${ext}`;
                          const { error } = await supabase.storage.from('project-assets').upload(path, file, { cacheControl: '3600', upsert: true });
                          if (error) throw error;
                          const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(path);
                          await supabase.from('backgrounds').update({ reference_image_url: publicUrl, reference_image_path: path }).eq('id', editing!.data.id);
                          await fetchData();
                          toast.success('Imagen subida');
                        } catch { toast.error('Error al subir imagen'); }
                        e.target.value = '';
                      }} />
                      <Upload className="mb-2 h-6 w-6 text-foreground-muted" />
                      <span className="text-xs text-foreground-muted">Subir imagen de referencia</span>
                    </label>
                  )}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Nombre</label>
                  <input value={editForm.name || ''} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Codigo</label>
                  <input value={editForm.code || ''} onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value }))} className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 font-mono text-sm text-foreground focus:border-brand-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Descripcion</label>
                  <textarea value={editForm.description || ''} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={3} className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Tipo</label>
                    <select value={editForm.location_type || 'interior'} onChange={(e) => setEditForm((p) => ({ ...p, location_type: e.target.value }))} className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none">
                      <option value="interior">Interior</option>
                      <option value="exterior">Exterior</option>
                      <option value="mixed">Mixto</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-foreground-muted">Hora</label>
                    <select value={editForm.time_of_day || 'day'} onChange={(e) => setEditForm((p) => ({ ...p, time_of_day: e.target.value }))} className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm text-foreground focus:border-brand-500 focus:outline-none">
                      <option value="dawn">Amanecer</option>
                      <option value="morning">Manana</option>
                      <option value="day">Dia</option>
                      <option value="golden_hour">Hora dorada</option>
                      <option value="evening">Atardecer</option>
                      <option value="night">Noche</option>
                    </select>
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">Prompt Snippet (EN)</label>
                    {editForm.prompt_snippet && <CopyButton text={editForm.prompt_snippet} className="h-6 text-[10px]" />}
                  </div>
                  <textarea value={editForm.prompt_snippet || ''} onChange={(e) => setEditForm((p) => ({ ...p, prompt_snippet: e.target.value }))} rows={4} className="w-full rounded-lg border border-surface-tertiary bg-[#0d1117] px-3 py-2 font-mono text-xs text-gray-300 focus:border-brand-500 focus:outline-none" />
                </div>
              </>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-surface-tertiary">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
