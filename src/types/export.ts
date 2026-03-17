export type ExportFormat = 'html' | 'json' | 'markdown' | 'pdf';

export interface Export {
  id: string;
  project_id: string;
  format: ExportFormat;
  file_url: string | null;
  file_path: string | null;
  file_size_bytes: number;
  version: number;
  notes: string;
  config: Record<string, unknown>;
  created_at: string;
}

export interface ProjectIssue {
  id: string;
  project_id: string;
  issue_type: 'strength' | 'warning' | 'suggestion';
  title: string;
  description: string;
  category: string;
  priority: number;
  resolved: boolean;
  resolution_notes: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AiConversation {
  id: string;
  project_id: string;
  messages: AiMessage[];
  wizard_step: string;
  conversation_type: 'wizard' | 'chat' | 'improve';
  title: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: AiMessageAttachment[];
}

export interface AiMessageAttachment {
  type: 'scene' | 'character' | 'image';
  id: string;
}

export interface ReferenceMap {
  id: string;
  project_id: string;
  scene_id: string;
  background_id: string | null;
  character_id: string | null;
  reference_type: 'background' | 'character';
  priority: number;
  notes: string;
  created_at: string;
}
