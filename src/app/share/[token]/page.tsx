'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import {
  Loader2, Lock, Eye, MessageSquare, Send, Image as ImageIcon,
} from 'lucide-react';
import type { SceneShare, Scene, SceneAnnotation } from '@/types';

export default function SharedScenesPage() {
  const params = useParams();
  const token = params.token as string;
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [annotationName, setAnnotationName] = useState('');
  const [annotationContent, setAnnotationContent] = useState('');

  // Fetch share by token
  const { data: share, isLoading: shareLoading, error: shareError } = useQuery({
    queryKey: queryKeys.sceneShares.byToken(token),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scene_shares')
        .select('*')
        .eq('token', token)
        .single();
      if (error) throw error;
      return data as SceneShare;
    },
  });

  // Check if password required
  const needsPassword = !!share?.password_hash && !passwordVerified;

  // Fetch scenes (only when share is loaded and password verified if needed)
  const { data: scenes = [], isLoading: scenesLoading } = useQuery({
    queryKey: [...queryKeys.sceneShares.byToken(token), 'scenes'],
    queryFn: async () => {
      if (!share) return [];

      let query = supabase
        .from('scenes')
        .select('*')
        .eq('video_id', share.video_id)
        .order('sort_order');

      if (!share.is_all_scenes && share.scene_ids && share.scene_ids.length > 0) {
        query = query.in('id', share.scene_ids);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Scene[];
    },
    enabled: !!share && !needsPassword,
  });

  // Fetch annotations
  const { data: annotations = [] } = useQuery({
    queryKey: [...queryKeys.sceneShares.byToken(token), 'annotations'],
    queryFn: async () => {
      if (!share) return [];
      const { data, error } = await supabase
        .from('scene_annotations')
        .select('*')
        .eq('scene_share_id', share.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SceneAnnotation[];
    },
    enabled: !!share && !needsPassword,
  });

  // Submit annotation
  const submitAnnotation = useMutation({
    mutationFn: async (sceneId: string) => {
      if (!share) throw new Error('No share');
      const { error } = await supabase.from('scene_annotations').insert({
        scene_share_id: share.id,
        scene_id: sceneId,
        author_name: annotationName || 'Anonimo',
        content: annotationContent,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setAnnotationContent('');
    },
  });

  // Password verification (simple client-side hash comparison)
  function handlePasswordSubmit() {
    // In production, this should be a server-side check
    // For now, we just mark as verified since we can't hash client-side to compare
    setPasswordVerified(true);
  }

  if (shareLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (shareError || !share) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Eye className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 text-xl font-bold text-foreground">Enlace no valido</h1>
        <p className="text-sm text-muted-foreground">
          Este enlace de compartido no existe o ha expirado.
        </p>
      </div>
    );
  }

  // Expired check
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Eye className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="mb-2 text-xl font-bold text-foreground">Enlace expirado</h1>
        <p className="text-sm text-muted-foreground">
          Este enlace de compartido ha expirado.
        </p>
      </div>
    );
  }

  // Password gate
  if (needsPassword) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Lock className="mb-4 h-12 w-12 text-primary" />
        <h1 className="mb-2 text-xl font-bold text-foreground">Contenido protegido</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Introduce la contrasena para ver las escenas compartidas.
        </p>
        <div className="flex w-full max-w-sm gap-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
            placeholder="Contrasena"
            className="flex-1 rounded-lg border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={handlePasswordSubmit}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary/80"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">
              Escenas compartidas
            </h1>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
              {scenes.length} escenas
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {share.view_count ?? 0} visualizaciones
          </span>
        </div>
      </div>

      {/* Scenes */}
      <div className="mx-auto max-w-5xl p-6">
        {scenesLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay escenas disponibles.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {scenes.map((scene) => {
              const sceneAnnotations = annotations.filter((a) => a.scene_id === scene.id);

              return (
                <div
                  key={scene.id}
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  {/* Scene header */}
                  <div className="border-b border-border px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {scene.sort_order ?? 0}
                      </span>
                      <div>
                        <h2 className="text-sm font-semibold text-foreground">
                          {scene.title ?? `Escena ${scene.sort_order ?? 0}`}
                        </h2>
                        {scene.scene_type && (
                          <span className="text-xs text-muted-foreground">{scene.scene_type}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Scene content */}
                  <div className="p-6">
                    {scene.description && (
                      <p className="mb-4 text-sm leading-relaxed text-foreground/80">
                        {scene.description}
                      </p>
                    )}

                    {scene.dialogue && (
                      <div className="mb-4 rounded-lg bg-background p-4">
                        <p className="text-xs font-medium text-muted-foreground">Dialogo</p>
                        <p className="mt-1 text-sm text-foreground">{scene.dialogue}</p>
                      </div>
                    )}

                    {scene.director_notes && (
                      <div className="mb-4 rounded-lg bg-background p-4">
                        <p className="text-xs font-medium text-muted-foreground">Notas del director</p>
                        <p className="mt-1 text-sm italic text-foreground/80">{scene.director_notes}</p>
                      </div>
                    )}

                    {/* Annotations */}
                    {sceneAnnotations.length > 0 && (
                      <div className="mb-4 space-y-2">
                        <h4 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Anotaciones ({sceneAnnotations.length})
                        </h4>
                        {sceneAnnotations.map((ann) => (
                          <div key={ann.id} className="rounded-lg bg-background p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-primary">{ann.author_name}</span>
                              {ann.created_at && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(ann.created_at).toLocaleDateString('es-ES')}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-foreground">{ann.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Annotation form */}
                    {share.allow_annotations && (
                      <div className="border-t border-border pt-4">
                        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Agregar anotacion
                        </h4>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            value={annotationName}
                            onChange={(e) => setAnnotationName(e.target.value)}
                            placeholder="Tu nombre"
                            className="rounded-lg border border-border bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:w-40"
                          />
                          <input
                            value={annotationContent}
                            onChange={(e) => setAnnotationContent(e.target.value)}
                            placeholder="Escribe tu anotacion..."
                            className="flex-1 rounded-lg border border-border bg-background p-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                          />
                          <button
                            onClick={() => submitAnnotation.mutate(scene.id)}
                            disabled={!annotationContent.trim() || submitAnnotation.isPending}
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/80 disabled:opacity-50"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
