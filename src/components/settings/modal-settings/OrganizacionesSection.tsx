'use client';

import { useState } from 'react';
import { Button, TextField, Input } from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/stores/useUIStore';
import { useOrganizations, ORG_TYPE_LABELS } from '@/hooks/useOrganizations';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { Loader2, Plus, Building2 } from 'lucide-react';
import { SectionTitle, SectionDescription, SettingsCard, SectionLoading } from './shared';

const ORG_TYPE_COLORS: Record<string, string> = {
  personal:  'bg-primary/20 text-primary',
  freelance: 'bg-blue-500/20 text-blue-500',
  team:      'bg-purple-500/20 text-purple-500',
  agency:    'bg-orange-500/20 text-orange-500',
};

function OrgBadge({ name, orgType }: { name: string; orgType?: string | null }) {
  const colors = ORG_TYPE_COLORS[orgType ?? 'team'] ?? ORG_TYPE_COLORS.team;
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <span className={cn('flex shrink-0 items-center justify-center font-bold h-10 w-10 text-sm rounded-lg', colors)}>
      {initials}
    </span>
  );
}

export function OrganizacionesSection() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { organizations, currentOrgId, switchOrg, loading } = useOrganizations();
  const { openSettingsModal, openWorkspaceModal } = useUIStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const saveMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('organizations').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Nombre actualizado');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: () => toast.error('Error al guardar'),
  });

  if (loading) return <SectionLoading />;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <SectionTitle>Mis organizaciones</SectionTitle>
          <SectionDescription>Gestiona todas las organizaciones a las que perteneces.</SectionDescription>
        </div>
        <Button variant="primary" size="sm" onPress={openWorkspaceModal} className="shrink-0">
          <Plus size={13} className="mr-1" />
          Nueva
        </Button>
      </div>

      {organizations.length === 0 ? (
        <SettingsCard>
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="h-11 w-11 rounded-lg bg-muted flex items-center justify-center mb-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">No hay organizaciones</p>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-4">
              Crea tu primera organización para empezar a colaborar.
            </p>
            <Button variant="primary" size="md" onPress={openWorkspaceModal}>
              <Plus size={14} className="mr-1" />
              Crear organización
            </Button>
          </div>
        </SettingsCard>
      ) : (
        <div className="space-y-2">
          {organizations.map((org) => {
            const isActive = org.id === currentOrgId;
            const isEditing = editingId === org.id;
            return (
              <SettingsCard key={org.id}>
                <div className="p-3">
                  <div className="flex items-center gap-3 mb-2.5">
                    <OrgBadge name={org.name} orgType={org.org_type} />
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <TextField variant="secondary" aria-label="Nombre" value={editName} onChange={setEditName} autoFocus>
                          <Input />
                        </TextField>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{org.name}</p>
                            {isActive && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Activa</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{ORG_TYPE_LABELS[org.org_type ?? 'team']} · Plan Gratis</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!isActive && (
                      <Button variant="outline" size="sm" onPress={() => { switchOrg(org.id); toast.success(`Cambiado a ${org.name}`); }}>
                        Cambiar a esta
                      </Button>
                    )}
                    {isActive && (
                      <Button variant="outline" size="sm" onPress={() => openSettingsModal('org-general')}>Gestionar</Button>
                    )}
                    {isEditing ? (
                      <>
                        <Button variant="primary" size="sm" isDisabled={saveMutation.isPending} onPress={() => saveMutation.mutate({ id: org.id, name: editName })}>
                          {saveMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                          Guardar
                        </Button>
                        <Button variant="ghost" size="sm" onPress={() => setEditingId(null)}>Cancelar</Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onPress={() => { setEditingId(org.id); setEditName(org.name); }}>Renombrar</Button>
                    )}
                  </div>
                </div>
              </SettingsCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
