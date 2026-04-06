'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  Image, Clock, Users, Mountain, Copy, Download,
  CheckCircle2, AlertCircle, Loader2, Clapperboard, Eye, EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

const ARC_COLORS: Record<string, string> = {
  hook: 'border-l-blue-500', build: 'border-l-amber-500',
  peak: 'border-l-red-500', close: 'border-l-emerald-500',
};
const ARC_BG: Record<string, string> = {
  hook: 'bg-blue-500/10 text-blue-400', build: 'bg-amber-500/10 text-amber-400',
  peak: 'bg-red-500/10 text-red-400', close: 'bg-emerald-500/10 text-emerald-400',
};
const STATUS_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  draft: { icon: AlertCircle, color: 'text-zinc-400' },
  prompt_ready: { icon: CheckCircle2, color: 'text-blue-400' },
  generating: { icon: Loader2, color: 'text-amber-400' },
  generated: { icon: CheckCircle2, color: 'text-emerald-400' },
  approved: { icon: CheckCircle2, color: 'text-emerald-600' },
  rejected: { icon: AlertCircle, color: 'text-red-400' },
};

interface EnrichedScene {
  id: string; short_id: string | null; title: string; description: string | null;
  dialogue: string | null; scene_number: number; duration_seconds: number | null;
  arc_phase: string | null; status: string; director_notes: string | null;
  thumbnail_url: string | null; has_image_prompt: boolean; has_video_prompt: boolean;
  characters: string[]; background_name: string | null;
}

