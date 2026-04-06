'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { VideoSettingsModal } from '@/components/video/VideoSettingsModal';
import { VideoProvider } from '@/contexts/VideoContext';
import { useUIStore } from '@/stores/useUIStore';

function VideoSettingsRouteSync() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams<{ shortId: string; videoShortId: string }>();
  const videoSettingsModalOpen = useUIStore((state) => state.videoSettingsModalOpen);
  const openVideoSettingsModal = useUIStore((state) => state.openVideoSettingsModal);
  const isSettingsRoute = pathname.endsWith('/settings');

  useEffect(() => {
    if (!isSettingsRoute || videoSettingsModalOpen) return;
    openVideoSettingsModal('general');
  }, [isSettingsRoute, openVideoSettingsModal, videoSettingsModalOpen]);

  useEffect(() => {
    if (!isSettingsRoute || videoSettingsModalOpen) return;
    router.replace(`/project/${params.shortId}/video/${params.videoShortId}`, { scroll: false });
  }, [isSettingsRoute, params.shortId, params.videoShortId, router, videoSettingsModalOpen]);

  return null;
}

export default function VideoLayout({ children }: { children: React.ReactNode }) {
  return (
    <VideoProvider>
      <VideoSettingsRouteSync />
      {children}
      <VideoSettingsModal />
    </VideoProvider>
  );
}
