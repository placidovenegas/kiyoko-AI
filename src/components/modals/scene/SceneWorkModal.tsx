'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Select, ListBox } from '@heroui/react';
import { X, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { generateShortId } from '@/lib/utils/nanoid';
import { SceneWorkForm } from './SceneWorkForm';
import { SceneWorkChat } from './SceneWorkChat';
import type { SceneForm, IaMessage, SuggestionData, CameraAngle, CameraMovement } from './scene-work-types';
import { PHASES, ANGLES, MOVEMENTS, DEFAULT_FORM } from './scene-work-types';
import type { Scene, Character, Background } from '@/types';

interface SceneCameraData {
  scene_id: string;
  camera_angle: string | null;
  camera_movement: string | null;
}
import type { SceneCharacterWithChar, SceneBackgroundWithBg } from './scene-work-types';
import type { Key } from 'react';

/* ── Props ────────────────────────────────────────────────── */

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  projectId: string;
  nextSceneNumber?: number;
  scene?: Scene | null;
  imagePrompt?: string | null;
  videoPrompt?: string | null;
  allScenes?: Scene[];
  characters?: Character[];
  backgrounds?: Background[];
  sceneCharacters?: SceneCharacterWithChar[];
  sceneBackgrounds?: SceneBackgroundWithBg[];
  sceneCameras?: SceneCameraData[];
  onUpdate?: () => void;
}

/* ── Component ────────────────────────────────────────────── */

