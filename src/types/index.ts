export type { Project, ProjectStyle, ProjectStatus, TargetPlatform, ColorPalette, ProjectCreateInput } from './project';
export type { Scene, SceneType, SceneStatus, ArcPhase, CameraAngle, CameraMovement, SceneImprovement, PromptHistoryEntry } from './scene';
export type { Character, CharacterCreateInput } from './character';
export type { Background } from './background';
export type { TimelineEntry, NarrativeArc } from './timeline';
export type { AiProvider, AiProviderId, AiProviderType, AiTask, AiRouterConfig, AiTextResponse, AiImageResponse, QuotaStatus, AiUsageLog, UserApiKey } from './ai';
export type { Export, ExportFormat, ProjectIssue, AiConversation, AiMessage, AiMessageAttachment, ReferenceMap } from './export';

export type UserRole = 'admin' | 'editor' | 'viewer' | 'pending' | 'blocked';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  bio: string;
  company: string;
  preferences: UserPreferences;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  default_style: string;
}
