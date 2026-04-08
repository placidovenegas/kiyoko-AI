'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Select, ListBox, Label } from '@heroui/react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
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

  // Form state
  const [form, setForm] = useState<SceneForm>(DEFAULT_FORM);
  const [insertPosition, setInsertPosition] = useState<'end' | number>('end');
  const [saving, setSaving] = useState(false);

  // Chat state
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
      });
    } else {
      setForm(DEFAULT_FORM);
      setIaMessages([]);
      setIaInput('');
    }
  }, [open, scene, sceneCameras, sceneCharacters, sceneBackgrounds]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onOpenChange]);

  const update = useCallback(<K extends keyof SceneForm>(key: K, val: SceneForm[K]) => {
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  // Adjacent scenes
  const prevScene = typeof insertPosition === 'number' ? allScenes[insertPosition] : null;
  const nextScene = typeof insertPosition === 'number' ? allScenes[insertPosition + 1] : null;

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

    const timer = setTimeout(() => {
      const next = allScenes[insertPosition + 1];
      const prevPhase: string = prev.arc_phase ?? 'build';
      const nextPhase: string | undefined = next?.arc_phase ?? undefined;

      let sugPhase = 'build';
      if (prevPhase === 'hook') sugPhase = 'build';
      else if (prevPhase === 'build' && nextPhase === 'close') sugPhase = 'peak';
      else if (prevPhase === 'peak') sugPhase = 'close';
      else if (!nextPhase) sugPhase = prevPhase === 'peak' ? 'close' : 'peak';

      const sugAngle: CameraAngle = prevPhase === 'hook' ? 'medium' : prevPhase === 'peak' ? 'close_up' : 'wide';
      const sugMove: CameraMovement = sugPhase === 'peak' ? 'dolly_in' : sugPhase === 'close' ? 'dolly_out' : 'tracking';
      const sugDur = prevPhase === 'hook' ? 4 : prevPhase === 'peak' ? 6 : 5;

      // Pick characters/backgrounds from adjacent scenes
      const prevChars = sceneCharacters.filter(sc => sc.scene_id === prev.id).map(sc => sc.character_id);
      const nextChars = next ? sceneCharacters.filter(sc => sc.scene_id === next.id).map(sc => sc.character_id) : [];
      const sugChars = [...new Set([...prevChars, ...nextChars])];

      const prevBgs = sceneBackgrounds.filter(sb => sb.scene_id === prev.id).map(sb => sb.background_id);
      const sugBgs = prevBgs.length > 0 ? [prevBgs[0]] : [];

      const prevTitle = prev.title ?? `Escena #${prev.scene_number}`;
      const prevDesc = prev.description ?? '';
      const nextTitle = next?.title ?? 'el final del video';
      const phaseLabel = PHASES.find(p => p.value === sugPhase)?.label ?? sugPhase;
      const angleLabel = ANGLES.find(a => a.value === sugAngle)?.label ?? 'Medio';
      const movLabel = MOVEMENTS.find(m => m.value === sugMove)?.label ?? 'Tracking';

      // Generate contextual title and rich description
      let sugTitle = '';
      let sugDescription = '';
      if (sugPhase === 'peak') {
        sugTitle = 'Momento clave — punto de inflexion';
        sugDescription = prevDesc
          ? `Tras "${prevTitle}", la tension alcanza su punto maximo. La camara se acerca para capturar la reaccion emocional del momento decisivo. La iluminacion cambia dramaticamente para reflejar la intensidad de la escena.`
          : `El momento de mayor impacto visual y narrativo del video. Un plano que capture la atencion del espectador con un movimiento de camara que eleve la intensidad dramatica.`;
      } else if (sugPhase === 'close') {
        sugTitle = 'Cierre y resolucion';
        sugDescription = prevDesc
          ? `Despues de "${prevTitle}", la escena se resuelve con un plano amplio que muestra la consecuencia de lo ocurrido. El ritmo se ralentiza y la camara retrocede, dando al espectador un momento para procesar.`
          : `El cierre natural del video. Un plano final que transmita la conclusion del mensaje con un movimiento de camara suave que invite a la reflexion o accion del espectador.`;
      } else if (sugPhase === 'hook') {
        sugTitle = 'Gancho visual de apertura';
        sugDescription = 'Una toma impactante que capture la atencion en los primeros segundos. Movimiento dinamico de camara con un elemento visual sorprendente que enganche al espectador inmediatamente.';
      } else {
        sugTitle = 'Desarrollo — construyendo la narrativa';
        sugDescription = prevDesc
          ? `Continuando desde "${prevTitle}", esta escena profundiza en el mensaje. La camara sigue la accion con un movimiento fluido que mantiene el interes mientras construye hacia el momento clave.`
          : `Una escena que desarrolla el mensaje central del video. Plano medio con movimiento que acompane la narracion visual y mantenga el ritmo narrativo.`;
      }

      // Add character/background context to description
      const charNames = characters.filter(c => sugChars.includes(c.id)).map(c => c.name);
      const bgNames = backgrounds.filter(b => sugBgs.includes(b.id)).map(b => b.name);
      if (charNames.length > 0) {
        sugDescription += ` Protagonizada por ${charNames.join(' y ')}.`;
      }
      if (bgNames.length > 0) {
        sugDescription += ` Ambientada en ${bgNames.join(', ')}.`;
      }

      const suggestion: SuggestionData = {
        title: sugTitle, description: sugDescription,
        arcPhase: sugPhase, duration: sugDur,
        cameraAngle: sugAngle, cameraMovement: sugMove,
        characterIds: sugChars, backgroundIds: sugBgs,
      };

      const content = `He analizado las escenas adyacentes:

**← Anterior:** "${prevTitle}" (${prev.duration_seconds}s · ${prev.arc_phase})
**→ Siguiente:** "${nextTitle}"${next ? ` (${next.duration_seconds}s · ${next.arc_phase})` : ''}

Basandome en el contexto narrativo, te sugiero esta escena:`;

      setIaMessages([{ id: `auto-${Date.now()}`, role: 'assistant', content, suggestion }]);
      setIaProcessing(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [open, isEdit, insertPosition, allScenes, sceneCharacters, sceneBackgrounds]);

  /* ── Use suggestion ─────────────────────────────────────── */
  function handleUseSuggestion(data: SuggestionData) {
    setForm(f => ({
      ...f,
      title: data.title,
      description: data.description,
      arcPhase: data.arcPhase,
      duration: data.duration,
      cameraAngle: data.cameraAngle,
      cameraMovement: data.cameraMovement,
      characterIds: data.characterIds,
      backgroundIds: data.backgroundIds,
    }));
    toast.success('Sugerencia aplicada al formulario');
  }

  /* ── IA chat handler ────────────────────────────────────── */
  function handleIaSend(directText?: string) {
    const text = (directText ?? iaInput).trim();
    if (!text || iaProcessing) return;
    setIaInput('');
    setIaProcessing(true);
    setIaMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);

    setTimeout(() => {
      // Mock suggestion based on user input
      const sugTitle = text.toLowerCase().includes('accion') ? 'Secuencia de accion' :
        text.toLowerCase().includes('transicion') ? 'Transicion suave' :
        text.toLowerCase().includes('emocional') ? 'Momento emocional' :
        text.toLowerCase().includes('gancho') ? 'Gancho visual' :
        text.toLowerCase().includes('corto') || text.toLowerCase().includes('corta') ? form.title || 'Escena rapida' :
        'Escena sugerida';
      const sugPhase = text.toLowerCase().includes('cierre') ? 'close' :
        text.toLowerCase().includes('gancho') ? 'hook' :
        text.toLowerCase().includes('climax') ? 'peak' : form.arcPhase || 'build';
      const sugAngle: CameraAngle = text.toLowerCase().includes('primer plano') || text.toLowerCase().includes('close') ? 'close_up' :
        text.toLowerCase().includes('general') ? 'wide' : form.cameraAngle || 'medium';
      const sugMove: CameraMovement = text.toLowerCase().includes('tracking') ? 'tracking' :
        text.toLowerCase().includes('orbita') ? 'orbit' : form.cameraMovement || 'dolly_in';
      const sugDur = text.toLowerCase().includes('corto') || text.toLowerCase().includes('corta') ? 3 :
        text.toLowerCase().includes('larga') || text.toLowerCase().includes('largo') ? 8 : form.duration || 5;

      // Generate rich description based on user input
      const t = text.toLowerCase();
      let sugDesc = '';
      if (t.includes('accion')) {
        sugDesc = 'Secuencia dinamica con movimientos rapidos de camara. El protagonista ejecuta la accion principal mientras la camara sigue cada movimiento con energia cinematografica. Iluminacion contrastada para dramatismo.';
      } else if (t.includes('transicion')) {
        sugDesc = 'Una toma de transicion fluida que conecta las escenas de forma natural. La camara se desplaza suavemente revelando el nuevo escenario mientras el ritmo visual se mantiene constante.';
      } else if (t.includes('emocional')) {
        sugDesc = 'Primer plano que captura la expresion y emocion del personaje. Iluminacion suave y calida, con fondo desenfocado para centrar toda la atencion en el momento intimo y vulnerable.';
      } else if (t.includes('gancho')) {
        sugDesc = 'Toma de apertura impactante disenada para captar la atencion en los primeros 2 segundos. Elemento visual sorprendente con movimiento de camara dinamico que genera curiosidad inmediata.';
      } else if (t.includes('dramatico') || t.includes('drama')) {
        sugDesc = 'Escena de alta intensidad emocional con contrastes de luz marcados. La camara se acerca lentamente al sujeto mientras la tension narrativa alcanza su punto maximo.';
      } else {
        sugDesc = `Escena ${sugPhase === 'peak' ? 'climática de máxima intensidad' : sugPhase === 'close' ? 'de cierre que resuelve la narrativa' : 'que desarrolla el mensaje central'}. Plano ${ANGLES.find(a => a.value === sugAngle)?.label?.toLowerCase() ?? 'medio'} con movimiento ${MOVEMENTS.find(m => m.value === sugMove)?.label?.toLowerCase() ?? 'fluido'} que mantiene el ritmo visual.`;
      }

      const suggestion: SuggestionData = {
        title: sugTitle, description: sugDesc,
        arcPhase: sugPhase, duration: sugDur,
        cameraAngle: sugAngle, cameraMovement: sugMove,
        characterIds: form.characterIds, backgroundIds: form.backgroundIds,
      };

      const content = `Entendido. He preparado una sugerencia basada en "${text}":`;

      setIaMessages(prev => [...prev, { id: `auto-${Date.now()}`, role: 'assistant', content, suggestion }]);
      setIaProcessing(false);
    }, 500);
  }

  /* ── Save ────────────────────────────────────────────────── */
  async function handleSave() {
    if (!form.title.trim()) { toast.error('El titulo es obligatorio'); return; }
    setSaving(true);
    try {
      const supabase = createClient();
      if (isEdit && scene) {
        await supabase.from('scenes').update({
          title: form.title, description: form.description,
          arc_phase: form.arcPhase as 'hook' | 'build' | 'peak' | 'close',
          duration_seconds: form.duration, dialogue: form.dialogue,
        }).eq('id', scene.id);

        // Update camera
        const cam = sceneCameras.find(c => c.scene_id === scene.id);
        if (cam) {
          await supabase.from('scene_camera').update({
            camera_angle: form.cameraAngle, camera_movement: form.cameraMovement,
          }).eq('scene_id', scene.id);
        }

        toast.success('Escena actualizada');
      } else {
        const num = insertPosition === 'end' ? allScenes.length + 1 : (typeof insertPosition === 'number' ? insertPosition + 2 : nextSceneNumber);
        const { data: newScene } = await supabase.from('scenes').insert({
          video_id: videoId, project_id: projectId, title: form.title,
          description: form.description, duration_seconds: form.duration,
          arc_phase: form.arcPhase as 'hook' | 'build' | 'peak' | 'close',
          scene_number: num, sort_order: num, short_id: generateShortId(),
          status: 'draft', scene_type: 'original', dialogue: form.dialogue,
        }).select('id').single();

        if (newScene) {
          await supabase.from('scene_camera').insert({
            scene_id: newScene.id, camera_angle: form.cameraAngle, camera_movement: form.cameraMovement,
          });

          // Insert characters
          if (form.characterIds.length > 0) {
            await supabase.from('scene_characters').insert(
              form.characterIds.map((cid, i) => ({ scene_id: newScene.id, character_id: cid, sort_order: i }))
            );
          }

          // Insert backgrounds
          if (form.backgroundIds.length > 0) {
            await supabase.from('scene_backgrounds').insert(
              form.backgroundIds.map((bid, i) => ({ scene_id: newScene.id, background_id: bid, is_primary: i === 0 }))
            );
          }
        }
        toast.success('Escena creada');
      }
      queryClient.invalidateQueries({ queryKey: ['scenes'] });
      queryClient.invalidateQueries({ queryKey: ['video'] });
      queryClient.invalidateQueries({ queryKey: ['scene-characters'] });
      queryClient.invalidateQueries({ queryKey: ['scene-backgrounds'] });
      onUpdate?.();
      onOpenChange(false);
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  }

  if (!open) return null;

  const sceneNum = isEdit ? scene?.scene_number : (insertPosition === 'end' ? allScenes.length + 1 : (typeof insertPosition === 'number' ? insertPosition + 2 : nextSceneNumber));

  // Position options for HeroUI Select
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
          {/* Position selector */}
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

        {/* ── Body: Form + Chat side by side ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: Form */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <SceneWorkForm
              form={form}
              update={update}
              characters={characters}
              backgrounds={backgrounds}
              imagePrompt={imagePrompt}
              videoPrompt={videoPrompt}
              isEdit={isEdit}
            />
          </div>

          {/* Right: Chat sidebar */}
          <div className="w-[340px] shrink-0 border-l border-border bg-background/50 hidden lg:flex flex-col">
            <SceneWorkChat
              messages={iaMessages}
              processing={iaProcessing}
              input={iaInput}
              onInputChange={setIaInput}
              onSend={handleIaSend}
              onUseSuggestion={handleUseSuggestion}
              characters={characters}
              backgrounds={backgrounds}
              isEdit={isEdit}
            />
          </div>

          {/* Mobile: Chat toggle button */}
          <button type="button" className="lg:hidden fixed bottom-24 right-6 z-20 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl hover:bg-primary/90 transition-colors"
            onClick={() => toast.info('Chat IA disponible en pantalla completa')}>
            <Sparkles className="size-5" />
          </button>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between border-t border-border px-5 py-3 shrink-0">
          {/* Context indicator */}
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
              {saving && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear escena'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
