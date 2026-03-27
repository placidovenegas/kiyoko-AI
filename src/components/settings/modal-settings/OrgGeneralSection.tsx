'use client';

import { useState } from 'react';
import { Button, TextField, Label, Input } from '@heroui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useOrganizations, ORG_TYPE_LABELS } from '@/hooks/useOrganizations';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { SectionTitle, SectionDescription, SettingsCard, FieldLabel } from './shared';

export function OrgGeneralSection() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { currentOrg } = useOrganizations();
  const [name, setName] = useState(currentOrg?.name ?? '');
  const [dirty, setDirty] = useState(false);

  const currentOrgName = currentOrg?.name ?? '';
  if (name !== currentOrgName && !dirty) {
    setName(currentOrgName);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg) return;
      const { error } = await supabase.from('organizations').update({ name }).eq('id', currentOrg.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Organización actualizada');
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
    onError: () => toast.error('Error al guardar'),
  });

  if (!currentOrg) return <div className="py-8 text-center text-muted-foreground text-sm">No hay organización seleccionada.</div>;

  return (
    <div>
      <SectionTitle>General</SectionTitle>
      <SectionDescription>Configura el nombre y tipo de tu organización activa.</SectionDescription>

      <SettingsCard className="mb-5">
        <div className="p-4 space-y-4">
          <TextField variant="secondary" value={name} onChange={(val) => { setName(val); setDirty(true); }}>
            <Label>Nombre de la organización</Label>
            <Input />
          </TextField>
          <div>
            <FieldLabel>Tipo</FieldLabel>
            <div className="h-9 flex items-center px-3 rounded-lg border border-border bg-muted/30 text-sm text-muted-foreground">
              {ORG_TYPE_LABELS[currentOrg.org_type ?? 'team']}
            </div>
          </div>
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <Button variant="primary" size="md" onPress={() => saveMutation.mutate()} isDisabled={!dirty || saveMutation.isPending}>
          {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
