'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useVideoQuery } from '@/hooks/queries/useVideoQuery';
import { queryKeys } from '@/lib/query/keys';
import type { Video, Scene } from '@/types';

interface VideoContextValue {
  video: Video | null;
  loading: boolean;
  error: string | null;
  scenes: Scene[];
  scenesLoading: boolean;
  refreshScenes: () => void;
}

const VideoContext = createContext<VideoContextValue>({
  video: null,
  loading: true,
  error: null,
  scenes: [],
  scenesLoading: true,
  refreshScenes: () => {},
});

export function useVideo() {
  return useContext(VideoContext);
}

export function VideoProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const videoShortId = params.videoShortId as string;
  const queryClient = useQueryClient();

  const { video, scenes, isLoading, scenesLoading, error } = useVideoQuery(videoShortId);

  const refreshScenes = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.videos.detail(videoShortId),
    });
  }, [queryClient, videoShortId]);

  return (
    <VideoContext.Provider value={{
      video,
      loading: isLoading,
      error,
      scenes,
      scenesLoading,
      refreshScenes,
    }}>
      {children}
    </VideoContext.Provider>
  );
}
