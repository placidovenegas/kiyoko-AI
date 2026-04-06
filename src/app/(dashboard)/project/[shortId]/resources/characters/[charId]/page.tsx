'use client';

import { useCallback, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { useUIStore } from '@/stores/useUIStore';
import { ModalShell } from '@/components/modals/shared/ModalShell';
import { AiResultDrawer, type AiResultPayload } from '@/components/ai/AiResultDrawer';
import { useCharacterAi } from '@/hooks/useCharacterAi';
import { toast } from '@/components/ui/toast';
import type { Character, CharacterImage, CharacterUpdate } from '@/types';
import type { Json } from '@/types/database.types';
import { buildCharacterTurnaroundPrompt } from '@/lib/ai/prompts/character-turnaround';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Film,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  PenLine,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------ */
/*  Types & helpers                                                    */
/* ------------------------------------------------------------------ */

interface CharacterRules {
  always?: string[];
  never?: string[];
}

interface CharacterMetadata {
  ai_reference_sheet_prompt?: string;
  ai_reference_sheet_source_image_url?: string;
  ai_reference_sheet_updated_at?: string;
  avatar_image_url?: string;
  avatar_image_path?: string;
  avatar_image_row_id?: string;
  avatar_image_updated_at?: string;
}

interface SceneWithCharacter {
  scene_id: string;
  role_in_scene: string | null;
  scene: {
    id: string;
    scene_number: string;
    title: string;
  };
}

interface GalleryItem {
  id: string;
  url: string;
  label: string;
  helper: string;
  filePath: string | null;
  isPrimary: boolean;
  imageRowId: string | null;
  kind: 'reference' | 'avatar';
  sortOrder: number | null;
}

interface ActivityToastState {
  title: string;
  detail: string;
}

function sanitizeCharacterUpdates(updates: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined && value !== null)
  ) as CharacterUpdate;
}

function getImageUrl(image: CharacterImage) {
  return image.file_url ?? image.thumbnail_url ?? null;
}

function normalizeRuleItems(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  if (typeof value === 'string' && value.trim().length > 0) return [value.trim()];
  return [];
}

function normalizeCharacterRules(value: unknown): CharacterRules {
  if (!value || typeof value !== 'object') return { always: [], never: [] };
  const candidate = value as Record<string, unknown>;
  return { always: normalizeRuleItems(candidate.always), never: normalizeRuleItems(candidate.never) };
}

function splitListInput(value: string) {
  return value.split(/[\n,]/).map((item) => item.trim()).filter((item) => item.length > 0);
}