export default function StoryboardPage() {
  const params = useParams<{ shortId: string; videoShortId: string }>();
  const supabase = createClient();
  const [showDialogue, setShowDialogue] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const basePath = `/project/${params.shortId}/video/${params.videoShortId}`;

  const { data: video } = useQuery({
    queryKey: ['video-storyboard', params.videoShortId],
    queryFn: async () => {
      const { data } = await supabase.from('videos').select('id, title, target_duration_seconds').eq('short_id', params.videoShortId).single();
      return data;
    },
  });

  const { data: scenes, isLoading } = useQuery({
    queryKey: ['storyboard-scenes', video?.id],
    queryFn: async (): Promise<EnrichedScene[]> => {
      if (!video) return [];
      const { data: raw } = await supabase
        .from('scenes')
        .select('id, short_id, title, description, dialogue, scene_number, duration_seconds, arc_phase, status, director_notes')
        .eq('video_id', video.id)
        .order('sort_order');
      if (!raw) return [];

      return Promise.all(raw.map(async (s) => {
        const { data: media } = await supabase.from('scene_media').select('thumbnail_url, file_url').eq('scene_id', s.id).eq('media_type', 'image').eq('is_current', true).maybeSingle();
        const { data: prompts } = await supabase.from('scene_prompts').select('prompt_type').eq('scene_id', s.id).eq('is_current', true);
        const { data: chars } = await supabase.from('scene_characters').select('character:characters!character_id(name)').eq('scene_id', s.id);
        const { data: bg } = await supabase.from('scene_backgrounds').select('background:backgrounds!background_id(name)').eq('scene_id', s.id).eq('is_primary', true).maybeSingle();

        return {
          ...s,
          thumbnail_url: media?.thumbnail_url || media?.file_url || null,
          has_image_prompt: prompts?.some((p) => p.prompt_type === 'image') ?? false,
          has_video_prompt: prompts?.some((p) => p.prompt_type === 'video') ?? false,
          characters: (chars ?? []).map((c) => ((c.character as unknown as { name: string } | null)?.name ?? '?')),
          background_name: (bg?.background as unknown as { name: string } | null)?.name ?? null,
        };
      }));
    },
    enabled: !!video?.id,
  });

  const totalDuration = scenes?.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) ?? 0;

  const copyAllPrompts = async () => {
    if (!scenes?.length) return;
    const ids = scenes.filter((s) => s.has_image_prompt).map((s) => s.id);
    if (!ids.length) { toast.error('No hay prompts generados'); return; }
    const { data: prompts } = await supabase.from('scene_prompts').select('scene_id, prompt_text').in('scene_id', ids).eq('prompt_type', 'image').eq('is_current', true);
    if (!prompts?.length) { toast.error('No hay prompts'); return; }
    const text = prompts.map((p) => {
      const sc = scenes.find((s) => s.id === p.scene_id);
      return `--- Scene ${sc?.scene_number}: ${sc?.title} ---\n${p.prompt_text}`;
    }).join('\n\n');
    await navigator.clipboard.writeText(text);
    toast.success(`${prompts.length} prompts copiados`);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-video bg-muted rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Storyboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {scenes?.length ?? 0} escenas · {totalDuration}s{video?.target_duration_seconds ? ` / ${video.target_duration_seconds}s` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setShowDialogue(!showDialogue)} className={cn('flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium transition-colors cursor-pointer', showDialogue ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent')}>
            {showDialogue ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} Diálogos
          </button>
          <button onClick={() => setShowNotes(!showNotes)} className={cn('flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium transition-colors cursor-pointer', showNotes ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent')}>
            {showNotes ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} Notas
          </button>
          <button onClick={copyAllPrompts} className="flex items-center gap-1.5 px-2.5 h-8 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors cursor-pointer">
            <Copy className="h-3.5 w-3.5" /> Copiar prompts
          </button>
          <button onClick={() => toast.info('Export PDF próximamente')} className="flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-border text-xs font-medium text-foreground hover:bg-accent transition-colors cursor-pointer">
            <Download className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Empty */}
      {(!scenes || scenes.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clapperboard className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <p className="text-sm font-medium text-foreground mb-1">Sin escenas</p>
          <p className="text-xs text-muted-foreground mb-4">Crea escenas para ver el storyboard</p>
          <Link href={basePath} className="text-sm font-medium text-primary hover:underline">Ir a vista general</Link>
        </div>
      )}

      {/* Grid */}
      {scenes && scenes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {scenes.map((scene) => {
            const si = STATUS_ICON[scene.status] ?? STATUS_ICON.draft;
            const SI = si.icon;
            return (
              <Link key={scene.id} href={`${basePath}/scene/${scene.short_id}`}
                className={cn('group rounded-lg border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all', 'border-l-4', ARC_COLORS[scene.arc_phase ?? 'build'])}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {scene.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={scene.thumbnail_url} alt={scene.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Image className="h-8 w-8 text-muted-foreground/20" /></div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className={cn('flex items-center justify-center h-6 min-w-6 px-1.5 rounded text-[11px] font-bold', ARC_BG[scene.arc_phase ?? 'build'])}>{scene.scene_number}</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className="flex items-center gap-1 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      <Clock className="h-2.5 w-2.5" />{scene.duration_seconds}s
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1">
                    {scene.has_image_prompt && <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-bold px-1 py-0.5 rounded">IMG</span>}
                    {scene.has_video_prompt && <span className="bg-blue-500/20 text-blue-400 text-[9px] font-bold px-1 py-0.5 rounded">VID</span>}
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">{scene.title}</h3>
                    <SI className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', si.color)} />
                  </div>
                  {scene.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{scene.description}</p>}
                  {showDialogue && scene.dialogue && (
                    <div className="bg-muted/50 rounded px-2 py-1.5 mb-2">
                      <p className="text-xs text-foreground/80 italic line-clamp-3">"{scene.dialogue}"</p>
                    </div>
                  )}
                  {showNotes && scene.director_notes && (
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded px-2 py-1.5 mb-2">
                      <p className="text-xs text-amber-400/80 line-clamp-2">{scene.director_notes}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    {scene.characters.length > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Users className="h-3 w-3" />{scene.characters.join(', ')}</span>
                    )}
                    {scene.background_name && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><Mountain className="h-3 w-3" />{scene.background_name}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