export function SceneWorkModal({
  open, onOpenChange, videoId, projectId, nextSceneNumber = 1,
  scene, imagePrompt, videoPrompt, allScenes = [],
  characters = [], backgrounds = [],
  sceneCharacters = [], sceneBackgrounds = [], sceneCameras = [],
  onUpdate,
}: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!scene;

  const [form, setForm] = useState<SceneForm>(DEFAULT_FORM);
  const [insertPosition, setInsertPosition] = useState<'end' | number>('end');
  const [saving, setSaving] = useState(false);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);

  const [iaInput, setIaInput] = useState('');
  const [iaMessages, setIaMessages] = useState<IaMessage[]>([]);
  const [iaProcessing, setIaProcessing] = useState(false);

  const lastSuggestedRef = useRef<'end' | number | null>(null);

  // Init form
  useEffect(() => {
    if (!open) { lastSuggestedRef.current = null; return; }
    if (scene) {
      const cam = sceneCameras.find(c => c.scene_id === scene.id);
      const charIds = sceneCharacters.filter(sc => sc.scene_id === scene.id).map(sc => sc.character_id);
      const bgIds = sceneBackgrounds.filter(sb => sb.scene_id === scene.id).map(sb => sb.background_id);
      setForm({
        title: scene.title ?? '', description: scene.description ?? '',
        arcPhase: scene.arc_phase ?? 'build', duration: Number(scene.duration_seconds) || 5,
        cameraAngle: (cam?.camera_angle as CameraAngle) ?? 'medium',
        cameraMovement: (cam?.camera_movement as CameraMovement) ?? 'static',
        dialogue: scene.dialogue ?? '',
        music: false, dialogue_audio: false, sfx: false, voiceover: false,
        characterIds: charIds, backgroundIds: bgIds,
        sceneKind: (scene.scene_type as SceneForm['sceneKind']) ?? 'original',
        parentSceneId: scene.parent_scene_id ?? null,
      });
    } else {
      setForm(DEFAULT_FORM);
      setIaMessages([]);
      setIaInput('');
      setInsertPosition('end');
    }
  }, [open, scene, sceneCameras, sceneCharacters, sceneBackgrounds]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onOpenChange]);

  const update = useCallback(<K extends keyof SceneForm>(key: K, val: SceneForm[K]) => {
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  const prevScene = typeof insertPosition === 'number' ? allScenes[insertPosition] : null;
  const nextScene = typeof insertPosition === 'number' ? allScenes[insertPosition + 1] : null;

  /* ── Call real AI for scene suggestion ───────────────────── */
  async function callAiSuggestion(instruction: string): Promise<SuggestionData | null> {
    try {
      const res = await fetch('/api/ai/generate-scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, instruction }),
      });
      if (!res.ok) return null;
      const json = await res.json();
      if (!json.success || !json.data) return null;
      const d = json.data;
      return {
        title: d.title ?? '',
        description: d.description ?? '',
        arcPhase: d.arc_phase ?? 'build',
        duration: d.duration_seconds ?? 5,
        cameraAngle: (d.camera_angle as CameraAngle) ?? 'medium',
        cameraMovement: (d.camera_movement as CameraMovement) ?? 'static',
        characterIds: [],
        backgroundIds: [],
        promptImage: d.prompt_image ?? undefined,
        promptVideo: d.prompt_video ?? undefined,
        directorNotes: d.director_notes ?? undefined,
        mood: d.mood ?? undefined,
        lighting: d.lighting ?? undefined,
      };
    } catch {
      return null;
    }
  }

  /* ── Fallback local suggestion builder ──────────────────── */
  function buildLocalSuggestion(prevS: Scene | null, nextS: Scene | null, userHint?: string): SuggestionData {
    const prevPhase: string = prevS?.arc_phase ?? 'build';
    const nextPhase: string | undefined = nextS?.arc_phase ?? undefined;
    let sugPhase = 'build';
    if (prevPhase === 'hook') sugPhase = 'build';
    else if (prevPhase === 'build' && nextPhase === 'close') sugPhase = 'peak';
    else if (prevPhase === 'peak') sugPhase = 'close';
    else if (!nextPhase) sugPhase = prevPhase === 'peak' ? 'close' : 'peak';

    if (userHint) {
      const h = userHint.toLowerCase();
      if (h.includes('gancho') || h.includes('hook')) sugPhase = 'hook';
      else if (h.includes('climax') || h.includes('peak')) sugPhase = 'peak';
      else if (h.includes('cierre') || h.includes('close')) sugPhase = 'close';
    }

    const sugAngle: CameraAngle = sugPhase === 'peak' ? 'close_up' : sugPhase === 'hook' ? 'medium' : 'wide';
    const sugMove: CameraMovement = sugPhase === 'peak' ? 'dolly_in' : sugPhase === 'close' ? 'dolly_out' : 'tracking';
    const sugDur = sugPhase === 'hook' ? 4 : sugPhase === 'peak' ? 6 : 5;

    const prevChars = prevS ? sceneCharacters.filter(sc => sc.scene_id === prevS.id).map(sc => sc.character_id) : [];
    const nextChars = nextS ? sceneCharacters.filter(sc => sc.scene_id === nextS.id).map(sc => sc.character_id) : [];
    const sugChars = [...new Set([...prevChars, ...nextChars])];
    const prevBgs = prevS ? sceneBackgrounds.filter(sb => sb.scene_id === prevS.id).map(sb => sb.background_id) : [];

    const charNames = characters.filter(c => sugChars.includes(c.id)).map(c => c.name);
    const bgNames = backgrounds.filter(b => prevBgs.includes(b.id)).map(b => b.name);
    const who = charNames.length > 0 ? charNames.join(' y ') : 'el protagonista';
    const where = bgNames.length > 0 ? `en ${bgNames[0]}` : '';
    const prevTitle = prevS?.title ?? '';
    const prevDesc = prevS?.description ?? '';

    let title = '';
    let desc = '';
    if (sugPhase === 'peak') {
      title = prevTitle ? `Climax — ${prevTitle} llega al punto critico` : 'Momento de maxima tension';
      desc = `${who} se enfrenta al momento decisivo ${where}. La camara se acerca capturando la reaccion emocional.${prevDesc ? ` Tras: "${prevDesc.slice(0, 60)}..."` : ''}`;
    } else if (sugPhase === 'close') {
      title = prevTitle ? `Cierre — resolucion de "${prevTitle}"` : 'Cierre y llamada a la accion';
      desc = `${who} muestra la resolucion ${where}. La camara retrocede revelando el resultado final.${prevDesc ? ` Despues de: "${prevDesc.slice(0, 60)}..."` : ''}`;
    } else if (sugPhase === 'hook') {
      title = 'Gancho — primera impresion';
      desc = `${who} aparece ${where} en una toma impactante que capta la atencion en los primeros 2 segundos.`;
    } else {
      title = prevTitle ? `Desarrollo — continuacion de "${prevTitle}"` : `Desarrollo — ${who} en accion`;
      desc = `${who} avanza en la narrativa ${where}.${prevDesc ? ` Continuando desde: "${prevDesc.slice(0, 60)}..."` : ''}${nextS ? ` Prepara la transicion hacia "${nextS.title}".` : ''}`;
    }

    return {
      title, description: desc, arcPhase: sugPhase, duration: sugDur,
      cameraAngle: sugAngle, cameraMovement: sugMove,
      characterIds: sugChars, backgroundIds: prevBgs.length > 0 ? [prevBgs[0]] : [],
    };
  }

  /* ── Auto-suggestion on position change ─────────────────── */
  useEffect(() => {
    if (!open || isEdit) return;
    if (insertPosition === 'end' || typeof insertPosition !== 'number') return;
    if (insertPosition === lastSuggestedRef.current) return;

    const prev = allScenes[insertPosition];
    if (!prev) return;
    lastSuggestedRef.current = insertPosition;
    setIaMessages([]);
    setIaProcessing(true);

    const next = allScenes[insertPosition + 1];
    const prevTitle = prev.title ?? `Escena #${prev.scene_number}`;
    const nextTitle = next?.title ?? 'el final del video';

    // Try real AI first, fallback to local
    const instruction = `Genera una escena para insertar entre "${prevTitle}" (${prev.arc_phase}, ${prev.duration_seconds}s${prev.description ? `: ${prev.description}` : ''}) y "${nextTitle}"${next?.description ? ` (${next.description})` : ''}. Debe conectar ambas escenas narrativamente.`;

    callAiSuggestion(instruction).then(aiResult => {
      const suggestion = aiResult ?? buildLocalSuggestion(prev, next);
      const content = `He analizado las escenas adyacentes:

**← Anterior:** "${prevTitle}" (${prev.duration_seconds}s · ${prev.arc_phase})
**→ Siguiente:** "${nextTitle}"${next ? ` (${next.duration_seconds}s · ${next.arc_phase})` : ''}

${aiResult ? 'He generado esta escena con IA:' : 'Te sugiero esta escena:'}`;

      setIaMessages([{ id: `auto-${Date.now()}`, role: 'assistant', content, suggestion }]);
      setIaProcessing(false);
    });
  }, [open, isEdit, insertPosition, allScenes, sceneCharacters, sceneBackgrounds]);

  /* ── Use suggestion ─────────────────────────────────────── */
  function handleUseSuggestion(data: SuggestionData) {
    setForm(f => ({
      ...f,
      title: data.title, description: data.description,
      arcPhase: data.arcPhase, duration: data.duration,
      cameraAngle: data.cameraAngle, cameraMovement: data.cameraMovement,
      characterIds: data.characterIds, backgroundIds: data.backgroundIds,
    }));
    toast.success('Sugerencia aplicada al formulario');
  }

  /* ── IA chat handler (calls real API) ───────────────────── */
  async function handleIaSend(directText?: string) {
    const text = (directText ?? iaInput).trim();
    if (!text || iaProcessing) return;
    setIaInput('');
    setIaProcessing(true);
    setIaMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);

    // Build instruction with context
    const prev = typeof insertPosition === 'number' ? allScenes[insertPosition] : null;
    const next = typeof insertPosition === 'number' ? allScenes[insertPosition + 1] : null;
    const contextParts: string[] = [];
    if (prev) contextParts.push(`Escena anterior: "${prev.title}" (${prev.arc_phase}${prev.description ? `, ${prev.description}` : ''})`);
    if (next) contextParts.push(`Escena siguiente: "${next.title}" (${next.arc_phase}${next.description ? `, ${next.description}` : ''})`);
    if (form.title) contextParts.push(`Titulo actual del formulario: "${form.title}"`);
    const instruction = `${text}. ${contextParts.length > 0 ? `Contexto: ${contextParts.join('. ')}` : ''}`;

    const aiResult = await callAiSuggestion(instruction);
    const suggestion = aiResult ?? buildLocalSuggestion(prev, next, text);
    const content = aiResult
      ? `He generado una escena basada en tu indicacion:`
      : `Entendido. Te propongo esta escena:`;

    setIaMessages(prev => [...prev, { id: `auto-${Date.now()}`, role: 'assistant', content, suggestion }]);
    setIaProcessing(false);
  }

  /* ── Save + auto-generate prompts ───────────────────────── */
  async function handleSave() {
    if (!form.title.trim()) { toast.error('El titulo es obligatorio'); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      let sceneId: string | null = null;

      if (isEdit && scene) {
        sceneId = scene.id;
        await supabase.from('scenes').update({
          title: form.title, description: form.description,
          arc_phase: form.arcPhase as 'hook' | 'build' | 'peak' | 'close',
          duration_seconds: form.duration, dialogue: form.dialogue,
        }).eq('id', scene.id);

        // Update camera
        await supabase.from('scene_camera').upsert({
          scene_id: scene.id, camera_angle: form.cameraAngle, camera_movement: form.cameraMovement,
        }, { onConflict: 'scene_id' });

        toast.success('Escena actualizada');
      } else {
        const num = insertPosition === 'end' ? allScenes.length + 1 : (typeof insertPosition === 'number' ? insertPosition + 2 : nextSceneNumber);
        const { data: newScene } = await supabase.from('scenes').insert({
          video_id: videoId, project_id: projectId, title: form.title,
          description: form.description, duration_seconds: form.duration,
          arc_phase: form.arcPhase as 'hook' | 'build' | 'peak' | 'close',
          scene_number: num, sort_order: num, short_id: generateShortId(),
          status: 'draft', dialogue: form.dialogue,
          scene_type: form.sceneKind as 'original' | 'extension' | 'insert',
          parent_scene_id: form.parentSceneId || null,
        }).select('id').single();

        if (newScene) {
          sceneId = newScene.id;
          await supabase.from('scene_camera').insert({
            scene_id: newScene.id, camera_angle: form.cameraAngle, camera_movement: form.cameraMovement,
          });
          if (form.characterIds.length > 0) {
            await supabase.from('scene_characters').insert(
              form.characterIds.map((cid, i) => ({ scene_id: newScene.id, character_id: cid, sort_order: i }))
            );
          }
          if (form.backgroundIds.length > 0) {
            await supabase.from('scene_backgrounds').insert(
              form.backgroundIds.map((bid, i) => ({ scene_id: newScene.id, background_id: bid, is_primary: i === 0 }))
            );
          }
        }
        toast.success('Escena creada');
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
      queryClient.invalidateQueries({ queryKey: ['scene-characters'] });
      queryClient.invalidateQueries({ queryKey: ['scene-backgrounds'] });
      queryClient.invalidateQueries({ queryKey: ['scene-cameras'] });
      onUpdate?.();
      onOpenChange(false);
      setSaving(false);

      // Auto-generate prompts in background (after modal closes)
      if (sceneId) {
        setGeneratingPrompts(true);
        toast.loading('Generando prompts de imagen y video...', { id: 'gen-prompts' });
        try {
          const res = await fetch('/api/ai/generate-scene-prompts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sceneId }),
          });
          const json = await res.json();
          if (json.success) {
            toast.success('Prompts generados automaticamente', { id: 'gen-prompts' });
            queryClient.invalidateQueries({ queryKey: ['scene-prompts'] });
          } else {
            toast.error('No se pudieron generar prompts', { id: 'gen-prompts' });
          }
        } catch {
          toast.error('Error generando prompts', { id: 'gen-prompts' });
        }
        setGeneratingPrompts(false);
      }
    } catch {
      toast.error('Error al guardar');
      setSaving(false);
    }
  }

  if (!open) return null;

  const sceneNum = isEdit ? scene?.scene_number : (insertPosition === 'end' ? allScenes.length + 1 : (typeof insertPosition === 'number' ? insertPosition + 2 : nextSceneNumber));

  const positionOptions = [
    { key: 'end', label: `Al final (escena #${allScenes.length + 1})` },
    ...allScenes.map((s, i) => ({ key: String(i), label: `Despues de #${s.scene_number} "${s.title}"` })),
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-4 sm:inset-6 lg:inset-y-6 lg:left-[8%] lg:right-[8%] z-10 flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-3 shrink-0">
          {!isEdit && allScenes.length > 0 && (
            <div className="w-[260px] shrink-0">
              <Select variant="secondary" aria-label="Posicion" selectedKey={insertPosition === 'end' ? 'end' : String(insertPosition)}
                onSelectionChange={(key: Key | null) => {
                  if (!key) return;
                  setInsertPosition(key === 'end' ? 'end' : parseInt(String(key), 10));
                }}>
                <Select.Trigger className="h-8 text-xs"><Select.Value /><Select.Indicator /></Select.Trigger>
                <Select.Popover><ListBox>{positionOptions.map(o => <ListBox.Item key={o.key} id={o.key}>{o.label}</ListBox.Item>)}</ListBox></Select.Popover>
              </Select>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {isEdit ? `Editar escena #${scene?.scene_number}` : `Nueva escena #${sceneNum}`}
            </p>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <SceneWorkForm
              form={form} update={update}
              characters={characters} backgrounds={backgrounds}
              allScenes={allScenes.map(s => ({ id: s.id, title: s.title ?? '', scene_number: s.scene_number ?? 0 }))}
              imagePrompt={imagePrompt} videoPrompt={videoPrompt}
              isEdit={isEdit}
            />
          </div>
          <div className="w-[340px] shrink-0 border-l border-border bg-background/50 hidden lg:flex flex-col">
            <SceneWorkChat
              messages={iaMessages} processing={iaProcessing}
              input={iaInput} onInputChange={setIaInput}
              onSend={handleIaSend} onUseSuggestion={handleUseSuggestion}
              characters={characters} backgrounds={backgrounds}
              isEdit={isEdit}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3 shrink-0">
          {prevScene && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="text-foreground font-medium">{prevScene.title}</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="text-primary font-medium">#{sceneNum}</span>
              <span className="text-muted-foreground/40">→</span>
              <span className="text-foreground font-medium">{nextScene?.title ?? 'Final'}</span>
            </div>
          )}
          {!prevScene && <div />}

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => onOpenChange(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              Cancelar
            </button>
            <button type="button" onClick={handleSave} disabled={!form.title.trim() || saving}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Wand2 className="size-4" />}
              {isEdit ? 'Guardar y regenerar prompts' : 'Crear y generar prompts'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
