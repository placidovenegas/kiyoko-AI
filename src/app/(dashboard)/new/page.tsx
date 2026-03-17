'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils/slugify';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';
import {
  IconSend,
  IconPhoto,
  IconSparkles,
  IconArrowLeft,
  IconLoader2,
  IconMessageChatbot,
  IconPalette,
  IconUsers,
  IconMapPin,
  IconRocket,
  IconForms,
} from '@tabler/icons-react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProjectStyle =
  | 'pixar'
  | 'realistic'
  | 'anime'
  | 'watercolor'
  | 'flat_2d'
  | 'cyberpunk'
  | 'custom';

type TargetPlatform =
  | 'youtube'
  | 'instagram_reels'
  | 'tiktok'
  | 'tv_commercial'
  | 'web'
  | 'custom';

type MessageRole = 'user' | 'assistant' | 'system';

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  quickActions?: QuickAction[];
  durationSlider?: boolean;
  timestamp: number;
}

interface QuickAction {
  label: string;
  emoji?: string;
  value: string;
  group?: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

interface CollectedData {
  title: string;
  clientName: string;
  description: string;
  style: ProjectStyle;
  platform: TargetPlatform;
  duration: number;
  characters: { name: string; description: string; role: string; personality: string }[];
  locations: { name: string; description: string; locationType: string; timeOfDay: string }[];
  aiBrief: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STYLES: { value: ProjectStyle; label: string; emoji: string }[] = [
  { value: 'pixar', label: 'Pixar 3D', emoji: '\uD83C\uDFAC' },
  { value: 'realistic', label: 'Realista', emoji: '\uD83D\uDCF7' },
  { value: 'anime', label: 'Anime', emoji: '\uD83C\uDFA8' },
  { value: 'watercolor', label: 'Acuarela', emoji: '\uD83D\uDD8C\uFE0F' },
  { value: 'flat_2d', label: 'Flat 2D', emoji: '\uD83D\uDCD0' },
  { value: 'cyberpunk', label: 'Cyberpunk', emoji: '\uD83C\uDF03' },
];

const PLATFORMS: { value: TargetPlatform; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram_reels', label: 'Instagram Reels' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'tv_commercial', label: 'TV' },
  { value: 'web', label: 'Web' },
];

const STEP_CONFIG = [
  { label: 'Brief', icon: IconMessageChatbot },
  { label: 'Estilo', icon: IconPalette },
  { label: 'Personajes', icon: IconUsers },
  { label: 'Localizaciones', icon: IconMapPin },
  { label: 'Crear', icon: IconRocket },
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hola, soy Kiyoko, tu directora creativa de IA. Vamos a crear algo increible juntos.\n\nCuantame sobre tu proyecto de video: \u00bfDe que trata? \u00bfQuien es el cliente? \u00bfQue quieres comunicar?',
  timestamp: Date.now(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function makeAssistantMsg(
  content: string,
  extras?: Partial<Pick<ChatMessage, 'quickActions' | 'durationSlider'>>,
): ChatMessage {
  return { id: uid(), role: 'assistant', content, timestamp: Date.now(), ...extras };
}

function makeUserMsg(content: string): ChatMessage {
  return { id: uid(), role: 'user', content, timestamp: Date.now() };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();

  // Wizard state
  const [step, setStep] = useState<WizardStep>(1);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Duration slider state (shown inline in chat)
  const [sliderValue, setSliderValue] = useState(60);

  // Collected project data
  const [data, setData] = useState<CollectedData>({
    title: '',
    clientName: '',
    description: '',
    style: 'pixar',
    platform: 'youtube',
    duration: 60,
    characters: [],
    locations: [],
    aiBrief: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Focus input when step changes
  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  // ------------------------------------------------------------------
  // AI call with fallback
  // ------------------------------------------------------------------

  const callAI = useCallback(
    async (conversationHistory: { role: string; content: string }[]): Promise<string | null> => {
      try {
        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: '__wizard__',
            messages: conversationHistory.map((m) => ({
              role: m.role === 'assistant' ? 'assistant' : 'user',
              content: m.content,
            })),
          }),
        });

        if (!res.ok) {
          return null;
        }

        // Read SSE stream
        const reader = res.body?.getReader();
        if (!reader) return null;

        const decoder = new TextDecoder();
        let full = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.text) full += parsed.text;
                if (parsed.error) return null;
              } catch {
                // ignore parse errors
              }
            }
          }
        }

