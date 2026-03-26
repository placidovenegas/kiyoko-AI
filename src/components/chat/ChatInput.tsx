'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import {
  Send,
  Square,
  X,
  FileText,
  Image as ImageIcon,
  Plus,
  Bot,
  Check,
  Lock,
  Trash2,
  Paperclip,
  ChevronRight,
  FolderOpen,
  Video,
  LayoutDashboard,
  Building2,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProviderStatus {
  id: string;
  name: string;
  isFree: boolean;
  defaultModel: string;
  status: 'available' | 'rate_limited' | 'no_key' | 'cooldown';
  retryInSeconds?: number | null;
}

export type ChatContextType = 'dashboard' | 'organization' | 'project' | 'video' | 'scene';

interface FileEntry {
  file: File;
  preview?: string; // object URL for images
}

interface ChatInputProps {
  onSend: (text: string, files?: File[]) => void;
  onStop: () => void;
  onClearConversation?: () => void;
  isStreaming: boolean;
  activeProvider: string | null;
  placeholder?: string;
  allowFiles?: boolean;
  contextLabel?: string;
  contextType?: ChatContextType;
  prefillText?: string | null;
  onPrefillConsumed?: () => void;
  /** Sandbox/dev: evita fetch de providers/status para no hacer requests */
  disableProvidersFetch?: boolean;
  /** Formulario de creación anclado: bloquea escritura y muestra placeholder tipo “Creando…” */
  creationDockOpen?: boolean;
  /** Conectado visualmente al dock (esquinas inferiores redondeadas, sin borde superior duplicado) */
  dockTail?: boolean;
  /**
   * Dentro del compositor unificado (formulario + input): sin borde propio; el padre aporta el único `rounded-xl`.
   */
  embeddedInComposer?: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROVIDER_KEY = 'kiyoko-preferred-provider';

const MODEL_SHORT: Record<string, string> = {
  'llama-3.3-70b-versatile': 'LLaMA 3.3',
  'gemini-2.0-flash': 'Flash 2.0',
  'mistral-large-latest': 'Mistral L',
  'llama3.1-8b': 'Llama 3.1',
  'grok-3-fast': 'Grok 3',
  'deepseek-chat': 'DeepSeek',
  'claude-sonnet-4-20250514': 'Sonnet 4',
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
};

const CONTEXT_ICON: Record<ChatContextType, React.ElementType> = {
  dashboard: LayoutDashboard,
  organization: Building2,
  project: FolderOpen,
  video: Video,
  scene: Video,
};

function providerDotColor(status: ProviderStatus['status'], isFree: boolean): string {
  switch (status) {
    case 'available': return isFree ? 'bg-amber-400' : 'bg-emerald-500';
    case 'cooldown': return 'bg-amber-400 animate-pulse';
    default: return 'bg-gray-400';
  }
}

// ---------------------------------------------------------------------------
// NoKeyTooltip — advice when provider has no API key
// ---------------------------------------------------------------------------

function NoKeyTooltip({ providerName }: { providerName: string }) {
  return (
    <div className="mt-1 px-2 py-1.5 rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
      <div className="flex items-start gap-1.5">
        <AlertCircle size={11} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-snug">
          {providerName} necesita una API key. Ve a <strong>Ajustes → API Keys</strong> para configurarla.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProviderList — shared between chip popover and + menu
// ---------------------------------------------------------------------------

function ProviderList({
  providers,
  effectiveProviderId,
  onSelect,
  onSelectAuto,
}: {
  providers: ProviderStatus[];
  effectiveProviderId: string | null;
  onSelect: (id: string) => void;
  onSelectAuto: () => void;
}) {
  const [noKeyProvider, setNoKeyProvider] = useState<string | null>(null);

  if (providers.length === 0) {
    return (
      <div className="px-2 py-4 text-center text-xs text-muted-foreground">
        Cargando...
      </div>
    );
  }

  const isAutoSelected = effectiveProviderId === null || effectiveProviderId === 'auto';

  return (
    <>
      {/* Auto option */}
      <button
        type="button"
        onClick={() => { onSelectAuto(); setNoKeyProvider(null); }}
        className={cn(
          'flex items-center gap-2.5 w-full px-2 py-2 rounded-md transition-colors',
          isAutoSelected
            ? 'bg-primary/10 text-primary dark:text-primary'
            : 'text-foreground hover:bg-accent',
        )}
      >
        <Zap size={12} className="shrink-0 text-primary" />
        <div className="flex flex-col items-start flex-1 min-w-0">
          <span className={cn('text-xs font-medium leading-tight', isAutoSelected && 'text-primary dark:text-primary')}>
            Automático
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">
            Mejor proveedor disponible
          </span>
        </div>
        {isAutoSelected && <Check size={13} className="shrink-0 text-primary" />}
      </button>

      <div className="my-1 border-t border-border" />

      {providers.map((p) => {
        const isSelected = p.id === effectiveProviderId && !isAutoSelected;
        const isAvailable = p.status === 'available' || p.status === 'cooldown';
        const modelShort = MODEL_SHORT[p.defaultModel] ?? p.defaultModel;
        const subtitle = p.status === 'no_key'
          ? 'Sin API key'
          : p.status === 'cooldown' && p.retryInSeconds
            ? `Cuota · ${p.retryInSeconds}s`
            : p.isFree
              ? `${modelShort} · Gratis`
              : modelShort;

        return (
          <div key={p.id}>
            <button
              type="button"
              onClick={() => {
                if (p.status === 'no_key') {
                  setNoKeyProvider(noKeyProvider === p.id ? null : p.id);
                  return;
                }
                if (isAvailable) {
                  onSelect(p.id);
                  setNoKeyProvider(null);
                }
              }}
              className={cn(
                'flex items-center gap-2.5 w-full px-2 py-2 rounded-md transition-colors',
                isSelected
                  ? 'bg-primary/10 text-primary dark:text-primary'
                  : isAvailable || p.status === 'no_key'
                    ? 'text-foreground hover:bg-accent'
                    : 'text-muted-foreground cursor-not-allowed opacity-60',
              )}
            >
              <span className={cn('size-2 rounded-full shrink-0', providerDotColor(p.status, p.isFree))} />
              {p.status === 'no_key'
                ? <Lock size={12} className="shrink-0 text-muted-foreground" />
                : <Bot size={12} className="shrink-0 text-muted-foreground" />
              }
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className={cn('text-xs font-medium leading-tight', isSelected && 'text-primary dark:text-primary')}>
                  {p.name}
                </span>
                <span className={cn(
                  'text-[10px] leading-tight',
                  p.status === 'no_key' ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground',
                )}>
                  {subtitle}
                </span>
              </div>
              {isSelected && <Check size={13} className="shrink-0 text-primary" />}
            </button>
            {noKeyProvider === p.id && (
              <NoKeyTooltip providerName={p.name} />
            )}
          </div>
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// ChatInput
// ---------------------------------------------------------------------------

export function ChatInput({
  onSend,
  onStop,
  onClearConversation,
  isStreaming,
  activeProvider,
  placeholder = 'Escribe un mensaje...',
  allowFiles = true,
  contextLabel,
  contextType,
  prefillText,
  onPrefillConsumed,
  disableProvidersFetch = false,
  creationDockOpen = false,
  dockTail = false,
  embeddedInComposer = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);

  const [input, setInput]     = useState('');
  const [files, setFiles]     = useState<FileEntry[]>([]);
  const [focused, setFocused] = useState(false);

  // Provider state
  const [providers, setProviders]               = useState<ProviderStatus[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PROVIDER_KEY);
      if (saved === 'auto' || !saved) return null;
      return saved;
    }
    return null;
  });

  const [plusOpen, setPlusOpen]           = useState(false);
  const [providerOpen, setProviderOpen]   = useState(false); // chip popover
  const [modelMenuOpen, setModelMenuOpen] = useState(false); // + menu sub-panel
  const modelCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inputLocked = isStreaming || creationDockOpen;

  const openModelMenu = useCallback(() => {
    if (inputLocked) return;
    if (modelCloseTimer.current) clearTimeout(modelCloseTimer.current);
    setModelMenuOpen(true);
  }, [inputLocked]);

  const scheduleCloseModelMenu = useCallback(() => {
    modelCloseTimer.current = setTimeout(() => setModelMenuOpen(false), 120);
  }, []);

  // ---- Fetch providers ----
  useEffect(() => {
    if (disableProvidersFetch) return;
    fetch('/api/ai/providers/status')
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (json?.success && Array.isArray(json.providers)) {
          setProviders(json.providers as ProviderStatus[]);
        }
      })
      .catch(() => {});
  }, [disableProvidersFetch]);

  // ---- Prefill from parent ----
  useEffect(() => {
    if (prefillText) {
      setInput(prefillText);
      onPrefillConsumed?.();
      // Resize textarea
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.style.height = 'auto';
          el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
          el.focus();
        }
      });
    }
  }, [prefillText, onPrefillConsumed]);

  // ---- Cleanup preview URLs on unmount ----
  useEffect(() => {
    return () => {
      files.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Durante streaming o dock de creación: cerrar menús
  useEffect(() => {
    if (!inputLocked) return;
    setPlusOpen(false);
    setProviderOpen(false);
    setModelMenuOpen(false);
  }, [inputLocked]);

  // ---- Derived provider info ----
  const isAutoMode = !selectedProvider;
  const effectiveProviderId = isAutoMode
    ? null
    : selectedProvider;

  const currentProvider = providers.find((p) => p.id === effectiveProviderId);

  const providerLabel = isAutoMode
    ? 'Auto'
    : currentProvider
      ? currentProvider.name.split(' ')[0]
      : activeProvider
        ? activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1)
        : 'Auto';

  const chipDot = isAutoMode
    ? 'bg-primary'
    : currentProvider
      ? providerDotColor(currentProvider.status, currentProvider.isFree)
      : 'bg-gray-400';

  // ---- Handlers ----
  const handleSelectProvider = useCallback((id: string) => {
    setSelectedProvider(id);
    localStorage.setItem(PROVIDER_KEY, id);
    setProviderOpen(false);
    setModelMenuOpen(false);
    setPlusOpen(false);
  }, []);

  const handleSelectAuto = useCallback(() => {
    setSelectedProvider(null);
    localStorage.removeItem(PROVIDER_KEY);
    setProviderOpen(false);
    setModelMenuOpen(false);
    setPlusOpen(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (inputLocked) return;
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [inputLocked]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (inputLocked) return;
    const all = Array.from(e.target.files ?? []);
    const imageFiles = all.filter((f) => f.type.startsWith('image/'));
    const nonImageCount = all.length - imageFiles.length;
    if (nonImageCount > 0) {
      toast.error('Para analizar imágenes, sólo se permiten archivos de tipo imagen.');
    }

    const newEntries: FileEntry[] = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...newEntries]);
    e.target.value = '';
    setPlusOpen(false);
  }, [inputLocked]);

  const removeFile = useCallback((idx: number) => {
    if (inputLocked) return;
    setFiles((prev) => {
      const entry = prev[idx];
      if (entry?.preview) URL.revokeObjectURL(entry.preview);
      return prev.filter((_, i) => i !== idx);
    });
  }, [inputLocked]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text && files.length === 0) return;
    if (isStreaming) { onStop(); return; }
    if (creationDockOpen) return;
    onSend(text, files.map((f) => f.file));
    setInput('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [input, files, isStreaming, creationDockOpen, onSend, onStop]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleClear = useCallback(() => {
    if (inputLocked) return;
    onClearConversation?.();
    setPlusOpen(false);
  }, [onClearConversation, inputLocked]);

  const hasContent = input.trim().length > 0 || files.length > 0;

  const CtxIcon = contextType ? CONTEXT_ICON[contextType] : null;

  return (
    <div
      className={cn(
        'shrink-0 w-full min-w-0',
        embeddedInComposer ? 'px-0 pb-3 pt-0' : 'px-3 pb-3',
        dockTail && !embeddedInComposer && 'px-3 pb-2 pt-0',
      )}
    >

      {/* Main input box */}
      <div
        className={cn(
          'transition-all duration-150',
          embeddedInComposer
            ? 'rounded-none border-0 border-t border-border/45 bg-transparent'
            : cn(
                'border bg-muted/60',
                dockTail
                  ? 'rounded-b-xl rounded-t-none border-0 border-t border-border/80 bg-muted/60'
                  : cn(
                      'rounded-xl',
                      focused
                        ? 'border-primary/60 shadow-[0_0_0_2px_rgba(20,184,166,0.08)]'
                        : 'border-border',
                    ),
              ),
        )}
      >
        {/* File previews inside the box */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-2.5 pt-2.5">
            {files.map((entry, i) => (
              entry.preview ? (
                /* Image thumbnail */
                <div key={i} className="relative group/thumb">
                  <img
                    src={entry.preview}
                    alt={entry.file.name}
                    className="size-14 rounded-lg object-cover border border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={inputLocked}
                    className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-4 rounded-full bg-gray-800 dark:bg-secondary border border-border text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                  >
                    <X className="size-2.5" />
                  </button>
                </div>
              ) : (
                /* Non-image chip */
                <span
                  key={i}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/60 px-2 py-1 text-[11px] text-foreground"
                >
                  <FileText className="size-3 shrink-0 text-primary" />
                  <span className="max-w-24 truncate">{entry.file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={inputLocked}
                    className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="size-2.5" />
                  </button>
                </span>
              )
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={
            isStreaming && !creationDockOpen
              ? 'Escribe para interrumpir y enviar...'
              : placeholder
          }
          disabled={inputLocked}
          title={
            creationDockOpen
              ? 'El chat está en modo creación: completa el formulario de arriba o cancela para escribir de nuevo.'
              : undefined
          }
          rows={1}
          className={cn(
            'w-full bg-transparent resize-none outline-none',
            'text-sm text-foreground',
            'placeholder:text-muted-foreground',
            'px-3 pt-3 pb-2.5 max-h-40 min-h-5 leading-5',
            creationDockOpen && 'cursor-not-allowed opacity-90',
          )}
        />

        {/* ── Thin divider ─────────────────────────────────────────── */}
        <div className="mx-2 border-t border-border" />

        {/* Bottom toolbar */}
        <div className="flex items-center gap-1 px-1.5 py-1.5">

          {/* LEFT: + menu */}
          <Popover
            open={plusOpen}
            onOpenChange={(v) => {
              if (inputLocked) return;
              setPlusOpen(v);
            }}
          >
            <PopoverTrigger asChild>
              <button
                type="button"
                disabled={inputLocked}
                aria-disabled={inputLocked}
                className={cn(
                  'flex items-center justify-center size-7 rounded-md transition-colors',
                  'text-muted-foreground hover:text-foreground',
                  'hover:bg-accent',
                  plusOpen && 'bg-accent text-foreground',
                  inputLocked && 'cursor-not-allowed opacity-60',
                )}
                title="Más opciones"
              >
                <Plus size={15} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              sideOffset={6}
              className="w-52 p-1 bg-popover border-border shadow-lg"
            >
              {allowFiles && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={inputLocked}
                  className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Paperclip size={13} className="shrink-0 text-muted-foreground" />
                  Adjuntar archivo...
                </button>
              )}
              {onClearConversation && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={inputLocked}
                  className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-accent transition-colors"
                >
                  <Trash2 size={13} className="shrink-0 text-muted-foreground" />
                  Limpiar conversación
                </button>
              )}
              <div className="my-1 border-t border-border" />
              {/* Cambiar modelo — se abre al hover */}
              <Popover
                open={modelMenuOpen}
                onOpenChange={(v) => {
                  if (inputLocked) return;
                  setModelMenuOpen(v);
                }}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    disabled={inputLocked}
                    aria-disabled={inputLocked}
                    onMouseEnter={openModelMenu}
                    onMouseLeave={scheduleCloseModelMenu}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-2 py-1.5 rounded-md text-sm transition-colors',
                      'text-foreground hover:bg-accent',
                    )}
                  >
                    <Bot size={13} className="shrink-0 text-muted-foreground" />
                    <span className="flex-1 text-left">Cambiar modelo...</span>
                    <ChevronRight size={12} className="shrink-0 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="right"
                  align="start"
                  sideOffset={4}
                  onMouseEnter={openModelMenu}
                  onMouseLeave={scheduleCloseModelMenu}
                  className="w-64 p-1 bg-popover border-border shadow-lg"
                >
                  <div className="px-2 py-1.5 border-b border-border mb-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Proveedor de IA
                    </p>
                  </div>
                  <ProviderList
                    providers={providers}
                    effectiveProviderId={effectiveProviderId}
                    onSelect={handleSelectProvider}
                    onSelectAuto={handleSelectAuto}
                  />
                </PopoverContent>
              </Popover>
            </PopoverContent>
          </Popover>

          {/* MIDDLE: context label (flexible spacer) */}
          <div className="flex-1 flex items-center min-w-0 px-1">
            {contextLabel && (
              <button
                type="button"
                disabled={inputLocked}
                aria-disabled={inputLocked}
                className="flex items-center gap-1 min-w-0 px-1.5 py-0.5 rounded-md hover:bg-accent transition-colors"
                title={contextLabel}
              >
                {CtxIcon && (
                  <CtxIcon size={11} className="shrink-0 text-muted-foreground" />
                )}
                <span className="text-[11px] text-muted-foreground truncate max-w-32">
                  {contextLabel}
                </span>
              </button>
            )}
          </div>

          {/* RIGHT: provider chip + send */}
          <div className="flex items-center gap-1 shrink-0">

            {/* Provider chip — opens its OWN popover, independent of + menu */}
            <Popover
              open={providerOpen}
              onOpenChange={(v) => {
                if (inputLocked) return;
                setProviderOpen(v);
              }}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={inputLocked}
                  aria-disabled={inputLocked}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors',
                    'text-[11px] text-muted-foreground',
                    'hover:text-gray-700',
                    'hover:bg-accent',
                    providerOpen && 'bg-accent text-foreground',
                    isAutoMode && 'text-primary dark:text-primary',
                  )}
                  title="Cambiar proveedor"
                >
                  {isAutoMode
                    ? <Zap size={11} className="shrink-0 text-primary" />
                    : <span className={cn('size-1.5 rounded-full shrink-0', chipDot)} />
                  }
                  <span>{isAutoMode ? 'Auto' : providerLabel}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="end"
                sideOffset={6}
                className="w-64 p-1 bg-popover border-border shadow-lg"
              >
                <div className="px-2 py-1.5 border-b border-border mb-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Proveedor de IA
                  </p>
                </div>
                <ProviderList
                  providers={providers}
                  effectiveProviderId={effectiveProviderId}
                  onSelect={handleSelectProvider}
                  onSelectAuto={handleSelectAuto}
                />
              </PopoverContent>
            </Popover>

            {/* Send / Stop — con dock de creación abierto solo se permite detener stream, no enviar */}
            <button
              type="button"
              onClick={isStreaming ? onStop : hasContent ? handleSend : undefined}
              disabled={creationDockOpen ? !isStreaming : !hasContent && !isStreaming}
              className={cn(
                'flex items-center justify-center size-7 rounded-lg transition-colors shrink-0',
                creationDockOpen && !isStreaming && 'opacity-40',
                isStreaming
                  ? 'bg-orange-600 hover:bg-orange-500 text-white'
                  : hasContent && !creationDockOpen
                    ? 'bg-primary hover:bg-primary text-white'
                    : 'text-muted-foreground cursor-not-allowed',
              )}
              title={
                creationDockOpen && !isStreaming
                  ? 'Desbloquea cancelando o completando la creación'
                  : isStreaming
                    ? 'Detener'
                    : 'Enviar'
              }
            >
              {isStreaming
                ? <Square size={12} className="fill-current" />
                : <Send size={13} />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
      />
    </div>
  );
}
