import { VideoProvider } from '@/contexts/VideoContext';

export default function VideoLayout({ children }: { children: React.ReactNode }) {
  return (
    <VideoProvider>
      {children}
    </VideoProvider>
  );
}
