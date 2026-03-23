'use client';

import { useAIStore } from '@/stores/ai-store';
import { PROVIDER_META } from '@/lib/ai/sdk-router';

const FREE_PROVIDERS = ['groq', 'mistral', 'gemini', 'cerebras'] as const;
const PREMIUM_PROVIDERS = ['deepseek', 'grok', 'claude', 'openai'] as const;

export function AIModeSwitcher() {
  const { aiMode, setAIMode } = useAIStore();

  return (
    <div className="relative">
      <select
        value={aiMode}
        onChange={(e) => setAIMode(e.target.value)}
        className="h-7 cursor-pointer appearance-none rounded-md bg-gray-100 px-2
                   pr-6 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500
                   dark:bg-gray-800 dark:text-gray-300"
        title="Proveedor de IA"
      >
        <option value="auto">⚡ Auto</option>
        <optgroup label="Gratis">
          {FREE_PROVIDERS.map((id) => (
            <option key={id} value={id}>
              {PROVIDER_META[id]?.name ?? id}
            </option>
          ))}
        </optgroup>
        <optgroup label="Premium (requiere tu key)">
          {PREMIUM_PROVIDERS.map((id) => (
            <option key={id} value={id}>
              {PROVIDER_META[id]?.name ?? id}
            </option>
          ))}
        </optgroup>
      </select>
      <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
        ▾
      </span>
    </div>
  );
}
