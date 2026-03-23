'use client';

import { useRealtimeSync } from '@/hooks/useRealtimeSync';

export function RealtimeSyncWrapper({ projectId }: { projectId: string }) {
  useRealtimeSync(projectId);
  return null;
}
