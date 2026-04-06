import type { Database } from './database.types';

// ============================================================
// Tipos derivados directamente de la base de datos.
// NO se definen manualmente — se extraen de database.types.ts.
// Esto elimina todos los "as any" / "as unknown as X".
// ============================================================

type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];

// Helper: extrae Row, Insert y Update de una tabla
export type Row<T extends keyof Tables> = Tables[T]['Row'];
export type Insert<T extends keyof Tables> = Tables[T]['Insert'];
export type Update<T extends keyof Tables> = Tables[T]['Update'];

// ========================
// Entidades principales
// ========================
export type Profile = Row<'profiles'>;
export type ProfileInsert = Insert<'profiles'>;
export type ProfileUpdate = Update<'profiles'>;

export type Project = Row<'projects'>;
export type ProjectInsert = Insert<'projects'>;
export type ProjectUpdate = Update<'projects'>;

export type Video = Row<'videos'>;
export type VideoInsert = Insert<'videos'>;
export type VideoUpdate = Update<'videos'>;

export type Scene = Row<'scenes'>;
export type SceneInsert = Insert<'scenes'>;
export type SceneUpdate = Update<'scenes'>;

export type Character = Row<'characters'>;
export type CharacterInsert = Insert<'characters'>;
export type CharacterUpdate = Update<'characters'>;

export type Background = Row<'backgrounds'>;
export type BackgroundInsert = Insert<'backgrounds'>;
export type BackgroundUpdate = Update<'backgrounds'>;

// ========================
// Sub-tablas de escena
// ========================
export type SceneCamera = Row<'scene_camera'>;
export type SceneCameraInsert = Insert<'scene_camera'>;
export type SceneCameraUpdate = Update<'scene_camera'>;

export type SceneMedia = Row<'scene_media'>;
export type SceneMediaInsert = Insert<'scene_media'>;

export type SceneVideoClip = Row<'scene_video_clips'>;
export type SceneVideoClipInsert = Insert<'scene_video_clips'>;
export type SceneVideoClipUpdate = Update<'scene_video_clips'>;

export type ScenePrompt = Row<'scene_prompts'>;
export type ScenePromptInsert = Insert<'scene_prompts'>;

export type SceneCharacterLink = Row<'scene_characters'>;
export type SceneBackgroundLink = Row<'scene_backgrounds'>;

// ========================
// Vídeo sub-tablas
// ========================
export type VideoNarration = Row<'video_narrations'>;
export type VideoNarrationInsert = Insert<'video_narrations'>;
export type VideoNarrationUpdate = Update<'video_narrations'>;

export type VideoAnalysis = Row<'video_analysis'>;
export type VideoAnalysisInsert = Insert<'video_analysis'>;

export type VideoDerivation = Row<'video_derivations'>;

// ========================
// Recursos del proyecto
// ========================
export type StylePreset = Row<'style_presets'>;
export type StylePresetInsert = Insert<'style_presets'>;
export type StylePresetUpdate = Update<'style_presets'>;

export type PromptTemplate = Row<'prompt_templates'>;
export type PromptTemplateInsert = Insert<'prompt_templates'>;

export type CharacterImage = Row<'character_images'>;
export type CharacterImageInsert = Insert<'character_images'>;

// ========================
// IA
// ========================
export type ProjectAiSettings = Row<'project_ai_settings'>;
export type ProjectAiSettingsUpdate = Update<'project_ai_settings'>;

export type ProjectAiAgent = Row<'project_ai_agents'>;
export type ProjectAiAgentInsert = Insert<'project_ai_agents'>;
export type ProjectAiAgentUpdate = Update<'project_ai_agents'>;

export type AiConversation = Row<'ai_conversations'>;
export type AiConversationInsert = Insert<'ai_conversations'>;

export type EntitySnapshot = Row<'entity_snapshots'>;
export type EntitySnapshotInsert = Insert<'entity_snapshots'>;

export type AiUsageLog = Row<'ai_usage_logs'>;
export type AiUsageLogInsert = Insert<'ai_usage_logs'>;

// ========================
// Publicaciones
// ========================
export type SocialProfile = Row<'social_profiles'>;
export type SocialProfileInsert = Insert<'social_profiles'>;

export type Publication = Row<'publications'>;
export type PublicationInsert = Insert<'publications'>;
export type PublicationUpdate = Update<'publications'>;

