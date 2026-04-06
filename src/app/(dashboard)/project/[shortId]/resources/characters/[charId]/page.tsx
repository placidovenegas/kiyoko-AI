'use client';

import { useCallback, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
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
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ImagePlus,
  Loader2,
  MoreHorizontal,
  Palette,
  PenLine,
  Sparkles,
  Trash2,
  Wand2,
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

function isGenericAssetLabel(label: string | null | undefined) {
  const normalized = (label ?? '').trim().toLowerCase();
  return normalized === 'reference' || normalized === 'avatar image' || normalized === 'avatar';
}

function normalizeRuleItems(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value.trim()];
  }

  return [];
}

function normalizeCharacterRules(value: unknown): CharacterRules {
  if (!value || typeof value !== 'object') {
    return { always: [], never: [] };
  }

  const candidate = value as Record<string, unknown>;

  return {
    always: normalizeRuleItems(candidate.always),
    never: normalizeRuleItems(candidate.never),
  };
}

function splitListInput(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function serializeCopyValue(value: string | string[] | null | undefined) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value ?? '';
}

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

  const metadata = ((character?.metadata ?? {}) as CharacterMetadata) ?? null;

  const { galleryItems, avatarGalleryItem } = useMemo(() => {
    const items: GalleryItem[] = [];
    const seenReferenceUrls = new Set<string>();

    for (const image of images) {
      const url = getImageUrl(image);
      if (!url) continue;

      const kind = image.image_type === 'avatar' ? 'avatar' : 'reference';
      if (kind === 'reference') {
        seenReferenceUrls.add(url);
      }

      items.push({
        id: image.id,
        url,
        label: image.angle_description ?? (kind === 'avatar' ? 'Avatar image' : image.image_type ?? 'Reference'),
        helper: kind === 'avatar' ? 'Avatar image' : image.is_primary ? 'Principal' : 'Galería',
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
        if (left.isPrimary !== right.isPrimary) {
          return left.isPrimary ? -1 : 1;
        }

        const leftOrder = left.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

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
        if (rowMatch) {
          return { ...rowMatch, kind: 'avatar' as const, helper: 'Avatar activo' };
        }
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

    return {
      galleryItems: referenceItems,
      avatarGalleryItem: avatarFromMetadata,
    };
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
  const libraryTileItems = useMemo(() => {
    return allAssetItems
      .filter((item) => item.id !== primaryGalleryItem?.id)
      .sort((left, right) => {
        const leftIsAvatar = (left.imageRowId ?? left.url) === (avatarGalleryItem?.imageRowId ?? avatarGalleryItem?.url);
        const rightIsAvatar = (right.imageRowId ?? right.url) === (avatarGalleryItem?.imageRowId ?? avatarGalleryItem?.url);

        if (leftIsAvatar !== rightIsAvatar) {
          return leftIsAvatar ? -1 : 1;
        }

        const leftOrder = left.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const rightOrder = right.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftOrder !== rightOrder) {
          return leftOrder - rightOrder;
        }

        return left.label.localeCompare(right.label);
      });
  }, [allAssetItems, avatarGalleryItem?.imageRowId, avatarGalleryItem?.url, primaryGalleryItem?.id]);
  const avatarSelectionKey = avatarGalleryItem ? (avatarGalleryItem.imageRowId ?? avatarGalleryItem.url) : null;
  const rules = useMemo(() => normalizeCharacterRules(character?.rules), [character?.rules]);

  const readyItems = [
    Boolean(primaryGalleryItem),
    Boolean(character?.visual_description),
    Boolean(character?.ai_prompt_description),
    Boolean(character?.prompt_snippet),
    Boolean(metadata?.ai_reference_sheet_prompt),
    (rules.always?.length ?? 0) + (rules.never?.length ?? 0) > 0,
  ];
  const readyCount = readyItems.filter(Boolean).length;
  const readinessScore = Math.round((readyCount / readyItems.length) * 100);
  const promptReadyCount = [Boolean(character?.prompt_snippet), Boolean(character?.ai_prompt_description), Boolean(metadata?.ai_reference_sheet_prompt)].filter(Boolean).length;
  const fieldCoverageCount = [
    Boolean(character?.visual_description),
    Boolean(character?.description),
    Boolean(character?.personality),
    Boolean(character?.hair_description),
    Boolean(character?.signature_clothing),
    Boolean(character?.accessories?.length),
    Boolean(character?.signature_tools?.length),
  ].filter(Boolean).length;

  const metrics = [
    {
      label: 'Consistency Score',
      value: `${readinessScore}%`,
      detail: `${readyCount}/${readyItems.length} bloques listos`,
      tone: 'primary' as const,
    },
    {
      label: 'Prompt Stack',
      value: `${promptReadyCount}/3`,
      detail: 'Scene, visual y turnaround',
      tone: 'default' as const,
    },
    {
      label: 'Asset Library',
      value: String(galleryItems.length),
      detail: primaryGalleryItem ? 'Con referencia principal activa' : 'Sin referencia principal',
      tone: 'success' as const,
    },
    {
      label: 'Avatar Layer',
      value: avatarGalleryItem ? 'Ready' : 'Missing',
      detail: avatarGalleryItem ? 'Avatar seleccionado desde la librería' : `${fieldCoverageCount}/7 parámetros cubiertos`,
      tone: 'default' as const,
    },
  ];

  const updateMutation = useMutation({
    mutationFn: async (updates: CharacterUpdate) => {
      const { error } = await supabase.from('characters').update(updates).eq('id', charId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(charId) });
      if (project) {
        queryClient.invalidateQueries({ queryKey: queryKeys.characters.byProject(project.id) });
      }
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
        if (!response.ok || !body?.file?.url) {
          throw new Error(body?.error ?? `No se pudo subir ${file.name}`);
        }

        const existingAvatarRow = images.find((item) => item.id === metadata?.avatar_image_row_id) ?? images.find((item) => item.image_type === 'avatar');
        let avatarRowId = existingAvatarRow?.id ?? null;

        if (existingAvatarRow) {
          const { error } = await supabase
            .from('character_images')
            .update({
              image_type: 'avatar',
              file_path: body.file.path ?? path,
              file_url: body.file.url,
              thumbnail_url: body.file.url,
              source: 'upload',
              angle_description: 'Avatar image',
            })
            .eq('id', existingAvatarRow.id);
          if (error) throw error;

          if (existingAvatarRow.file_path && existingAvatarRow.file_path !== (body.file.path ?? path)) {
            await fetch('/api/storage/object', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bucket: 'project-assets', path: existingAvatarRow.file_path }),
            }).catch(() => null);
          }
        } else {
          const { data, error } = await supabase
            .from('character_images')
            .insert({
              character_id: charId,
              image_type: 'avatar',
              file_path: body.file.path ?? path,
              file_url: body.file.url,
              thumbnail_url: body.file.url,
              source: 'upload',
              is_primary: false,
              angle_description: 'Avatar image',
              sort_order: Math.floor(Date.now() / 1000),
            })
            .select('id')
            .single();
          if (error) throw error;
          avatarRowId = data.id;
        }

        const nextMetadata: CharacterMetadata = {
          ...(metadata ?? {}),
          avatar_image_url: body.file.url,
          avatar_image_path: body.file.path ?? path,
          avatar_image_row_id: avatarRowId ?? undefined,
          avatar_image_updated_at: new Date().toISOString(),
        };

        const { error: characterError } = await supabase
          .from('characters')
          .update({ metadata: nextMetadata as unknown as Json })
          .eq('id', charId);
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
        if (!response.ok || !body?.file?.url) {
          throw new Error(body?.error ?? `No se pudo subir ${file.name}`);
        }

        const shouldBePrimary = !character.reference_image_url && index === 0;
        const shouldSeedAvatar = !metadata?.avatar_image_url && index === 0;
        const { error } = await supabase.from('character_images').insert({
          character_id: charId,
          image_type: 'reference',
          file_path: body.file.path ?? path,
          file_url: body.file.url,
          thumbnail_url: body.file.url,
          source: 'upload',
          is_primary: shouldBePrimary,
          sort_order: Math.floor(Date.now() / 1000) + index,
        });
        if (error) throw error;

        if (shouldBePrimary) {
          const nextMetadata: CharacterMetadata = shouldSeedAvatar
            ? {
                ...(metadata ?? {}),
                avatar_image_url: body.file.url,
                avatar_image_path: body.file.path ?? path,
                avatar_image_updated_at: new Date().toISOString(),
              }
            : { ...(metadata ?? {}) };

          const { error: primaryError } = await supabase
            .from('characters')
            .update({
              reference_image_url: body.file.url,
              reference_image_path: body.file.path ?? path,
              metadata: nextMetadata as unknown as Json,
            })
            .eq('id', charId);
          if (primaryError) throw primaryError;
        } else if (shouldSeedAvatar) {
          const nextMetadata: CharacterMetadata = {
            ...(metadata ?? {}),
            avatar_image_url: body.file.url,
            avatar_image_path: body.file.path ?? path,
            avatar_image_updated_at: new Date().toISOString(),
          };

          const { error: avatarSeedError } = await supabase
            .from('characters')
            .update({ metadata: nextMetadata as unknown as Json })
            .eq('id', charId);
          if (avatarSeedError) throw avatarSeedError;
        }
      }

      return { target };
    },
    onMutate: ({ selectedFiles, target }) => {
      setActivityToast({
        title: target === 'avatar' ? 'Subiendo avatar' : 'Subiendo imágenes de referencia',
        detail: target === 'avatar'
          ? 'Guardando la imagen principal del avatar del personaje'
          : selectedFiles.length > 1
            ? `${selectedFiles.length} archivos en proceso`
            : 'Guardando la nueva referencia en la librería visual',
      });
    },
    onSuccess: async (result) => {
      await refreshCharacterQueries();
      setActivityToast(null);
      toast.success(result.target === 'avatar' ? 'Avatar actualizado' : 'Imágenes subidas');
    },
    onError: (error) => {
      setActivityToast(null);
      toast.error(error instanceof Error ? error.message : 'No se pudieron subir las imágenes');
    },
  });

  const setAvatarImageMutation = useMutation({
    mutationFn: async (image: GalleryItem) => {
      const nextMetadata: CharacterMetadata = {
        ...(metadata ?? {}),
        avatar_image_url: image.url,
        avatar_image_path: image.filePath ?? undefined,
        avatar_image_row_id: image.imageRowId ?? undefined,
        avatar_image_updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('characters')
        .update({ metadata: nextMetadata as unknown as Json })
        .eq('id', charId);
      if (error) throw error;
    },
    onMutate: async (image) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.characters.detail(charId) });
      const previousCharacter = queryClient.getQueryData<Character>(queryKeys.characters.detail(charId));

      queryClient.setQueryData<Character>(queryKeys.characters.detail(charId), (current) => {
        if (!current) return current;
        const currentMetadata = ((current.metadata ?? {}) as CharacterMetadata) ?? {};
        return {
          ...current,
          metadata: {
            ...currentMetadata,
            avatar_image_url: image.url,
            avatar_image_path: image.filePath ?? undefined,
            avatar_image_row_id: image.imageRowId ?? undefined,
            avatar_image_updated_at: new Date().toISOString(),
          } as unknown as Json,
        };
      });

      return { previousCharacter };
    },
    onSuccess: async () => {
      await refreshCharacterQueries();
      toast.success('Avatar actualizado');
    },
    onError: (error, _image, context) => {
      if (context?.previousCharacter) {
        queryClient.setQueryData(queryKeys.characters.detail(charId), context.previousCharacter);
      }
      toast.error(error instanceof Error ? error.message : 'No se pudo actualizar el avatar');
    },
  });

  const saveTurnaroundPromptMutation = useMutation({
    mutationFn: async ({ image }: { image: GalleryItem }) => {
      if (!character) throw new Error('Personaje no disponible');

      const prompt = buildCharacterTurnaroundPrompt(character);
      const nextMetadata: CharacterMetadata = {
        ...(metadata ?? {}),
        ai_reference_sheet_prompt: prompt,
        ai_reference_sheet_source_image_url: image.url,
        ai_reference_sheet_updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('characters')
        .update({ metadata: nextMetadata as unknown as Json })
        .eq('id', charId);
      if (error) throw error;

      return { prompt, image };
    },
    onSuccess: async ({ prompt, image }) => {
      await refreshCharacterQueries();
      setActivityToast(null);
      setAiResult({
        title: 'Reference sheet prompt actualizado',
        summary: 'El turnaround se regeneró con una plantilla estable basada en la referencia seleccionada y en los datos del personaje.',
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
        const { error } = await supabase
          .from('characters')
          .update({ reference_image_url: image.url, reference_image_path: image.filePath })
          .eq('id', charId);
        if (error) throw error;
        return;
      }

      const minReferenceSortOrder = images
        .filter((item) => item.image_type !== 'avatar')
        .reduce((minimum, item) => Math.min(minimum, item.sort_order ?? minimum), Math.floor(Date.now() / 1000));

      const { error: resetError } = await supabase
        .from('character_images')
        .update({ is_primary: false })
        .eq('character_id', charId)
        .neq('image_type', 'avatar');
      if (resetError) throw resetError;

      const { error: primaryError } = await supabase
        .from('character_images')
        .update({ is_primary: true, sort_order: minReferenceSortOrder - 1 })
        .eq('id', image.imageRowId);
      if (primaryError) throw primaryError;

      const { error: characterError } = await supabase
        .from('characters')
        .update({ reference_image_url: image.url, reference_image_path: image.filePath })
        .eq('id', charId);
      if (characterError) throw characterError;
    },
    onMutate: async (image) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.characters.detail(charId) }),
        queryClient.cancelQueries({ queryKey: queryKeys.characters.images(charId) }),
      ]);

      const previousCharacter = queryClient.getQueryData<Character>(queryKeys.characters.detail(charId));
      const previousImages = queryClient.getQueryData<CharacterImage[]>(queryKeys.characters.images(charId));

      queryClient.setQueryData<Character>(queryKeys.characters.detail(charId), (current) => {
        if (!current) return current;
        return {
          ...current,
          reference_image_url: image.url,
          reference_image_path: image.filePath,
        };
      });

      if (image.imageRowId) {
        queryClient.setQueryData<CharacterImage[]>(queryKeys.characters.images(charId), (current) => {
          if (!current) return current;

          const nextSortOrder = current
            .filter((item) => item.image_type !== 'avatar')
            .reduce((minimum, item) => Math.min(minimum, item.sort_order ?? minimum), Math.floor(Date.now() / 1000)) - 1;

          return current.map((item) => {
            if (item.image_type === 'avatar') return item;
            if (item.id === image.imageRowId) {
              return { ...item, is_primary: true, sort_order: nextSortOrder };
            }
            return { ...item, is_primary: false };
          });
        });
      }

      return { previousCharacter, previousImages };
    },
    onSuccess: async () => {
      await refreshCharacterQueries();
      toast.success('Imagen principal actualizada');
    },
    onError: (error, _image, context) => {
      if (context?.previousCharacter) {
        queryClient.setQueryData(queryKeys.characters.detail(charId), context.previousCharacter);
      }
      if (context?.previousImages) {
        queryClient.setQueryData(queryKeys.characters.images(charId), context.previousImages);
      }
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
        await fetch('/api/storage/object', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucket: 'project-assets', path: image.filePath }),
        }).catch(() => null);
      }

      const deletingCurrentPrimary = character?.reference_image_url === image.url || image.isPrimary;
      if (deletingCurrentPrimary) {
        if (nextPrimaryRow) {
          await supabase.from('character_images').update({ is_primary: true }).eq('id', nextPrimaryRow.id);
        }

        const { error: characterError } = await supabase
          .from('characters')
          .update({
            reference_image_url: nextPrimaryUrl,
            reference_image_path: nextPrimaryRow?.file_path ?? null,
          })
          .eq('id', charId);
        if (characterError) throw characterError;
      }

      if (avatarWasDeleted) {
        const nextAvatarRow = remainingRows.find((item) => item.image_type === 'avatar') ?? nextPrimaryRow ?? null;
        const nextMetadata: CharacterMetadata = {
          ...(metadata ?? {}),
          avatar_image_url: nextAvatarRow ? getImageUrl(nextAvatarRow) ?? undefined : undefined,
          avatar_image_path: nextAvatarRow?.file_path ?? undefined,
          avatar_image_row_id: nextAvatarRow?.id ?? undefined,
          avatar_image_updated_at: new Date().toISOString(),
        };

        const { error: avatarError } = await supabase
          .from('characters')
          .update({ metadata: nextMetadata as unknown as Json })
          .eq('id', charId);
        if (avatarError) throw avatarError;
      }
    },
    onMutate: async (image) => {
      setActivityToast({
        title: 'Eliminando imagen',
        detail: `Quitando ${image.label.toLowerCase()} de la librería visual`,
      });
      await Promise.all([
        queryClient.cancelQueries({ queryKey: queryKeys.characters.detail(charId) }),
        queryClient.cancelQueries({ queryKey: queryKeys.characters.images(charId) }),
      ]);

      const previousCharacter = queryClient.getQueryData<Character>(queryKeys.characters.detail(charId));
      const previousImages = queryClient.getQueryData<CharacterImage[]>(queryKeys.characters.images(charId));

      queryClient.setQueryData<CharacterImage[]>(queryKeys.characters.images(charId), (current) => {
        if (!current) return current;
        return current.filter((item) => item.id !== image.imageRowId);
      });

      queryClient.setQueryData<Character>(queryKeys.characters.detail(charId), (current) => {
        if (!current) return current;

        const currentImages = previousImages ?? [];
        const remainingRows = currentImages.filter((item) => item.id !== image.imageRowId);
        const remainingReferenceRows = remainingRows.filter((item) => item.image_type !== 'avatar');
        const nextPrimaryRow = remainingReferenceRows[0] ?? null;
        const deletingCurrentPrimary = current.reference_image_url === image.url || image.isPrimary;
        const avatarWasDeleted = ((current.metadata ?? {}) as CharacterMetadata)?.avatar_image_row_id === image.imageRowId
          || ((current.metadata ?? {}) as CharacterMetadata)?.avatar_image_url === image.url;
        const nextAvatarRow = remainingRows.find((item) => item.image_type === 'avatar') ?? nextPrimaryRow ?? null;
        const currentMetadata = ((current.metadata ?? {}) as CharacterMetadata) ?? {};

        return {
          ...current,
          reference_image_url: deletingCurrentPrimary ? (nextPrimaryRow ? getImageUrl(nextPrimaryRow) : null) : current.reference_image_url,
          reference_image_path: deletingCurrentPrimary ? (nextPrimaryRow?.file_path ?? null) : current.reference_image_path,
          metadata: {
            ...currentMetadata,
            avatar_image_url: avatarWasDeleted ? (nextAvatarRow ? getImageUrl(nextAvatarRow) ?? undefined : undefined) : currentMetadata.avatar_image_url,
            avatar_image_path: avatarWasDeleted ? (nextAvatarRow?.file_path ?? undefined) : currentMetadata.avatar_image_path,
            avatar_image_row_id: avatarWasDeleted ? (nextAvatarRow?.id ?? undefined) : currentMetadata.avatar_image_row_id,
            avatar_image_updated_at: avatarWasDeleted ? new Date().toISOString() : currentMetadata.avatar_image_updated_at,
          } as unknown as Json,
        };
      });

      return { previousCharacter, previousImages };
    },
    onSuccess: async () => {
      await refreshCharacterQueries();
      setActivityToast(null);
      toast.success('Imagen eliminada');
    },
    onError: (error, _image, context) => {
      setActivityToast(null);
      if (context?.previousCharacter) {
        queryClient.setQueryData(queryKeys.characters.detail(charId), context.previousCharacter);
      }
      if (context?.previousImages) {
        queryClient.setQueryData(queryKeys.characters.images(charId), context.previousImages);
      }
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar la imagen');
    },
  });

  const handleUploadChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    uploadImagesMutation.mutate({ selectedFiles: files, target: uploadTarget });
    event.target.value = '';
  };

  const handleSetPrimaryImage = useCallback(async (selectedImage: GalleryItem) => {
    setImageActionId(selectedImage.id);
    try {
      await setPrimaryImageMutation.mutateAsync(selectedImage);
    } finally {
      setImageActionId(null);
    }
  }, [setPrimaryImageMutation]);

  const handleGenerateTurnaroundFromImage = useCallback(async (selectedImage: GalleryItem) => {
    setImageActionId(selectedImage.id);
    try {
      setActivityToast({
        title: 'Generando turnaround',
        detail: 'Guardando el prompt maestro desde la referencia elegida',
      });
      await saveTurnaroundPromptMutation.mutateAsync({ image: selectedImage });
    } finally {
      setImageActionId(null);
    }
  }, [saveTurnaroundPromptMutation]);

  const handleSetAvatarImage = useCallback(async (selectedImage: GalleryItem) => {
    setImageActionId(selectedImage.id);
    try {
      await setAvatarImageMutation.mutateAsync(selectedImage);
    } finally {
      setImageActionId(null);
    }
  }, [setAvatarImageMutation]);

  const handleDeleteGalleryImage = useCallback(async (selectedImage: GalleryItem) => {
    setImageActionId(selectedImage.id);
    try {
      await deleteImageMutation.mutateAsync(selectedImage);
    } finally {
      setImageActionId(null);
    }
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
      body: JSON.stringify({
        imageUrl: image.url,
        entityType: 'character',
        entityId: charId,
        persistReferenceSheetPrompt: false,
      }),
    });

    const payload = (await response.json().catch(() => null)) as { analysis?: Record<string, unknown>; error?: string } | null;
    if (!response.ok || !payload?.analysis) {
      throw new Error(payload?.error ?? 'No se pudo analizar la imagen');
    }

    await refreshCharacterQueries();
    return payload.analysis;
  }, [charId, refreshCharacterQueries]);

  const handleAnalyzeSelectedImage = async () => {
    const selectedImage = galleryItems.find((image) => image.id === selectedImageId) ?? primaryGalleryItem;
    if (!selectedImage) {
      toast.error('No hay imagen seleccionada');
      return;
    }

    setFieldLoadingKey('reference-analysis');
    setActivityToast({
      title: 'Generando turnaround',
      detail: 'Construyendo el prompt maestro desde la referencia seleccionada',
    });
    try {
      await saveTurnaroundPromptMutation.mutateAsync({ image: selectedImage });
      setImagePickerOpen(false);
    } catch (error) {
      setActivityToast(null);
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el prompt');
    } finally {
      setFieldLoadingKey(null);
    }
  };

  const runFieldAi = useCallback(async (fieldKey: string) => {
    if (!project || !character) return;
    if (!primaryGalleryItem) {
      toast.error('Selecciona o sube una imagen principal primero');
      return;
    }

    setFieldLoadingKey(fieldKey);
    setActivityToast({
      title: 'IA trabajando',
      detail: `Generando contenido para ${fieldKey.replaceAll('_', ' ')}`,
    });

    try {
      if (fieldKey === 'ai_prompt_description') {
        await analyzeFromImage(primaryGalleryItem);
        setActivityToast(null);
        toast.success('Descripción IA regenerada desde la referencia principal');
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

      if (!partialUpdate || Object.keys(partialUpdate).length === 0) {
        setActivityToast(null);
        toast.error('La IA no devolvió contenido para este campo');
        return;
      }

      await updateMutation.mutateAsync(partialUpdate);
      setActivityToast(null);
      toast.success('Campo actualizado con IA');
    } catch (error) {
      setActivityToast(null);
      toast.error(error instanceof Error ? error.message : 'No se pudo generar el campo');
    } finally {
      setFieldLoadingKey(null);
    }
  }, [analyzeFromImage, charId, character, enrichMutation, primaryGalleryItem, project, promptMutation, updateMutation]);

  const handleCopy = async (value: string | string[] | null | undefined, label: string) => {
    const serialized = serializeCopyValue(value);
    if (!serialized) {
      toast.error(`No hay ${label.toLowerCase()} para copiar`);
      return;
    }
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
    setActivityToast({
      title: 'Analizando escenas',
      detail: 'Revisando continuidad y uso del personaje en el storyboard',
    });
    try {
      const response = await sceneSummaryMutation.mutateAsync({ projectId: project.id, characterId: charId });
      setAiResult(response.result);
      setAiResultOpen(true);
    } catch (error) {
      setActivityToast(null);
      toast.error(error instanceof Error ? error.message : 'No se pudo analizar el uso en escenas');
    } finally {
      setActivityToast(null);
      setFieldLoadingKey(null);
    }
  };

  if (characterLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
      </div>
    );
  }

  if (!character) {
    return <div className="p-6 text-center text-muted-foreground">Personaje no encontrado</div>;
  }

  return (
    <div className="w-full px-4 pb-8 pt-4 lg:px-6 2xl:px-8">
      <section className="relative overflow-hidden rounded-[20px] border border-border bg-card shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(76,141,255,0.12),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(210,150,70,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0))]" />
        <div className="relative p-4 lg:p-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span>{project?.title ?? 'Workspace'}</span>
              <span>{character.role ?? 'Character'}</span>
              <span>{galleryItems.length} references</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-primary">
                <Sparkles className="h-3 w-3" />
                Character System
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                <Palette className="h-3 w-3" />
                Ready {readinessScore}%
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <h1 className="text-[2rem] font-semibold tracking-tight text-foreground lg:text-[2.35rem]">{character.name}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {character.description || 'Define una referencia visual fuerte, prompts reutilizables y reglas de consistencia para que el personaje se comporte como una unidad creativa estable en escenas, imágenes y narración.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 xl:justify-end">
                <HeroButton onClick={() => openUploadPicker('reference')} icon={<ImagePlus className="h-4 w-4" />} label={uploadImagesMutation.isPending && uploadTarget === 'reference' ? 'Subiendo referencias...' : 'Upload references'} muted isDisabled={uploadImagesMutation.isPending} />
                <HeroButton
                  onClick={() => {
                    if (!galleryItems.length) {
                      toast.error('Sube primero una imagen de referencia');
                      return;
                    }
                    setSelectedImageId(primaryGalleryItem?.id ?? galleryItems[0]?.id ?? null);
                    setImagePickerOpen(true);
                  }}
                  icon={fieldLoadingKey === 'reference-analysis' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  label="Generate Turnaround"
                  isDisabled={fieldLoadingKey !== null || saveTurnaroundPromptMutation.isPending}
                />
                <HeroButton
                  onClick={() => void handleSceneSummary()}
                  icon={fieldLoadingKey === 'scene-summary' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
                  label="View Usage"
                  secondary
                  isDisabled={fieldLoadingKey !== null}
                />
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} tone={metric.tone} compact />
              ))}
            </div>
          </div>
        </div>
      </section>

      <input ref={fileInputRef} type="file" multiple={uploadTarget === 'reference'} accept="image/*" className="hidden" onChange={handleUploadChange} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.68fr)_19rem]">
        <div className="space-y-6">
          <section className="rounded-[20px] border border-border bg-card p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Library</div>
                <div className="h-1 w-1 rounded-full bg-border" />
                <h2 className="text-sm font-medium tracking-tight text-foreground">Featured</h2>
              </div>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                <span>Grid View</span>
                <span className="text-primary">Featured</span>
              </div>
            </div>

            <div className="mt-2.5 grid gap-3 xl:grid-cols-[minmax(22rem,35rem)_minmax(14rem,18rem)] xl:items-start">
              <FeaturedPrimaryAssetCard
                image={primaryGalleryItem}
                isAvatar={avatarSelectionKey === (primaryGalleryItem?.imageRowId ?? primaryGalleryItem?.url ?? null)}
                busy={imageActionId === primaryGalleryItem?.id}
                onPreview={openPreview}
                onSetPrimary={handleSetPrimaryImage}
                onGenerateFromImage={handleGenerateTurnaroundFromImage}
                onSetAvatar={handleSetAvatarImage}
                onDelete={handleDeleteGalleryImage}
                onUpload={() => openUploadPicker('reference')}
              />

              <div className="grid grid-cols-2 gap-3 content-start">
                {libraryTileItems.map((image) => (
                  <CompactGalleryTile
                    key={image.id}
                    image={image}
                    isAvatar={avatarSelectionKey === (image.imageRowId ?? image.url)}
                    busy={imageActionId === image.id}
                    onPreview={openPreview}
                    onSetPrimary={handleSetPrimaryImage}
                    onGenerateFromImage={handleGenerateTurnaroundFromImage}
                    onSetAvatar={handleSetAvatarImage}
                    onDelete={handleDeleteGalleryImage}
                  />
                ))}
                <AssetUploadTile
                  label={uploadImagesMutation.isPending && uploadTarget === 'reference' ? 'Subiendo...' : 'Add Tile'}
                  icon={uploadImagesMutation.isPending && uploadTarget === 'reference' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
                  onClick={() => openUploadPicker('reference')}
                />
              </div>
            </div>

            {!primaryGalleryItem && !avatarGalleryItem && galleryItems.length === 0 ? (
              <div className="mt-4 rounded-[20px] border border-dashed border-border bg-background/70 px-5 py-10 text-center text-sm text-muted-foreground">
                Sube una imagen de referencia y una de avatar para construir esta biblioteca visual.
              </div>
            ) : null}

          </section>

          <section className="rounded-[22px] border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Core Identity Parameters</div>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Character DNA</h2>
              </div>
              <button
                type="button"
                onClick={() => void handleCopy(character.prompt_snippet, 'Prompt de escena')}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy scene prompt
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <TextFieldPanel
                title="Visual Description"
                value={character.visual_description}
                fieldKey="visual_description"
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveField}
                onCancel={() => setEditField(null)}
                onCopy={() => void handleCopy(character.visual_description, 'Descripción visual')}
                onGenerate={() => void runFieldAi('visual_description')}
                aiEnabled
                isAiLoading={fieldLoadingKey === 'visual_description'}
                isSaving={updateMutation.isPending && editField === 'visual_description'}
              />
              <TextFieldPanel
                title="Personality Model"
                value={character.personality}
                fieldKey="personality"
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveField}
                onCancel={() => setEditField(null)}
                onCopy={() => void handleCopy(character.personality, 'Personalidad')}
                onGenerate={() => void runFieldAi('personality')}
                aiEnabled
                isAiLoading={fieldLoadingKey === 'personality'}
                isSaving={updateMutation.isPending && editField === 'personality'}
              />
              <TextFieldPanel
                title="Narrative Brief"
                value={character.description}
                fieldKey="description"
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveField}
                onCancel={() => setEditField(null)}
                onCopy={() => void handleCopy(character.description, 'Descripción narrativa')}
                onGenerate={() => void runFieldAi('description')}
                aiEnabled
                isAiLoading={fieldLoadingKey === 'description'}
                isSaving={updateMutation.isPending && editField === 'description'}
              />
              <TextFieldPanel
                title="AI Visual Prompt"
                value={character.ai_prompt_description}
                fieldKey="ai_prompt_description"
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveField}
                onCancel={() => setEditField(null)}
                onCopy={() => void handleCopy(character.ai_prompt_description, 'Descripción IA')}
                onGenerate={() => void runFieldAi('ai_prompt_description')}
                aiEnabled
                isAiLoading={fieldLoadingKey === 'ai_prompt_description'}
                isSaving={updateMutation.isPending && editField === 'ai_prompt_description'}
              />
              <TextFieldPanel
                title="Hair Description"
                value={character.hair_description}
                fieldKey="hair_description"
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveField}
                onCancel={() => setEditField(null)}
                onCopy={() => void handleCopy(character.hair_description, 'Cabello')}
                onGenerate={() => void runFieldAi('hair_description')}
                aiEnabled
                isAiLoading={fieldLoadingKey === 'hair_description'}
                isSaving={updateMutation.isPending && editField === 'hair_description'}
              />
              <TextFieldPanel
                title="Clothing and Material Protocol"
                value={character.signature_clothing}
                fieldKey="signature_clothing"
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveField}
                onCancel={() => setEditField(null)}
                onCopy={() => void handleCopy(character.signature_clothing, 'Ropa')}
                onGenerate={() => void runFieldAi('signature_clothing')}
                aiEnabled
                isAiLoading={fieldLoadingKey === 'signature_clothing'}
                isSaving={updateMutation.isPending && editField === 'signature_clothing'}
              />
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_13rem]">
              <ListFieldPanel
                title="Accessories"
                values={character.accessories ?? []}
                fieldKey="accessories"
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveField}
                onCancel={() => setEditField(null)}
                onCopy={() => void handleCopy(character.accessories, 'Accesorios')}
                isSaving={updateMutation.isPending && editField === 'accessories'}
              />
              <ListFieldPanel
                title="Signature Tools"
                values={character.signature_tools ?? []}
                fieldKey="signature_tools"
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveField}
                onCancel={() => setEditField(null)}
                onCopy={() => void handleCopy(character.signature_tools, 'Herramientas')}
                isSaving={updateMutation.isPending && editField === 'signature_tools'}
              />
              <ColorAccentPanel
                color={character.color_accent}
                fieldKey="color_accent"
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveField}
                onCancel={() => setEditField(null)}
                isSaving={updateMutation.isPending && editField === 'color_accent'}
              />
            </div>
          </section>

          <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.02fr)]">
            <PromptFieldPanel
              title="Scene Prompt"
              description="Reusable fragment for scene generation, narrative visuals and shot prompts."
              value={character.prompt_snippet}
              helper="This is the fast operational prompt stack for scenes."
              onCopy={() => void handleCopy(character.prompt_snippet, 'Prompt de escena')}
              onGenerate={() => void runFieldAi('prompt_snippet')}
              onEdit={() => startEdit('prompt_snippet', character.prompt_snippet)}
              isLoading={fieldLoadingKey === 'prompt_snippet'}
            />
            <TurnaroundPanel
              value={metadata?.ai_reference_sheet_prompt ?? null}
              onCopy={() => void handleCopy(metadata?.ai_reference_sheet_prompt, 'Prompt de turnaround')}
              onGenerate={() => {
                if (!galleryItems.length) {
                  toast.error('Sube primero una imagen');
                  return;
                }
                setSelectedImageId(primaryGalleryItem?.id ?? galleryItems[0]?.id ?? null);
                setImagePickerOpen(true);
              }}
              isLoading={fieldLoadingKey === 'reference-analysis'}
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[22px] border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Continuity</div>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Readiness and guardrails</h2>
              </div>
              <span className="text-xl font-semibold tracking-tight text-foreground">{readinessScore}%</span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${readinessScore}%` }} />
            </div>

            <div className="mt-4 space-y-2.5">
              <ReadinessRow label="Main reference uploaded" ready={Boolean(primaryGalleryItem)} />
              <ReadinessRow label="Personality archetype defined" ready={Boolean(character.personality)} />
              <ReadinessRow label="Core color palette locked" ready={Boolean(character.color_accent)} />
              <ReadinessRow label="Scene prompt ready" ready={Boolean(character.prompt_snippet)} />
              <ReadinessRow label="Turnaround prompt generated" ready={Boolean(metadata?.ai_reference_sheet_prompt)} />
            </div>

            <div className="mt-4 space-y-3">
              <RuleGroup title="Always Include" items={rules.always ?? []} tone="positive" onRemove={(index) => removeRule('always', index)} emptyLabel="Sin reglas fijas todavía" />
              <RuleGroup title="Never Include" items={rules.never ?? []} tone="negative" onRemove={(index) => removeRule('never', index)} emptyLabel="Sin restricciones todavía" />
            </div>

            <div className="mt-4 flex gap-2">
              <select value={ruleType} onChange={(event) => setRuleType(event.target.value as 'always' | 'never')} className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground">
                <option value="always">Always</option>
                <option value="never">Never</option>
              </select>
              <input value={newRule} onChange={(event) => setNewRule(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addRule()} placeholder="Add guardrail..." className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50" />
              <button type="button" onClick={addRule} className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent">+</button>
            </div>
          </section>

          <section className="rounded-[22px] border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Scene Appearances</div>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Story usage</h2>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/project/${shortId}/videos`)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                View storyboard
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              {sceneLinks.length > 0 ? (
                sceneLinks.slice(0, 4).map((link) => (
                  <div key={link.scene_id} className="rounded-2xl border border-border bg-background px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Scene {link.scene.scene_number}</p>
                        <p className="mt-1 text-sm font-medium text-foreground">{link.scene.title}</p>
                      </div>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground">{link.role_in_scene ?? 'linked'}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground">
                  Todavía no aparece en escenas.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <ModalShell
        open={imagePickerOpen}
        onOpenChange={setImagePickerOpen}
        title="Elegir imagen base"
        description="Selecciona la referencia exacta para regenerar el prompt maestro del turnaround sheet del personaje."
        dialogClassName="sm:max-w-150"
        footer={(
          <>
            <Button variant="ghost" onPress={() => setImagePickerOpen(false)}>Cancelar</Button>
            <Button variant="primary" onPress={handleAnalyzeSelectedImage} isDisabled={!selectedImageId || fieldLoadingKey === 'reference-analysis'}>
              {fieldLoadingKey === 'reference-analysis' ? 'Generando...' : 'Generar turnaround'}
            </Button>
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
                  'overflow-hidden rounded-2xl border text-left transition',
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

      <AiResultDrawer
        open={aiResultOpen}
        result={aiResult}
        onClose={() => {
          setAiResultOpen(false);
          setAiResult(null);
        }}
      />

      <ActivityToast activity={activityToast} />
    </div>
  );
}

function HeroButton({
  onClick,
  icon,
  label,
  muted,
  secondary,
  isDisabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  muted?: boolean;
  secondary?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'inline-flex h-8 items-center justify-center gap-2 rounded-lg px-2.5 text-[11px] font-medium transition-colors disabled:opacity-60',
        muted
          ? 'border border-border bg-background/90 text-foreground hover:bg-accent'
          : secondary
            ? 'border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15'
            : 'bg-primary text-primary-foreground hover:bg-primary/90'
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function MetricCard({ label, value, detail, tone, compact }: { label: string; value: string; detail: string; tone: 'default' | 'primary' | 'success'; compact?: boolean; }) {
  return (
    <div className={cn('rounded-[14px] border border-border bg-background/70 backdrop-blur-sm', compact ? 'p-2.5' : 'p-4')}>
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={cn(
        compact ? 'mt-1 text-lg font-semibold tracking-tight' : 'mt-2 text-3xl font-semibold tracking-tight',
        tone === 'primary' ? 'text-primary' : tone === 'success' ? 'text-emerald-300' : 'text-foreground'
      )}>{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function FeaturedPrimaryAssetCard({
  image,
  isAvatar,
  busy,
  onPreview,
  onSetPrimary,
  onGenerateFromImage,
  onSetAvatar,
  onDelete,
  onUpload,
}: {
  image: GalleryItem | null;
  isAvatar?: boolean;
  busy?: boolean;
  onPreview: (imageId: string) => void;
  onSetPrimary: (image: GalleryItem) => Promise<void>;
  onGenerateFromImage: (image: GalleryItem) => Promise<void>;
  onSetAvatar: (image: GalleryItem) => Promise<void>;
  onDelete: (image: GalleryItem) => Promise<void>;
  onUpload: () => void;
}) {
  if (!image) {
    return (
      <button
        type="button"
        onClick={onUpload}
        className="flex min-h-[23rem] flex-col items-center justify-center rounded-[22px] border border-dashed border-border bg-background/70 px-6 text-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground">
          <ImagePlus className="h-5 w-5" />
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">Primary reference</p>
        <p className="mt-2 max-w-md text-sm leading-6">Sube una imagen y márcala como principal para fijar el asset destacado del personaje.</p>
      </button>
    );
  }

  return (
    <div className="group w-full max-w-[34rem] overflow-hidden rounded-[22px] border border-primary/25 bg-background/80 shadow-[0_0_0_1px_rgba(76,141,255,0.1)] xl:mx-0">
      <div className="relative aspect-[1/1.08] w-full overflow-hidden">
        <button type="button" onClick={() => onPreview(image.id)} className="absolute inset-0 block">
          <Image src={image.url} alt={image.label} fill className="object-cover transition duration-300 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,18,0.05),rgba(6,10,18,0.24)_35%,rgba(6,10,18,0.72))]" />
        </button>

        <div className="absolute left-3 top-3 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-foreground shadow-lg">
            <Check className="h-3 w-3" />
            Primary
          </span>
          {isAvatar ? (
            <span className="inline-flex items-center rounded-full border border-white/15 bg-black/55 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              Avatar
            </span>
          ) : null}
        </div>

        <div className="absolute right-3 top-3">
          <AssetActionsMenu
            image={image}
            isAvatar={isAvatar}
            busy={busy}
            onSetPrimary={onSetPrimary}
            onSetAvatar={onSetAvatar}
            onGenerateFromImage={onGenerateFromImage}
            onDelete={onDelete}
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3">
          <div className="rounded-[16px] border border-white/10 bg-black/45 px-3 py-2.5 backdrop-blur-md">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                {!isGenericAssetLabel(image.label) ? (
                  <p className="truncate text-sm font-semibold text-white">{image.label}</p>
                ) : null}
                <p className="mt-1 text-[12px] text-white/72">Imagen base para IA y consistencia visual.</p>
              </div>
              <button
                type="button"
                onClick={() => void onGenerateFromImage(image)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/15"
              >
                <Wand2 className="h-3 w-3" />
                Turnaround
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetUploadTile({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-square min-h-[7rem] flex-col items-center justify-center rounded-[18px] border border-dashed border-border bg-background px-4 text-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground">
        {icon}
      </div>
      <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em]">{label}</span>
    </button>
  );
}

function CompactGalleryTile({
  image,
  isAvatar,
  busy,
  onPreview,
  onSetPrimary,
  onGenerateFromImage,
  onSetAvatar,
  onDelete,
}: {
  image: GalleryItem;
  isAvatar?: boolean;
  busy?: boolean;
  onPreview: (imageId: string) => void;
  onSetPrimary: (image: GalleryItem) => Promise<void>;
  onGenerateFromImage: (image: GalleryItem) => Promise<void>;
  onSetAvatar: (image: GalleryItem) => Promise<void>;
  onDelete: (image: GalleryItem) => Promise<void>;
}) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-[20px] border bg-background transition-all hover:-translate-y-0.5 hover:shadow-lg',
        image.isPrimary ? 'border-primary/50 shadow-[0_0_0_1px_rgba(76,141,255,0.24)]' : 'border-border hover:border-primary/30'
      )}
    >
      <button
        type="button"
        onClick={() => onPreview(image.id)}
        className="relative block aspect-[1/1.08] w-full cursor-pointer overflow-hidden"
      >
        <Image src={image.url} alt={image.label} fill className="object-cover transition duration-200 group-hover:scale-[1.02]" />
        <div className={cn(
          'absolute inset-0',
          image.isPrimary
            ? 'bg-[linear-gradient(180deg,rgba(11,16,24,0.04),rgba(10,18,34,0.72))]'
            : 'bg-[linear-gradient(180deg,rgba(7,10,14,0.08),rgba(7,10,14,0.62))]'
        )} />

        {image.isPrimary || isAvatar ? (
          <div className="absolute left-2.5 top-2.5 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1.5">
            {image.isPrimary ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-foreground shadow-sm">
                <Check className="h-3 w-3" />
                Principal
              </span>
            ) : null}
            {isAvatar ? (
              <span className="inline-flex items-center rounded-full border border-white/15 bg-black/55 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                Avatar
              </span>
            ) : null}
          </div>
        ) : null}
      </button>

      <div className="absolute right-2 top-2 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <AssetActionsMenu
          image={image}
          isAvatar={isAvatar}
          busy={busy}
          onSetPrimary={onSetPrimary}
          onSetAvatar={onSetAvatar}
          onGenerateFromImage={onGenerateFromImage}
          onDelete={onDelete}
        />
      </div>

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
  compact,
}: {
  image: GalleryItem;
  isAvatar?: boolean;
  busy?: boolean;
  onSetPrimary: (image: GalleryItem) => Promise<void>;
  onGenerateFromImage: (image: GalleryItem) => Promise<void>;
  onSetAvatar: (image: GalleryItem) => Promise<void>;
  onDelete: (image: GalleryItem) => Promise<void>;
  compact?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-lg border border-white/15 bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/75',
            compact ? 'h-8 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em]' : 'h-7 w-7'
          )}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : compact ? 'Actions' : <MoreHorizontal className="h-3.5 w-3.5" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="justify-between">
            <span className="inline-flex items-center">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Usar
            </span>
            <ChevronRight className="h-4 w-4 opacity-60" />
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => void onSetPrimary(image)}
                className="justify-between"
              >
                <span className="inline-flex items-center">
                  <Check className="mr-2 h-4 w-4" />
                  Principal
                </span>
                {image.isPrimary ? <Check className="h-4 w-4 text-primary" /> : null}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => void onSetAvatar(image)}
                className="justify-between"
              >
                <span className="inline-flex items-center">
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Avatar
                </span>
                {isAvatar ? <Check className="h-4 w-4 text-primary" /> : null}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={() => void onGenerateFromImage(image)}>
          <Wand2 className="mr-2 h-4 w-4" />
          Generar turnaround
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => void onDelete(image)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar imagen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PanelActionButton({ onClick, icon, label, loading, isDisabled }: { onClick: () => void; icon: React.ReactNode; label: string; loading?: boolean; isDisabled?: boolean; }) {
  return (
    <button type="button" onClick={onClick} disabled={isDisabled} className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-[11px] font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function TextFieldPanel({
  title,
  value,
  fieldKey,
  editField,
  editValue,
  onStartEdit,
  onEditValueChange,
  onSave,
  onCancel,
  onCopy,
  onGenerate,
  aiEnabled,
  isAiLoading,
  isSaving,
}: {
  title: string;
  value: string | null | undefined;
  fieldKey: string;
  editField: string | null;
  editValue: string;
  onStartEdit: (field: string, value: string | string[] | null | undefined) => void;
  onEditValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onCopy: () => void;
  onGenerate: () => void;
  aiEnabled?: boolean;
  isAiLoading?: boolean;
  isSaving?: boolean;
}) {
  const isEditing = editField === fieldKey;

  return (
    <section className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          {aiEnabled ? <PanelActionButton onClick={onGenerate} icon={<Sparkles className="h-3.5 w-3.5 text-primary" />} label="IA" loading={isAiLoading} /> : null}
          <button type="button" onClick={onCopy} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Copy className="h-3.5 w-3.5" />
          </button>
          {!isEditing ? (
            <button type="button" onClick={() => onStartEdit(fieldKey, value)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <PenLine className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <textarea value={editValue} onChange={(event) => onEditValueChange(event.target.value)} rows={5} className="w-full rounded-2xl border border-border bg-card p-3 text-sm text-foreground focus:border-primary focus:outline-none" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onPress={onCancel}>Cancelar</Button>
            <Button variant="primary" onPress={onSave} isDisabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-foreground/90">{value || 'Sin contenido todavía.'}</p>
      )}
    </section>
  );
}

function ListFieldPanel({
  title,
  values,
  fieldKey,
  editField,
  editValue,
  onStartEdit,
  onEditValueChange,
  onSave,
  onCancel,
  onCopy,
  isSaving,
}: {
  title: string;
  values: string[];
  fieldKey: string;
  editField: string | null;
  editValue: string;
  onStartEdit: (field: string, value: string | string[] | null | undefined) => void;
  onEditValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onCopy: () => void;
  isSaving?: boolean;
}) {
  const isEditing = editField === fieldKey;

  return (
    <section className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCopy} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Copy className="h-3.5 w-3.5" />
          </button>
          {!isEditing ? (
            <button type="button" onClick={() => onStartEdit(fieldKey, values)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
              <PenLine className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <textarea value={editValue} onChange={(event) => onEditValueChange(event.target.value)} rows={4} className="w-full rounded-2xl border border-border bg-card p-3 text-sm text-foreground focus:border-primary focus:outline-none" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onPress={onCancel}>Cancelar</Button>
            <Button variant="primary" onPress={onSave} isDisabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </div>
      ) : values.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {values.map((value) => (
            <span key={`${title}-${value}`} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-foreground">{value}</span>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">Sin elementos todavía.</p>
      )}
    </section>
  );
}

function ColorAccentPanel({
  color,
  fieldKey,
  editField,
  editValue,
  onStartEdit,
  onEditValueChange,
  onSave,
  onCancel,
  isSaving,
}: {
  color: string | null | undefined;
  fieldKey: string;
  editField: string | null;
  editValue: string;
  onStartEdit: (field: string, value: string | string[] | null | undefined) => void;
  onEditValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}) {
  const isEditing = editField === fieldKey;

  return (
    <section className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Color Accent</p>
        {!isEditing ? (
          <button type="button" onClick={() => onStartEdit(fieldKey, color)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <PenLine className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {isEditing ? (
        <div className="mt-4 space-y-3">
          <input value={editValue} onChange={(event) => onEditValueChange(event.target.value)} className="w-full rounded-2xl border border-border bg-card p-3 text-sm text-foreground focus:border-primary focus:outline-none" placeholder="#4C8DFF" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onPress={onCancel}>Cancelar</Button>
            <Button variant="primary" onPress={onSave} isDisabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl border border-border" style={{ backgroundColor: color ?? '#4C8DFF' }} />
          <div>
            <p className="text-sm font-medium text-foreground">{color ?? '#4C8DFF'}</p>
            <p className="text-xs text-muted-foreground">Swatch base para el personaje.</p>
          </div>
        </div>
      )}
    </section>
  );
}

function PromptFieldPanel({
  title,
  description,
  value,
  helper,
  onCopy,
  onGenerate,
  onEdit,
  isLoading,
}: {
  title: string;
  description: string;
  value: string | null | undefined;
  helper?: string;
  onCopy: () => void;
  onGenerate: () => void;
  onEdit: () => void;
  isLoading?: boolean;
}) {
  return (
    <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Prompt Layer</div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <PanelActionButton onClick={onGenerate} icon={<Sparkles className="h-3.5 w-3.5 text-primary" />} label="IA" loading={isLoading} />
          <button type="button" onClick={onCopy} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onEdit} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <PenLine className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-4">
        <p className="font-mono text-sm leading-6 text-muted-foreground">{value || 'Todavía no se ha generado este prompt.'}</p>
      </div>
      {helper ? <p className="mt-3 text-xs text-muted-foreground">{helper}</p> : null}
    </section>
  );
}

function TurnaroundPanel({ value, onCopy, onGenerate, isLoading }: { value: string | null; onCopy: () => void; onGenerate: () => void; isLoading?: boolean; }) {
  return (
    <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Character Turnaround</div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Reference sheet prompt</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Genera ortografías multi-view, croma verde y consistencia de render 3D para una imagen de referencia profesional.</p>
        </div>
        <div className="flex items-center gap-2">
          <PanelActionButton onClick={onGenerate} icon={<Wand2 className="h-3.5 w-3.5 text-primary" />} label="Generate Turnaround" loading={isLoading} />
          <button type="button" onClick={onCopy} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-[24px] border border-emerald-500/18 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.10),transparent_40%),linear-gradient(180deg,rgba(14,64,40,0.92),rgba(12,50,34,0.96))] p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-emerald-100">CharacterTurnaround</p>
          <span className="rounded-full border border-emerald-400/25 bg-emerald-500/12 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-emerald-200">3D Reference</span>
        </div>
        <div className="mt-4 rounded-[22px] border border-emerald-400/10 bg-black/12 p-5">
          <div className="grid grid-cols-3 gap-4 text-emerald-300/70">
            <TurnaroundGhost />
            <TurnaroundGhost />
            <TurnaroundGhost />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background p-4">
        <p className="font-mono text-sm leading-6 text-muted-foreground">{value || 'Todavía no se ha generado un turnaround sheet prompt.'}</p>
      </div>
    </section>
  );
}

function TurnaroundGhost() {
  return (
    <div className="flex h-28 items-center justify-center rounded-2xl border border-emerald-400/10 bg-black/10">
      <div className="relative h-12 w-8 rounded-full border border-emerald-300/35">
        <div className="absolute left-1/2 top-[-10px] h-5 w-5 -translate-x-1/2 rounded-full border border-emerald-300/35" />
        <div className="absolute left-[-10px] top-3 h-px w-7 bg-emerald-300/35" />
        <div className="absolute right-[-10px] top-3 h-px w-7 bg-emerald-300/35" />
        <div className="absolute bottom-[-12px] left-2 h-7 w-px bg-emerald-300/35" />
        <div className="absolute bottom-[-12px] right-2 h-7 w-px bg-emerald-300/35" />
      </div>
    </div>
  );
}

function ReadinessRow({ label, ready, compact }: { label: string; ready: boolean; compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border border-border bg-background', compact ? 'px-2.5 py-2.5' : 'px-3 py-3')}>
      {ready ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <div className="h-4 w-4 rounded-full border border-muted-foreground/50" />}
      <span className={cn('text-foreground', compact ? 'text-xs' : 'text-sm')}>{label}</span>
    </div>
  );
}

function RuleGroup({ title, items, tone, onRemove, emptyLabel }: { title: string; items: string[]; tone: 'positive' | 'negative'; onRemove: (index: number) => void; emptyLabel: string; }) {
  const toneClasses = tone === 'positive'
    ? 'border-emerald-500/18 bg-emerald-500/8 text-emerald-300'
    : 'border-rose-500/18 bg-rose-500/8 text-rose-300';

  return (
    <div>
      <div className={cn('inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em]', toneClasses)}>{title}</div>
      {items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <button key={`${title}-${item}-${index}`} type="button" onClick={() => onRemove(index)} className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-opacity hover:opacity-80', toneClasses)}>
              <span>{item}</span>
              <span className="text-[10px]">x</span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

function ActivityToast({ activity }: { activity: ActivityToastState | null }) {
  return (
    <div className={cn(
      'pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-all duration-200',
      activity ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
    )}>
      <div className="inline-flex min-w-[240px] items-center gap-3 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{activity?.title ?? 'Procesando'}</p>
          <p className="truncate text-xs text-muted-foreground">{activity?.detail ?? 'Esperando'}</p>
        </div>
      </div>
    </div>
  );
}