        return full || null;
      } catch {
        return null;
      }
    },
    [],
  );

  // ------------------------------------------------------------------
  // Append messages helper
  // ------------------------------------------------------------------

  const appendMessages = useCallback((...msgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  }, []);

  // ------------------------------------------------------------------
  // Fallback questions for each step (when AI is not available)
  // ------------------------------------------------------------------

  const fallbackStepResponse = useCallback(
    (currentStep: WizardStep, userText: string): ChatMessage | null => {
      switch (currentStep) {
        case 1: {
          // Parse brief - move to step 2
          setData((d) => ({
            ...d,
            description: userText,
            aiBrief: userText,
            title: userText.split(/[.,!?\n]/)[0].trim().slice(0, 80) || 'Nuevo Proyecto',
          }));
          setStep(2);
          return makeAssistantMsg(
            'Genial, tengo el brief. Ahora elijamos el estilo visual y la plataforma de destino.\n\nSelecciona un estilo visual:',
            {
              quickActions: STYLES.map((s) => ({
                label: s.label,
                emoji: s.emoji,
                value: s.value,
                group: 'style',
              })),
            },
          );
        }
        case 2:
          // Should be handled by quick actions
          return null;
        case 3: {
          // Parse characters
          const chars = parseCharacters(userText);
          setData((d) => ({ ...d, characters: chars }));
          setStep(4);
          return makeAssistantMsg(
            `Perfecto, tengo ${chars.length} personaje${chars.length !== 1 ? 's' : ''} registrado${chars.length !== 1 ? 's' : ''}.\n\nAhora cuantame sobre las localizaciones o fondos. Describe los escenarios donde transcurre la accion: nombre, apariencia, si es interior/exterior, momento del dia...\n\nSi no tienes localizaciones especificas, escribe "ninguna" y las generare yo.`,
          );
        }
        case 4: {
          const locs = parseLocations(userText);
          setData((d) => ({ ...d, locations: locs }));
          setStep(5);
          return makeAssistantMsg(
            'Tengo toda la informacion que necesito. Voy a crear tu proyecto ahora mismo...',
          );
        }
        default:
          return null;
      }
    },
    [],
  );

  // ------------------------------------------------------------------
  // Process user input
  // ------------------------------------------------------------------

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || isThinking || isCreating) return;

      const userMsg = makeUserMsg(text);
      appendMessages(userMsg);
      setInput('');
      setIsThinking(true);

      // Build conversation for AI
      const history = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];

      // Try AI first
      if (!isFallback) {
        const aiResponse = await callAI(history);

        if (aiResponse) {
          // AI responded - parse to detect step transitions
          const aiMsg = makeAssistantMsg(aiResponse);

          // Detect step from AI response content
          const lower = aiResponse.toLowerCase();
          if (step === 1 && (lower.includes('estilo') || lower.includes('plataforma'))) {
            setData((d) => ({
              ...d,
              description: text,
              aiBrief: text,
              title: text.split(/[.,!?\n]/)[0].trim().slice(0, 80) || 'Nuevo Proyecto',
            }));
            setStep(2);
            aiMsg.quickActions = STYLES.map((s) => ({
              label: s.label,
              emoji: s.emoji,
              value: s.value,
              group: 'style',
            }));
          } else if (step === 2 && (lower.includes('personaje') || lower.includes('character'))) {
            setStep(3);
          } else if (step === 3 && (lower.includes('localiz') || lower.includes('escenario') || lower.includes('fondo'))) {
            const chars = parseCharacters(text);
            if (chars.length > 0) setData((d) => ({ ...d, characters: chars }));
            setStep(4);
          } else if (step === 4 && (lower.includes('crear') || lower.includes('generar') || lower.includes('listo'))) {
            const locs = parseLocations(text);
            if (locs.length > 0) setData((d) => ({ ...d, locations: locs }));
            setStep(5);
          }

          appendMessages(aiMsg);
          setIsThinking(false);

          if (step === 5 || (step === 4 && aiResponse.toLowerCase().includes('crear'))) {
            await createProject();
          }
          return;
        } else {
          // AI failed - switch to fallback
          setIsFallback(true);
          toast('Configura una API key de IA para generacion automatica de escenas', {
            duration: 5000,
          });
        }
      }

      // Fallback mode
      const fallbackMsg = fallbackStepResponse(step, text);
      if (fallbackMsg) {
        appendMessages(fallbackMsg);
      }
      setIsThinking(false);

      // If we reached step 5 in fallback mode, auto-create
      if (step === 4 && fallbackMsg) {
        // step was just set to 5 inside fallbackStepResponse
        await createProject();
      }
    },
    [input, messages, step, isThinking, isCreating, isFallback, callAI, appendMessages, fallbackStepResponse],
  );

  // ------------------------------------------------------------------
  // Quick action handler
  // ------------------------------------------------------------------

  const handleQuickAction = useCallback(
    async (action: QuickAction) => {
      if (isThinking || isCreating) return;

      if (action.group === 'style') {
        setData((d) => ({ ...d, style: action.value as ProjectStyle }));
        appendMessages(makeUserMsg(`${action.emoji ?? ''} ${action.label}`));

        // Now show platform selection
        setTimeout(() => {
          appendMessages(
            makeAssistantMsg('Buen gusto. Ahora, \u00bfpara que plataforma es el video?', {
              quickActions: PLATFORMS.map((p) => ({
                label: p.label,
                value: p.value,
                group: 'platform',
              })),
            }),
          );
        }, 400);
        return;
      }

      if (action.group === 'platform') {
        setData((d) => ({ ...d, platform: action.value as TargetPlatform }));
        appendMessages(makeUserMsg(action.label));

        // Now show duration slider
        setTimeout(() => {
          appendMessages(
            makeAssistantMsg(
              '\u00bfQue duracion aproximada tiene el video? Desliza para elegir.',
              { durationSlider: true },
            ),
          );
        }, 400);
        return;
      }

      if (action.group === 'duration_confirm') {
        setData((d) => ({ ...d, duration: sliderValue }));
        appendMessages(makeUserMsg(`Duracion: ${sliderValue} segundos`));
        setStep(3);

        setTimeout(() => {
          appendMessages(
            makeAssistantMsg(
              'Perfecto. Ahora hablemos de los personajes.\n\n\u00bfCuantos personajes tiene tu video? Describe cada uno: nombre, aspecto fisico, rol en la historia y personalidad.\n\nPor ejemplo: "Maria, mujer de 30 anos, peluquera, pelo rizado castano, delantal negro. Es alegre y profesional."\n\nSi no hay personajes, escribe "ninguno".',
            ),
          );
        }, 400);
        return;
      }
    },
    [isThinking, isCreating, appendMessages, sliderValue],
  );

  // ------------------------------------------------------------------
  // Create project in Supabase
  // ------------------------------------------------------------------

  const createProject = useCallback(async () => {
    setIsCreating(true);
    appendMessages(
      makeAssistantMsg('Creando tu proyecto... Dame un momento.'),
    );

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const title = data.title || 'Nuevo Proyecto';
      const slug = slugify(title) + '-' + Date.now().toString(36);

      // Insert project
      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          title: title.trim(),
          slug,
          description: data.description.trim(),
          client_name: data.clientName.trim(),
          style: data.style,
          target_platform: data.platform,
          target_duration_seconds: data.duration,
          owner_id: user.id,
          status: 'draft',
          ai_brief: data.aiBrief,
        })
        .select()
        .single();

      if (error) throw error;

      // Insert characters
      if (data.characters.length > 0) {
        const charInserts = data.characters.map((c, i) => ({
          project_id: project.id,
          name: c.name,
          initials: c.name
            .split(' ')
            .map((w: string) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          role: c.role,
          description: c.description,
          personality: c.personality,
          sort_order: i,
        }));
        await supabase.from('characters').insert(charInserts);
      }

      // Insert backgrounds
      if (data.locations.length > 0) {
        const bgInserts = data.locations.map((l, i) => ({
          project_id: project.id,
          code: slugify(l.name).toUpperCase().slice(0, 10) || `LOC_${i + 1}`,
          name: l.name,
          description: l.description,
          location_type: l.locationType,
          time_of_day: l.timeOfDay,
          sort_order: i,
        }));
        await supabase.from('backgrounds').insert(bgInserts);
      }

      toast.success('Proyecto creado con exito');
      router.push(`/p/${project.slug}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear proyecto');
      setIsCreating(false);
      appendMessages(
        makeAssistantMsg(
          'Ha habido un error al crear el proyecto. Intentalo de nuevo o comprueba tu conexion.',
        ),
      );
    }
  }, [data, supabase, router, appendMessages]);

  // ------------------------------------------------------------------
  // Key handler
  // ------------------------------------------------------------------

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col">
      {/* ---- Header ---- */}
      <div className="flex items-center gap-3 border-b border-surface-tertiary px-4 py-3">
        <Link
          href="/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground-muted transition-colors duration-150 hover:bg-surface-secondary hover:text-foreground"
        >
          <IconArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-foreground">Nuevo Proyecto</h1>
          <p className="text-xs text-foreground-muted">Asistente de creacion</p>
        </div>
        <IconSparkles size={18} className="text-brand-500" />
      </div>

      {/* ---- Step indicator with icons ---- */}
      <div className="flex items-center gap-1 px-4 py-4">
        {STEP_CONFIG.map((cfg, i) => {
          const stepNum = (i + 1) as WizardStep;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          const StepIcon = cfg.icon;
          return (
            <div key={cfg.label} className="flex flex-1 flex-col items-center gap-1.5">
              {/* Icon circle */}
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full transition-all duration-150',
                  isCompleted
                    ? 'bg-brand-500 text-white'
                    : isActive
                      ? 'bg-brand-500/20 text-brand-500 ring-2 ring-brand-500/30'
                      : 'bg-surface-tertiary text-foreground-muted',
                )}
              >
                <StepIcon size={16} />
              </div>
              {/* Progress bar */}
              <div
                className={cn(
                  'h-1 w-full rounded-full transition-colors duration-150',
                  isCompleted
                    ? 'bg-brand-500'
                    : isActive
                      ? 'bg-brand-500/50'
                      : 'bg-surface-tertiary',
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors duration-150',
                  isActive || isCompleted ? 'text-brand-500' : 'text-foreground-muted',
                )}
              >
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ---- Messages ---- */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: 'calc(100vh - 16rem)' }}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
            >
              {/* Message bubble */}
              <div
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                {/* AI avatar */}
                {msg.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
                    AI
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'rounded-br-md bg-brand-500 text-white'
                      : 'rounded-bl-md bg-surface-secondary text-foreground',
                  )}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick actions */}
              {msg.quickActions && msg.quickActions.length > 0 && (
                <div className="mt-3 ml-11 flex flex-wrap gap-2">
                  {msg.quickActions.map((action) => (
                    <button
                      key={action.value}
                      onClick={() => handleQuickAction(action)}
                      disabled={isThinking || isCreating}
                      className={cn(
                        'flex items-center gap-1.5 rounded-xl border-2 px-4 py-2.5 text-sm font-medium',
                        'transition-all duration-150',
                        'min-h-11',
                        data.style === action.value && action.group === 'style'
                          ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                          : data.platform === action.value && action.group === 'platform'
                            ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                            : 'border-surface-tertiary text-foreground-secondary hover:border-brand-400 hover:text-brand-500',
                      )}
                    >
                      {action.emoji && <span className="text-lg">{action.emoji}</span>}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Duration slider */}
              {msg.durationSlider && (
                <div className="mt-3 ml-11 max-w-xs space-y-3">
                  <div className="flex items-center justify-between text-xs text-foreground-muted">
                    <span>15s</span>
                    <span className="text-base font-bold text-brand-500">
                      {sliderValue}s
                    </span>
                    <span>180s</span>
                  </div>
                  <input
                    type="range"
                    min={15}
                    max={180}
                    step={5}
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="w-full accent-brand-500"
                  />
                  <button
                    onClick={() =>
                      handleQuickAction({
                        label: `${sliderValue}s`,
                        value: String(sliderValue),
                        group: 'duration_confirm',
                      })
                    }
                    disabled={isThinking || isCreating}
                    className="min-h-11 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-brand-600"
                  >
                    Confirmar duracion
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isThinking && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
                AI
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-surface-secondary px-4 py-3">
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:0ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:150ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-foreground-muted [animation-delay:300ms]" />
              </div>
            </div>
          )}

          {/* Creating indicator */}
          {isCreating && (
            <div className="flex items-center justify-center gap-2 py-6">
              <IconLoader2 className="h-5 w-5 animate-spin text-brand-500" />
              <span className="text-sm font-medium text-foreground-muted">
                Creando proyecto...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ---- Input area ---- */}
      <div className="border-t border-surface-tertiary px-4 py-3">
        <div className="flex items-end gap-2 rounded-xl border border-surface-tertiary bg-surface-secondary p-2 transition-colors duration-150 focus-within:border-brand-500">
          {/* Photo upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                toast.info(`Imagen seleccionada: ${file.name}`);
                // TODO: Upload reference image to storage
              }
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-foreground-muted transition-colors duration-150 hover:bg-surface-tertiary hover:text-foreground"
            title="Subir imagen de referencia"
          >
            <IconPhoto size={18} />
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              step === 1
                ? 'Describe tu proyecto...'
                : step === 3
                  ? 'Describe los personajes...'
                  : step === 4
                    ? 'Describe las localizaciones...'
                    : 'Escribe un mensaje...'
            }
            rows={1}
            disabled={isCreating}
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-foreground-muted disabled:opacity-50"
          />

          {/* Send */}
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking || isCreating}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white transition-all duration-150 hover:bg-brand-600 disabled:opacity-40"
          >
            <IconSend size={16} />
          </button>
        </div>

        {/* Manual creation link + disclaimer */}
        <div className="mt-2 flex items-center justify-between">
          <Link
            href="/new/manual"
            className="flex items-center gap-1.5 text-xs text-foreground-muted transition-colors duration-150 hover:text-brand-500"
          >
            <IconForms size={14} />
            Crear manualmente (sin IA)
          </Link>
          <p className="text-[10px] text-foreground-muted">
            Kiyoko AI puede cometer errores.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function parseCharacters(
  text: string,
): { name: string; description: string; role: string; personality: string }[] {
  const lower = text.toLowerCase().trim();
  if (lower === 'ninguno' || lower === 'no' || lower === 'none' || lower === '0') {
    return [];
  }

  // Try to split by numbered lines, dashes, or double newlines
  const blocks = text
    .split(/(?:\n\s*\n|\n\s*[-\d]+[.)]\s*)/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return [{ name: 'Personaje', description: text, role: '', personality: '' }];
  }

  return blocks.map((block) => {
    // Try to extract name from the start (before comma or colon)
    const nameMatch = block.match(/^([^,:]+)[,:]?\s*/);
    const name = nameMatch ? nameMatch[1].trim() : 'Personaje';
    const rest = nameMatch ? block.slice(nameMatch[0].length) : block;
    return {
      name,
      description: rest || block,
      role: '',
      personality: '',
    };
  });
}

function parseLocations(
  text: string,
): { name: string; description: string; locationType: string; timeOfDay: string }[] {
  const lower = text.toLowerCase().trim();
  if (lower === 'ninguna' || lower === 'no' || lower === 'none' || lower === '0') {
    return [];
  }

  const blocks = text
    .split(/(?:\n\s*\n|\n\s*[-\d]+[.)]\s*)/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    return [{ name: 'Localizacion', description: text, locationType: 'interior', timeOfDay: 'day' }];
  }

  return blocks.map((block) => {
    const nameMatch = block.match(/^([^,:]+)[,:]?\s*/);
    const name = nameMatch ? nameMatch[1].trim() : 'Localizacion';
    const rest = nameMatch ? block.slice(nameMatch[0].length) : block;

    const lowerBlock = block.toLowerCase();
    const locationType = lowerBlock.includes('exterior') ? 'exterior' : 'interior';
    const timeOfDay = lowerBlock.includes('noche') || lowerBlock.includes('night')
      ? 'night'
      : lowerBlock.includes('atardecer') || lowerBlock.includes('sunset')
        ? 'sunset'
        : 'day';

    return { name, description: rest || block, locationType, timeOfDay };
  });
}
