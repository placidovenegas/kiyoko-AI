'use client';

import { useState, useCallback } from 'react';
import { Button, TextField, Input } from '@heroui/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Eye, EyeOff, ExternalLink, Check, Shield } from 'lucide-react';
import { SectionTitle, SectionDescription, SettingsCard, SectionLoading } from './shared';

const TEXT_PROVIDERS = [
  { id: 'groq', name: 'Groq', description: 'LLaMA 3.3 70B — Ultrarrapido, gratis ilimitado', isFree: true, signupUrl: 'https://console.groq.com/keys', placeholder: 'gsk_...' },
  { id: 'cerebras', name: 'Cerebras', description: 'LLaMA 3.1 8B — La inferencia más rápida del mundo', isFree: true, signupUrl: 'https://cloud.cerebras.ai', placeholder: 'csk-...' },
  { id: 'mistral', name: 'Mistral', description: 'Mistral Large — 1B tokens gratis/mes', isFree: true, signupUrl: 'https://console.mistral.ai', placeholder: 'Tu API key de Mistral' },
  { id: 'gemini', name: 'Gemini', description: 'Gemini 2.0 Flash — Cuota gratuita limitada', isFree: true, signupUrl: 'https://aistudio.google.com/apikey', placeholder: 'AIza...' },
  { id: 'grok', name: 'Grok (xAI)', description: 'Grok 3 Fast — Creativo (requiere créditos)', isFree: false, signupUrl: 'https://console.x.ai', placeholder: 'xai-...' },
  { id: 'deepseek', name: 'DeepSeek', description: 'DeepSeek V3 — Narrativas profundas', isFree: false, signupUrl: 'https://platform.deepseek.com', placeholder: 'sk-...' },
  { id: 'claude', name: 'Claude', description: 'Claude Sonnet 4 — El mejor en personajes vivos', isFree: false, signupUrl: 'https://console.anthropic.com', placeholder: 'sk-ant-...' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o Mini + DALL-E 3', isFree: false, signupUrl: 'https://platform.openai.com', placeholder: 'sk-proj-...' },
];

interface UserKey {
  id: string;
  provider: string;
  api_key_hint: string;
  is_active: boolean;
  total_requests?: number;
  total_tokens_used?: number;
  last_used_at?: string | null;
}

export function ApiKeysSection() {
  const queryClient = useQueryClient();
  const [addingProvider, setAddingProvider] = useState<string | null>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  const { data: userKeys = [], isLoading } = useQuery<UserKey[]>({
    queryKey: ['api-keys-data'],
    queryFn: async () => {
      const res = await fetch('/api/user/api-keys');
      if (!res.ok) return [];
      const d = await res.json();
      return d.keys ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const res = await fetch('/api/user/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider, apiKey }) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error'); }
    },
    onSuccess: () => { toast.success('API key guardada'); setAddingProvider(null); setNewKeyValue(''); queryClient.invalidateQueries({ queryKey: ['api-keys-data'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/user/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
    },
    onSuccess: () => { toast.success('API key eliminada'); queryClient.invalidateQueries({ queryKey: ['api-keys-data'] }); },
    onError: () => toast.error('Error al eliminar'),
  });

  const getUserKey = useCallback((pid: string) => userKeys.find((k) => k.provider === pid), [userKeys]);

  const configuredCount = userKeys.filter((k) => k.is_active).length;

  if (isLoading) return <SectionLoading />;

  return (
    <div>
      <SectionTitle>Proveedores de IA</SectionTitle>
      <SectionDescription>
        {configuredCount > 0
          ? `${configuredCount} proveedor${configuredCount > 1 ? 'es' : ''} activo${configuredCount > 1 ? 's' : ''}. Añade más para diversificar respuestas.`
          : 'Añade tus API keys para usar proveedores premium. Los gratuitos ya están activos.'}
      </SectionDescription>

      <div className="space-y-1.5">
        {TEXT_PROVIDERS.map((provider) => {
          const userKey = getUserKey(provider.id);
          const isAdding = addingProvider === provider.id;
          return (
            <div key={provider.id} className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-3.5 py-2.5">
                <div className={cn('size-2 rounded-full shrink-0', userKey?.is_active ? 'bg-emerald-500' : 'bg-border')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{provider.name}</span>
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded uppercase', provider.isFree ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')}>
                      {provider.isFree ? 'Gratis' : 'Premium'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{provider.description}</p>
                  {userKey && (
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-xs text-muted-foreground font-mono">{userKey.api_key_hint}</p>
                      {userKey.total_requests != null && userKey.total_requests > 0 && (
                        <p className="text-xs text-muted-foreground">{userKey.total_requests} requests</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {userKey ? (
                    <Button variant="danger-soft" size="sm" isIconOnly onPress={() => deleteMutation.mutate(userKey.id)}>
                      <Trash2 size={13} />
                    </Button>
                  ) : (
                    <Button
                      variant={isAdding ? 'secondary' : 'ghost'}
                      size="sm"
                      onPress={() => { setAddingProvider(isAdding ? null : provider.id); setNewKeyValue(''); setShowKey(false); }}
                    >
                      <Plus size={11} className="mr-1" />
                      {isAdding ? 'Cancelar' : 'Añadir'}
                    </Button>
                  )}
                  <a href={provider.signupUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center size-7 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
              {isAdding && (
                <div className="px-3.5 pb-2.5 pt-2 border-t border-border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <TextField variant="secondary" type={showKey ? 'text' : 'password'} value={newKeyValue} onChange={setNewKeyValue} autoFocus>
                        <Input placeholder={provider.placeholder} className="font-mono pr-8" />
                      </TextField>
                      <Button variant="ghost" size="sm" isIconOnly onPress={() => setShowKey(!showKey)} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                      </Button>
                    </div>
                    <Button variant="primary" size="sm" onPress={() => saveMutation.mutate({ provider: provider.id, apiKey: newKeyValue })} isDisabled={!newKeyValue.trim()}>
                      {saveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check size={12} className="mr-1" />}
                      Guardar
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-primary/10 bg-primary/5 p-3 flex items-start gap-2">
        <Shield size={14} className="text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">Las API keys se cifran con AES-256 antes de guardarse. Nunca se muestran completas.</p>
      </div>
    </div>
  );
}
