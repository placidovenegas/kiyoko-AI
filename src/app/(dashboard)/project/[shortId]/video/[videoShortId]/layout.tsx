'use client';

import { VideoProvider } from '@/contexts/VideoContext';
import { VideoSettingsModal } from '@/components/video/VideoSettingsModal';

export default function VideoLayout({ children }: { children: React.ReactNode }) {
  return (
    <VideoProvider>
      {children}
      <VideoSettingsModal />
    </VideoProvider>
  );
}
