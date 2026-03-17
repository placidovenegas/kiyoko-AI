import { z } from 'zod';

export const timelineOutputSchema = z.object({
  version: z.enum(['full', 'short_30s', 'short_15s']),
  total_duration_seconds: z.number(),
  entries: z.array(z.object({
    scene_number: z.string(),
    title: z.string(),
    description: z.string(),
    start_time: z.string(),
    end_time: z.string(),
    duration_seconds: z.number(),
    arc_phase: z.enum(['hook', 'build', 'peak', 'close']),
    music_notes: z.string().optional().default(''),
    transition: z.string().optional().default('cut'),
  })),
  director_notes: z.string(),
});

export type TimelineOutput = z.infer<typeof timelineOutputSchema>;
