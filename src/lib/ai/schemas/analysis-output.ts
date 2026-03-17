import { z } from 'zod';

export const analysisOutputSchema = z.object({
  metrics: z.object({
    total_scenes: z.number(),
    estimated_duration: z.number(),
    total_characters: z.number(),
    total_backgrounds: z.number(),
  }),
  strengths: z.array(z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
  })),
  warnings: z.array(z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    priority: z.number().min(0).max(2),
  })),
  suggestions: z.array(z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
  })),
  overall_score: z.number().min(0).max(100),
  summary: z.string(),
});

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;
