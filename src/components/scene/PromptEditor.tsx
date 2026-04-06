'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from '@/components/ui/input-group';
import { CopyButton } from '@/components/ui/CopyButton';
import {
  Sparkles,
  Pencil,
  Save,
  X,
  Languages,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Tooltip } from '@heroui/react';

interface PromptEditorProps {
  label: string;
  value: string;
  onSave?: (newValue: string) => void;
  onImprove?: () => void;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PromptEditor({
  label,
  value,
  onSave,
  onImprove,
  readOnly,
  disabled,
  className,
}: PromptEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const handleEdit = useCallback(() => {
    setEditValue(value);
    setIsEditing(true);
  }, [value]);

  const handleSave = useCallback(() => {
    if (onSave && editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  }, [editValue, value, onSave]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleTranslate = useCallback(async () => {
    if (showTranslation && translation) {
      setShowTranslation(false);
      return;
    }

    setTranslating(true);
    setShowTranslation(true);

    try {
      // Try Chrome Translator API first
      if ('Translator' in window) {
        const translator = await (window as Record<string, unknown> & { Translator: { create: (opts: { sourceLanguage: string; targetLanguage: string }) => Promise<{ translate: (text: string) => Promise<string> }> } }).Translator.create({
          sourceLanguage: 'en',
          targetLanguage: 'es',
        });
        const result = await translator.translate(value);
        setTranslation(result);
      } else {
        setTranslation('Chrome Translator API no disponible. Usa Chrome 131+ con la API activada.');
      }
    } catch {
      setTranslation('Error al traducir. Chrome Translator API no disponible.');
    } finally {
      setTranslating(false);
    }
  }, [value, showTranslation, translation]);

  if (!value && !isEditing) {
    return null;
  }

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {!isEditing && (
          <div className="flex items-center gap-0.5">
            <CopyButton
              text={value}
              className="h-7 px-2 text-[11px] opacity-60 hover:opacity-100"
            />
            <Tooltip>
              <Tooltip.Trigger>
                <button
                  type="button"
                  onClick={handleTranslate}
                  disabled={disabled || translating}
                  aria-label="Traducir prompt al espanol"
                  className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Languages className="h-3 w-3" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content>{showTranslation ? 'Ocultar traduccion' : 'Traducir al espanol'}</Tooltip.Content>
            </Tooltip>
            {onImprove && (
              <Tooltip>
                <Tooltip.Trigger>
                  <button
                    type="button"
                    onClick={onImprove}
                    disabled={disabled}
                    aria-label="Mejorar prompt con IA"
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-scene-filler transition-colors hover:bg-scene-filler/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Sparkles className="h-3 w-3" /> IA
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content>Mejorar con IA</Tooltip.Content>
              </Tooltip>
            )}
            {onSave && !readOnly && (
              <Tooltip>
                <Tooltip.Trigger>
                  <button
                    type="button"
                    onClick={handleEdit}
                    disabled={disabled}
                    aria-label={`Editar ${label}`}
                    className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </Tooltip.Trigger>
                <Tooltip.Content>Editar</Tooltip.Content>
              </Tooltip>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {isEditing ? (
        <div className="space-y-2">
          <InputGroup className="h-auto">
            <InputGroupTextarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={4}
              aria-label={`Editar ${label}`}
              className="font-mono text-xs leading-relaxed text-muted-foreground"
            />
          </InputGroup>
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-card"
            >
              <X className="h-3 w-3" /> Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-primary/90"
            >
              <Save className="h-3 w-3" /> Guardar
            </button>
          </div>
        </div>
      ) : (
        <>
          <pre className="whitespace-pre-wrap wrap-break-word rounded-lg bg-secondary px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            <code>{value}</code>
          </pre>

          {/* Translation */}
          {showTranslation && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Traduccion (referencia)
                </span>
                <button
                  type="button"
                  onClick={() => setShowTranslation(false)}
                  aria-label="Ocultar traduccion"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
              </div>
              {translating ? (
                <p className="text-xs text-muted-foreground">Traduciendo...</p>
              ) : (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {translation}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
