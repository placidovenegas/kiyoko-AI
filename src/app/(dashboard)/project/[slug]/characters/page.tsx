'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CopyButton } from '@/components/ui/CopyButton';
import { toast } from 'sonner';
import { IconUpload, IconX, IconPhoto, IconCheck } from '@tabler/icons-react';
import { ImageCropOverlay } from '@/components/ui/ImageCropOverlay';
import type { Character } from '@/types/character';

export default function CharactersPage() {
  const params = useParams();
  const projectId = params.slug as string;

  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [cropData, setCropData] = useState<{ characterId: string; src: string } | null>(null);
  const [editingField, setEditingField] = useState<{
    id: string;
    field: 'name' | 'role' | 'prompt_snippet';
  } | null>(null);
  const [editValue, setEditValue] = useState('');
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const editInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();

    async function fetchCharacters() {
      setLoading(true);
      const { data } = await supabase
        .from('characters')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      setCharacters((data as Character[]) ?? []);

      setLoading(false);
    }

    fetchCharacters();
  }, [projectId]);

  useEffect(() => {
    if (editingField && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingField]);

  async function handleImageUpload(characterId: string, file: File) {
    if (!projectId) return;
    setUploadingId(characterId);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const filePath = `${projectId}/references/characters/${characterId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from('project-assets').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('characters')
        .update({
          reference_image_url: publicUrl,
          reference_image_path: filePath,
        })
        .eq('id', characterId);

      if (updateError) throw updateError;

      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId
            ? { ...c, reference_image_url: publicUrl, reference_image_path: filePath }
            : c
        )
      );

      toast.success('Imagen subida');

      // Show crop overlay for avatar position
      setCropData({ characterId, src: publicUrl });
    } catch (err) {
      console.error(err);
      toast.error('Error al subir imagen');
    } finally {
      setUploadingId(null);
    }
  }

  async function handleCropConfirm(objectPosition: string) {
    if (!cropData) return;

    try {
      const supabase = createClient();

      const character = characters.find((c) => c.id === cropData.characterId);
      const updatedMetadata = {
        ...(character?.metadata ?? {}),
        avatar_object_position: objectPosition,
      };

      const { error } = await supabase
        .from('characters')
        .update({ metadata: updatedMetadata })
        .eq('id', cropData.characterId);

      if (error) throw error;

      setCharacters((prev) =>
        prev.map((c) =>
          c.id === cropData.characterId
            ? { ...c, metadata: updatedMetadata }
            : c
        )
      );

      toast.success('Avatar actualizado');
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar avatar');
    } finally {
      setCropData(null);
    }
  }

  async function handleImageDelete(characterId: string, filePath: string) {
    if (!projectId) return;

    try {
      const supabase = createClient();

      const { error: deleteError } = await supabase.storage
        .from('project-assets')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      const character = characters.find((c) => c.id === characterId);
      const updatedMetadata = { ...(character?.metadata ?? {}) };
      delete updatedMetadata.avatar_object_position;

      const { error: updateError } = await supabase
        .from('characters')
        .update({
          reference_image_url: null,
          reference_image_path: null,
          metadata: updatedMetadata,
        })
        .eq('id', characterId);

      if (updateError) throw updateError;

      setCharacters((prev) =>
        prev.map((c) =>
          c.id === characterId
            ? {
                ...c,
                reference_image_url: null,
                reference_image_path: null,
                metadata: updatedMetadata,
              }
            : c
        )
      );

      toast.success('Imagen eliminada');
    } catch (err) {
      console.error(err);
      toast.error('Error al eliminar imagen');
    }
  }

  function startEditing(characterId: string, field: 'name' | 'role' | 'prompt_snippet') {
    const character = characters.find((c) => c.id === characterId);
    if (!character) return;
    setEditingField({ id: characterId, field });
    setEditValue(character[field] ?? '');
  }

  async function saveEdit() {
    if (!editingField) return;

    const { id, field } = editingField;
    const trimmed = editValue.trim();

    // Don't save empty names
    if (field === 'name' && !trimmed) {
      setEditingField(null);
      return;
    }

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from('characters')
        .update({ [field]: trimmed })
        .eq('id', id);

      if (error) throw error;

      setCharacters((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: trimmed } : c))
      );

      toast.success('Campo actualizado');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar');
    } finally {
      setEditingField(null);
    }
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') {
      setEditingField(null);
    }
  }

  if (loading) {
    return (

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-6 w-48 animate-pulse rounded bg-surface-secondary" />
            <div className="mt-1 h-4 w-64 animate-pulse rounded bg-surface-secondary" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl bg-surface-secondary"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Crop overlay */}
      {cropData && (
        <ImageCropOverlay
          src={cropData.src}
          onCrop={handleCropConfirm}
          onCancel={() => setCropData(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Biblia de Personajes
          </h2>
          <p className="text-sm text-foreground-muted">
            {characters.length} personajes definidos
          </p>
        </div>
        <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
          + Nuevo personaje
        </button>
      </div>

      {/* Character grid */}
      {characters.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-tertiary py-20">
          <h3 className="mb-1 text-lg font-semibold text-foreground">
            No hay personajes
          </h3>
          <p className="mb-6 max-w-sm text-center text-sm text-foreground-muted">
            Crea personajes para mantener consistencia visual en todas las
            escenas del storyboard
          </p>
          <button className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600">
            + Nuevo personaje
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => {
            const avatarPosition =
              (character.metadata?.avatar_object_position as string) ?? 'center';

            return (
              <div
                key={character.id}
                className="rounded-xl border border-surface-tertiary bg-surface-secondary p-4 transition hover:border-brand-500/30"
              >
                {/* Reference Image Upload Area */}
                <div className="group relative mb-3">
                  <input
                    ref={(el) => {
                      fileInputRefs.current[character.id] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(character.id, file);
                      e.target.value = '';
                    }}
                  />

                  {character.reference_image_url ? (
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                      <img
                        src={character.reference_image_url}
                        alt={character.name}
                        className="h-full w-full object-cover"
                      />
                      {/* Delete button on hover */}
                      <button
                        onClick={() =>
                          character.reference_image_path &&
                          handleImageDelete(
                            character.id,
                            character.reference_image_path
                          )
                        }
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-red-500 group-hover:opacity-100"
                      >
                        <IconX size={14} />
                      </button>
                      {/* Re-upload button on hover */}
                      <button
                        onClick={() =>
                          fileInputRefs.current[character.id]?.click()
                        }
                        className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition hover:bg-brand-500 group-hover:opacity-100"
                      >
                        <IconUpload size={14} />
                      </button>

                      {/* Initials badge overlapping bottom-right */}
                      <div
                        className="absolute bottom-2 left-2 flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-md ring-2 ring-surface-secondary"
                        style={{
                          backgroundColor:
                            character.color_accent || '#6366f1',
                        }}
                      >
                        {character.initials ||
                          character.name.slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        fileInputRefs.current[character.id]?.click()
                      }
                      disabled={uploadingId === character.id}
                      className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-surface-tertiary transition hover:border-brand-500/50 hover:bg-brand-500/5"
                    >
                      {uploadingId === character.id ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                      ) : (
                        <>
                          <IconPhoto
                            size={24}
                            className="text-foreground-muted"
                          />
                          <span className="text-xs text-foreground-muted">
                            Subir imagen de referencia
                          </span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Avatar + Name (inline editable) */}
                <div className="mb-3 flex items-center gap-3">
                  {character.reference_image_url ? (
                    <button
                      onClick={() =>
                        setCropData({
                          characterId: character.id,
                          src: character.reference_image_url!,
                        })
                      }
                      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-transparent transition hover:ring-brand-500"
                    >
                      <img
                        src={character.reference_image_url}
                        alt={character.name}
                        className="h-full w-full object-cover"
                        style={{ objectPosition: avatarPosition }}
                      />
                    </button>
                  ) : (
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{
                        backgroundColor:
                          character.color_accent || '#6366f1',
                      }}
                    >
                      {character.initials ||
                        character.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {editingField?.id === character.id &&
                    editingField.field === 'name' ? (
                      <input
                        ref={(el) => {
                          editInputRef.current = el;
                        }}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleEditKeyDown}
                        className="w-full rounded bg-surface-tertiary px-1 text-sm font-semibold text-foreground outline-none ring-1 ring-brand-500"
                      />
                    ) : (
                      <h3
                        onClick={() => startEditing(character.id, 'name')}
                        className="cursor-pointer truncate text-sm font-semibold text-foreground rounded px-1 -mx-1 transition hover:bg-surface-tertiary"
                        title="Clic para editar"
                      >
                        {character.name}
                      </h3>
                    )}

                    {editingField?.id === character.id &&
                    editingField.field === 'role' ? (
                      <input
                        ref={(el) => {
                          editInputRef.current = el;
                        }}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleEditKeyDown}
                        className="mt-0.5 w-full rounded bg-surface-tertiary px-1 text-xs text-foreground-muted outline-none ring-1 ring-brand-500"
                      />
                    ) : (
                      <p
                        onClick={() => startEditing(character.id, 'role')}
                        className="cursor-pointer truncate text-xs text-foreground-muted rounded px-1 -mx-1 transition hover:bg-surface-tertiary"
                        title="Clic para editar"
                      >
                        {character.role || 'Sin rol definido'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Visual description */}
                {character.visual_description && (
                  <p className="mb-3 line-clamp-3 text-xs text-foreground-secondary">
                    {character.visual_description}
                  </p>
                )}

                {/* Prompt snippet (inline editable) */}
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                      Prompt snippet
                    </span>
                    {character.prompt_snippet && (
                      <CopyButton text={character.prompt_snippet} />
                    )}
                  </div>

                  {editingField?.id === character.id &&
                  editingField.field === 'prompt_snippet' ? (
                    <div className="relative">
                      <textarea
                        ref={(el) => {
                          editInputRef.current = el;
                        }}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleEditKeyDown}
                        rows={4}
                        className="w-full resize-none rounded-lg bg-surface-tertiary p-2 text-[11px] leading-relaxed text-foreground-secondary outline-none ring-1 ring-brand-500"
                      />
                      <button
                        onClick={saveEdit}
                        className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded bg-brand-500 text-white"
                      >
                        <IconCheck size={12} />
                      </button>
                    </div>
                  ) : character.prompt_snippet ? (
                    <pre
                      onClick={() =>
                        startEditing(character.id, 'prompt_snippet')
                      }
                      className="cursor-pointer overflow-x-auto rounded-lg bg-surface-tertiary p-2 text-[11px] leading-relaxed text-foreground-secondary transition hover:ring-1 hover:ring-brand-500/30"
                      title="Clic para editar"
                    >
                      <code>{character.prompt_snippet}</code>
                    </pre>
                  ) : (
                    <button
                      onClick={() =>
                        startEditing(character.id, 'prompt_snippet')
                      }
                      className="w-full rounded-lg border border-dashed border-surface-tertiary p-2 text-[11px] text-foreground-muted transition hover:border-brand-500/50"
                    >
                      Agregar prompt snippet...
                    </button>
                  )}
                </div>

                {/* Appears in scenes */}
                {character.appears_in_scenes &&
                  character.appears_in_scenes.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                        Aparece en:
                      </span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {character.appears_in_scenes.map((sceneNum) => (
                          <span
                            key={sceneNum}
                            className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-500"
                          >
                            E{sceneNum}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
