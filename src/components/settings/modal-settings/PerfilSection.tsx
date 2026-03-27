'use client';

import { useState } from 'react';
import { Button, TextField, TextArea, Label, Input, Description } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { SectionTitle, SectionDescription, SettingsCard, SectionLoading } from './shared';
import type { Profile } from '@/types';

export function PerfilSection() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [dirty, setDirty] = useState(false);
  const [formOverrides, setFormOverrides] = useState<Record<string, string>>({});

  const { data: authUser, isLoading: authLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user ?? null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile', 'me'],
    queryFn: async () => {
      if (!authUser) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      if (error) return null;
      return data as Profile | null;
    },
    enabled: !!authUser,
    staleTime: 5 * 60 * 1000,
  });

  const form = {
    full_name: formOverrides.full_name ?? profile?.full_name ?? '',
    bio: formOverrides.bio ?? profile?.bio ?? '',
    company: formOverrides.company ?? profile?.company ?? '',
    creative_video_types: formOverrides.creative_video_types ?? profile?.creative_video_types ?? '',
    creative_platforms: formOverrides.creative_platforms ?? profile?.creative_platforms ?? '',
    creative_use_context: formOverrides.creative_use_context ?? profile?.creative_use_context ?? '',
    creative_purpose: formOverrides.creative_purpose ?? profile?.creative_purpose ?? '',
    creative_typical_duration: formOverrides.creative_typical_duration ?? profile?.creative_typical_duration ?? '',
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!authUser) throw new Error('No autenticado');
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim() || null,
          bio: form.bio.trim() || null,
          company: form.company.trim() || null,
          creative_video_types: form.creative_video_types.trim() || null,
          creative_platforms: form.creative_platforms.trim() || null,
          creative_use_context: form.creative_use_context.trim() || null,
          creative_purpose: form.creative_purpose.trim() || null,
          creative_typical_duration: form.creative_typical_duration.trim() || null,
        })
        .eq('id', authUser.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Perfil guardado');
      setDirty(false);
      setFormOverrides({});
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('kiyoko-profile-updated'));
      }
    },
    onError: () => toast.error('Error al guardar'),
  });

  const initials = (form.full_name || authUser?.email || '?')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const updateField = (key: string, value: string) => {
    setFormOverrides((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  if (authLoading || profileLoading) return <SectionLoading />;

  return (
    <div>
      <SectionTitle>Perfil</SectionTitle>
      <SectionDescription>Gestiona tu información personal y preferencias creativas.</SectionDescription>

      {/* ── Avatar + identity ──────────────────────────── */}
      <SettingsCard className="mb-5">
        <div className="flex items-center gap-4 p-4">
          <div className="h-14 w-14 rounded-lg bg-primary/15 text-primary flex items-center justify-center text-lg font-bold shrink-0">
            {profile?.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={profile.avatar_url} alt="avatar" className="h-14 w-14 rounded-lg object-cover" />
              : initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate">{form.full_name || authUser?.email}</p>
            <p className="text-xs text-muted-foreground">{authUser?.email}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Miembro desde {authUser?.created_at
                ? new Date(authUser.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })
                : '–'}
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* ── Información básica ─────────────────────────── */}
      <SettingsCard className="mb-5">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Información básica</p>
        </div>
        <div className="p-4 space-y-4">
          <TextField variant="secondary" value={form.full_name} onChange={(val) => updateField('full_name', val)}>
            <Label>Nombre completo</Label>
            <Input placeholder="Tu nombre completo" />
          </TextField>

          <div>
            <TextField variant="secondary" value={authUser?.email ?? ''} isReadOnly isDisabled>
              <Label>Email</Label>
              <Input />
            </TextField>
            <p className="text-xs text-muted-foreground mt-1">El email no se puede cambiar desde aquí.</p>
          </div>

          <TextField variant="secondary" value={form.bio} onChange={(val) => updateField('bio', val)}>
            <Label>Bio</Label>
            <TextArea placeholder="Cuéntanos algo sobre ti..." rows={2} />
            <Description>Una breve descripción que aparecerá en tu perfil.</Description>
          </TextField>

          <TextField variant="secondary" value={form.company} onChange={(val) => updateField('company', val)}>
            <Label>Empresa / marca</Label>
            <Input placeholder="Nombre de tu empresa o marca personal" />
          </TextField>
        </div>
      </SettingsCard>

      {/* ── Perfil creativo ────────────────────────────── */}
      <SettingsCard className="mb-5">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Perfil creativo</p>
          <p className="text-xs text-muted-foreground mt-0.5">Kiyoko usa esto para dar ideas y tono más acordes a ti.</p>
        </div>
        <div className="p-4 space-y-4">
          <TextField variant="secondary" value={form.creative_video_types} onChange={(val) => updateField('creative_video_types', val)}>
            <Label>Qué tipo de vídeos haces</Label>
            <TextArea placeholder="Ej. reels para Instagram, anuncios para pymes, tutoriales largos..." rows={2} />
            <Description>Formato o estilo; separa con comas si quieres.</Description>
          </TextField>

          <TextField variant="secondary" value={form.creative_platforms} onChange={(val) => updateField('creative_platforms', val)}>
            <Label>Plataformas y formatos</Label>
            <TextArea placeholder="Ej. TikTok, Instagram Reels, YouTube largos, Facebook Ads..." rows={2} />
            <Description>Dónde publicas o en qué formato entregas.</Description>
          </TextField>

          <TextField variant="secondary" value={form.creative_use_context} onChange={(val) => updateField('creative_use_context', val)}>
            <Label>Contexto de uso</Label>
            <TextArea placeholder="Ej. marca personal, proyectos de clientes, freelance profesional..." rows={2} />
            <Description>Así la IA ajusta el tono (corporativo, cercano, etc.).</Description>
          </TextField>

          <TextField variant="secondary" value={form.creative_purpose} onChange={(val) => updateField('creative_purpose', val)}>
            <Label>Objetivo y audiencia</Label>
            <TextArea placeholder="Ej. promocionar mi marca, enseñar a principiantes, entretenimiento..." rows={2} />
            <Description>Para quién creas y qué buscas conseguir.</Description>
          </TextField>

          <TextField variant="secondary" value={form.creative_typical_duration} onChange={(val) => updateField('creative_typical_duration', val)}>
            <Label>Duración habitual</Label>
            <Input placeholder="Ej. 15–60 s en reels, 2–5 min en YouTube..." />
            <Description>Rango típico para calibrar ritmo y estructura.</Description>
          </TextField>
        </div>
      </SettingsCard>

      {/* ── Save ──────────────────────────────────────── */}
      {dirty && (
        <div className="flex justify-end sticky bottom-0 py-3 bg-background/80 backdrop-blur-sm">
          <Button
            variant="primary"
            size="md"
            onPress={() => saveMutation.mutate()}
            isDisabled={saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar cambios
          </Button>
        </div>
      )}
    </div>
  );
}
