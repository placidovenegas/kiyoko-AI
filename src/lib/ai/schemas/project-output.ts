import { z } from 'zod';

export const projectOutputSchema = z.object({
  title: z.string(),
  description: z.string(),
  client_name: z.string(),
  style: z.enum(['pixar', 'realistic', 'anime', 'watercolor', 'flat_2d', 'cyberpunk', 'custom']),
  target_platform: z.enum(['youtube', 'instagram_reels', 'tiktok', 'tv_commercial', 'web', 'custom']),
  target_duration_seconds: z.number(),
  color_palette: z.object({
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    dark: z.string(),
    light: z.string(),
  }),
  tags: z.array(z.string()),
});

export type ProjectOutput = z.infer<typeof projectOutputSchema>;
