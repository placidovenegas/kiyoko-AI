'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Users,
  Upload,
  X,
  Sparkles,
  ChevronDown,
  Image as ImageIcon,
  Copy,
  Check,
  Info,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useAiAssist } from '@/hooks/useAiAssist';
import { toast } from 'sonner';

const ROLES = ['protagonista', 'secundario', 'extra', 'narrador'] as const;

const ANALYSIS_PROMPT = `Analyze this character image for a video production project. Describe in English (max 50 words): age, gender, hair, clothing, expression, energy. Format as a concise visual prompt.`;

export interface CharacterCreationData {
  name: string;
  role: string;
  description: string;
  personality: string;
  visual_description: string;
  image?: File;
  imagePreview?: string;
}

interface CharacterCreationCardProps {
  prefill?: Partial<CharacterCreationData>;
  projectId?: string;
  onCreated?: (msg: string) => void;
  onCancel: () => void;
}

export function CharacterCreationCard({ prefill, projectId, onCreated, onCancel }: CharacterCreationCardProps) {
  const [name, setName] = useState(prefill?.name ?? '');
  const [role, setRole] = useState(prefill?.role ?? 'protagonista');
  const [description, setDescription] = useState(prefill?.description ?? '');
  const [personality, setPersonality] = useState(prefill?.personality ?? '');
  const [visualDesc, setVisualDesc] = useState(prefill?.visual_description ?? '');
  const [imagePreview, setImagePreview] = useState<string | null>(prefill?.imagePreview ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { assist, loading: aiLoading } = useAiAssist();

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Imagen demasiado grande (max 10MB)'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const removeImage = useCallback(() => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }, [imagePreview]);

  // ---- AI assists ----
  const suggestPersonality = useCallback(async () => {
    const result = await assist(
      `Sugiere 3-4 rasgos de personalidad (separados por coma) para un personaje llamado "${name}" con rol ${role}. ${description ? `Contexto: ${description}` : ''} Solo los rasgos, nada mas.`,
      'personality',
    );
    if (result) setPersonality(result);
  }, [assist, name, role, description]);

  const suggestVisual = useCallback(async () => {
    const result = await assist(
      `Escribe un prompt visual en INGLES (max 50 palabras) para un personaje llamado "${name}": ${description || 'sin contexto'}. Personalidad: ${personality || 'sin definir'}. Solo el prompt, nada mas.`,
      'visual',
    );
    if (result) setVisualDesc(result);
  }, [assist, name, description, personality]);

  const copyAnalysisPrompt = useCallback(() => {
    navigator.clipboard.writeText(ANALYSIS_PROMPT).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    });
  }, []);

  // ---- Save to Supabase ----
  const handleSave = useCallback(async () => {
    if (!name.trim() || !projectId) return;
    setSaving(true);

    try {
      const supabase = createClient();

      // Upload image if provided
      let referenceImageUrl: string | null = null;
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'png';
        const path = `characters/${projectId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('chat-attachments').upload(path, imageFile, { contentType: imageFile.type });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('chat-attachments').getPublicUrl(path);
          referenceImageUrl = urlData?.publicUrl || null;
        }
      }

      const words = name.trim().split(/\s+/);
      const initials = words.map((w) => w[0]?.toUpperCase()).join('').slice(0, 3);

      const { data, error } = await supabase.from('characters').insert({
        project_id: projectId,
        name: name.trim(),
        initials,
        role: role as never,
        description: description.trim() || null,
        personality: personality.trim() || null,
        visual_description: visualDesc.trim() || null,
        prompt_snippet: visualDesc.trim() || null,
        reference_image_url: referenceImageUrl,
      } as never).select('id, name').single();

      if (error) throw error;

      setSaved(true);
      toast.success(`Personaje "${name}" creado`);
      onCreated?.(`Personaje "${(data as Record<string, unknown>)?.name}" creado correctamente.`);
    } catch (err) {
      toast.error(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  }, [name, projectId, role, description, personality, visualDesc, imageFile, onCreated]);

  const isValid = name.trim().length > 0;

  if (saved) {
    return (
      <div className="mt-2 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 flex items-center gap-3">
        <Check size={18} className="text-emerald-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Personaje "{name}" creado</p>
          <p className="text-xs text-muted-foreground capitalize">{role}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
        <Users size={14} className="text-purple-500 shrink-0" />
        <span className="text-sm font-semibold text-foreground">Nuevo personaje</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Image + Name + Role */}
        <div className="flex gap-3">
          <div className="shrink-0">
            {imagePreview ? (
              <div className="relative size-20 rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                <button type="button" onClick={removeImage} className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80">
                  <X size={10} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center size-20 rounded-lg border-2 border-dashed border-border hover:border-teal-500/40 hover:bg-teal-500/5 text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-all">
                <Upload size={16} />
                <span className="text-[9px] mt-0.5">Imagen</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre del personaje"
              className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/50" autoFocus />
            <div className="relative">
              <button type="button" onClick={() => setRoleOpen(!roleOpen)} className="flex items-center justify-between w-full px-3 py-1.5 rounded-md border border-border bg-background text-sm text-foreground">
                <span className="capitalize">{role}</span>
                <ChevronDown size={12} className="text-muted-foreground" />
              </button>
              {roleOpen && (
                <div className="absolute z-10 top-full left-0 right-0 mt-0.5 rounded-md border border-border bg-popover shadow-lg py-0.5">
                  {ROLES.map((r) => (
                    <button key={r} type="button" onClick={() => { setRole(r); setRoleOpen(false); }}
                      className={cn('w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-accent', r === role ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-foreground')}>
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Que hace en la historia</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Chica aventurera que descubre ofertas de verano..." rows={2}
            className="w-full mt-1 px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-teal-500/50" />
        </div>

        {/* Personality + AI assist */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Personalidad</label>
            {name && (
              <button type="button" onClick={suggestPersonality} disabled={!!aiLoading}
                className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-500 disabled:opacity-50">
                {aiLoading === 'personality' ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />} Sugerir
              </button>
            )}
          </div>
          <input type="text" value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="Ej: Alegre, aventurera, espontanea"
            className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal-500/50" />
        </div>

        {/* Visual description + AI assist */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              <ImageIcon size={10} /> Prompt visual (EN)
            </label>
            {name && (
              <button type="button" onClick={suggestVisual} disabled={!!aiLoading}
                className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 hover:text-teal-500 disabled:opacity-50">
                {aiLoading === 'visual' ? <Loader2 size={9} className="animate-spin" /> : <Sparkles size={9} />} Generar
              </button>
            )}
          </div>
          <textarea value={visualDesc} onChange={(e) => setVisualDesc(e.target.value)} placeholder="Ej: young woman 22-27, wavy blonde hair, bright smile, beach outfit" rows={2}
            className="w-full px-3 py-1.5 rounded-md border border-border bg-background text-xs text-foreground font-mono placeholder:text-muted-foreground placeholder:font-sans resize-none focus:outline-none focus:ring-1 focus:ring-teal-500/50" />

          {/* Image analysis helper */}
          {imagePreview && !visualDesc && (
            <div className="mt-1.5 rounded-md border border-border bg-muted/50 p-2">
              <div className="flex items-start gap-2">
                <Info size={11} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Si la IA no puede analizar la imagen, copia este prompt y usalo en ChatGPT/Claude con la imagen:
                  </p>
                  <button type="button" onClick={copyAnalysisPrompt}
                    className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                    {promptCopied ? <Check size={9} className="text-emerald-500" /> : <Copy size={9} />}
                    {promptCopied ? 'Copiado' : 'Copiar prompt de analisis'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-border bg-muted/30">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Cancelar
        </button>
        <button type="button" onClick={handleSave} disabled={!isValid || saving}
          className={cn('flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors',
            isValid && !saving ? 'bg-teal-600 text-white hover:bg-teal-500' : 'bg-muted text-muted-foreground cursor-not-allowed')}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Users size={12} />}
          {saving ? 'Creando...' : 'Crear personaje'}
        </button>
      </div>
    </div>
  );
}
