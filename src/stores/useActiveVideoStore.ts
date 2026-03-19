import { create } from 'zustand';

export interface ActiveVideo {
  id: string;
  name: string;
  platform: string | null;
  target_duration_seconds: number | null;
  aspect_ratio: string | null;
}

interface ActiveVideoState {
  activeVideo: ActiveVideo | null;
  videos: ActiveVideo[];
  /** Incrementing key — subscribe in useEffect to re-fetch videos */
  refreshKey: number;
  setActiveVideo: (video: ActiveVideo | null) => void;
  setVideos: (videos: ActiveVideo[]) => void;
  clearActiveVideo: () => void;
  /** Call after creating/deleting/duplicating a video to refresh the header selector */
  triggerRefresh: () => void;
}

export const useActiveVideoStore = create<ActiveVideoState>((set) => ({
  activeVideo: null,
  videos: [],
  refreshKey: 0,
  setActiveVideo: (video) => set({ activeVideo: video }),
  setVideos: (videos) => set({ videos }),
  clearActiveVideo: () => set({ activeVideo: null }),
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
}));
