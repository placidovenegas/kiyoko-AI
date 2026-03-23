import { create } from 'zustand';

export interface ActiveVideo {
  id: string;
  short_id: string;
  name: string;
  platform: string | null;
  target_duration_seconds: number | null;
  aspect_ratio: string | null;
  status: string | null;
}

interface ActiveVideoState {
  activeVideo: ActiveVideo | null;
  videos: ActiveVideo[];
  refreshKey: number;
  setActiveVideo: (video: ActiveVideo | null) => void;
  setVideos: (videos: ActiveVideo[]) => void;
  clearActiveVideo: () => void;
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
