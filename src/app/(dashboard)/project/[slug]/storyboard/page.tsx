'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CopyButton } from '@/components/ui/CopyButton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  Sparkles,
  Plus,
  X,
  Loader2,
  ChevronRight,
  Search as SearchIcon,
  Wand2,
  Image as ImageIcon,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  Pencil,
  Save,
  BarChart3,
  List,
  LayoutGrid,
  MessageSquare,
  Clock,
  Trash2,
  AlertTriangle,
  CheckSquare,
} from 'lucide-react';
import type { Project } from '@/types/project';
import type { Scene, SceneType, ArcPhase, SceneImprovement } from '@/types/scene';
import type { Character } from '@/types/character';
import type { Background } from '@/types/background';
import { SceneSelectionBar } from '@/components/project/SceneSelectionBar';
import { ChatStoryboard } from '@/components/storyboard/ChatStoryboard';
import { HistoryPanel } from '@/components/storyboard/HistoryPanel';

// ==========================================================================
// 1. Types & Constants
// ==========================================================================

type ViewMode = 'collapsed' | 'expanded';
type AudioType = 'silent' | 'ambient' | 'music' | 'dialogue' | 'voiceover';
type InsertMode = 'closed' | 'menu' | 'detail' | 'manual';
type AISidebarMode = 'improve' | 'rewrite';

interface AISidebarState {
  open: boolean;
  sceneId: string;
  promptType: 'image' | 'video';
  originalPrompt: string;
}

interface SceneAnalysis {
  scene_number: string;
  scene_title: string;
  score: number;
  status: 'good' | 'needs_improvement' | 'critical';
  prompt_quality: string;
  improvements: string[];
  audio_suggestion?: string;
  pacing_note?: string;
}

interface AnalysisResult {
  summary?: string;
  strengths?: Array<string | { title: string; description: string; category?: string }>;
  warnings?: Array<string | { title: string; description: string; category?: string; priority?: number }>;
  suggestions?: Array<string | { title: string; description: string; category?: string } | { text: string; action?: string }>;
  overall_score?: number;
  scene_analysis?: SceneAnalysis[];
  narrative_flow?: Record<string, string>;
  audio_analysis?: Record<string, string>;
}

const SCENE_TYPE_COLORS: Record<SceneType, string> = {
  original: '#6B7280',
  improved: '#F59E0B',
  new: '#3B82F6',
  filler: '#8B5CF6',
  video: '#EC4899',
};

const SCENE_TYPE_LABELS: Record<SceneType, string> = {
  original: 'Original',
  improved: 'Mejorada',
  new: 'Nueva',
  filler: 'Relleno',
  video: 'Video',
};

const ARC_PHASE_COLORS: Record<ArcPhase, string> = {
  hook: '#EF4444',
  build: '#F59E0B',
  peak: '#10B981',
  close: '#3B82F6',
};

const ARC_PHASE_LABELS: Record<ArcPhase, string> = {
  hook: 'Gancho',
  build: 'Desarrollo',
  peak: 'Climax',
  close: 'Cierre',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompt_ready: 'Prompt listo',
  generating: 'Generando',
  generated: 'Generado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  draft: 'bg-gray-400',
  prompt_ready: 'bg-yellow-400',
  generating: 'bg-purple-400 animate-pulse',
  generated: 'bg-green-400',
  approved: 'bg-blue-500',
  rejected: 'bg-red-400',
};

const TYPE_FILTERS: { label: string; value: string }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Orig', value: 'original' },
  { label: 'Mej', value: 'improved' },
  { label: 'Nuevas', value: 'new' },
  { label: 'Relleno', value: 'filler' },
  { label: 'Video', value: 'video' },
];

const ARC_FILTERS: { label: string; value: string }[] = [
  { label: 'Todas', value: 'all' },
  { label: 'Gancho', value: 'hook' },
  { label: 'Desarrollo', value: 'build' },
  { label: 'Climax', value: 'peak' },
  { label: 'Cierre', value: 'close' },
];

const CAMERA_ANGLE_OPTIONS: { label: string; value: Scene['camera_angle'] }[] = [
  { label: 'Wide', value: 'wide' },
  { label: 'Medium', value: 'medium' },
  { label: 'Close Up', value: 'close_up' },
  { label: 'Extreme Close Up', value: 'extreme_close_up' },
  { label: 'POV', value: 'pov' },
  { label: 'Low Angle', value: 'low_angle' },
  { label: 'High Angle', value: 'high_angle' },
  { label: "Bird's Eye", value: 'birds_eye' },
  { label: 'Dutch', value: 'dutch' },
  { label: 'Over Shoulder', value: 'over_shoulder' },
];

const CAMERA_MOVEMENT_OPTIONS: { label: string; value: Scene['camera_movement'] }[] = [
  { label: 'Static', value: 'static' },
  { label: 'Dolly In', value: 'dolly_in' },
  { label: 'Dolly Out', value: 'dolly_out' },
  { label: 'Pan Left', value: 'pan_left' },
  { label: 'Pan Right', value: 'pan_right' },
  { label: 'Tilt Up', value: 'tilt_up' },
  { label: 'Tilt Down', value: 'tilt_down' },
  { label: 'Tracking', value: 'tracking' },
  { label: 'Crane', value: 'crane' },
  { label: 'Handheld', value: 'handheld' },
  { label: 'Orbit', value: 'orbit' },
];

const AUDIO_TYPE_OPTIONS: { label: string; value: AudioType; emoji: string }[] = [
  { label: 'Silente', value: 'silent', emoji: '\uD83D\uDD07' },
  { label: 'Sonido ambiente', value: 'ambient', emoji: '\uD83C\uDF0A' },
  { label: 'Musica de fondo', value: 'music', emoji: '\uD83C\uDFB5' },
  { label: 'Dialogos', value: 'dialogue', emoji: '\uD83D\uDDE3\uFE0F' },
  { label: 'Voz en off', value: 'voiceover', emoji: '\uD83C\uDF99\uFE0F' },
];

const SCENE_TYPE_OPTIONS: { value: SceneType; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'new', label: 'Nueva' },
  { value: 'filler', label: 'Relleno' },
  { value: 'video', label: 'Video' },
];

const QUICK_SUGGESTIONS = [
  'Mas detalle de iluminacion',
  'Cambiar angulo de camara',
  'Anadir mas emocion',
  'Hacer mas cinematografico',
  'Anadir profundidad de campo',
  'Incluir mas detalles del personaje',
  'Cambiar hora del dia',
  'Anadir efectos atmosfericos',
];

