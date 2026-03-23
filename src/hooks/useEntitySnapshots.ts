'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { EntitySnapshot } from '@/types';

export function useEntitySnapshots(projectId: string | undefined) {
  const rollbackConversation = useCallback(async (conversationId: string) => {
    if (!projectId) return;
    const supabase = createClient();
    const { data: snapshots } = await supabase
      .from('entity_snapshots')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('restored', false)
      .order('created_at', { ascending: false });

    if (!snapshots?.length) return;

    const sbAny = supabase as unknown as { from: (t: string) => { upsert: (d: unknown) => Promise<unknown>; delete: () => { eq: (c: string, v: string) => Promise<unknown> } } };
    for (const snap of snapshots as EntitySnapshot[]) {
      const tableName = snap.entity_type === 'scene' ? 'scenes' : snap.entity_type === 'video' ? 'videos' : 'characters';
      if (snap.action_type === 'update' || snap.action_type === 'delete') {
        await sbAny.from(tableName).upsert(snap.snapshot_data);
      } else if (snap.action_type === 'create') {
        await sbAny.from(tableName).delete().eq('id', snap.entity_id);
      }
      await supabase
        .from('entity_snapshots')
        .update({ restored: true, restored_at: new Date().toISOString() })
        .eq('id', snap.id);
    }
  }, [projectId]);

  return { rollbackConversation };
}
