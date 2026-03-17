import { z } from 'zod';

export const characterOutputSchema = z.object({
  name: z.string(),
  initials: z.string(),
  role: z.string(),
  description: z.string(),
  visual_description: z.string(),
  prompt_snippet: z.string(),
  personality: z.string(),
  signature_clothing: z.string(),
  hair_description: z.string(),
  accessories: z.array(z.string()).optional().default([]),
  signature_tools: z.array(z.string()).optional().default([]),
  color_accent: z.string(),
});

export const charactersArraySchema = z.object({
  characters: z.array(characterOutputSchema),
  consistency_rules: z.array(z.string()).optional().default([]),
});

export type CharacterOutput = z.infer<typeof characterOutputSchema>;
