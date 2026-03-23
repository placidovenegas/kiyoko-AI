'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useVideo } from '@/contexts/VideoContext';
import { useProject } from '@/contexts/ProjectContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Share2,
  Link2,
  Copy,
  Plus,
  Eye,
  Shield,
  Clock,
  Trash2,
  Check,
  MessageSquare,
} from 'lucide-react';
import type { SceneShare, SceneShareInsert } from '@/types';

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function ShareScenesPage() {
  const { video, loading: videoLoading } = useVideo();
  const { project } = useProject();
  const queryClient = useQueryClient();

  // ── Form state ──
  const [showForm, setShowForm] = useState(false);
  const [isAllScenes, setIsAllScenes] = useState(true);
  const [allowAnnotations, setAllowAnnotations] = useState(true);
  const [password, setPassword] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── Query ──
  const { data: shares = [], isLoading } = useQuery({
    queryKey: ['scene-shares', video?.id],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('scene_shares')
        .select('*')
        .eq('video_id', video!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SceneShare[];
    },
    enabled: !!video?.id,
  });

  // ── Create mutation ──
  const createShare = useMutation({
    mutationFn: async () => {
      if (!video || !project) throw new Error('Missing context');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const token = generateToken();
      const insertData: SceneShareInsert = {
        video_id: video.id,
        project_id: project.id,
        shared_by: user.id,
        token,
        is_all_scenes: isAllScenes,
        allow_annotations: allowAnnotations,
        password_hash: password.trim() || null,
      };

      const { error } = await supabase
        .from('scene_shares')
        .insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scene-shares', video?.id] });
      setShowForm(false);
      setPassword('');
      toast.success('Enlace de compartir creado');
    },
    onError: () => {
      toast.error('Error al crear enlace');
    },
  });

  // ── Delete mutation ──
  const deleteShare = useMutation({
    mutationFn: async (shareId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('scene_shares')
        .delete()
        .eq('id', shareId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scene-shares', video?.id] });
      toast.success('Enlace eliminado');
    },
  });

  const copyLink = (token: string, shareId: string) => {
    const url = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedId(shareId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Enlace copiado');
  };

  const loading = videoLoading || isLoading;

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-card" />
        <div className="h-48 animate-pulse rounded-xl bg-card" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-card" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl h-full overflow-y-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Compartir escenas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crea enlaces para compartir las escenas de este video
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nuevo enlace
        </button>
      </div>

      {/* ── Create form ── */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Crear nuevo enlace</h3>

          <div className="space-y-4">
            {/* All scenes toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllScenes}
                onChange={(e) => setIsAllScenes(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <div>
                <span className="text-sm text-foreground">Todas las escenas</span>
                <p className="text-xs text-muted-foreground">Comparte todas las escenas del video</p>
              </div>
            </label>

            {/* Allow annotations */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowAnnotations}
                onChange={(e) => setAllowAnnotations(e.target.checked)}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <div>
                <span className="text-sm text-foreground">Permitir anotaciones</span>
                <p className="text-xs text-muted-foreground">Los invitados pueden dejar comentarios</p>
              </div>
            </label>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Contrasena (opcional)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar vacio para acceso sin contrasena"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() => createShare.mutate()}
                disabled={createShare.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                <Link2 className="h-4 w-4" />
                {createShare.isPending ? 'Creando...' : 'Crear enlace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {shares.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
          <Share2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <h3 className="mb-1 text-lg font-semibold text-foreground">Sin enlaces compartidos</h3>
          <p className="mb-4 text-sm text-muted-foreground">Crea un enlace para compartir las escenas con tu equipo</p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Crear primer enlace
          </button>
        </div>
      )}

      {/* ── Shares list ── */}
      {shares.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Enlaces activos ({shares.length})</h3>

          {shares.map((share) => (
            <div
              key={share.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Token + info */}
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Link2 className="h-4 w-4 shrink-0 text-primary" />
                    <code className="truncate rounded bg-background px-2 py-0.5 font-mono text-xs text-foreground">
                      {share.token}
                    </code>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {share.is_all_scenes && (
                      <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] text-blue-400">Todas las escenas</span>
                    )}
                    {share.allow_annotations && (
                      <span className="flex items-center gap-0.5 rounded bg-purple-500/10 px-1.5 py-0.5 text-[10px] text-purple-400">
                        <MessageSquare className="h-2.5 w-2.5" /> Anotaciones
                      </span>
                    )}
                    {share.password_hash && (
                      <span className="flex items-center gap-0.5 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                        <Shield className="h-2.5 w-2.5" /> Protegido
                      </span>
                    )}
                    <span className="flex items-center gap-0.5 rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      <Eye className="h-2.5 w-2.5" /> {share.view_count ?? 0} vistas
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      <Clock className="h-2.5 w-2.5" /> {timeAgo(share.created_at)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => copyLink(share.token, share.id)}
                    className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                    title="Copiar enlace"
                  >
                    {copiedId === share.id ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Eliminar este enlace?')) {
                        deleteShare.mutate(share.id);
                      }
                    }}
                    className="rounded-lg border border-border p-2 text-muted-foreground transition hover:border-red-500/30 hover:text-red-400"
                    title="Eliminar enlace"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
