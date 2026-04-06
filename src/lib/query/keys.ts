export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    profile: () => ['auth', 'profile'] as const,
  },

  dashboard: {
    overview: (userId: string) => ['dashboard', 'overview', userId] as const,
  },

  projects: {
    all: ['projects'] as const,
    workspace: () => ['projects'] as const,
    detail: (shortId: string) => ['projects', shortId] as const,
  },

  videos: {
    byProject: (projectId: string) => ['videos', 'project', projectId] as const,
    workspace: () => ['videos', 'workspace'] as const,
    detail: (shortId: string) => ['video', shortId] as const,
    analysis: (videoId: string) => ['video-analysis', videoId] as const,
    narration: (videoId: string) => ['video-narration', videoId] as const,
  },

  scenes: {
    byVideo: (videoId: string) => ['scenes', 'video', videoId] as const,
    detail: (sceneShortId: string) => ['scene', sceneShortId] as const,
  },

  characters: {
    byProject: (projectId: string) => ['characters', 'project', projectId] as const,
    detail: (charId: string) => ['character', charId] as const,
    images: (charId: string) => ['character-images', charId] as const,
  },

  backgrounds: {
    byProject: (projectId: string) => ['backgrounds', 'project', projectId] as const,
  },

  tasks: {
    byProject: (projectId: string) => ['tasks', 'project', projectId] as const,
    byVideo: (videoId: string) => ['tasks', 'video', videoId] as const,
    detail: (taskId: string) => ['tasks', 'detail', taskId] as const,
    dashboard: (userId: string) => ['tasks', 'dashboard', userId] as const,
  },

  notifications: {
    inbox: (userId: string) => ['notifications', 'inbox', userId] as const,
  },

  publications: {
    byProject: (projectId: string) => ['publications', 'project', projectId] as const,
    detail: (pubShortId: string) => ['publication', pubShortId] as const,
    allForUser: ['publications', 'all'] as const,
  },

  conversations: {
    byProject: (projectId: string) => ['conversations', 'project', projectId] as const,
    byVideo: (videoId: string) => ['conversations', 'video', videoId] as const,
    byContext: (contextType: string, entityId: string) => ['conversations', contextType, entityId] as const,
  },

  stylePresets: {
    byProject: (projectId: string) => ['style-presets', 'project', projectId] as const,
  },

  promptTemplates: {
    byProject: (projectId: string) => ['prompt-templates', 'project', projectId] as const,
  },

  aiSettings: {
    byProject: (projectId: string) => ['ai-settings', 'project', projectId] as const,
  },

  aiAgent: {
    byProject: (projectId: string) => ['ai-agent', 'project', projectId] as const,
  },

  socialProfiles: {
    byProject: (projectId: string) => ['social-profiles', 'project', projectId] as const,
  },

  projectShares: {
    byProject: (projectId: string) => ['project-shares', 'project', projectId] as const,
    sharedWithMe: ['project-shares', 'shared-with-me'] as const,
  },

  timeEntries: {
    byProject: (projectId: string) => ['time-entries', 'project', projectId] as const,
  },

  userPlans: {
    byUser: (userId: string) => ['user-plans', userId] as const,
  },

  sceneShares: {
    byToken: (token: string) => ['scene-share', token] as const,
  },
};
