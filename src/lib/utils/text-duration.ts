const WORDS_PER_MINUTE: Record<string, number> = {
  es: 150,
  en: 160,
  fr: 145,
  de: 130,
  it: 155,
};

export function estimateTextDuration(
  text: string,
  lang: string = 'es',
): {
  durationSeconds: number;
  wordCount: number;
  fitsInSeconds: (seconds: number) => boolean;
  maxWordsForSeconds: (seconds: number) => number;
} {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const wpm = WORDS_PER_MINUTE[lang] ?? 150;
  const durationSeconds = Math.round(((words / wpm) * 60) * 10) / 10;

  return {
    durationSeconds,
    wordCount: words,
    fitsInSeconds: (s: number) => durationSeconds <= s,
    maxWordsForSeconds: (s: number) => Math.floor((s * wpm) / 60),
  };
}
