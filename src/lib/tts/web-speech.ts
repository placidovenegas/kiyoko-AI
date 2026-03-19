'use client';

/**
 * Browser-based TTS using Web Speech API (free, works offline).
 * Fallback when Google Cloud TTS is not available.
 */

export function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getAvailableVoices(lang?: string): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisAvailable()) return [];
  const voices = speechSynthesis.getVoices();
  if (lang) return voices.filter((v) => v.lang.startsWith(lang));
  return voices;
}

interface GenerateSpeechOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voiceName?: string;
}

/**
 * Generate speech audio using Web Speech API + MediaRecorder to capture as blob.
 * Returns a Blob of audio/webm that can be played or uploaded.
 */
export async function generateSpeechBlob(
  text: string,
  options: GenerateSpeechOptions = {},
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisAvailable()) {
      reject(new Error('Web Speech API no disponible en este navegador'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'es-ES';
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;

    // Try to find a specific voice
    if (options.voiceName) {
      const voices = speechSynthesis.getVoices();
      const voice = voices.find((v) => v.name === options.voiceName);
      if (voice) utterance.voice = voice;
    }

    // Use AudioContext + MediaRecorder to capture
    try {
      const audioContext = new AudioContext();
      const dest = audioContext.createMediaStreamDestination();
      const mediaRecorder = new MediaRecorder(dest.stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        audioContext.close();
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };

      mediaRecorder.start();
      speechSynthesis.speak(utterance);

      utterance.onend = () => {
        setTimeout(() => mediaRecorder.stop(), 100);
      };

      utterance.onerror = (e) => {
        mediaRecorder.stop();
        audioContext.close();
        reject(new Error(`Speech synthesis error: ${e.error}`));
      };
    } catch {
      // Fallback: just speak without recording (user can hear it but not save)
      speechSynthesis.speak(utterance);
      utterance.onend = () => {
        // Return empty blob - the speech was spoken but not recorded
        resolve(new Blob([], { type: 'audio/webm' }));
      };
      utterance.onerror = (e) => reject(new Error(`Speech error: ${e.error}`));
    }
  });
}

/**
 * Ensure voices are loaded (Chrome loads them async).
 */
function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    // Chrome fires voiceschanged event when voices are ready
    speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(speechSynthesis.getVoices());
    }, { once: true });
    // Timeout fallback
    setTimeout(() => resolve(speechSynthesis.getVoices()), 1000);
  });
}

/**
 * Simply speak text aloud (no recording, just playback).
 * Good for preview. Returns a promise that resolves when done speaking.
 */
export async function speakText(
  text: string,
  options: GenerateSpeechOptions = {},
): Promise<{ cancel: () => void }> {
  if (!isSpeechSynthesisAvailable()) return { cancel: () => {} };

  speechSynthesis.cancel(); // Stop any current speech

  const voices = await ensureVoicesLoaded();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'es-ES';
  utterance.rate = options.rate || 1.0;
  utterance.pitch = options.pitch || 1.0;

  // Try to find a good voice for the language
  if (options.voiceName) {
    const voice = voices.find((v) => v.name === options.voiceName);
    if (voice) utterance.voice = voice;
  } else {
    // Auto-select best voice for language
    const langVoices = voices.filter((v) => v.lang.startsWith(options.lang || 'es'));
    if (langVoices.length > 0) {
      // Prefer Google/Microsoft voices
      const preferred = langVoices.find((v) => v.name.includes('Google') || v.name.includes('Microsoft'));
      utterance.voice = preferred || langVoices[0];
    }
  }

  speechSynthesis.speak(utterance);

  return {
    cancel: () => speechSynthesis.cancel(),
  };
}
