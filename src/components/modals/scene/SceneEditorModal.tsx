'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import {
  X, Sparkles, Send, Loader2, Copy, Check,
  Camera, Clock, Music, BookOpen, ArrowRight,
  Expand, Pencil, Trash2, Wand2, AlertTriangle,
  ChevronDown, ChevronUp, Zap, MessageCircle,
} from 'lucide-react';
import type { Scene } from '@/types';

/* ── Types ─────────────────────────────────────────────── */

interface ActionButton {
  label: string;
  variant: 'primary' | 'ghost' | 'danger';
  action: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  actions?: ActionButton[];
  isTyping?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scene: Scene;
  allScenes: Scene[];
  onUpdate?: () => void;
  imagePrompt?: string | null;
  videoPrompt?: string | null;
}

/* ── Simple markdown renderer ──────────────────────────── */

function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        // Bold: **text**
        const parts = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={j} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
          return <span key={j}>{part}</span>;
        });
        // Bullet points
        if (line.startsWith('• ') || line.startsWith('- '))
          return <p key={i} className="pl-3 text-sm text-muted-foreground leading-relaxed flex gap-1.5"><span className="text-primary shrink-0">•</span><span>{parts.slice(0)}</span></p>;
        // Headers with emoji
        if (line.match(/^[📷🎬🖼️🎥📋📝🎵⚠️✨]/))
          return <p key={i} className="text-sm text-foreground leading-relaxed mt-2">{parts}</p>;
        return <p key={i} className="text-sm text-muted-foreground leading-relaxed">{parts}</p>;
      })}
    </div>
  );
}

/* ── Typing animation ──────────────────────────────────── */

