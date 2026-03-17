'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function useAiGenerate() {
  const [generating, setGenerating] = useState(false);

  async function generate<T>(
    endpoint: string,
    body: Record<string, unknown>
  ): Promise<T | null> {
    setGenerating(true);
    try {
      const response = await fetch(`/api/ai/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'AI generation failed');
      }

      return await response.json();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error en generación IA');
      return null;
    } finally {
      setGenerating(false);
    }
  }

  return { generate, generating };
}