// ==========================================================================
// 2. Helper Functions
// ==========================================================================

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m${s}s` : `${m}m`;
}

function getInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectAudioType(scene: Scene): AudioType {
  const sn = (scene.sound_notes || '').toUpperCase();
  if (sn.includes('SILENT') || sn.includes('NO DIALOGUE')) return 'silent';
  if (sn.includes('VOICEOVER')) return 'voiceover';
  if (sn.includes('AMBIENT')) return 'ambient';
  if (scene.music_notes) return 'music';
  if (sn.includes('DIALOGUE')) return 'dialogue';
  return 'silent';
}

function getAudioBadge(scene: Scene): { emoji: string; label: string } {
  const t = detectAudioType(scene);
  const opt = AUDIO_TYPE_OPTIONS.find((o) => o.value === t);
  return opt ? { emoji: opt.emoji, label: opt.label } : { emoji: '\uD83D\uDD07', label: 'Silente' };
}

function resolveSceneCharacters(scene: Scene, characters: Character[]): Character[] {
  const byIds = characters.filter((c) => scene.character_ids?.includes(c.id));
  if (byIds.length > 0) return byIds;
  if (scene.required_references?.length) {
    const charRefs = scene.required_references
      .filter((ref) => ref.startsWith('CHAR:') || ref.startsWith('char:'))
      .map((ref) => ref.split(':')[1]?.toLowerCase().trim());
    if (charRefs.length > 0) {
      const found = characters.filter((c) =>
        charRefs.some((ref) => c.name.toLowerCase().includes(ref) || c.initials.toLowerCase() === ref),
      );
      if (found.length > 0) return found;
    }
    const refEntries = scene.required_references
      .filter((ref) => ref.startsWith('REF-'))
      .map((ref) => stripAccents(ref.slice(4)).toLowerCase());
    if (refEntries.length > 0) {
      const found = characters.filter((c) =>
        refEntries.some((ref) => {
          const nameNorm = stripAccents(c.name).toLowerCase();
          const initialsNorm = stripAccents(c.initials || '').toLowerCase();
          return nameNorm === ref || nameNorm.includes(ref) || initialsNorm === ref;
        }),
      );
      if (found.length > 0) return found;
    }
  }
  return [];
}

function resolveSceneBackground(scene: Scene, backgrounds: Background[]): Background | undefined {
  if (scene.background_id) return backgrounds.find((b) => b.id === scene.background_id);
  if (scene.required_references?.length) {
    const bgRefs = scene.required_references
      .filter((ref) => ref.startsWith('BG:') || ref.startsWith('bg:'))
      .map((ref) => ref.split(':')[1]?.toLowerCase().trim());
    if (bgRefs.length > 0) {
      const found = backgrounds.find((bg) =>
        bgRefs.some((ref) => bg.code.toLowerCase().includes(ref) || bg.name.toLowerCase().includes(ref)),
      );
      if (found) return found;
    }
    const refEntries = scene.required_references.filter((ref) => ref.startsWith('REF-'));
    if (refEntries.length > 0) {
      const found = backgrounds.find((bg) =>
        refEntries.some((ref) => {
          const refNorm = stripAccents(ref).toLowerCase();
          const codeNorm = stripAccents(bg.code).toLowerCase();
          const nameNorm = stripAccents(bg.name).toLowerCase();
          return codeNorm === refNorm || nameNorm === refNorm || codeNorm.includes(refNorm) || refNorm.includes(codeNorm);
        }),
      );
      if (found) return found;
    }
  }
  return undefined;
}

function exportAnalysisMarkdown(result: AnalysisResult) {
  const lines: string[] = ['# Analisis del Storyboard', ''];
  if (result.summary) lines.push('## Resumen', '', result.summary, '');
  if (result.overall_score != null) lines.push(`**Puntuacion general:** ${result.overall_score}/100`, '');
  const renderItems = (items: unknown[]) => {
    for (const item of items) {
      if (typeof item === 'string') {
        lines.push(`- ${item}`);
      } else if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        if ('title' in obj) lines.push(`- **${obj.title}**: ${obj.description || ''}${obj.category ? ` _(${obj.category})_` : ''}`);
        else if ('text' in obj) lines.push(`- ${obj.text}${obj.action ? ` [${obj.action}]` : ''}`);
        else lines.push(`- ${JSON.stringify(obj)}`);
      }
    }
  };
  if (result.strengths?.length) { lines.push('## Puntos fuertes', ''); renderItems(result.strengths); lines.push(''); }
  if (result.warnings?.length) { lines.push('## Advertencias', ''); renderItems(result.warnings); lines.push(''); }
  if (result.suggestions?.length) { lines.push('## Sugerencias', ''); renderItems(result.suggestions); lines.push(''); }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analisis-storyboard-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==========================================================================
// 3. Sub-components
// ==========================================================================

function Badge({ label, color, textWhite }: { label: string; color: string; textWhite?: boolean }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none', textWhite ? 'text-white' : '')}
      style={textWhite ? { backgroundColor: color } : { backgroundColor: `${color}18`, color }}
    >
      {label}
    </span>
  );
}

function CharacterBadge({ character }: { character: Character }) {
  const initials = character.initials || getInitials(character.name);
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
        style={{ backgroundColor: character.color_accent || '#6B7280' }}
      >
        {initials}
      </span>
      <span className="text-xs text-foreground-secondary">{character.name}</span>
    </div>
  );
}

function PromptSection({
  label,
  text,
  onImprove,
  onEdit,
  editMode,
  editValue,
  onEditChange,
}: {
  label: string;
  text: string;
  onImprove?: () => void;
  onEdit?: () => void;
  editMode?: boolean;
  editValue?: string;
  onEditChange?: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">{label}</span>
        {!editMode && (
          <div className="flex items-center gap-0.5">
            <CopyButton text={text} className="h-7 px-2 text-[11px] opacity-60 hover:opacity-100" />
            {onImprove && (
              <button type="button" onClick={onImprove} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-[#8B5CF6] transition-colors hover:bg-[#8B5CF6]/10">
                <Sparkles className="h-3 w-3" /> IA
              </button>
            )}
            {onEdit && (
              <button type="button" onClick={onEdit} className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-foreground">
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
      {editMode ? (
        <textarea
          className="w-full rounded-lg border border-surface-tertiary bg-[#0d1117] px-3 py-2 font-mono text-xs leading-relaxed text-gray-300 outline-none focus:border-[#3B82F6]"
          rows={4}
          value={editValue ?? ''}
          onChange={(e) => onEditChange?.(e.target.value)}
        />
      ) : (
        <pre className="whitespace-pre-wrap break-words rounded-lg bg-[#0d1117] px-3 py-2.5 text-xs leading-relaxed text-gray-300">
          <code>{text}</code>
        </pre>
      )}
    </div>
  );
}

function GeneratePromptButton({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#8B5CF6]/30 bg-[#8B5CF6]/5 px-4 py-2.5 text-xs font-medium text-[#8B5CF6] transition-all hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/10 disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
      {loading ? 'Generando...' : label}
    </button>
  );
}

function AddCharactersDropdown({
  allCharacters, currentIds, sceneId, onUpdateScene,
}: {
  allCharacters: Character[];
  currentIds: string[];
  sceneId: string;
  onUpdateScene?: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(currentIds);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (id: string) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const handleSave = async () => {
    if (onUpdateScene) await onUpdateScene(sceneId, { character_ids: selected });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 text-xs text-foreground-muted transition-colors hover:text-[#3B82F6]">
        Sin personajes <Plus className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-lg border border-surface-tertiary bg-surface p-2 shadow-xl">
          <div className="max-h-48 space-y-0.5 overflow-y-auto">
            {allCharacters.map((c) => (
              <button key={c.id} type="button" onClick={() => toggle(c.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-surface-secondary">
                <span className={cn('flex h-4 w-4 shrink-0 items-center justify-center rounded border', selected.includes(c.id) ? 'border-[#3B82F6] bg-[#3B82F6] text-white' : 'border-surface-tertiary')}>
                  {selected.includes(c.id) && <Check className="h-3 w-3" />}
                </span>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: c.color_accent || '#6B7280' }}>
                  {c.initials || getInitials(c.name)}
                </span>
                <span className="truncate text-foreground-secondary">{c.name}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={handleSave} className="mt-2 flex w-full items-center justify-center gap-1 rounded-md bg-[#3B82F6] px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#3B82F6]/90">
            <Check className="h-3 w-3" /> Guardar
          </button>
        </div>
      )}
    </div>
  );
}

function AddBackgroundDropdown({
  allBackgrounds, sceneId, onUpdateScene,
}: {
  allBackgrounds: Background[];
  sceneId: string;
  onUpdateScene?: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (bgId: string) => {
    if (onUpdateScene) await onUpdateScene(sceneId, { background_id: bgId });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 text-xs text-foreground-muted transition-colors hover:text-[#3B82F6]">
        Sin fondo <Plus className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-64 rounded-lg border border-surface-tertiary bg-surface p-2 shadow-xl">
          <div className="max-h-48 space-y-0.5 overflow-y-auto">
            {allBackgrounds.map((bg) => (
              <button key={bg.id} type="button" onClick={() => handleSelect(bg.id)} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-surface-secondary">
                <span className="truncate font-medium text-foreground-secondary">{bg.name}</span>
                <span className="shrink-0 rounded bg-surface-tertiary px-1.5 py-0.5 text-[10px] font-mono text-foreground-muted">{bg.code}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// 4. AI Sidebar Component
// ==========================================================================

function AISidebar({
  state, onClose, onApply, project, scenes, characters,
}: {
  state: AISidebarState;
  onClose: () => void;
  onApply: (sceneId: string, promptType: 'image' | 'video', newPrompt: string) => void;
  project: Project;
  scenes: Scene[];
  characters: Character[];
}) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [improvedPrompt, setImprovedPrompt] = useState<string | null>(null);
  const [sidebarMode, setSidebarMode] = useState<AISidebarMode>('improve');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInstruction('');
    setImprovedPrompt(null);
    setSidebarMode('improve');
    if (state.open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300);
  }, [state.open, state.sceneId, state.promptType]);

  const scene = scenes.find((s) => s.id === state.sceneId);

  const handleGenerate = useCallback(async () => {
    if (sidebarMode === 'improve' && !instruction.trim() && !state.originalPrompt) return;
    setLoading(true);
    setImprovedPrompt(null);
    try {
      const sceneChars = scene ? characters.filter((c) => scene.character_ids?.includes(c.id)) : [];
      let promptPayload: string;
      if (sidebarMode === 'rewrite') {
        promptPayload = `Reescribe completamente el prompt de ${state.promptType === 'image' ? 'imagen' : 'video'} desde cero para esta escena.