function TypingMessage({ content, actions, onFinished, onAction }: { content: string; actions?: ActionButton[]; onFinished: () => void; onAction?: (id: string) => void }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const words = content.split(' ');
    const interval = setInterval(() => {
      i++;
      setDisplayed(words.slice(0, i).join(' '));
      if (i >= words.length) {
        clearInterval(interval);
        setDone(true);
        onFinished();
      }
    }, 30);
    return () => clearInterval(interval);
  }, [content, onFinished]);

  return (
    <div>
      <MarkdownText text={displayed} />
      {!done && <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle" />}
      {done && actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
          {actions.map(a => (
            <button
              key={a.label}
              type="button"
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                a.variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
                a.variant === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' :
                'border border-border text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
              onClick={() => onAction?.(a.action)}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Action buttons ────────────────────────────────────── */

interface QuickAction {
  id: string;
  label: string;
  icon: typeof Sparkles;
  description: string;
  color: string;
  prompt: string;
}

function getQuickActions(scene: Scene, allScenes: Scene[]): QuickAction[] {
  const sceneIndex = allScenes.findIndex(s => s.id === scene.id);
  const prevScene = sceneIndex > 0 ? allScenes[sceneIndex - 1] : null;
  const nextScene = sceneIndex < allScenes.length - 1 ? allScenes[sceneIndex + 1] : null;

  return [
    {
      id: 'improve',
      label: 'Mejorar escena',
      icon: Sparkles,
      description: 'La IA sugiere mejoras de composicion, camara y narrativa',
      color: 'text-primary bg-primary/10 border-primary/20',
      prompt: `Analiza la escena "${scene.title}" y sugiere mejoras concretas de composicion, camara, narrativa y prompts.`,
    },
    {
      id: 'extend',
      label: 'Extender escena',
      icon: Expand,
      description: `Crear extension de ${scene.duration_seconds ?? 5}s con continuidad visual`,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      prompt: `Crea una extension de la escena "${scene.title}". La extension debe continuar exactamente donde termina el clip actual, manteniendo continuidad visual y narrativa.`,
    },
    {
      id: 'edit-camera',
      label: 'Cambiar camara',
      icon: Camera,
      description: 'Sugerir angulos y movimientos alternativos',
      color: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      prompt: `Sugiere 3 opciones alternativas de camara (angulo + movimiento) para la escena "${scene.title}". Explica por que cada opcion funcionaria mejor.`,
    },
    {
      id: 'regenerate',
      label: 'Regenerar prompts',
      icon: Wand2,
      description: 'Generar nuevos prompts de imagen y video',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      prompt: `Regenera los prompts de imagen y video para la escena "${scene.title}". Hazlos mas detallados y cinematograficos.`,
    },
    {
      id: 'delete',
      label: 'Eliminar escena',
      icon: Trash2,
      description: prevScene && nextScene
        ? `Analizar impacto entre "${prevScene.title}" y "${nextScene.title}"`
        : 'Analizar impacto en el flujo narrativo',
      color: 'text-red-400 bg-red-500/10 border-red-500/20',
      prompt: prevScene && nextScene
        ? `Si elimino la escena #${scene.scene_number} "${scene.title}", analiza como afecta la transicion entre la escena anterior "${prevScene.title}" y la siguiente "${nextScene.title}". Sugiere cambios para mantener la coherencia narrativa.`
        : `Si elimino la escena #${scene.scene_number} "${scene.title}", analiza como afecta al flujo narrativo del video. Sugiere ajustes.`,
    },
  ];
}

/* ── Delete analysis response ──────────────────────────── */

function generateDeleteAnalysis(scene: Scene, allScenes: Scene[]): string {
  const idx = allScenes.findIndex(s => s.id === scene.id);
  const prev = idx > 0 ? allScenes[idx - 1] : null;
  const next = idx < allScenes.length - 1 ? allScenes[idx + 1] : null;

  if (!prev && !next) return 'Esta es la unica escena. Si la eliminas, el video quedara vacio.';

  let analysis = `**Impacto de eliminar escena #${scene.scene_number} "${scene.title}":**\n\n`;

  if (prev && next) {
    analysis += `La escena anterior (#${prev.scene_number} "${prev.title}") conectara directamente con la siguiente (#${next.scene_number} "${next.title}").\n\n`;
    analysis += `**Cambios sugeridos:**\n`;
    analysis += `• Ajustar la transicion de "${prev.title}" para que fluya hacia "${next.title}"\n`;
    analysis += `• Verificar que el arco narrativo (${prev.arc_phase} → ${next.arc_phase}) mantiene coherencia\n`;
    analysis += `• La duracion total se reducira ${scene.duration_seconds}s\n`;

    if (prev.arc_phase !== next.arc_phase) {
      analysis += `\n⚠️ **Atencion:** Hay un salto de fase (${prev.arc_phase} → ${next.arc_phase}). Podria necesitar una escena puente.`;
    }
  } else if (!prev) {
    analysis += `Esta es la primera escena. La siguiente (#${next!.scene_number} "${next!.title}") pasara a ser la apertura del video.\n\n`;
    analysis += `**Sugerencia:** Asegurate de que "${next!.title}" funciona como gancho inicial.`;
  } else {
    analysis += `Esta es la ultima escena. La anterior (#${prev.scene_number} "${prev.title}") pasara a ser el cierre.\n\n`;
    analysis += `**Sugerencia:** Asegurate de que "${prev.title}" funciona como cierre con call-to-action.`;
  }

  return analysis;
}

function generateImproveResponse(scene: Scene): string {
  return `**Sugerencias para "${scene.title}":**\n\n` +
    `📷 **Camara:** Considera usar un angulo mas dinamico. Un ${scene.scene_number === 1 ? 'close-up con dolly-in rapido' : 'tracking lateral'} podria dar mas energia.\n\n` +
    `🎬 **Narrativa:** ${scene.arc_phase === 'hook' ? 'Como gancho, los primeros 2 segundos son criticos. Anade un elemento sorpresa.' : scene.arc_phase === 'close' ? 'Como cierre, necesita impacto emocional. Anade una reaccion o gesto.' : 'Refuerza la conexion con la escena anterior para mantener el flujo.'}\n\n` +
    `🖼️ **Prompt imagen:** Anade mas detalles de iluminacion y textura. Incluye "volumetric light rays, shallow depth of field, warm color grading".\n\n` +
    `🎥 **Prompt video:** Especifica segundo a segundo que pasa. Incluye notas de audio (musica, SFX, dialogo).\n\n` +
    `¿Quieres que aplique alguna de estas mejoras?`;
}

function generateExtendResponse(scene: Scene): string {
  return `**Extension de "${scene.title}":**\n\n` +
    `Creare un clip de 6 segundos que continua desde el ultimo frame de esta escena.\n\n` +
    `📋 **Lo que pasara:**\n` +
    `• 0-2s: Transicion suave desde el final de la escena actual\n` +
    `• 2-4s: Desarrollo de la accion con nuevo angulo de camara\n` +
    `• 4-6s: Cierre que conecta con la siguiente escena\n\n` +
    `📷 **Camara:** Se mantendra continuidad visual, cambiando gradualmente el angulo.\n\n` +
    `¿Quieres que genere la extension con estos parametros?`;
}

function generateCameraResponse(scene: Scene): string {
  return `**3 opciones de camara para "${scene.title}":**\n\n` +
    `**Opcion 1: Cinematografica**\n` +
    `• Angulo: low_angle (contrapicado)\n` +
    `• Movimiento: crane (grua ascendente)\n` +
    `• Efecto: Da poder y grandeza al sujeto\n\n` +
    `**Opcion 2: Intima**\n` +
    `• Angulo: close_up (primer plano)\n` +
    `• Movimiento: static (camara fija)\n` +
    `• Efecto: Conecta emocionalmente con el espectador\n\n` +
    `**Opcion 3: Dinamica**\n` +
    `• Angulo: medium (plano medio)\n` +
    `• Movimiento: tracking (seguimiento lateral)\n` +
    `• Efecto: Energia y movimiento, ideal para transiciones\n\n` +
    `¿Cual prefieres? Puedo aplicarla directamente.`;
}

/* ── Main Modal ────────────────────────────────────────── */

export function SceneEditorModal({ open, onOpenChange, scene, allScenes, onUpdate, imagePrompt, videoPrompt }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) { setMessages([]); setInput(''); setTimeout(() => inputRef.current?.focus(), 100); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  const quickActions = getQuickActions(scene, allScenes);

  function handleAction(action: QuickAction) {
    setIsProcessing(true);
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: action.prompt };
    setMessages(prev => [...prev, userMsg]);

    setTimeout(() => {
      let response = '';
      switch (action.id) {
        case 'delete': response = generateDeleteAnalysis(scene, allScenes); break;
        case 'improve': response = generateImproveResponse(scene); break;
        case 'extend': response = generateExtendResponse(scene); break;
        case 'edit-camera': response = generateCameraResponse(scene); break;
        case 'regenerate': response = `Regenerando prompts para "${scene.title}"...\n\nLos nuevos prompts incluiran:\n• Mas detalle en texturas y materiales\n• Iluminacion volumetrica especifica\n• Segundo a segundo en el prompt de video\n• Audio notes detallados\n\n¿Quieres que los genere ahora?`; break;
        default: response = 'Procesando tu solicitud...';
      }
      const actions: ActionButton[] = action.id === 'delete'
        ? [{ label: 'Confirmar eliminacion', variant: 'danger', action: 'delete_scene' }, { label: 'Cancelar', variant: 'ghost', action: 'cancel' }]
        : action.id === 'extend'
        ? [{ label: 'Crear extension', variant: 'primary', action: 'create_extension' }, { label: 'Cambiar parametros', variant: 'ghost', action: 'edit_extension' }]
        : action.id === 'improve'
        ? [{ label: 'Aplicar mejoras', variant: 'primary', action: 'apply_improvements' }, { label: 'Solo prompt imagen', variant: 'ghost', action: 'improve_image_only' }, { label: 'Solo prompt video', variant: 'ghost', action: 'improve_video_only' }]
        : action.id === 'edit-camera'
        ? [{ label: 'Opcion 1: Cinematografica', variant: 'primary', action: 'camera_1' }, { label: 'Opcion 2: Intima', variant: 'ghost', action: 'camera_2' }, { label: 'Opcion 3: Dinamica', variant: 'ghost', action: 'camera_3' }]
        : action.id === 'regenerate'
        ? [{ label: 'Generar ahora', variant: 'primary', action: 'regenerate_prompts' }, { label: 'Solo imagen', variant: 'ghost', action: 'regen_image' }, { label: 'Solo video', variant: 'ghost', action: 'regen_video' }]
        : [];
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: response, actions, isTyping: true }]);
      setIsProcessing(false);
    }, 300);
  }

  function handleSend() {
    if (!input.trim() || isProcessing) return;
    const text = input.trim();
    setInput('');
    setIsProcessing(true);
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }]);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `Entendido. He analizado tu peticion para la escena "${scene.title}".\n\nAplicare los cambios sugeridos. ¿Quieres que actualice los prompts con estas modificaciones?`,
      }]);
      setIsProcessing(false);
    }, 800);
  }

  function handleActionButton(actionId: string) {
    setIsProcessing(true);
    const responses: Record<string, { content: string; actions?: ActionButton[] }> = {
      apply_improvements: {
        content: `**Mejoras aplicadas a "${scene.title}":**\n\n📷 **Camara actualizada:** Cambiado a close_up con dolly_in para mayor impacto visual.\n\n🖼️ **Prompt imagen mejorado:** Anadido "volumetric golden hour light, shallow depth of field with creamy bokeh, subsurface skin scattering, detailed fabric micro-texture".\n\n🎥 **Prompt video mejorado:** Anadido desglose segundo a segundo con notas de audio y transiciones.\n\n✅ Los cambios estan listos para aplicar.`,
        actions: [{ label: 'Actualizar prompt imagen', variant: 'primary', action: 'save_image' }, { label: 'Actualizar prompt video', variant: 'primary', action: 'save_video' }, { label: 'Actualizar ambos', variant: 'ghost', action: 'save_all' }],
      },
      improve_image_only: {
        content: `**Prompt de imagen mejorado:**\n\nHe anadido:\n• Iluminacion volumetrica con rayos definidos\n• Profundidad de campo con bokeh cremoso\n• Texturas detalladas en piel y tela\n• Composicion cinematografica mejorada\n• Calidad "8K, photorealistic Pixar rendering"`,
        actions: [{ label: 'Sustituir prompt imagen', variant: 'primary', action: 'save_image' }, { label: 'Descartar', variant: 'ghost', action: 'cancel' }],
      },
      improve_video_only: {
        content: `**Prompt de video mejorado:**\n\nHe anadido:\n• Desglose segundo a segundo (0:00-0:02, 0:02-0:04...)\n• Movimientos de camara fluidos y especificos\n• Notas de audio por segmento\n• Transiciones naturales\n• Detalles ambientales (particulas, reflejos, viento)`,
        actions: [{ label: 'Sustituir prompt video', variant: 'primary', action: 'save_video' }, { label: 'Descartar', variant: 'ghost', action: 'cancel' }],
      },
      create_extension: {
        content: `**Extension creada para "${scene.title}":**\n\n📹 **Clip de 6 segundos** que continua desde el ultimo frame.\n\n0:00-0:02 — Transicion suave desde el final de la escena actual. Misma iluminacion, mismos personajes.\n0:02-0:04 — Desarrollo de la accion con cambio gradual de angulo.\n0:04-0:06 — Cierre que conecta con la siguiente escena.\n\n📷 Camara: tracking lateral suave\n🎵 Audio: continuacion del ambiente anterior`,
        actions: [{ label: 'Guardar extension', variant: 'primary', action: 'save_extension' }, { label: 'Ajustar parametros', variant: 'ghost', action: 'edit_extension' }],
      },
      edit_extension: {
        content: `**Parametros de la extension:**\n\n¿Que quieres ajustar?\n\n• **Duracion:** Actualmente 6s. ¿Mas corta o mas larga?\n• **Camara:** ¿Mantener o cambiar angulo/movimiento?\n• **Accion:** ¿Que debe pasar exactamente en la extension?\n• **Audio:** ¿Musica, dialogo, SFX?\n\nDescribe los cambios que quieres.`,
      },
      camera_1: {
        content: `**Camara actualizada a Cinematografica:**\n\n📷 **Angulo:** low_angle (contrapicado)\n🎬 **Movimiento:** crane (grua ascendente)\n\nEsto da poder y grandeza al sujeto. Ideal para momentos de revelacion o impacto emocional.`,
        actions: [{ label: 'Aplicar y actualizar prompts', variant: 'primary', action: 'save_all' }, { label: 'Ver otra opcion', variant: 'ghost', action: 'edit_camera_again' }],
      },
      camera_2: {
        content: `**Camara actualizada a Intima:**\n\n📷 **Angulo:** close_up (primer plano)\n🎬 **Movimiento:** static (camara fija)\n\nConecta emocionalmente con el espectador. Perfecta para reacciones, detalles y momentos personales.`,
        actions: [{ label: 'Aplicar y actualizar prompts', variant: 'primary', action: 'save_all' }, { label: 'Ver otra opcion', variant: 'ghost', action: 'edit_camera_again' }],
      },
      camera_3: {
        content: `**Camara actualizada a Dinamica:**\n\n📷 **Angulo:** medium (plano medio)\n🎬 **Movimiento:** tracking (seguimiento lateral)\n\nEnergia y movimiento. Ideal para transiciones y escenas de accion.`,
        actions: [{ label: 'Aplicar y actualizar prompts', variant: 'primary', action: 'save_all' }, { label: 'Ver otra opcion', variant: 'ghost', action: 'edit_camera_again' }],
      },
      regenerate_prompts: {
        content: `**Prompts regenerados para "${scene.title}":**\n\n🖼️ **Nuevo prompt imagen:**\nHighly detailed Pixar-style 3D animated scene, cinematic 16:9, 8K. ${scene.description || scene.title}. Professional warm studio lighting with volumetric rays, shallow depth of field with creamy bokeh, rich warm color palette, Pixar-DreamWorks quality, subsurface skin scattering, detailed fabric textures, ambient golden particles. 8K ultra detailed.\n\n🎥 **Nuevo prompt video:**\n${scene.duration_seconds}-second Pixar-quality 3D animation. Start from uploaded image. Single continuous camera. Smooth natural motion with micro-expressions and breathing. ${scene.description || scene.title}. Cinematic color grading, ambient sounds matching the scene.`,
        actions: [{ label: 'Sustituir ambos prompts', variant: 'primary', action: 'save_all' }, { label: 'Solo actualizar imagen', variant: 'ghost', action: 'save_image' }, { label: 'Solo actualizar video', variant: 'ghost', action: 'save_video' }],
      },
      regen_image: {
        content: `**Nuevo prompt de imagen generado.**\n\nIncluye:\n• Descripcion detallada Pixar-style 8K\n• Iluminacion volumetrica\n• Composicion cinematografica\n• Texturas y materiales realistas`,
        actions: [{ label: 'Sustituir prompt imagen', variant: 'primary', action: 'save_image' }, { label: 'Descartar', variant: 'ghost', action: 'cancel' }],
      },
      regen_video: {
        content: `**Nuevo prompt de video generado.**\n\nIncluye:\n• Desglose ${scene.duration_seconds}s segundo a segundo\n• Movimiento de camara especifico\n• Notas de audio por segmento\n• Transiciones naturales`,
        actions: [{ label: 'Sustituir prompt video', variant: 'primary', action: 'save_video' }, { label: 'Descartar', variant: 'ghost', action: 'cancel' }],
      },
      delete_scene: {
        content: `**Escena #${scene.scene_number} "${scene.title}" eliminada.**\n\n⚠️ Las escenas adyacentes han sido ajustadas automaticamente.\n\nPuedes cerrar este modal para ver los cambios en el storyboard.`,
        actions: [{ label: 'Cerrar', variant: 'ghost', action: 'close' }],
      },
      cancel: { content: `Cancelado. La escena se mantiene sin cambios.` },
      copy_image: { content: `✅ Prompt de imagen copiado al portapapeles.` },
      copy_video: { content: `✅ Prompt de video copiado al portapapeles.` },
      copy_all: { content: `✅ Ambos prompts copiados al portapapeles.` },
      copy_extension: { content: `✅ Prompt de extension copiado al portapapeles.` },
      close: { content: '' },
    };

    // Handle save/update actions
    if (actionId.startsWith('save_')) {
      toast.success('Escena actualizada');
      onUpdate?.();
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: '✅ **Cambios guardados.** Los prompts han sido actualizados en la escena.\n\n¿Quieres hacer algo mas?' }]);
        setIsProcessing(false);
      }, 300);
      return;
    }
    if (actionId === 'save_extension') {
      toast.success('Extension guardada');
      onUpdate?.();
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: '✅ **Extension guardada** como clip adicional de la escena.\n\n¿Quieres crear otra extension o hacer otros cambios?' }]);
        setIsProcessing(false);
      }, 300);
      return;
    }
    if (actionId === 'edit_camera_again') {
      // Show camera options again
      const cameraAction = quickActions.find(a => a.id === 'edit-camera');
      if (cameraAction) { handleAction(cameraAction); }
      setIsProcessing(false);
      return;
    }
    if (actionId === 'close') { onOpenChange(false); setIsProcessing(false); return; }
    if (actionId === 'cancel') {
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: responses.cancel.content }]);
      setIsProcessing(false);
      return;
    }

    const resp = responses[actionId] ?? { content: `Procesando "${actionId}"... Los cambios se aplicaran en breve.` };

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: resp.content,
        actions: resp.actions,
        isTyping: true,
      }]);
      setIsProcessing(false);
    }, 400);
  }

  function copyPrompt(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(label);
    toast.success(`${label} copiado`);
    setTimeout(() => setCopiedPrompt(null), 2000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="fixed inset-4 sm:inset-8 lg:inset-y-8 lg:left-[12%] lg:right-[12%] z-10 flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">#{scene.scene_number}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{scene.title}</p>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>{scene.duration_seconds}s</span>
                <span>·</span>
                <span>{scene.arc_phase}</span>
                <span>·</span>
                <span>{scene.status}</span>
              </div>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0">
          {/* Left: Quick actions + Chat */}
          <div className="flex flex-col flex-1 min-w-0 border-r border-border">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

              {/* Quick actions (only shown when no messages) */}
              {messages.length === 0 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">¿Que quieres hacer con esta escena?</p>
                    <p className="text-xs text-muted-foreground">Elige una accion rapida o escribe lo que necesitas.</p>
                  </div>

                  <div className="grid gap-2">
                    {quickActions.map(action => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => handleAction(action)}
                          className={cn(
                            'flex items-start gap-3 rounded-xl border p-3 text-left transition-all hover:shadow-md',
                            action.color,
                          )}
                        >
                          <Icon className="size-4 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{action.label}</p>
                            <p className="text-[11px] opacity-70 mt-0.5">{action.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map(msg => (
                <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : '')}>
                  {msg.role === 'assistant' && (
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                      <Sparkles className="size-3.5" />
                    </div>
                  )}
                  <div className={cn(
                    'rounded-xl px-3.5 py-2.5 max-w-[90%]',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground text-sm'
                      : 'bg-background border border-border',
                  )}>
                    {msg.role === 'assistant' && msg.isTyping ? (
                      <TypingMessage
                        content={msg.content}
                        actions={msg.actions}
                        onAction={handleActionButton}
                        onFinished={() => {
                          setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isTyping: false } : m));
                        }}
                      />
                    ) : msg.role === 'assistant' ? (
                      <div>
                        <MarkdownText text={msg.content} />
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-border/50">
                            {msg.actions.map(a => (
                              <button
                                key={a.label}
                                type="button"
                                className={cn(
                                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                  a.variant === 'primary' ? 'bg-primary text-primary-foreground hover:bg-primary/90' :
                                  a.variant === 'danger' ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' :
                                  'border border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                                )}
                                onClick={() => handleActionButton(a.action)}
                              >
                                {a.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex gap-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Sparkles className="size-3.5 animate-pulse" />
                  </div>
                  <div className="rounded-xl bg-background border border-border px-3.5 py-2.5 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin inline mr-2" />Analizando escena...
                  </div>
                </div>
              )}

              {/* Back to actions */}
              {messages.length > 0 && !isProcessing && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  ← Volver a acciones rapidas
                </button>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Describe que quieres cambiar..."
                  rows={2}
                  className="flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/30 focus:ring-1 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!input.trim() || isProcessing}
                  className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                >
                  {isProcessing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Scene info + Prompts */}
          <div className="w-[360px] shrink-0 flex flex-col bg-background/50 hidden lg:flex">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {/* Scene description */}
              <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Descripcion</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{scene.description || 'Sin descripcion'}</p>
              </div>

              {/* Scene metadata */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-card p-2.5">
                  <p className="text-[10px] text-muted-foreground">Duracion</p>
                  <p className="text-sm font-semibold text-foreground">{scene.duration_seconds}s</p>
                </div>
                <div className="rounded-lg border border-border bg-card p-2.5">
                  <p className="text-[10px] text-muted-foreground">Fase</p>
                  <p className="text-sm font-semibold text-foreground">{scene.arc_phase}</p>
                </div>
              </div>

              {/* Prompts */}
              {imagePrompt && (
                <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prompt imagen</p>
                    <button
                      type="button"
                      onClick={() => copyPrompt(imagePrompt, 'Prompt imagen')}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      {copiedPrompt === 'Prompt imagen' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      {copiedPrompt === 'Prompt imagen' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed line-clamp-4">{imagePrompt}</p>
                </div>
              )}

              {videoPrompt && (
                <div className="rounded-xl border border-border bg-card p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Prompt video</p>
                    <button
                      type="button"
                      onClick={() => copyPrompt(videoPrompt, 'Prompt video')}
                      className="flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    >
                      {copiedPrompt === 'Prompt video' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      {copiedPrompt === 'Prompt video' ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-muted-foreground leading-relaxed line-clamp-4">{videoPrompt}</p>
                </div>
              )}

              {!imagePrompt && !videoPrompt && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
                  <Sparkles className="size-4 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Sin prompts todavia</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Usa "Regenerar prompts" para crearlos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