function serializeCopyValue(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) return value.join(', ');
  return value ?? '';
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { project } = useProject();
  const openFilePreview = useUIStore((state) => state.openFilePreview);
  const shortId = params.shortId as string;
  const charId = params.charId as string;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = createClient();

  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newRule, setNewRule] = useState('');
  const [ruleType, setRuleType] = useState<'always' | 'never'>('always');
  const [uploadTarget, setUploadTarget] = useState<'reference' | 'avatar'>('reference');
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [aiResultOpen, setAiResultOpen] = useState(false);
  const [aiResult, setAiResult] = useState<AiResultPayload | null>(null);
  const [fieldLoadingKey, setFieldLoadingKey] = useState<string | null>(null);
  const [imageActionId, setImageActionId] = useState<string | null>(null);
  const [activityToast, setActivityToast] = useState<ActivityToastState | null>(null);

  const { enrichMutation, promptMutation, sceneSummaryMutation } = useCharacterAi();

  /* ---- Queries ---- */

  const { data: character, isLoading: characterLoading } = useQuery({
    queryKey: queryKeys.characters.detail(charId),
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*').eq('id', charId).single();
      if (error) throw error;
      return data as Character;
    },
    enabled: !!charId,
  });

  const { data: images = [] } = useQuery({
    queryKey: queryKeys.characters.images(charId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('character_images')
        .select('*')
        .eq('character_id', charId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as CharacterImage[];
    },
    enabled: !!charId,
  });

  const { data: sceneLinks = [] } = useQuery({
    queryKey: ['character-scenes', charId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scene_characters')
        .select('scene_id, role_in_scene, scene:scenes(id, scene_number, title)')
        .eq('character_id', charId);
      if (error) throw error;
      return (data ?? []) as unknown as SceneWithCharacter[];
    },
    enabled: !!charId,
  });

  /* ---- Derived data ---- */

  const metadata = ((character?.metadata ?? {}) as CharacterMetadata) ?? null;

  const { galleryItems, avatarGalleryItem } = useMemo(() => {
    const items: GalleryItem[] = [];
    const seenReferenceUrls = new Set<string>();

    for (const image of images) {
      const url = getImageUrl(image);
      if (!url) continue;
      const kind = image.image_type === 'avatar' ? 'avatar' : 'reference';
      if (kind === 'reference') seenReferenceUrls.add(url);

      items.push({
        id: image.id,
        url,
        label: image.angle_description ?? (kind === 'avatar' ? 'Avatar image' : image.image_type ?? 'Reference'),
        helper: kind === 'avatar' ? 'Avatar image' : image.is_primary ? 'Principal' : 'Galeria',
        filePath: image.file_path,
        isPrimary: kind === 'reference' && (Boolean(image.is_primary) || character?.reference_image_url === url),
        imageRowId: image.id,
        kind,
        sortOrder: image.sort_order,
      });
    }

    const referenceItems = items
      .filter((item) => item.kind === 'reference')
      .sort((left, right) => {
        if (left.isPrimary !== right.isPrimary) return left.isPrimary ? -1 : 1;
        const lo = left.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const ro = right.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (lo !== ro) return lo - ro;
        return left.label.localeCompare(right.label);
      });

    if (character?.reference_image_url && !seenReferenceUrls.has(character.reference_image_url)) {
      referenceItems.unshift({
        id: 'legacy-main-reference',
        url: character.reference_image_url,
        label: 'Referencia principal',
        helper: 'Imagen principal actual',
        filePath: character.reference_image_path,
        isPrimary: true,
        imageRowId: null,
        kind: 'reference',
        sortOrder: Number.MIN_SAFE_INTEGER,
      });
    }

    const avatarFromMetadata = (() => {
      if (metadata?.avatar_image_row_id) {
        const rowMatch = items.find((item) => item.imageRowId === metadata.avatar_image_row_id);
        if (rowMatch) return { ...rowMatch, kind: 'avatar' as const, helper: 'Avatar activo' };
      }
      if (metadata?.avatar_image_url) {
        return {
          id: metadata.avatar_image_row_id ?? 'character-avatar',
          url: metadata.avatar_image_url,
          label: 'Avatar image',
          helper: 'Avatar activo',
          filePath: metadata.avatar_image_path ?? null,
          isPrimary: false,
          imageRowId: metadata.avatar_image_row_id ?? null,
          kind: 'avatar' as const,
          sortOrder: null,
        };
      }
      return items.find((item) => item.kind === 'avatar') ?? null;
    })();

    return { galleryItems: referenceItems, avatarGalleryItem: avatarFromMetadata };
  }, [character?.reference_image_path, character?.reference_image_url, images, metadata?.avatar_image_path, metadata?.avatar_image_row_id, metadata?.avatar_image_url]);

  const primaryGalleryItem = galleryItems.find((item) => item.isPrimary) ?? galleryItems[0] ?? null;

  const allAssetItems = useMemo(() => {
    const avatarItems = avatarGalleryItem ? [avatarGalleryItem] : [];
    const seen = new Set<string>();
    return [...avatarItems, ...galleryItems].filter((item) => {
      const key = item.imageRowId ?? item.url;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [avatarGalleryItem, galleryItems]);

  const avatarSelectionKey = avatarGalleryItem ? (avatarGalleryItem.imageRowId ?? avatarGalleryItem.url) : null;
  const rules = useMemo(() => normalizeCharacterRules(character?.rules), [character?.rules]);

  /* ---- Mutations ---- */

  const updateMutation = useMutation({
    mutationFn: async (updates: CharacterUpdate) => {
      const { error } = await supabase.from('characters').update(updates).eq('id', charId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(charId) });
      if (project) queryClient.invalidateQueries({ queryKey: queryKeys.characters.byProject(project.id) });
      setEditField(null);
    },
  });

  const refreshCharacterQueries = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(charId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.images(charId) }),
      project ? queryClient.invalidateQueries({ queryKey: queryKeys.characters.byProject(project.id) }) : Promise.resolve(),
    ]);
  }, [charId, project, queryClient]);

  const openUploadPicker = useCallback((target: 'reference' | 'avatar') => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  }, []);

  const uploadImagesMutation = useMutation({
    mutationFn: async ({ selectedFiles, target }: { selectedFiles: File[]; target: 'reference' | 'avatar' }) => {
      if (!project || !character) throw new Error('Contexto no disponible');

      if (target === 'avatar') {
        const file = selectedFiles[0];
        if (!file) throw new Error('Selecciona una imagen para el avatar');
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `projects/${project.id}/characters/${charId}/avatar-${crypto.randomUUID()}.${ext}`;
        const payload = new FormData();
        payload.append('bucket', 'project-assets');
        payload.append('path', path);
        payload.append('file', file);

        const response = await fetch('/api/storage/object', { method: 'POST', body: payload });
        const body = (await response.json().catch(() => null)) as { file?: { url: string; path?: string }; error?: string } | null;
        if (!response.ok || !body?.file?.url) throw new Error(body?.error ?? `No se pudo subir ${file.name}`);

        const existingAvatarRow = images.find((item) => item.id === metadata?.avatar_image_row_id) ?? images.find((item) => item.image_type === 'avatar');
        let avatarRowId = existingAvatarRow?.id ?? null;

        if (existingAvatarRow) {
          const { error } = await supabase
            .from('character_images')
            .update({ image_type: 'avatar', file_path: body.file.path ?? path, file_url: body.file.url, thumbnail_url: body.file.url, source: 'upload', angle_description: 'Avatar image' })
            .eq('id', existingAvatarRow.id);
          if (error) throw error;
          if (existingAvatarRow.file_path && existingAvatarRow.file_path !== (body.file.path ?? path)) {
            await fetch('/api/storage/object', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bucket: 'project-assets', path: existingAvatarRow.file_path }) }).catch(() => null);
          }
        } else {
          const { data, error } = await supabase
            .from('character_images')
            .insert({ character_id: charId, image_type: 'avatar', file_path: body.file.path ?? path, file_url: body.file.url, thumbnail_url: body.file.url, source: 'upload', is_primary: false, angle_description: 'Avatar image', sort_order: Math.floor(Date.now() / 1000) })
            .select('id')
            .single();
          if (error) throw error;
          avatarRowId = data.id;
        }

        const nextMetadata: CharacterMetadata = { ...(metadata ?? {}), avatar_image_url: body.file.url, avatar_image_path: body.file.path ?? path, avatar_image_row_id: avatarRowId ?? undefined, avatar_image_updated_at: new Date().toISOString() };
        const { error: characterError } = await supabase.from('characters').update({ metadata: nextMetadata as unknown as Json }).eq('id', charId);
        if (characterError) throw characterError;
        return { target };
      }

      for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index];
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `projects/${project.id}/characters/${charId}/${crypto.randomUUID()}.${ext}`;
        const payload = new FormData();
        payload.append('bucket', 'project-assets');
        payload.append('path', path);
        payload.append('file', file);

        const response = await fetch('/api/storage/object', { method: 'POST', body: payload });
        const body = (await response.json().catch(() => null)) as { file?: { url: string; path?: string }; error?: string } | null;
        if (!response.ok || !body?.file?.url) throw new Error(body?.error ?? `No se pudo subir ${file.name}`);

        const shouldBePrimary = !character.reference_image_url && index === 0;
        const shouldSeedAvatar = !metadata?.avatar_image_url && index === 0;
        const { error } = await supabase.from('character_images').insert({ character_id: charId, image_type: 'reference', file_path: body.file.path ?? path, file_url: body.file.url, thumbnail_url: body.file.url, source: 'upload', is_primary: shouldBePrimary, sort_order: Math.floor(Date.now() / 1000) + index });
        if (error) throw error;

        if (shouldBePrimary) {
          const nextMetadata: CharacterMetadata = shouldSeedAvatar
            ? { ...(metadata ?? {}), avatar_image_url: body.file.url, avatar_image_path: body.file.path ?? path, avatar_image_updated_at: new Date().toISOString() }
            : { ...(metadata ?? {}) };
          const { error: primaryError } = await supabase.from('characters').update({ reference_image_url: body.file.url, reference_image_path: body.file.path ?? path, metadata: nextMetadata as unknown as Json }).eq('id', charId);
          if (primaryError) throw primaryError;
        } else if (shouldSeedAvatar) {
          const nextMetadata: CharacterMetadata = { ...(metadata ?? {}), avatar_image_url: body.file.url, avatar_image_path: body.file.path ?? path, avatar_image_updated_at: new Date().toISOString() };
          const { error: avatarSeedError } = await supabase.from('characters').update({ metadata: nextMetadata as unknown as Json }).eq('id', charId);
          if (avatarSeedError) throw avatarSeedError;
        }
      }
      return { target };
    },
    onMutate: ({ selectedFiles, target }) => {
      setActivityToast({
        title: target === 'avatar' ? 'Subiendo avatar' : 'Subiendo imagenes de referencia',
        detail: target === 'avatar' ? 'Guardando la imagen principal del avatar del personaje' : selectedFiles.length > 1 ? `${selectedFiles.length} archivos en proceso` : 'Guardando la nueva referencia en la libreria visual',
      });
    },
    onSuccess: async (result) => {
      await refreshCharacterQueries();
      setActivityToast(null);
      toast.success(result.target === 'avatar' ? 'Avatar actualizado' : 'Imagenes subidas');
    },
    onError: (error) => {
      setActivityToast(null);
      toast.error(error instanceof Error ? error.message : 'No se pudieron subir las imagenes');
    },
  });

  const setAvatarImageMutation = useMutation({
    mutationFn: async (image: GalleryItem) => {
      const nextMetadata: CharacterMetadata = { ...(metadata ?? {}), avatar_image_url: image.url, avatar_image_path: image.filePath ?? undefined, avatar_image_row_id: image.imageRowId ?? undefined, avatar_image_updated_at: new Date().toISOString() };
      const { error } = await supabase.from('characters').update({ metadata: nextMetadata as unknown as Json }).eq('id', charId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshCharacterQueries();
      toast.success('Avatar actualizado');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el avatar');
    },
  });

  const saveTurnaroundPromptMutation = useMutation({
    mutationFn: async ({ image }: { image: GalleryItem }) => {
      if (!character) throw new Error('Personaje no disponible');
      const prompt = buildCharacterTurnaroundPrompt(character);
      const nextMetadata: CharacterMetadata = { ...(metadata ?? {}), ai_reference_sheet_prompt: prompt, ai_reference_sheet_source_image_url: image.url, ai_reference_sheet_updated_at: new Date().toISOString() };
      const { error } = await supabase.from('characters').update({ metadata: nextMetadata as unknown as Json }).eq('id', charId);
      if (error) throw error;
      return { prompt, image };
    },
    onSuccess: async ({ prompt, image }) => {
      await refreshCharacterQueries();
      setActivityToast(null);
      setAiResult({
        title: 'Reference sheet prompt actualizado',
        summary: 'El turnaround se regenero con una plantilla estable basada en la referencia seleccionada y en los datos del personaje.',
        sections: [
          { title: 'Imagen base', items: [image.label] },
          { title: 'Prompt generado', items: [prompt] },
        ],
        suggestions: [
          'Usa este prompt como base maestra para nuevas hojas 2x3.',
          'Si cambias de referencia principal, regenera el turnaround para mantener coherencia.',
        ],
      });
      setAiResultOpen(true);
      toast.success('Turnaround generado');
    },
    onError: (error) => {
      setActivityToast(null);
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el turnaround');
    },
  });

  const setPrimaryImageMutation = useMutation({
    mutationFn: async (image: GalleryItem) => {
      if (!image.imageRowId) {
        const { error } = await supabase.from('characters').update({ reference_image_url: image.url, reference_image_path: image.filePath }).eq('id', charId);
        if (error) throw error;
        return;
      }
      const minReferenceSortOrder = images.filter((item) => item.image_type !== 'avatar').reduce((minimum, item) => Math.min(minimum, item.sort_order ?? minimum), Math.floor(Date.now() / 1000));
      const { error: resetError } = await supabase.from('character_images').update({ is_primary: false }).eq('character_id', charId).neq('image_type', 'avatar');
      if (resetError) throw resetError;
      const { error: primaryError } = await supabase.from('character_images').update({ is_primary: true, sort_order: minReferenceSortOrder - 1 }).eq('id', image.imageRowId);
      if (primaryError) throw primaryError;
      const { error: characterError } = await supabase.from('characters').update({ reference_image_url: image.url, reference_image_path: image.filePath }).eq('id', charId);
      if (characterError) throw characterError;
    },
    onSuccess: async () => {
      await refreshCharacterQueries();
      toast.success('Imagen principal actualizada');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'No se pudo cambiar la imagen principal');
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (image: GalleryItem) => {
      const remainingRows = images.filter((item) => item.id !== image.imageRowId);
      const remainingReferenceRows = remainingRows.filter((item) => item.image_type !== 'avatar');
      const nextPrimaryRow = remainingReferenceRows[0] ?? null;
      const nextPrimaryUrl = nextPrimaryRow ? getImageUrl(nextPrimaryRow) : null;
      const avatarWasDeleted = metadata?.avatar_image_row_id === image.imageRowId || metadata?.avatar_image_url === image.url;

      if (image.imageRowId) {
        const { error: deleteRowError } = await supabase.from('character_images').delete().eq('id', image.imageRowId);
        if (deleteRowError) throw deleteRowError;
      }
      if (image.filePath) {
        await fetch('/api/storage/object', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bucket: 'project-assets', path: image.filePath }) }).catch(() => null);
      }

      const deletingCurrentPrimary = character?.reference_image_url === image.url || image.isPrimary;
      if (deletingCurrentPrimary) {
        if (nextPrimaryRow) await supabase.from('character_images').update({ is_primary: true }).eq('id', nextPrimaryRow.id);
        const { error: characterError } = await supabase.from('characters').update({ reference_image_url: nextPrimaryUrl, reference_image_path: nextPrimaryRow?.file_path ?? null }).eq('id', charId);
        if (characterError) throw characterError;
      }

      if (avatarWasDeleted) {
        const nextAvatarRow = remainingRows.find((item) => item.image_type === 'avatar') ?? nextPrimaryRow ?? null;
        const nextMeta: CharacterMetadata = { ...(metadata ?? {}), avatar_image_url: nextAvatarRow ? getImageUrl(nextAvatarRow) ?? undefined : undefined, avatar_image_path: nextAvatarRow?.file_path ?? undefined, avatar_image_row_id: nextAvatarRow?.id ?? undefined, avatar_image_updated_at: new Date().toISOString() };
        const { error: avatarError } = await supabase.from('characters').update({ metadata: nextMeta as unknown as Json }).eq('id', charId);
        if (avatarError) throw avatarError;
      }
    },
    onMutate: (image) => {
      setActivityToast({ title: 'Eliminando imagen', detail: `Quitando ${image.label.toLowerCase()} de la libreria visual` });
    },
    onSuccess: async () => {
      await refreshCharacterQueries();
      setActivityToast(null);
      toast.success('Imagen eliminada');
    },
    onError: (error) => {
      setActivityToast(null);
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la imagen');
    },
  });

  /* ---- Handlers ---- */

  const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    uploadImagesMutation.mutate({ selectedFiles: files, target: uploadTarget });
    event.target.value = '';
  };

  const handleSetPrimaryImage = useCallback(async (selectedImage: GalleryItem) => {
    setImageActionId(selectedImage.id);
    try { await setPrimaryImageMutation.mutateAsync(selectedImage); } finally { setImageActionId(null); }
  }, [setPrimaryImageMutation]);

  const handleGenerateTurnaroundFromImage = useCallback(async (selectedImage: GalleryItem) => {
    setImageActionId(selectedImage.id);
    try {
      setActivityToast({ title: 'Generando turnaround', detail: 'Guardando el prompt maestro desde la referencia elegida' });
      await saveTurnaroundPromptMutation.mutateAsync({ image: selectedImage });
    } finally { setImageActionId(null); }
  }, [saveTurnaroundPromptMutation]);

  const handleSetAvatarImage = useCallback(async (selectedImage: GalleryItem) => {
    setImageActionId(selectedImage.id);
    try { await setAvatarImageMutation.mutateAsync(selectedImage); } finally { setImageActionId(null); }
  }, [setAvatarImageMutation]);

  const handleDeleteGalleryImage = useCallback(async (selectedImage: GalleryItem) => {
    setImageActionId(selectedImage.id);
    try { await deleteImageMutation.mutateAsync(selectedImage); } finally { setImageActionId(null); }
  }, [deleteImageMutation]);

  const previewItems = useMemo(
    () => allAssetItems.map((image) => ({ id: image.id, url: image.url, name: image.label, type: 'image/*' })),
    [allAssetItems]
  );

  const openPreview = (imageId: string) => {
    const imageIndex = previewItems.findIndex((item) => item.id === imageId);
    if (imageIndex < 0) return;
    openFilePreview(previewItems, imageIndex);
  };

  const startEdit = (field: string, value: string | string[] | null | undefined) => {
    setEditField(field);
    setEditValue(Array.isArray(value) ? value.join(', ') : value ?? '');
  };

  const saveField = () => {
    if (!editField) return;
    if (editField === 'accessories' || editField === 'signature_tools') {
      updateMutation.mutate({ [editField]: splitListInput(editValue) } as CharacterUpdate);
      return;
    }
    if (editField === 'color_accent') {
      updateMutation.mutate({ color_accent: editValue.trim() || null });
      return;
    }
    updateMutation.mutate({ [editField]: editValue.trim() || null } as CharacterUpdate);
  };

  const analyzeFromImage = useCallback(async (image: GalleryItem) => {
    const response = await fetch('/api/ai/analyze-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: image.url, entityType: 'character', entityId: charId, persistReferenceSheetPrompt: false }),
    });
    const payload = (await response.json().catch(() => null)) as { analysis?: Record<string, unknown>; error?: string } | null;
    if (!response.ok || !payload?.analysis) throw new Error(payload?.error ?? 'No se pudo analizar la imagen');
    await refreshCharacterQueries();
    return payload.analysis;
  }, [charId, refreshCharacterQueries]);

  const handleAnalyzeSelectedImage = async () => {
    const selectedImage = galleryItems.find((image) => image.id === selectedImageId) ?? primaryGalleryItem;
    if (!selectedImage) { toast.error('No hay imagen seleccionada'); return; }
    setFieldLoadingKey('reference-analysis');
    setActivityToast({ title: 'Generando turnaround', detail: 'Construyendo el prompt maestro desde la referencia seleccionada' });
    try {
      await saveTurnaroundPromptMutation.mutateAsync({ image: selectedImage });
      setImagePickerOpen(false);
    } catch (error) {
      setActivityToast(null);
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el prompt');
    } finally { setFieldLoadingKey(null); }
  };

  const runFieldAi = useCallback(async (fieldKey: string) => {
    if (!project || !character) return;
    if (!primaryGalleryItem) { toast.error('Selecciona o sube una imagen principal primero'); return; }
    setFieldLoadingKey(fieldKey);
    setActivityToast({ title: 'IA trabajando', detail: `Generando contenido para ${fieldKey.replaceAll('_', ' ')}` });
    try {
      if (fieldKey === 'ai_prompt_description') {
        await analyzeFromImage(primaryGalleryItem);
        setActivityToast(null);
        toast.success('Descripcion IA regenerada desde la referencia principal');
        return;
      }
      if (fieldKey === 'prompt_snippet') {
        await analyzeFromImage(primaryGalleryItem);
        const response = await promptMutation.mutateAsync({ projectId: project.id, characterId: charId });
        await updateMutation.mutateAsync(sanitizeCharacterUpdates(response.updates as Record<string, unknown>));
        setActivityToast(null);
        toast.success('Prompt de escena actualizado');
        return;
      }
      await analyzeFromImage(primaryGalleryItem);
      const response = await enrichMutation.mutateAsync({ projectId: project.id, characterId: charId });
      const updates = sanitizeCharacterUpdates(response.updates as Record<string, unknown>);
      const partialUpdate = fieldKey in updates ? ({ [fieldKey]: updates[fieldKey as keyof CharacterUpdate] } as CharacterUpdate) : null;
      if (!partialUpdate || Object.keys(partialUpdate).length === 0) { setActivityToast(null); toast.error('La IA no devolvio contenido para este campo'); return; }
      await updateMutation.mutateAsync(partialUpdate);
      setActivityToast(null);
      toast.success('Campo actualizado con IA');
    } catch (error) {
      setActivityToast(null);
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el campo');
    } finally { setFieldLoadingKey(null); }
  }, [analyzeFromImage, charId, character, enrichMutation, primaryGalleryItem, project, promptMutation, updateMutation]);

  const handleCopy = async (value: string | string[] | null | undefined, label: string) => {
    const serialized = serializeCopyValue(value);
    if (!serialized) { toast.error(`No hay ${label.toLowerCase()} para copiar`); return; }
    await navigator.clipboard.writeText(serialized);
    toast.success(`${label} copiado`);
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    const updatedRules = { ...rules };
    updatedRules[ruleType] = [...(updatedRules[ruleType] ?? []), newRule.trim()];
    updateMutation.mutate({ rules: updatedRules as CharacterUpdate['rules'] });
    setNewRule('');
  };

  const removeRule = (type: 'always' | 'never', index: number) => {
    const updatedRules = { ...rules };
    updatedRules[type] = (updatedRules[type] ?? []).filter((_, currentIndex) => currentIndex !== index);
    updateMutation.mutate({ rules: updatedRules as CharacterUpdate['rules'] });
  };

  const handleSceneSummary = async () => {
    if (!project || !character) return;
    setFieldLoadingKey('scene-summary');
    setActivityToast({ title: 'Analizando escenas', detail: 'Revisando continuidad y uso del personaje en el storyboard' });
    try {
      const response = await sceneSummaryMutation.mutateAsync({ projectId: project.id, characterId: charId });
      setAiResult(response.result);
      setAiResultOpen(true);
    } catch (error) {
      setActivityToast(null);
      toast.error(error instanceof Error ? error.message : 'No se pudo analizar el uso en escenas');
    } finally { setActivityToast(null); setFieldLoadingKey(null); }
  };

  /* ---- Loading / Error states ---- */

  if (characterLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-xl bg-muted" />
        <div className="h-96 animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <p className="text-sm text-muted-foreground">Personaje no encontrado.</p>
        <Link href={`/project/${shortId}/resources/characters`} className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a personajes
        </Link>
      </div>
    );
  }

  /* ---- Render ---- */

  const avatarUrl = avatarGalleryItem?.url ?? primaryGalleryItem?.url ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" multiple={uploadTarget === 'reference'} accept="image/*" className="hidden" onChange={handleUploadChange} />

      {/* Back link */}
      <Link
        href={`/project/${shortId}/resources/characters`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Personajes
      </Link>

      {/* ===== Header ===== */}
      <section className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
          {avatarUrl ? (
            <Image src={avatarUrl} alt={character.name} fill className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-muted-foreground">
              {character.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{character.name}</h1>
            {character.role && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {character.role}
              </span>
            )}
          </div>
          {character.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{character.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openUploadPicker('reference')}
            disabled={uploadImagesMutation.isPending}
            className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Upload className="inline h-3.5 w-3.5 mr-1" />
            Subir
          </button>
          <button
            type="button"
            onClick={() => startEdit('name', character.name)}
            className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Editar
          </button>
        </div>
      </section>

      {/* ===== Two-column layout ===== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr_2fr]">

        {/* ===== LEFT COLUMN (60%) ===== */}
        <div className="space-y-6">

          {/* Basic info card */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Informacion basica</p>

            <EditableRow label="Nombre" fieldKey="name" value={character.name} editField={editField} editValue={editValue} onStart={startEdit} onChange={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} />
            <EditableRow label="Rol" fieldKey="role" value={character.role} editField={editField} editValue={editValue} onStart={startEdit} onChange={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} />
            <EditableTextarea label="Descripcion" fieldKey="description" value={character.description} editField={editField} editValue={editValue} onStart={startEdit} onChange={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} onAi={() => void runFieldAi('description')} aiLoading={fieldLoadingKey === 'description'} />
            <EditableTextarea label="Personalidad" fieldKey="personality" value={character.personality} editField={editField} editValue={editValue} onStart={startEdit} onChange={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} onAi={() => void runFieldAi('personality')} aiLoading={fieldLoadingKey === 'personality'} />
            <EditableTextarea label="Descripcion visual" fieldKey="visual_description" value={character.visual_description} editField={editField} editValue={editValue} onStart={startEdit} onChange={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} onAi={() => void runFieldAi('visual_description')} aiLoading={fieldLoadingKey === 'visual_description'} />
            <EditableTextarea label="Cabello" fieldKey="hair_description" value={character.hair_description} editField={editField} editValue={editValue} onStart={startEdit} onChange={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} onAi={() => void runFieldAi('hair_description')} aiLoading={fieldLoadingKey === 'hair_description'} />
            <EditableTextarea label="Ropa" fieldKey="signature_clothing" value={character.signature_clothing} editField={editField} editValue={editValue} onStart={startEdit} onChange={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} onAi={() => void runFieldAi('signature_clothing')} aiLoading={fieldLoadingKey === 'signature_clothing'} />
            <EditableRow label="Accesorios" fieldKey="accessories" value={(character.accessories ?? []).join(', ')} editField={editField} editValue={editValue} onStart={startEdit} onChange={setEditValue} onSave={saveField} onCancel={() => setEditField(null)} saving={updateMutation.isPending} />

            {/* Color accent */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Color Accent</p>
              {editField === 'color_accent' ? (
                <div className="space-y-2">
                  <input value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="#4C8DFF" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10" />
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditField(null)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">Cancelar</button>
                    <button type="button" onClick={saveField} disabled={updateMutation.isPending} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Guardar</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg border border-border" style={{ backgroundColor: character.color_accent ?? '#4C8DFF' }} />
                  <span className="text-sm text-foreground">{character.color_accent ?? '#4C8DFF'}</span>
                  <button type="button" onClick={() => startEdit('color_accent', character.color_accent)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                    <PenLine className="inline h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Prompt snippet - prominent */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prompt snippet (escena)</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void handleCopy(character.prompt_snippet, 'Prompt')} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                  <Copy className="inline h-3 w-3 mr-1" /> Copiar
                </button>
                <button
                  type="button"
                  onClick={() => void runFieldAi('prompt_snippet')}
                  disabled={fieldLoadingKey !== null}
                  className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {fieldLoadingKey === 'prompt_snippet' ? <Loader2 className="inline h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="inline h-3.5 w-3.5 mr-1" />}
                  Generar con IA
                </button>
              </div>
            </div>
            {editField === 'prompt_snippet' ? (
              <div className="space-y-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditField(null)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">Cancelar</button>
                  <button type="button" onClick={saveField} disabled={updateMutation.isPending} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                    <Save className="inline h-3 w-3 mr-1" /> Guardar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => startEdit('prompt_snippet', character.prompt_snippet)} className="w-full text-left">
                <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background p-3 font-mono text-sm text-muted-foreground">
                  {character.prompt_snippet || 'Sin prompt generado. Haz clic en "Generar con IA".'}
                </pre>
              </button>
            )}
          </section>

          {/* AI Prompt Description */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descripcion IA (visual prompt)</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => void handleCopy(character.ai_prompt_description, 'AI Prompt')} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                  <Copy className="inline h-3 w-3 mr-1" /> Copiar
                </button>
                <button type="button" onClick={() => void runFieldAi('ai_prompt_description')} disabled={fieldLoadingKey !== null} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50">
                  {fieldLoadingKey === 'ai_prompt_description' ? <Loader2 className="inline h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="inline h-3.5 w-3.5 mr-1" />} IA
                </button>
              </div>
            </div>
            {editField === 'ai_prompt_description' ? (
              <div className="space-y-2">
                <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10" />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditField(null)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">Cancelar</button>
                  <button type="button" onClick={saveField} disabled={updateMutation.isPending} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Guardar</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => startEdit('ai_prompt_description', character.ai_prompt_description)} className="w-full text-left">
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-background p-3 font-mono text-sm text-muted-foreground">
                  {character.ai_prompt_description || 'Sin descripcion IA. Usa el boton IA para generar.'}
                </p>
              </button>
            )}
          </section>

          {/* Turnaround reference sheet prompt */}
          {metadata?.ai_reference_sheet_prompt && (
            <section className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Turnaround prompt</p>
                <button type="button" onClick={() => void handleCopy(metadata.ai_reference_sheet_prompt, 'Turnaround')} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                  <Copy className="inline h-3 w-3 mr-1" /> Copiar
                </button>
              </div>
              <pre className="whitespace-pre-wrap rounded-lg border border-border bg-background p-3 font-mono text-sm text-muted-foreground max-h-48 overflow-y-auto">
                {metadata.ai_reference_sheet_prompt}
              </pre>
            </section>
          )}
        </div>

        {/* ===== RIGHT COLUMN (40%) ===== */}
        <div className="space-y-6">

          {/* Reference images gallery */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Imagenes de referencia ({galleryItems.length})</p>
              <button type="button" onClick={() => openUploadPicker('reference')} disabled={uploadImagesMutation.isPending} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50">
                {uploadImagesMutation.isPending ? <Loader2 className="inline h-3 w-3 animate-spin mr-1" /> : <ImagePlus className="inline h-3 w-3 mr-1" />}
                Subir
              </button>
            </div>

            {galleryItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {galleryItems.map((image) => (
                  <div key={image.id} className="group relative overflow-hidden rounded-lg border border-border bg-background">
                    <button type="button" onClick={() => openPreview(image.id)} className="relative block aspect-square w-full overflow-hidden">
                      <Image src={image.url} alt={image.label} fill className="object-cover" />
                      {image.isPrimary && (
                        <span className="absolute left-1.5 top-1.5 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">Principal</span>
                      )}
                      {avatarSelectionKey === (image.imageRowId ?? image.url) && (
                        <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">Avatar</span>
                      )}
                    </button>
                    <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <AssetActionsMenu
                        image={image}
                        isAvatar={avatarSelectionKey === (image.imageRowId ?? image.url)}
                        busy={imageActionId === image.id}
                        onSetPrimary={handleSetPrimaryImage}
                        onSetAvatar={handleSetAvatarImage}
                        onGenerateFromImage={handleGenerateTurnaroundFromImage}
                        onDelete={handleDeleteGalleryImage}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-4 py-8 text-center">
                <ImagePlus className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-2 text-xs text-muted-foreground">Sube una imagen de referencia</p>
              </div>
            )}

            {/* Avatar upload */}
            <button type="button" onClick={() => openUploadPicker('avatar')} disabled={uploadImagesMutation.isPending} className="w-full rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
              {uploadImagesMutation.isPending && uploadTarget === 'avatar' ? 'Subiendo avatar...' : 'Subir avatar'}
            </button>
          </section>

          {/* Generate turnaround */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Turnaround</p>
            <button
              type="button"
              onClick={() => {
                if (!galleryItems.length) { toast.error('Sube primero una imagen de referencia'); return; }
                setSelectedImageId(primaryGalleryItem?.id ?? galleryItems[0]?.id ?? null);
                setImagePickerOpen(true);
              }}
              disabled={fieldLoadingKey !== null || saveTurnaroundPromptMutation.isPending}
              className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {fieldLoadingKey === 'reference-analysis' ? <Loader2 className="inline h-3.5 w-3.5 animate-spin mr-1" /> : <Wand2 className="inline h-3.5 w-3.5 mr-1" />}
              Generar turnaround
            </button>
          </section>

          {/* Rules / guardrails */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reglas de consistencia</p>

            {(rules.always?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-medium text-emerald-500 mb-1">Siempre incluir</p>
                <div className="flex flex-wrap gap-1.5">
                  {rules.always?.map((item, index) => (
                    <button key={`always-${item}-${index}`} type="button" onClick={() => removeRule('always', index)} className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400 hover:opacity-80">
                      {item} <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(rules.never?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs font-medium text-rose-500 mb-1">Nunca incluir</p>
                <div className="flex flex-wrap gap-1.5">
                  {rules.never?.map((item, index) => (
                    <button key={`never-${item}-${index}`} type="button" onClick={() => removeRule('never', index)} className="inline-flex items-center gap-1 rounded-md border border-rose-500/20 bg-rose-500/10 px-2 py-1 text-xs text-rose-400 hover:opacity-80">
                      {item} <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <select value={ruleType} onChange={(e) => setRuleType(e.target.value as 'always' | 'never')} className="w-24 appearance-none cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10">
                <option value="always">Always</option>
                <option value="never">Never</option>
              </select>
              <input value={newRule} onChange={(e) => setNewRule(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRule()} placeholder="Nueva regla..." className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10" />
              <button type="button" onClick={addRule} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">+</button>
            </div>
          </section>

          {/* Scenes where character appears */}
          <section className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Film className="inline h-3.5 w-3.5 mr-1" />
                Escenas ({sceneLinks.length})
              </p>
              <button
                type="button"
                onClick={() => void handleSceneSummary()}
                disabled={fieldLoadingKey !== null}
                className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              >
                {fieldLoadingKey === 'scene-summary' ? <Loader2 className="inline h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="inline h-3.5 w-3.5 mr-1" />}
                Analizar uso
              </button>
            </div>
            {sceneLinks.length > 0 ? (
              <div className="space-y-2">
                {sceneLinks.map((link) => (
                  <div key={link.scene_id} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-xs font-medium text-primary">{link.scene.scene_number}</span>
                      <span className="truncate text-sm text-foreground">{link.scene.title}</span>
                    </div>
                    {link.role_in_scene && (
                      <span className="shrink-0 text-xs text-muted-foreground">{link.role_in_scene}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No aparece en ninguna escena todavia.</p>
            )}
          </section>
        </div>
      </div>

      {/* Image picker modal */}
      <ModalShell
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        title="Elegir imagen base"
        description="Selecciona la referencia para regenerar el turnaround."
        dialogClassName="sm:max-w-150"
        footer={(
          <>
            <button type="button" onClick={() => setImagePickerOpen(false)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">Cancelar</button>
            <button type="button" onClick={handleAnalyzeSelectedImage} disabled={!selectedImageId || fieldLoadingKey === 'reference-analysis'} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {fieldLoadingKey === 'reference-analysis' ? 'Generando...' : 'Generar turnaround'}
            </button>
          </>
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((image) => {
            const isSelected = selectedImageId === image.id;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageId(image.id)}
                className={cn(
                  'overflow-hidden rounded-xl border text-left transition',
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-accent'
                )}
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <Image src={image.url} alt={image.label} fill className="object-cover" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground">{image.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{image.helper}</p>
                </div>
              </button>
            );
          })}
        </div>
      </ModalShell>

      <AiResultDrawer open={aiResultOpen} result={aiResult} onClose={() => { setAiResultOpen(false); setAiResult(null); }} />
      <ActivityToast activity={activityToast} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function EditableRow({
  label,
  fieldKey,
  value,
  editField,
  editValue,
  onStart,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  label: string;
  fieldKey: string;
  value: string | null | undefined;
  editField: string | null;
  editValue: string;
  onStart: (field: string, value: string | string[] | null | undefined) => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const isEditing = editField === fieldKey;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      {isEditing ? (
        <div className="space-y-2">
          <input value={editValue} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><X className="inline h-3 w-3 mr-1" /> Cancelar</button>
            <button type="button" onClick={onSave} disabled={saving} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><Save className="inline h-3 w-3 mr-1" /> Guardar</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-foreground">{value || <span className="italic text-muted-foreground/50">-</span>}</span>
          <button type="button" onClick={() => onStart(fieldKey, value)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
            <PenLine className="inline h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}

function EditableTextarea({
  label,
  fieldKey,
  value,
  editField,
  editValue,
  onStart,
  onChange,
  onSave,
  onCancel,
  saving,
  onAi,
  aiLoading,
}: {
  label: string;
  fieldKey: string;
  value: string | null | undefined;
  editField: string | null;
  editValue: string;
  onStart: (field: string, value: string | string[] | null | undefined) => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  onAi?: () => void;
  aiLoading?: boolean;
}) {
  const isEditing = editField === fieldKey;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="flex items-center gap-1">
          {onAi && (
            <button type="button" onClick={onAi} disabled={aiLoading} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50">
              {aiLoading ? <Loader2 className="inline h-3 w-3 animate-spin" /> : <Sparkles className="inline h-3 w-3" />}
            </button>
          )}
          {!isEditing && (
            <button type="button" onClick={() => onStart(fieldKey, value)} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
              <PenLine className="inline h-3 w-3" />
            </button>
          )}
        </div>
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <textarea value={editValue} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10" />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"><X className="inline h-3 w-3 mr-1" /> Cancelar</button>
            <button type="button" onClick={onSave} disabled={saving} className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><Save className="inline h-3 w-3 mr-1" /> Guardar</button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{value || <span className="italic text-muted-foreground/50">Sin contenido</span>}</p>
      )}
    </div>
  );
}

function AssetActionsMenu({
  image,
  isAvatar,
  busy,
  onSetPrimary,
  onGenerateFromImage,
  onSetAvatar,
  onDelete,
}: {
  image: GalleryItem;
  isAvatar?: boolean;
  busy?: boolean;
  onSetPrimary: (image: GalleryItem) => Promise<void>;
  onGenerateFromImage: (image: GalleryItem) => Promise<void>;
  onSetAvatar: (image: GalleryItem) => Promise<void>;
  onDelete: (image: GalleryItem) => Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="justify-between">
            <span className="inline-flex items-center"><CheckCircle2 className="mr-2 h-4 w-4" /> Usar</span>
            <ChevronRight className="h-4 w-4 opacity-60" />
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => void onSetPrimary(image)} className="justify-between">
                <span className="inline-flex items-center"><Check className="mr-2 h-4 w-4" /> Principal</span>
                {image.isPrimary ? <Check className="h-4 w-4 text-primary" /> : null}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void onSetAvatar(image)} className="justify-between">
                <span className="inline-flex items-center"><ImagePlus className="mr-2 h-4 w-4" /> Avatar</span>
                {isAvatar ? <Check className="h-4 w-4 text-primary" /> : null}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={() => void onGenerateFromImage(image)}>
          <Wand2 className="mr-2 h-4 w-4" /> Generar turnaround
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => void onDelete(image)}>
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar imagen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ActivityToast({ activity }: { activity: ActivityToastState | null }) {
  return (
    <div className={cn(
      'pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-200',
      activity ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
    )}>
      <div className="inline-flex min-w-[240px] items-center gap-3 rounded-xl border border-border bg-background/95 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{activity?.title ?? 'Procesando'}</p>
          <p className="truncate text-xs text-muted-foreground">{activity?.detail ?? 'Esperando'}</p>
        </div>
      </div>
    </div>
  );
}