Titulo: ${scene?.title}. Descripcion: ${scene?.description}.
Camara: ${scene?.camera_angle} ${scene?.camera_movement}. Iluminacion: ${scene?.lighting}. Mood: ${scene?.mood}.
Estilo del proyecto: ${project.style}. Plataforma: ${project.target_platform}.
${instruction.trim() ? `Instrucciones adicionales: ${instruction}` : ''}
${state.originalPrompt ? `Prompt anterior (solo como referencia, NO lo mejores, crea uno nuevo): ${state.originalPrompt}` : ''}
Genera un prompt completamente nuevo, profesional y detallado.`;
      } else {
        promptPayload = state.originalPrompt
          ? `${state.originalPrompt}\n\nInstruccion del usuario: ${instruction}`
          : `Genera un prompt de ${state.promptType === 'image' ? 'imagen' : 'video'} para: ${scene?.title}. ${scene?.description}. Instruccion: ${instruction}`;
      }
      const res = await fetch('/api/ai/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptPayload,
          sceneContext: {
            style: project.style,
            sceneTitle: scene?.title,
            arcPhase: scene?.arc_phase,
            characters: sceneChars.map((c) => ({ name: c.name, prompt_snippet: c.prompt_snippet })),
          },
        }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setImprovedPrompt(data.improved_prompt || data.text || '');
    } catch {
      toast.error('Error al mejorar el prompt');
    } finally {
      setLoading(false);
    }
  }, [instruction, state, scene, characters, project, sidebarMode]);

  const handleApply = useCallback(() => {
    if (improvedPrompt) { onApply(state.sceneId, state.promptType, improvedPrompt); onClose(); }
  }, [improvedPrompt, state, onApply, onClose]);

  return (
    <div className={cn(
      'fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col border-l border-surface-tertiary bg-surface shadow-2xl transition-transform duration-300',
      state.open ? 'translate-x-0' : 'translate-x-full',
    )}>
      <div className="flex items-center justify-between border-b border-surface-tertiary px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
          <h3 className="text-sm font-semibold text-foreground">Prompt {state.promptType === 'image' ? 'imagen' : 'video'}</h3>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-foreground-muted hover:bg-surface-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div className="flex rounded-lg border border-surface-tertiary p-0.5">
          <button type="button" onClick={() => setSidebarMode('improve')} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors', sidebarMode === 'improve' ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]' : 'text-foreground-muted hover:text-foreground')}>
            <Sparkles className="h-3.5 w-3.5" /> Mejorar existente
          </button>
          <button type="button" onClick={() => setSidebarMode('rewrite')} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors', sidebarMode === 'rewrite' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'text-foreground-muted hover:text-foreground')}>
            <RefreshCw className="h-3.5 w-3.5" /> Reescribir completo
          </button>
        </div>
        {state.originalPrompt && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Prompt actual</span>
              <span className="text-[10px] text-foreground-muted">{state.originalPrompt.length} chars</span>
            </div>
            <pre className="whitespace-pre-wrap break-words rounded-lg bg-[#0d1117] p-3 text-xs leading-relaxed text-gray-300">{state.originalPrompt}</pre>
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
            {sidebarMode === 'improve' ? 'Que quieres cambiar?' : 'Instrucciones para reescribir (opcional)'}
          </label>
          <textarea
            ref={inputRef}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={sidebarMode === 'improve' ? 'Describe que quieres mejorar...' : 'Instrucciones adicionales...'}
            rows={3}
            className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary p-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
          />
        </div>
        <div>
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Sugerencias rapidas</span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => setInstruction(s)} className={cn('rounded-full border border-surface-tertiary px-2.5 py-1 text-[11px] text-foreground-secondary transition-colors hover:border-[#3B82F6]/30 hover:text-[#3B82F6]', instruction === s && 'border-[#3B82F6]/50 bg-[#3B82F6]/10 text-[#3B82F6]')}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleGenerate} disabled={loading || (sidebarMode === 'improve' && !instruction.trim())} className={cn('flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50', sidebarMode === 'improve' ? 'bg-[#8B5CF6] hover:bg-[#8B5CF6]/90' : 'bg-[#3B82F6] hover:bg-[#3B82F6]/90')}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : sidebarMode === 'improve' ? <Sparkles className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? 'Generando...' : sidebarMode === 'improve' ? 'Generar mejora' : 'Reescribir prompt'}
          </button>
          {state.originalPrompt && (
            <button type="button" onClick={() => { navigator.clipboard.writeText(improvedPrompt || state.originalPrompt); toast.success('Prompt copiado'); }} className="flex items-center rounded-lg border border-surface-tertiary px-3 py-2.5 text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-foreground">
              <Copy className="h-4 w-4" />
            </button>
          )}
        </div>
        {improvedPrompt && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                {sidebarMode === 'improve' ? 'Prompt mejorado' : 'Prompt reescrito'}
              </span>
              <span className="text-[10px] text-foreground-muted">{improvedPrompt.length} chars</span>
            </div>
            {state.originalPrompt && sidebarMode === 'improve' && (
              <div>
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Original</span>
                </div>
                <pre className="whitespace-pre-wrap break-words rounded-lg bg-red-500/5 p-3 text-xs leading-relaxed text-red-300/70 line-through">{state.originalPrompt}</pre>
              </div>
            )}
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">{sidebarMode === 'improve' ? 'Mejorado' : 'Nuevo'}</span>
              </div>
              <pre className="whitespace-pre-wrap break-words rounded-lg bg-green-500/5 p-3 text-xs leading-relaxed text-green-300">{improvedPrompt}</pre>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={handleApply} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#3B82F6] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3B82F6]/90">
                <ChevronRight className="h-4 w-4" /> Aplicar cambio
              </button>
              <button type="button" onClick={() => { navigator.clipboard.writeText(improvedPrompt); toast.success('Copiado'); }} className="rounded-lg border border-surface-tertiary px-3 py-2 text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-foreground">
                <Copy className="h-4 w-4" />
              </button>
              <button type="button" onClick={onClose} className="rounded-lg border border-surface-tertiary px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-foreground">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================================
// 5. Analysis Modal Component
// ==========================================================================

function AnalysisItem({ item, icon }: { item: string | Record<string, unknown>; icon: React.ReactNode }) {
  if (typeof item === 'string') {
    return <li className="flex items-start gap-2 text-sm text-foreground-secondary"><span className="mt-1">{icon}</span><span>{item}</span></li>;
  }
  if ('text' in item && typeof item.text === 'string') {
    const action = 'action' in item ? String(item.action) : null;
    return (
      <li className="flex items-start justify-between gap-3 rounded-lg border border-surface-tertiary p-3">
        <span className="text-sm text-foreground-secondary">{String(item.text)}</span>
        {action && <button type="button" className="shrink-0 rounded-md bg-[#3B82F6]/10 px-2.5 py-1 text-xs font-medium text-[#3B82F6] transition-colors hover:bg-[#3B82F6]/20">Aplicar</button>}
      </li>
    );
  }
  if ('title' in item && typeof item.title === 'string') {
    const desc = 'description' in item ? String(item.description) : '';
    const cat = 'category' in item ? String(item.category) : '';
    return (
      <li className="flex items-start gap-2 text-sm text-foreground-secondary">
        <span className="mt-1">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <strong className="text-foreground">{String(item.title)}</strong>
            {cat && <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-[10px] font-medium text-foreground-muted">{cat}</span>}
          </div>
          {desc && <span className="mt-0.5 block">{desc}</span>}
        </div>
      </li>
    );
  }
  return <li className="flex items-start gap-2 text-sm text-foreground-secondary"><span className="mt-1">{icon}</span><span>{JSON.stringify(item)}</span></li>;
}

function AnalysisModal({ open, onClose, result, loading }: { open: boolean; onClose: () => void; result: AnalysisResult | null; loading: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-surface-tertiary bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#3B82F6]" />
            <h3 className="text-lg font-bold text-foreground">Analisis del storyboard</h3>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <button type="button" onClick={() => exportAnalysisMarkdown(result)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-foreground">
                <Download className="h-4 w-4" /> Exportar
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded-md p-1 text-foreground-muted hover:bg-surface-secondary hover:text-foreground"><X className="h-5 w-5" /></button>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#3B82F6]" />
            <span className="ml-3 text-foreground-muted">Analizando storyboard completo...</span>
          </div>
        ) : result ? (
          <div className="space-y-6">
            {result.summary && <p className="text-sm leading-relaxed text-foreground-secondary">{result.summary}</p>}
            {result.overall_score != null && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Puntuacion general</span>
                  <span className="text-sm font-bold text-foreground">{result.overall_score}/100</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                  <div className={cn('h-full rounded-full transition-all', result.overall_score >= 80 ? 'bg-green-500' : result.overall_score >= 50 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${Math.min(100, Math.max(0, result.overall_score))}%` }} />
                </div>
              </div>
            )}
            {result.strengths && result.strengths.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-green-500"><span className="h-2 w-2 rounded-full bg-green-500" />Puntos fuertes</h4>
                <ul className="space-y-1.5">{result.strengths.map((s, i) => <AnalysisItem key={i} item={s as string | Record<string, unknown>} icon={<span className="text-green-500">+</span>} />)}</ul>
              </div>
            )}
            {result.warnings && result.warnings.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-500"><span className="h-2 w-2 rounded-full bg-amber-500" />Advertencias</h4>
                <ul className="space-y-1.5">{result.warnings.map((w, i) => <AnalysisItem key={i} item={w as string | Record<string, unknown>} icon={<span className="text-amber-500">!</span>} />)}</ul>
              </div>
            )}
            {result.suggestions && result.suggestions.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#3B82F6]"><span className="h-2 w-2 rounded-full bg-[#3B82F6]" />Sugerencias</h4>
                <ul className="space-y-2">{result.suggestions.map((s, i) => <AnalysisItem key={i} item={s as string | Record<string, unknown>} icon={<span className="text-[#3B82F6]">*</span>} />)}</ul>
              </div>
            )}
            {result.scene_analysis && result.scene_analysis.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-foreground">Analisis escena por escena</h4>
                <div className="space-y-2">
                  {result.scene_analysis.map((sa, i) => (
                    <div key={i} className={cn('rounded-lg border p-3', sa.status === 'good' ? 'border-green-500/20 bg-green-500/5' : sa.status === 'critical' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5')}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-surface-tertiary px-1.5 py-0.5 text-xs font-mono font-bold">{sa.scene_number}</span>
                          <span className="text-sm font-medium text-foreground">{sa.scene_title}</span>
                        </div>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', sa.status === 'good' ? 'bg-green-500/20 text-green-600' : sa.status === 'critical' ? 'bg-red-500/20 text-red-600' : 'bg-amber-500/20 text-amber-600')}>{sa.score}/10</span>
                      </div>
                      <p className="mb-1.5 text-xs text-foreground-secondary">{sa.prompt_quality}</p>
                      {sa.improvements?.length > 0 && (
                        <ul className="space-y-0.5">
                          {sa.improvements.map((imp, j) => <li key={j} className="flex items-start gap-1.5 text-xs text-foreground-muted"><span className="mt-0.5 text-[#3B82F6]">-&gt;</span><span>{imp}</span></li>)}
                        </ul>
                      )}
                      {sa.audio_suggestion && <p className="mt-1 text-xs text-foreground-muted">Audio: {sa.audio_suggestion}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.narrative_flow && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">Flujo narrativo</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(result.narrative_flow).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-surface-secondary p-2.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">{key.replace(/_/g, ' ')}</span>
                      <p className="mt-0.5 text-xs text-foreground-secondary">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.audio_analysis && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">Analisis de audio</h4>
                <div className="space-y-2">
                  {Object.entries(result.audio_analysis).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-surface-secondary p-2.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">{key.replace(/_/g, ' ')}</span>
                      <p className="mt-0.5 text-xs text-foreground-secondary">{String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="py-8 text-center text-foreground-muted">No se pudo obtener el analisis.</p>
        )}
      </div>
    </div>
  );
}

// ==========================================================================
// 6. Insert Scene Button Component
// ==========================================================================

function InsertSceneButton({
  prevScene, nextScene, characters, backgrounds, project, onInserted,
}: {
  prevScene: Scene;
  nextScene: Scene;
  characters: Character[];
  backgrounds: Background[];
  project: Project;
  onInserted: () => void;
}) {
  const [mode, setMode] = useState<InsertMode>('closed');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ title: string; description: string; prompt_image: string } | null>(null);
  const [hovered, setHovered] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualType, setManualType] = useState<SceneType>('new');
  const [manualDuration, setManualDuration] = useState(5);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setMode('closed');
    }
    if (mode !== 'closed') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mode]);

  const handleDetailShot = useCallback(async () => {
    setMode('detail');
    setLoading(true);
    setPreview(null);
    try {
      const prevChars = resolveSceneCharacters(prevScene, characters);
      const nextChars = resolveSceneCharacters(nextScene, characters);
      const prevBg = resolveSceneBackground(prevScene, backgrounds);
      const nextBg = resolveSceneBackground(nextScene, backgrounds);
      const context = `Escena anterior: "${prevScene.title}" - ${prevScene.description}. Personajes: ${prevChars.map((c) => c.name).join(', ') || 'ninguno'}. Fondo: ${prevBg?.name || 'N/A'}. Camara: ${prevScene.camera_angle} ${prevScene.camera_movement}.
Escena siguiente: "${nextScene.title}" - ${nextScene.description}. Personajes: ${nextChars.map((c) => c.name).join(', ') || 'ninguno'}. Fondo: ${nextBg?.name || 'N/A'}. Camara: ${nextScene.camera_angle} ${nextScene.camera_movement}.
Estilo del proyecto: ${project.style}. Plataforma: ${project.target_platform}.
Genera un plano detalle (detail shot) de transicion entre estas dos escenas. Responde con JSON: { "title": "...", "description": "...", "prompt_image": "..." }`;
      const res = await fetch('/api/ai/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: context, sceneContext: { style: project.style, sceneTitle: 'Plano detalle de transicion', arcPhase: prevScene.arc_phase } }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setPreview({
        title: data.title || `Detalle: ${prevScene.title} -> ${nextScene.title}`,
        description: data.description || data.improved_prompt || '',
        prompt_image: data.improved_prompt || data.prompt_image || '',
      });
    } catch {
      toast.error('Error al generar sugerencia de plano detalle');
      setMode('closed');
    } finally {
      setLoading(false);
    }
  }, [prevScene, nextScene, characters, backgrounds, project]);

  const handleInsertDetail = useCallback(async () => {
    if (!preview) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const newSortOrder = (prevScene.sort_order + nextScene.sort_order) / 2;
      const { error } = await supabase.from('scenes').insert({
        project_id: prevScene.project_id,
        scene_number: `D${prevScene.scene_number}-${nextScene.scene_number}`,
        title: preview.title,
        scene_type: 'filler' as SceneType,
        category: 'detail_shot',
        arc_phase: prevScene.arc_phase,
        description: preview.description,
        prompt_image: preview.prompt_image,
        prompt_video: '',
        duration_seconds: 2,
        sort_order: newSortOrder,
        status: 'draft',
        character_ids: [],
        required_references: [],
        improvements: [],
        prompt_history: [],
        director_notes: '',
        prompt_additions: '',
        reference_tip: '',
        camera_angle: 'extreme_close_up',
        camera_movement: 'static',
        camera_notes: '',
        lighting: prevScene.lighting || '',
        mood: prevScene.mood || '',
        music_notes: '',
        sound_notes: '',
        notes: '',
        metadata: {},
      });
      if (error) throw error;
      toast.success('Plano detalle insertado');
      setMode('closed');
      onInserted();
    } catch {
      toast.error('Error al insertar escena');
    } finally {
      setLoading(false);
    }
  }, [preview, prevScene, nextScene, onInserted]);

  const handleInsertManual = useCallback(async () => {
    if (!manualTitle.trim()) { toast.error('El titulo es obligatorio'); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const newSortOrder = (prevScene.sort_order + nextScene.sort_order) / 2;
      const { error } = await supabase.from('scenes').insert({
        project_id: prevScene.project_id,
        scene_number: `N${prevScene.scene_number}-${nextScene.scene_number}`,
        title: manualTitle.trim(),
        scene_type: manualType,
        category: '',
        arc_phase: prevScene.arc_phase,
        description: manualDescription.trim(),
        prompt_image: '',
        prompt_video: '',
        duration_seconds: manualDuration,
        sort_order: newSortOrder,
        status: 'draft',
        character_ids: [],
        required_references: [],
        improvements: [],
        prompt_history: [],
        director_notes: '',
        prompt_additions: '',
        reference_tip: '',
        camera_angle: '',
        camera_movement: '',
        camera_notes: '',
        lighting: '',
        mood: '',
        music_notes: '',
        sound_notes: '',
        notes: '',
        metadata: {},
      });
      if (error) throw error;
      toast.success('Escena insertada');
      setMode('closed');
      setManualTitle('');
      setManualDescription('');
      setManualType('new');
      setManualDuration(5);
      onInserted();
    } catch {
      toast.error('Error al insertar escena');
    } finally {
      setLoading(false);
    }
  }, [manualTitle, manualDescription, manualType, manualDuration, prevScene, nextScene, onInserted]);

  return (
    <div className="group relative flex items-center justify-center py-0.5" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className={cn('absolute inset-x-0 top-1/2 h-px transition-colors', hovered || mode !== 'closed' ? 'bg-[#3B82F6]/40' : 'bg-transparent')} />
      <button
        type="button"
        onClick={() => setMode(mode === 'closed' ? 'menu' : 'closed')}
        className={cn(
          'relative z-10 flex h-5 w-5 items-center justify-center rounded-full border transition-all',
          hovered || mode !== 'closed'
            ? 'border-[#3B82F6] bg-[#3B82F6] text-white shadow-md shadow-[#3B82F6]/25'
            : 'border-transparent bg-transparent text-transparent group-hover:border-surface-tertiary group-hover:bg-surface group-hover:text-foreground-muted',
        )}
        title="Insertar escena"
      >
        <Plus className={cn('h-3 w-3 transition-transform', mode !== 'closed' && 'rotate-45')} />
      </button>
      {mode !== 'closed' && (
        <div ref={popoverRef} className="absolute left-1/2 top-full z-50 mt-2 w-[420px] -translate-x-1/2 rounded-xl border border-surface-tertiary bg-surface shadow-2xl">
          {mode === 'menu' && (
            <div className="p-2">
              <button type="button" onClick={handleDetailShot} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-secondary">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/10 text-[#8B5CF6]"><Wand2 className="h-4 w-4" /></span>
                <div>
                  <div className="text-sm font-medium text-foreground">Plano detalle</div>
                  <div className="text-xs text-foreground-muted">IA genera un plano de transicion entre escenas</div>
                </div>
              </button>
              <button type="button" onClick={() => setMode('manual')} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-secondary">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]"><Plus className="h-4 w-4" /></span>
                <div>
                  <div className="text-sm font-medium text-foreground">Nueva escena</div>
                  <div className="text-xs text-foreground-muted">Crear una escena en blanco manualmente</div>
                </div>
              </button>
            </div>
          )}
          {mode === 'detail' && (
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Insertar plano detalle</h4>
                <button type="button" onClick={() => setMode('closed')} className="rounded-md p-1 text-foreground-muted hover:bg-surface-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              {loading && !preview ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#3B82F6]" />
                  <span className="ml-2 text-sm text-foreground-muted">Analizando escenas...</span>
                </div>
              ) : preview ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Titulo</span>
                    <p className="text-sm font-medium text-foreground">{preview.title}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Descripcion</span>
                    <p className="text-sm text-foreground-secondary">{preview.description}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Prompt imagen</span>
                    <pre className="whitespace-pre-wrap break-words rounded-lg bg-[#0d1117] p-2 text-xs leading-relaxed text-gray-300">{preview.prompt_image}</pre>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleInsertDetail} disabled={loading} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#3B82F6] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3B82F6]/90 disabled:opacity-50">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Insertar
                    </button>
                    <button type="button" onClick={() => setMode('closed')} className="rounded-lg border border-surface-tertiary px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-foreground">Cancelar</button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          {mode === 'manual' && (
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">Nueva escena</h4>
                <button type="button" onClick={() => setMode('closed')} className="rounded-md p-1 text-foreground-muted hover:bg-surface-secondary hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Titulo</label>
                  <input type="text" value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Titulo de la escena..." className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Descripcion</label>
                  <textarea value={manualDescription} onChange={(e) => setManualDescription(e.target.value)} placeholder="Describe la escena..." rows={2} className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]" />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">Tipo</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SCENE_TYPE_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setManualType(opt.value)} className={cn('rounded-full px-2.5 py-1 text-xs font-medium transition-colors', manualType === opt.value ? 'text-white' : 'bg-surface-secondary text-foreground-muted hover:bg-surface-tertiary')} style={manualType === opt.value ? { backgroundColor: SCENE_TYPE_COLORS[opt.value] } : undefined}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                    <span>Duracion</span>
                    <span className="rounded-full bg-surface-tertiary px-2 py-0.5 text-[11px] font-bold normal-case text-foreground">{manualDuration}s</span>
                  </label>
                  <input type="range" min={1} max={15} step={1} value={manualDuration} onChange={(e) => setManualDuration(Number(e.target.value))} className="w-full accent-[#3B82F6]" />
                  <div className="flex justify-between text-[10px] text-foreground-muted"><span>1s</span><span>15s</span></div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={handleInsertManual} disabled={loading || !manualTitle.trim()} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#3B82F6] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3B82F6]/90 disabled:opacity-50">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Crear
                  </button>
                  <button type="button" onClick={() => setMode('closed')} className="rounded-lg border border-surface-tertiary px-3 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-foreground">Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// 7. Scene Card - Compact Horizontal (Collapsed/Expanded)
// ==========================================================================

function SceneCard({
  scene, characters, backgrounds, sortPosition, isExpanded, onToggleExpand,
  onOpenAISidebar, onGeneratePrompt, generatingPrompts, onUpdateScene, onDeleteScene,
  selectionMode, isSelected, onToggleSelect,
}: {
  scene: Scene;
  characters: Character[];
  backgrounds: Background[];
  sortPosition: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onOpenAISidebar: (sceneId: string, promptType: 'image' | 'video', prompt: string) => void;
  onGeneratePrompt: (sceneId: string, promptType: 'image' | 'video') => void;
  generatingPrompts: Set<string>;
  onUpdateScene?: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
  onDeleteScene?: (sceneId: string) => Promise<void>;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const sceneCharacters = resolveSceneCharacters(scene, characters);
  const sceneBackground = resolveSceneBackground(scene, backgrounds);
  const isGeneratingImage = generatingPrompts.has(`${scene.id}:image`);
  const isGeneratingVideo = generatingPrompts.has(`${scene.id}:video`);
  const typeColor = SCENE_TYPE_COLORS[scene.scene_type] ?? '#6B7280';
  const arcColor = ARC_PHASE_COLORS[scene.arc_phase] ?? '#6B7280';
  const audioBadge = getAudioBadge(scene);

  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Scene>>({});
  const [editAudioType, setEditAudioType] = useState<AudioType>('silent');

  const enterEditMode = () => { setEditMode(true); setEditData({ ...scene }); setEditAudioType(detectAudioType(scene)); };
  const cancelEdit = () => { setEditMode(false); setEditData({}); };
  const saveEdit = async () => { if (onUpdateScene) await onUpdateScene(scene.id, editData); setEditMode(false); setEditData({}); };
  const updateField = <K extends keyof Scene>(key: K, value: Scene[K]) => setEditData((prev) => ({ ...prev, [key]: value }));

  const applyAudioType = (type: AudioType) => {
    setEditAudioType(type);
    const prefixes: Record<AudioType, string> = {
      silent: 'SILENT SCENE. NO DIALOGUE. NO LIP MOVEMENT. ',
      ambient: 'AMBIENT SOUND ONLY. No speech. ',
      dialogue: 'DIALOGUE SCENE. ',
      voiceover: 'VOICEOVER NARRATION. Characters do not speak on camera. ',
      music: '',
    };
    const newEditData = { ...editData };
    switch (type) {
      case 'silent': newEditData.sound_notes = 'SILENT SCENE. NO DIALOGUE.'; newEditData.music_notes = ''; break;
      case 'ambient': newEditData.sound_notes = 'Ambient sound only. No speech.'; newEditData.music_notes = ''; break;
      case 'music': newEditData.sound_notes = ''; break;
      case 'dialogue': newEditData.sound_notes = ''; newEditData.music_notes = ''; break;
      case 'voiceover': newEditData.sound_notes = 'VOICEOVER NARRATION.'; newEditData.music_notes = ''; break;
    }
    const allPrefixes = Object.values(prefixes).filter(Boolean);
    let currentVideo = (editData.prompt_video ?? scene.prompt_video) || '';
    for (const p of allPrefixes) { if (currentVideo.startsWith(p)) currentVideo = currentVideo.slice(p.length); }
    newEditData.prompt_video = (prefixes[type] || '') + currentVideo;
    setEditData(newEditData);
  };

  return (
    <div className={cn(
      'rounded-lg border transition-all duration-200',
      isSelected ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]' : 'border-foreground/[0.06]',
      'bg-surface-secondary hover:bg-surface-tertiary/30',
    )}>
      {/* ── COLLAPSED ROW ── */}
      <div className="flex items-center gap-3 px-3 py-2">
        {/* Selection checkbox */}
        {selectionMode && (
          <button type="button" onClick={onToggleSelect} className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded border transition', isSelected ? 'border-[#3B82F6] bg-[#3B82F6] text-white' : 'border-surface-tertiary bg-surface hover:border-[#3B82F6]/50')}>
            {isSelected && <Check className="h-3 w-3" />}
          </button>
        )}

        {/* Thumbnail */}
        <div className="h-[68px] w-[120px] shrink-0 overflow-hidden rounded-md bg-surface-secondary">
          {scene.generated_image_url ? (
            <img src={scene.generated_image_url} alt={scene.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-foreground-muted">
              <ImageIcon className="h-5 w-5 opacity-20" />
            </div>
          )}
        </div>

        {/* Info area */}
        <div className="min-w-0 flex-1">
          {/* Top line: number, scene_number, title, badges */}
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 rounded bg-surface-tertiary/60 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-foreground">#{sortPosition}</span>
            <span className="shrink-0 text-[11px] text-foreground-muted">{scene.scene_number}</span>
            <span className="text-foreground-muted/40">&middot;</span>
            <span className="min-w-0 truncate text-sm font-medium text-foreground">{scene.title}</span>
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              <Badge label={SCENE_TYPE_LABELS[scene.scene_type] ?? scene.scene_type} color={typeColor} textWhite />
              <Badge label={ARC_PHASE_LABELS[scene.arc_phase] ?? scene.arc_phase} color={arcColor} />
              {scene.duration_seconds > 0 && (
                <span className="rounded bg-surface-tertiary/60 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-foreground-secondary">{scene.duration_seconds}s</span>
              )}
              <button type="button" onClick={onToggleExpand} className="ml-1 flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-surface-tertiary hover:text-foreground">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {/* Bottom line: description snippet + meta icons */}
          <div className="mt-0.5 flex items-center gap-3 text-xs text-foreground-muted">
            <span className="min-w-0 truncate">{scene.description || 'Sin descripcion'}</span>
            <div className="ml-auto flex shrink-0 items-center gap-2 text-[11px]">
              <span title="Personajes">{'\uD83D\uDC65'}{sceneCharacters.length}</span>
              <span title="Fondo">{'\uD83C\uDFE0'}{sceneBackground?.code || '\u2014'}</span>
              <span title="Camara">{'\uD83D\uDCF9'}{scene.camera_angle?.replace('_', ' ') || '\u2014'}</span>
              <span title="Audio">{audioBadge.emoji}{audioBadge.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPANDED CONTENT ── */}
      {isExpanded && (
        <div className="border-t border-foreground/[0.06] px-4 pb-4 pt-3">
          {/* Description */}
          <div className="mb-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Descripcion</span>
            {editMode ? (
              <textarea className="mt-1 w-full rounded-md border border-surface-tertiary bg-surface-secondary px-2 py-1.5 text-sm text-foreground outline-none focus:border-[#3B82F6]" rows={2} value={editData.description ?? ''} onChange={(e) => updateField('description', e.target.value)} />
            ) : (
              <p className="mt-0.5 text-sm leading-relaxed text-foreground-secondary">{scene.description || 'Sin descripcion'}</p>
            )}
          </div>

          {/* Meta rows */}
          {!editMode && (
            <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-foreground-secondary">
                <span className="w-4 text-center text-sm">{'\uD83D\uDC65'}</span>
                {sceneCharacters.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">{sceneCharacters.map((c) => <CharacterBadge key={c.id} character={c} />)}</div>
                ) : (
                  <AddCharactersDropdown allCharacters={characters} currentIds={scene.character_ids || []} sceneId={scene.id} onUpdateScene={onUpdateScene} />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-foreground-secondary">
                <span className="w-4 text-center text-sm">{'\uD83C\uDFE0'}</span>
                {sceneBackground ? (
                  <span>{sceneBackground.name} <span className="rounded bg-surface-tertiary px-1 py-0.5 text-[10px] font-mono text-foreground-muted">{sceneBackground.code}</span></span>
                ) : (
                  <AddBackgroundDropdown allBackgrounds={backgrounds} sceneId={scene.id} onUpdateScene={onUpdateScene} />
                )}
              </div>
              <div className="flex items-center gap-1.5 text-foreground-secondary">
                <span className="w-4 text-center text-sm">{'\uD83D\uDCF9'}</span>
                <span>{[scene.camera_angle?.replace('_', ' '), scene.camera_movement].filter(Boolean).join(' \u00b7 ') || '\u2014'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground-secondary">
                <span className="w-4 text-center text-sm">{'\uD83D\uDCA1'}</span>
                <span>{[scene.lighting, scene.mood].filter(Boolean).join(' \u00b7 ') || '\u2014'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-foreground-secondary">
                <span className="w-4 text-center text-sm">{audioBadge.emoji}</span>
                <span>{audioBadge.label}{scene.sound_notes ? ` - ${scene.sound_notes}` : ''}{scene.music_notes ? ` - ${scene.music_notes}` : ''}</span>
              </div>
            </div>
          )}

          {/* Edit mode: camera/audio controls */}
          {editMode && (
            <div className="mb-3 space-y-3">
              {/* Title edit */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Titulo</span>
                <input className="mt-1 w-full rounded-md border border-surface-tertiary bg-surface-secondary px-2 py-1 text-sm font-medium text-foreground outline-none focus:border-[#3B82F6]" value={editData.title ?? ''} onChange={(e) => updateField('title', e.target.value)} />
              </div>
              {/* Camera grid */}
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-tertiary/30 p-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Angulo</span>
                  <select className="rounded-md border border-surface-tertiary bg-surface px-2 py-1 text-xs text-foreground outline-none focus:border-[#3B82F6]" value={editData.camera_angle ?? ''} onChange={(e) => updateField('camera_angle', e.target.value as Scene['camera_angle'])}>
                    <option value="">Seleccionar...</option>
                    {CAMERA_ANGLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Movimiento</span>
                  <select className="rounded-md border border-surface-tertiary bg-surface px-2 py-1 text-xs text-foreground outline-none focus:border-[#3B82F6]" value={editData.camera_movement ?? ''} onChange={(e) => updateField('camera_movement', e.target.value as Scene['camera_movement'])}>
                    <option value="">Seleccionar...</option>
                    {CAMERA_MOVEMENT_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Iluminacion</span>
                  <input className="rounded-md border border-surface-tertiary bg-surface px-2 py-1 text-xs text-foreground outline-none focus:border-[#3B82F6]" value={editData.lighting ?? ''} onChange={(e) => updateField('lighting', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Mood</span>
                  <input className="rounded-md border border-surface-tertiary bg-surface px-2 py-1 text-xs text-foreground outline-none focus:border-[#3B82F6]" value={editData.mood ?? ''} onChange={(e) => updateField('mood', e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Duracion (s)</span>
                  <input type="number" min={0} className="rounded-md border border-surface-tertiary bg-surface px-2 py-1 text-xs text-foreground outline-none focus:border-[#3B82F6]" value={editData.duration_seconds ?? 0} onChange={(e) => updateField('duration_seconds', Number(e.target.value))} />
                </div>
              </div>
              {/* Audio */}
              <div className="space-y-2 rounded-lg bg-surface-tertiary/30 p-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Audio</span>
                <div className="flex flex-wrap gap-1.5">
                  {AUDIO_TYPE_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => applyAudioType(opt.value)} className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors', editAudioType === opt.value ? 'bg-[#3B82F6] text-white' : 'bg-surface-tertiary text-foreground-secondary hover:bg-surface-secondary')}>
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
                {editAudioType === 'music' && (
                  <input className="w-full rounded-md border border-surface-tertiary bg-surface px-2 py-1 text-xs text-foreground outline-none focus:border-[#3B82F6]" placeholder="Notas de musica..." value={editData.music_notes ?? ''} onChange={(e) => updateField('music_notes', e.target.value)} />
                )}
                {editAudioType === 'dialogue' && (
                  <input className="w-full rounded-md border border-surface-tertiary bg-surface px-2 py-1 text-xs text-foreground outline-none focus:border-[#3B82F6]" placeholder="Notas de dialogo..." value={editData.sound_notes ?? ''} onChange={(e) => updateField('sound_notes', e.target.value)} />
                )}
              </div>
            </div>
          )}

          {/* Prompts */}
          <div className="space-y-3">
            {editMode ? (
              <PromptSection label="PROMPT IMAGEN" text={editData.prompt_image ?? ''} editMode editValue={editData.prompt_image ?? ''} onEditChange={(v) => updateField('prompt_image', v)} />
            ) : scene.prompt_image ? (
              <PromptSection label="PROMPT IMAGEN" text={scene.prompt_image} onImprove={() => onOpenAISidebar(scene.id, 'image', scene.prompt_image)} onEdit={enterEditMode} />
            ) : (
              <GeneratePromptButton label="Generar prompt imagen" loading={isGeneratingImage} onClick={() => onGeneratePrompt(scene.id, 'image')} />
            )}

            {editMode ? (
              <PromptSection label="PROMPT VIDEO" text={editData.prompt_video ?? ''} editMode editValue={editData.prompt_video ?? ''} onEditChange={(v) => updateField('prompt_video', v)} />
            ) : scene.prompt_video ? (
              <PromptSection label="PROMPT VIDEO" text={scene.prompt_video} onImprove={() => onOpenAISidebar(scene.id, 'video', scene.prompt_video)} onEdit={enterEditMode} />
            ) : (
              <GeneratePromptButton label="Generar prompt video" loading={isGeneratingVideo} onClick={() => onGeneratePrompt(scene.id, 'video')} />
            )}
          </div>

          {/* Narration (sound_notes with voiceover) */}
          {!editMode && detectAudioType(scene) === 'voiceover' && scene.sound_notes && (
            <div className="mt-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">{'\uD83C\uDF99\uFE0F'} Narracion</span>
              <p className="mt-0.5 text-sm text-foreground-secondary">{scene.sound_notes}</p>
            </div>
          )}

          {/* Improvements / Notes */}
          {((scene.improvements?.length > 0) || scene.director_notes || scene.reference_tip) && !editMode && (
            <div className="mt-3 space-y-2 border-t border-foreground/[0.06] pt-3">
              {scene.improvements?.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Mejoras</span>
                  <ul className="mt-1 space-y-0.5">
                    {(scene.improvements as SceneImprovement[]).map((imp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-foreground-secondary">
                        <span className="mt-px select-none">{imp.type === 'improve' ? '\u2192' : '+'}</span>
                        <span>{imp.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {scene.director_notes && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Notas de direccion</span>
                  <p className="mt-0.5 text-sm text-foreground-secondary">{scene.director_notes}</p>
                </div>
              )}
              {scene.reference_tip && (
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Referencia</span>
                  <p className="mt-0.5 text-sm text-foreground-secondary">{scene.reference_tip}</p>
                </div>
              )}
            </div>
          )}

          {/* Edit mode: director notes */}
          {editMode && (
            <div className="mt-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">Notas de direccion</span>
              <textarea className="mt-1 w-full rounded-md border border-surface-tertiary bg-surface-secondary px-2 py-1.5 text-sm text-foreground outline-none focus:border-[#3B82F6]" rows={2} value={editData.director_notes ?? ''} onChange={(e) => updateField('director_notes', e.target.value)} />
            </div>
          )}

          {/* Action bar */}
          <div className="mt-3 flex items-center justify-end gap-2">
            {editMode ? (
              <>
                <button onClick={cancelEdit} className="rounded-md px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-surface-secondary">Cancelar</button>
                <button onClick={saveEdit} className="inline-flex items-center gap-1 rounded-md bg-[#3B82F6] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#3B82F6]/90">
                  <Save className="h-3 w-3" /> Guardar
                </button>
              </>
            ) : (
              <>
                <button onClick={enterEditMode} className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:bg-surface-secondary hover:text-foreground">
                  <Pencil className="h-3 w-3" /> Editar
                </button>
                {onDeleteScene && (
                  <button onClick={() => onDeleteScene(scene.id)} className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10">
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================================================
// 8. Duration Progress Bar
// ==========================================================================

function DurationBar({ actual, target }: { actual: number; target: number }) {
  if (target <= 0) return null;
  const pct = Math.round((actual / target) * 100);
  const isOver = pct > 100;
  const barPct = Math.min(pct, 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs tabular-nums text-foreground-muted">
        {'\u23F1\uFE0F'} {formatDuration(actual)} / {formatDuration(target)} objetivo
      </span>
      <div className="h-2 w-28 overflow-hidden rounded-full bg-surface-tertiary">
        <div
          className={cn('h-full rounded-full transition-all', isOver ? 'bg-amber-500' : 'bg-green-500')}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <span className={cn('text-xs font-bold tabular-nums', isOver ? 'text-amber-500' : 'text-green-500')}>
        {pct}%{isOver && (
          <span className="ml-1 inline-flex items-center">
            <AlertTriangle className="inline h-3 w-3" />
          </span>
        )}
      </span>
    </div>
  );
}

// ==========================================================================
// 9. Main Page Component
// ==========================================================================

export default function StoryboardPage() {
  const params = useParams();
  const projectId = params.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [backgrounds, setBackgrounds] = useState<Background[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<ViewMode>('collapsed');
  const [typeFilter, setTypeFilter] = useState('all');
  const [arcFilter, setArcFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [chatOpen, setChatOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [aiSidebar, setAiSidebar] = useState<AISidebarState>({ open: false, sceneId: '', promptType: 'image', originalPrompt: '' });
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [generatingPrompts, setGeneratingPrompts] = useState<Set<string>>(new Set());
  const [selectedSceneIds, setSelectedSceneIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSceneSelection = useCallback((sceneId: string) => {
    setSelectedSceneIds((prev) => prev.includes(sceneId) ? prev.filter((id) => id !== sceneId) : [...prev, sceneId]);
  }, []);

  const clearSelection = useCallback(() => { setSelectedSceneIds([]); setSelectionMode(false); }, []);

  // View mode: "collapsed" = all collapsed, "expanded" = all expanded
  useEffect(() => {
    if (viewMode === 'expanded') {
      setExpandedIds(new Set(scenes.map((s) => s.id)));
    } else {
      setExpandedIds(new Set());
    }
  }, [viewMode, scenes]);

  // ── Fetch data ──────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!projectId) return;
    const supabase = createClient();
    setLoading(true);
    const { data: proj } = await supabase.from('projects').select('*').eq('slug', projectId).single();
    if (!proj) { setLoading(false); return; }
    setProject(proj as Project);
    const [scenesRes, charsRes, bgsRes] = await Promise.all([
      supabase.from('scenes').select('*').eq('project_id', proj.id).order('sort_order', { ascending: true }),
      supabase.from('characters').select('*').eq('project_id', proj.id).order('sort_order', { ascending: true }),
      supabase.from('backgrounds').select('*').eq('project_id', proj.id).order('sort_order', { ascending: true }),
    ]);
    setScenes((scenesRes.data as Scene[]) ?? []);
    setCharacters((charsRes.data as Character[]) ?? []);
    setBackgrounds((bgsRes.data as Background[]) ?? []);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtering ───────────────────────────────────────────────
  const filteredScenes = useMemo(() => {
    return scenes.filter((s) => {
      if (typeFilter !== 'all' && s.scene_type !== typeFilter) return false;
      if (arcFilter !== 'all' && s.arc_phase !== arcFilter) return false;
      if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.scene_number.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [scenes, typeFilter, arcFilter, search]);

  const totalDuration = useMemo(() => scenes.reduce((acc, s) => acc + Number(s.duration_seconds || 0), 0), [scenes]);

  // ── AI Sidebar handlers ─────────────────────────────────────
  const handleOpenAISidebar = useCallback((sceneId: string, promptType: 'image' | 'video', prompt: string) => {
    setAiSidebar({ open: true, sceneId, promptType, originalPrompt: prompt });
  }, []);

  const handleCloseAISidebar = useCallback(() => setAiSidebar((prev) => ({ ...prev, open: false })), []);

  const handleApplyImprovedPrompt = useCallback(async (sceneId: string, promptType: 'image' | 'video', newPrompt: string) => {
    const supabase = createClient();
    const field = promptType === 'image' ? 'prompt_image' : 'prompt_video';
    const { error } = await supabase.from('scenes').update({ [field]: newPrompt }).eq('id', sceneId);
    if (error) { toast.error('Error al guardar el prompt'); return; }
    setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, [field]: newPrompt } : s)));
    toast.success('Prompt actualizado');
  }, []);

  // ── Generate missing prompt ─────────────────────────────────
  const handleGeneratePrompt = useCallback(async (sceneId: string, promptType: 'image' | 'video') => {
    const key = `${sceneId}:${promptType}`;
    setGeneratingPrompts((prev) => new Set(prev).add(key));
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene || !project) { setGeneratingPrompts((prev) => { const n = new Set(prev); n.delete(key); return n; }); return; }
    try {
      const sceneChars = resolveSceneCharacters(scene, characters);
      const sceneBg = resolveSceneBackground(scene, backgrounds);
      const contextParts = [
        `Titulo: ${scene.title}`,
        scene.description ? `Descripcion: ${scene.description}` : '',
        sceneChars.length > 0 ? `Personajes: ${sceneChars.map((c) => `${c.name} (${c.visual_description || c.description})`).join(', ')}` : '',
        sceneBg ? `Fondo: ${sceneBg.name} - ${sceneBg.description}` : '',
        scene.camera_angle ? `Angulo: ${scene.camera_angle}` : '',
        scene.camera_movement ? `Movimiento: ${scene.camera_movement}` : '',
        scene.lighting ? `Iluminacion: ${scene.lighting}` : '',
        scene.mood ? `Mood: ${scene.mood}` : '',
      ].filter(Boolean).join('. ');
      const promptText = promptType === 'image'
        ? `Genera un prompt detallado para generar una imagen de esta escena: ${contextParts}. Estilo visual: ${project.style}.`
        : `Genera un prompt detallado para generar un video de esta escena: ${contextParts}. Estilo visual: ${project.style}. Plataforma: ${project.target_platform}.`;
      const res = await fetch('/api/ai/improve-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, sceneContext: { style: project.style, sceneTitle: scene.title, arcPhase: scene.arc_phase, characters: sceneChars.map((c) => ({ name: c.name, prompt_snippet: c.prompt_snippet })) } }),
      });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      const generatedPrompt = data.improved_prompt || data.text || '';
      if (!generatedPrompt) throw new Error('Empty response');
      const supabase = createClient();
      const field = promptType === 'image' ? 'prompt_image' : 'prompt_video';
      const { error } = await supabase.from('scenes').update({ [field]: generatedPrompt }).eq('id', sceneId);
      if (error) throw error;
      setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, [field]: generatedPrompt } : s)));
      toast.success(`Prompt de ${promptType === 'image' ? 'imagen' : 'video'} generado`);
    } catch {
      toast.error('Error al generar el prompt');
    } finally {
      setGeneratingPrompts((prev) => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [scenes, project, characters, backgrounds]);

  // ── Analyze storyboard ──────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    if (!project) return;
    setAnalysisOpen(true);
    setAnalysisLoading(true);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/ai/analyze-project', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: project.id }) });
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setAnalysisResult(data.diagnostic || data);
    } catch {
      toast.error('Error al analizar el storyboard');
      setAnalysisOpen(false);
    } finally {
      setAnalysisLoading(false);
    }
  }, [project]);

  // ── Update scene ────────────────────────────────────────────
  const handleUpdateScene = useCallback(async (sceneId: string, updates: Partial<Scene>) => {
    const supabase = createClient();
    const { error } = await supabase.from('scenes').update(updates).eq('id', sceneId);
    if (error) { toast.error('Error al actualizar la escena'); return; }
    await fetchAll();
    toast.success('Escena actualizada');
  }, [fetchAll]);

  // ── Delete scene ────────────────────────────────────────────
  const handleDeleteScene = useCallback(async (sceneId: string) => {
    if (!confirm('Eliminar esta escena?')) return;
    const supabase = createClient();
    const { error } = await supabase.from('scenes').delete().eq('id', sceneId);
    if (error) { toast.error('Error al eliminar la escena'); return; }
    await fetchAll();
    toast.success('Escena eliminada');
  }, [fetchAll]);

  // ── Loading state ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-surface-secondary" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-secondary" />)}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h3 className="text-lg font-semibold text-foreground">Proyecto no encontrado</h3>
      </div>
    );
  }

  return (
    <>
      <div className={cn('flex h-full overflow-hidden transition-all duration-300', aiSidebar.open ? 'mr-[400px]' : '')}>
        {/* ════════════════════════════════════════════════════════════
            LEFT PANEL: Scene List
           ════════════════════════════════════════════════════════════ */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* ── Header ── */}
          <div className="shrink-0 border-b border-foreground/[0.06] px-5 py-4">
            {/* Line 1: Title + project info */}
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Storyboard</h2>
              <span className="text-foreground-muted/40">&middot;</span>
              {project.client_name && <span className="text-sm text-foreground-muted">{project.client_name}</span>}
              <span className="text-sm capitalize text-foreground-muted">{project.style}</span>
              <span className="text-sm capitalize text-foreground-muted">{project.target_platform.replace('_', ' ')}</span>
            </div>

            {/* Line 2: Stats + duration bar */}
            <div className="mt-1.5 flex items-center gap-4">
              <span className="text-xs font-medium text-foreground-secondary">{scenes.length} escenas</span>
              <DurationBar actual={totalDuration} target={project.target_duration_seconds} />
            </div>

            {/* Line 3: Search + Filters */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-40 rounded-md border border-surface-tertiary bg-surface-secondary pl-8 pr-3 text-xs text-foreground placeholder:text-foreground-muted focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                />
              </div>

              {/* Type filters */}
              <span className="text-[10px] font-semibold uppercase text-foreground-muted">Tipo:</span>
              <div className="flex items-center gap-0.5">
                {TYPE_FILTERS.map((f) => (
                  <button key={f.value} onClick={() => setTypeFilter(f.value)} className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition', typeFilter === f.value ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'text-foreground-muted hover:bg-surface-secondary hover:text-foreground-secondary')}>
                    {f.value !== 'all' && <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SCENE_TYPE_COLORS[f.value as SceneType] ?? '#6B7280' }} />}
                    {f.label}
                  </button>
                ))}
              </div>

              <span className="h-4 w-px bg-surface-tertiary" />

              {/* Arc filters */}
              <span className="text-[10px] font-semibold uppercase text-foreground-muted">Fase:</span>
              <div className="flex items-center gap-0.5">
                {ARC_FILTERS.map((f) => (
                  <button key={f.value} onClick={() => setArcFilter(f.value)} className={cn('rounded-md px-2 py-1 text-[11px] font-medium transition', arcFilter === f.value ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'text-foreground-muted hover:bg-surface-secondary hover:text-foreground-secondary')}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Line 4: Action buttons */}
            <div className="mt-2.5 flex items-center gap-2">
              <button type="button" onClick={handleAnalyze} className="flex items-center gap-1.5 rounded-md bg-[#3B82F6]/10 px-3 py-1.5 text-xs font-medium text-[#3B82F6] transition-colors hover:bg-[#3B82F6]/20">
                <BarChart3 className="h-3.5 w-3.5" /> Analizar
              </button>
              <button type="button" onClick={() => { if (selectionMode) clearSelection(); else setSelectionMode(true); }} className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors', selectionMode ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-surface-secondary text-foreground-secondary hover:bg-surface-tertiary')}>
                {selectionMode ? <><X className="h-3.5 w-3.5" /> Cancelar</> : <><CheckSquare className="h-3.5 w-3.5" /> Seleccionar</>}
              </button>
              <button type="button" onClick={() => setHistoryOpen(true)} className="flex items-center gap-1.5 rounded-md bg-surface-secondary px-3 py-1.5 text-xs font-medium text-foreground-secondary transition-colors hover:bg-surface-tertiary">
                <Clock className="h-3.5 w-3.5" /> Historial
              </button>
              <button type="button" onClick={() => setChatOpen(!chatOpen)} className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors', chatOpen ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]' : 'bg-surface-secondary text-foreground-secondary hover:bg-surface-tertiary')}>
                <MessageSquare className="h-3.5 w-3.5" /> Chat IA
              </button>

              <span className="h-4 w-px bg-surface-tertiary" />

              {/* View mode toggle */}
              <div className="flex items-center gap-0.5 rounded-md border border-surface-tertiary p-0.5">
                <button onClick={() => setViewMode('collapsed')} className={cn('inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition', viewMode === 'collapsed' ? 'bg-surface-secondary text-foreground' : 'text-foreground-muted hover:text-foreground')}>
                  <List className="h-3 w-3" /> Compacto
                </button>
                <button onClick={() => setViewMode('expanded')} className={cn('inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition', viewMode === 'expanded' ? 'bg-surface-secondary text-foreground' : 'text-foreground-muted hover:text-foreground')}>
                  <LayoutGrid className="h-3 w-3" /> Expandido
                </button>
              </div>
            </div>
          </div>

          {/* ── Scene List ── */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {filteredScenes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-tertiary py-20">
                <h3 className="mb-1 text-lg font-semibold text-foreground">No hay escenas</h3>
                <p className="text-sm text-foreground-muted">{scenes.length === 0 ? 'Aun no hay escenas en este proyecto' : 'No hay escenas que coincidan con los filtros'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredScenes.map((scene, idx) => (
                  <div key={scene.id}>
                    <SceneCard
                      scene={scene}
                      characters={characters}
                      backgrounds={backgrounds}
                      sortPosition={idx + 1}
                      isExpanded={expandedIds.has(scene.id)}
                      onToggleExpand={() => toggleExpand(scene.id)}
                      onOpenAISidebar={handleOpenAISidebar}
                      onGeneratePrompt={handleGeneratePrompt}
                      generatingPrompts={generatingPrompts}
                      onUpdateScene={handleUpdateScene}
                      onDeleteScene={handleDeleteScene}
                      selectionMode={selectionMode}
                      isSelected={selectedSceneIds.includes(scene.id)}
                      onToggleSelect={() => toggleSceneSelection(scene.id)}
                    />
                    {idx < filteredScenes.length - 1 && (
                      <InsertSceneButton prevScene={scene} nextScene={filteredScenes[idx + 1]} characters={characters} backgrounds={backgrounds} project={project} onInserted={fetchAll} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            RIGHT PANEL: Chat (350px, toggleable)
           ════════════════════════════════════════════════════════════ */}
        {chatOpen && (
          <div className="w-[380px] shrink-0 border-l border-foreground/[0.06] bg-surface h-full overflow-hidden">
            <div className="relative flex h-full flex-col">
              {/* Close panel button */}
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="absolute right-2 top-2.5 z-10 flex h-6 w-6 items-center justify-center rounded-md text-foreground-muted hover:bg-surface-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <ChatStoryboard
                projectId={project.id}
                scenes={scenes}
                characters={characters}
                backgrounds={backgrounds}
                onRefresh={fetchAll}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── AI Sidebar (overlay) ── */}
      <AISidebar state={aiSidebar} onClose={handleCloseAISidebar} onApply={handleApplyImprovedPrompt} project={project} scenes={scenes} characters={characters} />
      {aiSidebar.open && <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]" onClick={handleCloseAISidebar} />}

      {/* ── Analysis Modal ── */}
      <AnalysisModal open={analysisOpen} onClose={() => setAnalysisOpen(false)} result={analysisResult} loading={analysisLoading} />

      {/* ── History Panel (overlay) ── */}
      <HistoryPanel
        projectId={project.id}
        onRefresh={fetchAll}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />

      {/* ── Scene Selection Bar ── */}
      {selectionMode && project && (
        <SceneSelectionBar
          selectedIds={selectedSceneIds}
          scenes={scenes}
          characters={characters}
          backgrounds={backgrounds}
          projectId={project.id}
          projectStyle={project.style}
          onClearSelection={clearSelection}
          onScenesUpdated={fetchAll}
        />
      )}
    </>
  );
}
