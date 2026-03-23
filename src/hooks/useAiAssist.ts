import { useState, useCallback } from 'react';

/**
 * Lightweight AI assist for form fields.
 * Calls /api/ai/chat with a single-shot prompt and returns the text.
 * Does NOT go through the chat — works silently behind the scenes.
 */
export function useAiAssist() {
  const [loading, setLoading] = useState<string | null>(null); // field name being generated

  const assist = useCallback(async (
    prompt: string,
    fieldName: string,
  ): Promise<string | null> => {
    setLoading(fieldName);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          contextLevel: 'dashboard',
        }),
      });

      if (!res.ok) return null;

      // Read the SSE stream and accumulate text
      const reader = res.body?.getReader();
      if (!reader) return null;

      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse Vercel AI Data Stream Protocol lines
        for (const line of chunk.split('\n')) {
          if (line.startsWith('0:')) {
            try {
              result += JSON.parse(line.slice(2)) as string;
            } catch { /* skip */ }
          }
        }
      }

      return result.trim() || null;
    } catch {
      return null;
    } finally {
      setLoading(null);
    }
  }, []);

  return { assist, loading };
}