export type PublicationItem = Row<'publication_items'>;
export type PublicationItemInsert = Insert<'publication_items'>;

// ========================
// Compartir
// ========================
export type SceneShare = Row<'scene_shares'>;
export type SceneShareInsert = Insert<'scene_shares'>;

export type SceneAnnotation = Row<'scene_annotations'>;
export type SceneAnnotationInsert = Insert<'scene_annotations'>;

// ========================
// Tareas y tiempo
// ========================
export type Task = Row<'tasks'>;
export type TaskInsert = Insert<'tasks'>;
export type TaskUpdate = Update<'tasks'>;


// ========================
// Sistema
// ========================
export type UserPlan = Row<'user_plans'>;
export type UserApiKey = Row<'user_api_keys'>;
export type Notification = Row<'notifications'>;
export type Export = Row<'exports'>;
export type ExportInsert = Insert<'exports'>;
export type ActivityLog = Row<'activity_log'>;
export type ActivityLogInsert = Insert<'activity_log'>;
export type Feedback = Row<'feedback'>;
export type FeedbackInsert = Insert<'feedback'>;
export type BillingEvent = Row<'billing_events'>;
export type UsageTracking = Row<'usage_tracking'>;
export type RealtimeUpdate = Row<'realtime_updates'>;

export type NarrativeArc = Row<'narrative_arcs'>;
export type NarrativeArcInsert = Insert<'narrative_arcs'>;

export type TimelineEntry = Row<'timeline_entries'>;
export type TimelineEntryInsert = Insert<'timeline_entries'>;

export type ProjectShare = Row<'project_shares'>;
export type ProjectFavorite = Row<'project_favorites'>;
export type Comment = Row<'comments'>;
export type CommentInsert = Insert<'comments'>;

// ========================
// Enums de la base de datos
// ========================
export type UserRole = Enums['user_role'];
export type ProjectStatus = Enums['project_status'];
export type ProjectStyle = Enums['project_style'];
export type TargetPlatform = Enums['target_platform'];
export type VideoType = Enums['video_type'];
export type VideoStatus = Enums['video_status'];
export type SceneType = Enums['scene_type'];
export type SceneStatus = Enums['scene_status'];
export type ArcPhase = Enums['arc_phase'];
export type CameraAngle = Enums['camera_angle'];
export type CameraMovement = Enums['camera_movement'];
export type MediaType = Enums['media_type'];
export type PromptType = Enums['prompt_type'];
export type ExportFormat = Enums['export_format'];
export type TaskStatus = Enums['task_status'];
export type TaskPriority = Enums['task_priority'];
export type TaskCategory = Enums['task_category'];

// ========================
// Tipos de aplicación (no de DB)
// ========================
export type { AiActionType, AiAction, AiActionPlan, AiActionChange, AiActionResult, ChangeHistoryEntry } from './ai-actions';

// Mensaje dentro de una conversación IA (almacenado como JSON en ai_conversations.messages)
export interface AiMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
  actions?: Record<string, unknown>[] | null;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  dark: string;
  light: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: boolean;
  default_style: string;
}

// Tipos para IA (proveedores, router — no están en DB)
export type AiProviderId = 'groq' | 'cerebras' | 'mistral' | 'gemini' | 'grok' | 'deepseek' | 'claude' | 'openai' | 'stability';
export type AiProviderType = 'text' | 'image' | 'both';
export type AiTask = 'text_generation' | 'image_generation' | 'chat' | 'analysis';

export interface AiProvider {
  id: AiProviderId;
  name: string;
  type: AiProviderType;
  isFree: boolean;
  priority: number;
  isAvailable: boolean;
  hasQuota: boolean;
  rateLimitRpm: number;
  models: { text?: string; image?: string };
}

export interface AiRouterConfig {
  userId: string;
  task: AiTask;
  preferredProvider?: AiProviderId;
  fallbackEnabled: boolean;
}

export interface AiTextResponse {
  text: string;
  providerId: AiProviderId;
  model: string;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
}

export interface AiImageResponse {
  imageUrl: string;
  providerId: AiProviderId;
  model: string;
  responseTimeMs: number;
}

export interface QuotaStatus {
  providerId: AiProviderId;
  requestsThisMinute: number;
  maxRequestsPerMinute: number;
  isAvailable: boolean;
}
