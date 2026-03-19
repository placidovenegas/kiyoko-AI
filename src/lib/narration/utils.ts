/** Estimate narration text duration in seconds (~2.3 words/sec Spanish) */
export function estimateDuration(text: string, lang = 'es'): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wps = lang === 'es' ? 2.3 : 2.5;
  return Math.round((words / wps) * 10) / 10;
}

/** Max words that fit in a scene duration */
export function maxWordsForDuration(seconds: number, lang = 'es'): number {
  const wps = lang === 'es' ? 2.3 : 2.5;
  return Math.floor(seconds * wps);
}

/** Estimate MP3 duration from buffer size (128kbps) */
export function estimateAudioDurationMs(bufferSize: number): number {
  return Math.round((bufferSize * 8) / 128); // 128kbps → ms
}

/** Clean AI response text */
export function cleanNarrationText(raw: string): string {
  let text = raw.trim();

  // If JSON, extract text field
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'string') return parsed;
      if (parsed.text) return String(parsed.text);
      if (parsed.narration) return String(parsed.narration);
      if (parsed.improved_prompt) return String(parsed.improved_prompt);
      if (Array.isArray(parsed)) {
        return parsed.map((p: Record<string, unknown>) => p.text || p.narration || '').filter(Boolean).join('\n');
      }
    } catch { /* not JSON */ }
  }

  // Strip markdown
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');

  // Strip prefixes
  text = text.replace(/^(?:Narrador|Narrator|Voz en off|Voiceover|Narracion)\s*:\s*/gim, '');

  // Strip quotes
  text = text.replace(/^["']|["']$/g, '');

  // Unescape
  text = text.replace(/\\n/g, '\n').replace(/\\"/g, '"');

  return text.trim();
}
