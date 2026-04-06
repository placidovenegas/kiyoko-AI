'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { queryKeys } from '@/lib/query/keys';
import { Button } from '@heroui/react';
import {
  Loader2, Users, UserPlus, Shield, Mail, Check, Clock, Trash2,
} from 'lucide-react';
import type { ProjectShare, Profile } from '@/types';

type ShareWithProfile = ProjectShare & {
  profiles: Pick<Profile, 'full_name' | 'email' | 'avatar_url'> | null;
};

export default function SharingSettingsPage() {
  const { project } = useProject();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const { data: shares = [], isLoading } = useQuery({
    queryKey: queryKeys.projectShares.byProject(project?.id ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_shares')
        .select(`
          *,
          profiles:shared_with_user (full_name, email, avatar_url)
        `)
        .eq('project_id', project!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ShareWithProfile[];
    },
    enabled: !!project?.id,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!project) throw new Error('No project');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No auth');

      const { error } = await supabase.from('project_shares').insert({
        project_id: project.id,
        shared_by: user.id,
        shared_with_email: inviteEmail,
        role: inviteRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projectShares.byProject(project?.id ?? '') });
      setInviteEmail('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase.from('project_shares').delete().eq('id', shareId);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projectShares.byProject(project?.id ?? '') });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">
          Colaboradores{' '}
          <span className="font-normal text-muted-foreground">({shares.length})</span>
        </h1>
      </div>

      {/* Invite form */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserPlus className="h-4 w-4 text-primary" />
          Invitar colaborador
        </h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="w-full rounded-lg border border-border bg-background p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="rounded-lg border border-border bg-background p-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <Button
            variant="primary"
            size="md"
            onClick={() => inviteMutation.mutate()}
            disabled={!inviteEmail.trim() || inviteMutation.isPending}
            className="rounded-md"
          >
            <Mail className="h-4 w-4 mr-2" />
            {inviteMutation.isPending ? 'Enviando...' : 'Invitar'}
          </Button>
        </div>
        {inviteMutation.isError && (
          <p className="mt-2 text-xs text-red-400">
            Error al invitar: {inviteMutation.error instanceof Error ? inviteMutation.error.message : 'Error desconocido'}
          </p>
        )}
      </div>

      {/* Collaborator list */}
      {shares.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-12">
          <Users className="mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-lg font-semibold text-foreground">Sin colaboradores</h2>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Invita personas para colaborar en este proyecto.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {shares.map((share) => (
            <div key={share.id} className="flex items-center gap-4 px-5 py-4">
              {/* Avatar */}
              {share.profiles?.avatar_url ? (
                <img
                  src={share.profiles.avatar_url}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-muted-foreground">
                  {(share.profiles?.full_name ?? share.shared_with_email ?? '?').slice(0, 2).toUpperCase()}
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {share.profiles?.full_name ?? share.shared_with_email ?? 'Pendiente'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {share.profiles?.email ?? share.shared_with_email}
                </p>
              </div>

              {/* Role */}
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                <Shield className="h-3 w-3" />
                {share.role}
              </span>

              {/* Status */}
              {share.accepted_at ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <Check className="h-3 w-3" />
                  Aceptado
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <Clock className="h-3 w-3" />
                  Pendiente
                </span>
              )}

              {/* Remove */}
              <button
                onClick={() => removeMutation.mutate(share.id)}
                className="text-muted-foreground transition hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
