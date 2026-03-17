import type { ArcPhase } from './scene';

export interface TimelineEntry {
  id: string;
  project_id: string;
  scene_id: string | null;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  arc_phase: ArcPhase;
  phase_color: string;
  timeline_version: 'full' | 'short_30s' | 'short_15s' | 'custom';
  sort_order: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface NarrativeArc {
  id: string;
  project_id: string;
  phase: string;
  phase_number: number;
  title: string;
  description: string;
  start_second: number;
  end_second: number;
  scene_ids: string[];
  scene_numbers: string[];
  color: string;
  icon: string;
  sort_order: number;
  created_at: string;
}
