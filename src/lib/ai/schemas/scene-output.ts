import { z } from 'zod';

export const sceneOutputSchema = z.object({
  scene_number: z.string(),
  title: z.string(),
  scene_type: z.enum(['original', 'improved', 'new', 'filler', 'video']),
  category: z.string(),
  arc_phase: z.enum(['hook', 'build', 'peak', 'close']),
  description: z.string(),
  director_notes: z.string().optional().default(''),
  prompt_image: z.string(),
  prompt_video: z.string().optional().default(''),
  prompt_additions: z.string().optional().default(''),
  improvements: z.array(z.object({
    type: z.enum(['improve', 'add']),
    text: z.string(),
  })).optional().default([]),
  duration_seconds: z.number(),
  camera_angle: z.string().optional().default('medium'),
  camera_movement: z.string().optional().default('static'),
  camera_notes: z.string().optional().default(''),
  lighting: z.string().optional().default(''),
  mood: z.string().optional().default(''),
  music_notes: z.string().optional().default(''),
  sound_notes: z.string().optional().default(''),
  required_references: z.array(z.string()).optional().default([]),
  reference_tip: z.string().optional().default(''),
});

export const scenesArraySchema = z.object({
  scenes: z.array(sceneOutputSchema),
});

export type SceneOutput = z.infer<typeof sceneOutputSchema>;
