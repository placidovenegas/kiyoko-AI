'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';
import Typography from '@tiptap/extension-typography';
import {
  Bold,
  CheckSquare,
  Code2,
  Copy,
  FileCode2,
  FileText,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Minus,
  PanelLeft,
  Quote,
  Rows3,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { marked } from 'marked';
import { common, createLowlight } from 'lowlight';
import type { TaskDocumentDensity, TaskDocumentWidth } from '@/lib/tasks/workspace';

interface TaskDocumentEditorProps {
  value: string;
  onChange: (next: { html: string; text: string }) => void;
  onAskAI?: (selection: string, instruction?: string, actionLabel?: string) => Promise<string>;
  isAiLoading?: boolean;
  aiSelectionPreview?: string;
  documentWidth?: TaskDocumentWidth;
  documentDensity?: TaskDocumentDensity;
}

interface CommandPaletteState {
  visible: boolean;
  top: number;
  left: number;
  query: string;
}

interface SlashCommandItem {
  id: string;
  label: string;
  hint: string;
  icon: ReactNode;
  run: (editor: NonNullable<ReturnType<typeof useEditor>>) => void;
}

interface AiActionItem {
  id: string;
  label: string;
  hint: string;
  instruction: string;
  icon: ReactNode;
  shouldShow?: (selection: string) => boolean;
}

type AiApplyMode = 'replace' | 'below' | 'section' | 'copy';

const lowlight = createLowlight(common);

function looksLikeCode(text: string) {
  const sample = text.trim();
  if (!sample) return false;

  return [
    /```[\s\S]*```/m,
    /^(const|let|var|function|class|interface|type|export|import|return)\s/m,
    /[{};=><()[\]]/,
    /<\/?[A-Za-z][^>]*>/,
  ].some((pattern) => pattern.test(sample));
}

function looksLikeMarkdown(text: string) {
  const sample = text.trim();
  if (!sample) return false;

  return [
    /^#{1,6}\s/m,
    /^[-*+]\s/m,
    /^\d+\.\s/m,
    /^>\s/m,
    /```[\s\S]*```/m,
    /\*\*[^*]+\*\*/,
    /_[^_]+_/
    ,/\[[^\]]+\]\([^)]+\)/,
    /^- \[( |x)\]\s/m,
    /^\|.+\|$/m,
  ].some((pattern) => pattern.test(sample));
}

function parseCodeBlock(text: string) {
  const fenced = text.match(/^```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```$/m);
  if (fenced) {
    return {
      language: fenced[1] || null,
      code: fenced[2].trimEnd(),
    };
  }

  return {
    language: null,
    code: text.trimEnd(),
  };
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function ToolbarButton({ active, onPress, children }: { active?: boolean; onPress: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
        onPress();
      }}
      className={active ? 'inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary' : 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'}
    >
      {children}
    </button>
  );
}

export function TaskDocumentEditor({
  value,
  onChange,
  onAskAI,
  isAiLoading = false,
  aiSelectionPreview = '',
  documentWidth = 'default',
  documentDensity = 'comfortable',
}: TaskDocumentEditorProps) {
  const lastAppliedValueRef = useRef(value);
  const toolbarAreaRef = useRef<HTMLDivElement>(null);
  const [selectionText, setSelectionText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ from: number; to: number } | null>(null);
  const [toolbarState, setToolbarState] = useState({ visible: false, top: 0, left: 0 });
  const [commandPalette, setCommandPalette] = useState<CommandPaletteState>({ visible: false, top: 0, left: 0, query: '' });
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [aiApplyMode, setAiApplyMode] = useState<AiApplyMode>('replace');
  const [aiPreview, setAiPreview] = useState<{ text: string; label: string; range: { from: number; to: number } } | null>(null);

  const slashCommands: SlashCommandItem[] = [
    {
      id: 'heading-1',
      label: 'Titulo grande',
      hint: 'Convierte el bloque actual en H1',
      icon: <Heading1 className="h-4 w-4" />,
      run: (currentEditor) => currentEditor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      id: 'heading-2',
      label: 'Subtitulo',
      hint: 'Convierte el bloque actual en H2',
      icon: <Heading2 className="h-4 w-4" />,
      run: (currentEditor) => currentEditor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      id: 'bullet-list',
      label: 'Lista',
      hint: 'Inserta una lista de puntos',
      icon: <List className="h-4 w-4" />,
      run: (currentEditor) => currentEditor.chain().focus().toggleBulletList().run(),
    },
    {
      id: 'ordered-list',
      label: 'Lista numerada',
      hint: 'Inserta una lista ordenada',
      icon: <ListOrdered className="h-4 w-4" />,
      run: (currentEditor) => currentEditor.chain().focus().toggleOrderedList().run(),
    },
    {
      id: 'checklist',
      label: 'Checklist',
      hint: 'Inserta tareas marcables',
      icon: <CheckSquare className="h-4 w-4" />,
      run: (currentEditor) => currentEditor.chain().focus().toggleTaskList().run(),
    },
    {
      id: 'quote',
      label: 'Cita',
      hint: 'Destaca una nota o idea',
      icon: <Quote className="h-4 w-4" />,
      run: (currentEditor) => currentEditor.chain().focus().toggleBlockquote().run(),
    },
    {
      id: 'code',
      label: 'Codigo',
      hint: 'Inserta un bloque de codigo',
      icon: <Code2 className="h-4 w-4" />,
      run: (currentEditor) => currentEditor.chain().focus().toggleCodeBlock().run(),
    },
    {
      id: 'divider',
      label: 'Separador',
      hint: 'Añade una linea divisoria',
      icon: <Minus className="h-4 w-4" />,
      run: (currentEditor) => currentEditor.chain().focus().setHorizontalRule().run(),
    },
  ];

  const aiActions: AiActionItem[] = useMemo(
    () => [
      {
        id: 'improve-writing',
        label: 'Mejorar redaccion',
        hint: 'Mas claro, elegante y util',
        instruction: 'Mejora la redaccion manteniendo el significado y hazlo mas claro, natural y profesional.',
        icon: <WandSparkles className="h-4 w-4" />,
      },
      {
        id: 'summarize',
        label: 'Resumir',
        hint: 'Extrae lo esencial',
        instruction: 'Resume este contenido en una version mas corta, accionable y facil de leer.',
        icon: <FileText className="h-4 w-4" />,
      },
      {
        id: 'simplify',
        label: 'Simplificar',
        hint: 'Lenguaje mas simple',
        instruction: 'Reescribe este contenido con un lenguaje mas simple, directo y facil de entender.',
        icon: <Sparkles className="h-4 w-4" />,
      },
      {
        id: 'extend',
        label: 'Expandir',
        hint: 'Añade mas detalle util',
        instruction: 'Amplia este contenido con mas detalle, contexto y estructura sin perder claridad.',
        icon: <ListOrdered className="h-4 w-4" />,
      },
      {
        id: 'fix-grammar',
        label: 'Corregir',
        hint: 'Ortografia y gramatica',
        instruction: 'Corrige ortografia, puntuacion y gramatica manteniendo el tono original.',
        icon: <CheckSquare className="h-4 w-4" />,
      },
      {
        id: 'explain-code',
        label: 'Explicar codigo',
        hint: 'Desglosa lo que hace',
        instruction: 'Explica este codigo paso a paso, que hace, sus riesgos y posibles mejoras.',
        icon: <FileCode2 className="h-4 w-4" />,
        shouldShow: looksLikeCode,
      },
      {
        id: 'document-code',
        label: 'Documentar codigo',
        hint: 'Resumen tecnico y documentacion',
        instruction: 'Documenta este codigo de forma breve y tecnica, resaltando entradas, salidas y comportamiento.',
        icon: <Code2 className="h-4 w-4" />,
        shouldShow: looksLikeCode,
      },
      {
        id: 'generate-tasks',
        label: 'Sugerir tareas',
        hint: 'Que falta por hacer, proximos pasos',
        instruction: 'Analiza el contenido y el contexto del proyecto/video. Genera una lista de tareas pendientes, cosas que faltan o proximos pasos concretos. Formato: lista con viñetas, cada item accionable y especifico.',
        icon: <CheckSquare className="h-4 w-4" />,
      },
      {
        id: 'convert-checklist',
        label: 'Convertir a checklist',
        hint: 'Transforma en lista de tareas',
        instruction: 'Convierte este contenido en una checklist estructurada con items accionables. Cada item debe ser claro, concreto y verificable.',
        icon: <List className="h-4 w-4" />,
      },
    ],
    [],
  );

  const filteredCommands = useMemo(() => {
    const query = commandPalette.query.trim().toLowerCase();
    if (!query) return slashCommands;
    return slashCommands.filter((item) => item.label.toLowerCase().includes(query) || item.hint.toLowerCase().includes(query));
  }, [commandPalette.query]);

  const visibleAiActions = useMemo(() => {
    return aiActions.filter((action) => !action.shouldShow || action.shouldShow(selectionText));
  }, [aiActions, selectionText]);

  function closeCommandPalette() {
    setCommandPalette((current) => ({ ...current, visible: false, query: '' }));
  }

  function closeAiMenu() {
    setAiMenuOpen(false);
    setAiCustomPrompt('');
  }

  function runSlashCommand(command: SlashCommandItem, currentEditor: NonNullable<ReturnType<typeof useEditor>>) {
    command.run(currentEditor);
    closeCommandPalette();
  }

  function buildAiHtml(text: string, sectionTitle?: string) {
    if (looksLikeCode(text)) {
      const { language, code } = parseCodeBlock(text);
      const codeHtml = `<pre><code class="language-${language ?? 'plaintext'}">${escapeHtml(code)}</code></pre>`;
      return sectionTitle ? `<section><h2>${sectionTitle}</h2>${codeHtml}</section>` : codeHtml;
    }

    if (looksLikeMarkdown(text)) {
      const markdownHtml = marked.parse(text, { gfm: true, breaks: true }) as string;
      return sectionTitle ? `<section><h2>${sectionTitle}</h2>${markdownHtml}</section>` : markdownHtml;
    }

    const paragraphs = text
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
      .join('');

    return sectionTitle ? `<section><h2>${sectionTitle}</h2>${paragraphs}</section>` : paragraphs;
  }

  async function applyAiResult(currentEditor: NonNullable<ReturnType<typeof useEditor>>, result: string, actionLabel?: string, mode: AiApplyMode = aiApplyMode) {
    const range = selectionRange ?? {
      from: currentEditor.state.selection.from,
      to: currentEditor.state.selection.to,
    };

    if (mode === 'copy') {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(result);
      }
      return;
    }

    const html = buildAiHtml(result, mode === 'section' ? actionLabel : undefined);

    if (mode === 'replace') {
      currentEditor.chain().focus().insertContentAt(range, html).run();
      return;
    }

    currentEditor.chain().focus().insertContentAt(range.to, `<p></p>${html}`).run();
  }

  function updateToolbarPosition(currentEditor: NonNullable<ReturnType<typeof useEditor>>) {
    const { from, to, empty } = currentEditor.state.selection;
    if (empty) {
      setSelectionText('');
      setSelectionRange(null);
      setToolbarState((current) => ({ ...current, visible: false }));
      closeAiMenu();
      return;
    }

    setSelectionText(currentEditor.state.doc.textBetween(from, to, '\n').trim());
    setSelectionRange({ from, to });

    const start = currentEditor.view.coordsAtPos(from);
    const end = currentEditor.view.coordsAtPos(to);
    const left = (start.left + end.right) / 2;
    const top = Math.max(start.top - 58, 16);

    setToolbarState({ visible: true, left, top });
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({
        placeholder: 'Escribe notas, prompts, decisiones, checklist o cualquier idea que quieras guardar.',
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'task-editor-link',
          rel: 'noopener noreferrer nofollow',
        },
      }),
      Typography,
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'task-editor-codeblock',
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'task-editor-content min-h-[60vh] px-1 py-6 text-[15px] leading-7 text-foreground outline-none prose prose-sm max-w-none prose-headings:mb-3 prose-headings:mt-7 prose-headings:text-foreground prose-p:my-2 prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-blockquote:border-l-primary/30 prose-blockquote:text-muted-foreground prose-ul:my-3 prose-ol:my-3 prose-code:rounded prose-code:bg-accent prose-code:px-1.5 prose-code:py-0.5 prose-code:text-[13px] prose-code:text-foreground prose-pre:rounded-xl prose-pre:border prose-pre:border-border prose-pre:bg-background prose-hr:border-border',
      },
      handleDrop: () => false,
      handlePaste: (_view, event) => {
        const clipboard = event.clipboardData;
        if (!clipboard) return false;

        const html = clipboard.getData('text/html');
        const text = clipboard.getData('text/plain');

        if (html) return false;

        if (looksLikeCode(text) && !looksLikeMarkdown(text.replace(/```[\s\S]*```/m, ''))) {
          event.preventDefault();
          const parsed = parseCodeBlock(text);
          editor?.chain().focus().insertContent({
            type: 'codeBlock',
            attrs: parsed.language ? { language: parsed.language } : {},
            content: [{ type: 'text', text: parsed.code }],
          }).run();
          return true;
        }

        if (!looksLikeMarkdown(text)) return false;

        event.preventDefault();
        const rendered = marked.parse(text, { gfm: true, breaks: true }) as string;
        editor?.commands.insertContent(rendered);
        return true;
      },
      handleKeyDown: (view, event) => {
        if (commandPalette.visible) {
          if (event.key === 'Escape') {
            event.preventDefault();
            closeCommandPalette();
            return true;
          }

          if (event.key === 'Backspace') {
            event.preventDefault();
            setCommandPalette((current) => {
              const nextQuery = current.query.slice(0, -1);
              if (!nextQuery) return { ...current, query: '', visible: false };
              return { ...current, query: nextQuery };
            });
            return true;
          }

          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveCommandIndex((current) => (current + 1) % Math.max(filteredCommands.length, 1));
            return true;
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveCommandIndex((current) => (current - 1 + Math.max(filteredCommands.length, 1)) % Math.max(filteredCommands.length, 1));
            return true;
          }

          if (event.key === 'Enter') {
            event.preventDefault();
            const selected = filteredCommands[activeCommandIndex] ?? filteredCommands[0];
            if (selected && editor) runSlashCommand(selected, editor);
            return true;
          }

          if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
            event.preventDefault();
            setCommandPalette((current) => ({ ...current, query: `${current.query}${event.key}` }));
            return true;
          }
        }

        if (event.key === '/' && view.state.selection.empty) {
          const coords = view.coordsAtPos(view.state.selection.from);
          setCommandPalette({ visible: true, query: '', left: coords.left, top: coords.top + 28 });
          setActiveCommandIndex(0);
          event.preventDefault();
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const text = currentEditor.getText();
      lastAppliedValueRef.current = html;
      onChange({ html, text });
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      updateToolbarPosition(currentEditor);
    },
    onBlur: ({ event }) => {
      const related = (event as FocusEvent).relatedTarget as Node | null;
      if (related && toolbarAreaRef.current?.contains(related)) return;
      setTimeout(() => {
        if (toolbarAreaRef.current?.contains(document.activeElement)) return;
        setSelectionText('');
        setSelectionRange(null);
        setToolbarState((current) => ({ ...current, visible: false }));
        closeCommandPalette();
        closeAiMenu();
      }, 150);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value === lastAppliedValueRef.current) return;

    editor.commands.setContent(value, { emitUpdate: false });
    lastAppliedValueRef.current = value;
  }, [editor, value]);

  async function handleAiAction(action: AiActionItem) {
    if (!editor || !selectionText.trim() || !onAskAI || isAiLoading) return;
    const range = selectionRange ?? { from: editor.state.selection.from, to: editor.state.selection.to };
    try {
      const result = await onAskAI(selectionText.trim(), action.instruction, action.label);
      if (result.trim()) {
        setAiPreview({ text: result.trim(), label: action.label, range });
      }
    } finally {
      closeAiMenu();
    }
  }

  async function handleCustomPrompt() {
    if (!editor || !selectionText.trim() || !aiCustomPrompt.trim() || !onAskAI || isAiLoading) return;
    const range = selectionRange ?? { from: editor.state.selection.from, to: editor.state.selection.to };
    try {
      const result = await onAskAI(selectionText.trim(), aiCustomPrompt.trim(), 'Prompt libre');
      if (result.trim()) {
        setAiPreview({ text: result.trim(), label: 'Prompt libre', range });
      }
    } finally {
      closeAiMenu();
    }
  }

  async function acceptAiPreview() {
    if (!editor || !aiPreview) return;
    await applyAiResult(editor, aiPreview.text, aiPreview.label, aiApplyMode);
    setAiPreview(null);
  }

  function discardAiPreview() {
    setAiPreview(null);
  }

  return (
    <>
      {editor && toolbarState.visible ? (
        <div ref={toolbarAreaRef} className="fixed z-50 -translate-x-1/2" style={{ top: toolbarState.top, left: toolbarState.left }}>
          <div className="flex items-center gap-1 rounded-2xl border border-border bg-card/95 p-1.5 shadow-xl backdrop-blur">
            <ToolbarButton active={editor.isActive('bold')} onPress={() => editor.chain().focus().toggleBold().run()}>
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('italic')} onPress={() => editor.chain().focus().toggleItalic().run()}>
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('heading', { level: 1 })} onPress={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
              <Heading1 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('heading', { level: 2 })} onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
              <Heading2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('bulletList')} onPress={() => editor.chain().focus().toggleBulletList().run()}>
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('orderedList')} onPress={() => editor.chain().focus().toggleOrderedList().run()}>
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('blockquote')} onPress={() => editor.chain().focus().toggleBlockquote().run()}>
              <Quote className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton active={editor.isActive('codeBlock')} onPress={() => editor.chain().focus().toggleCodeBlock().run()}>
              <Code2 className="h-4 w-4" />
            </ToolbarButton>
            {onAskAI ? (
              <Button size="sm" variant="flat" color="primary" className="ml-1 rounded-xl" isDisabled={isAiLoading || !selectionText} onPress={() => setAiMenuOpen((current) => !current)}>
                {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isAiLoading ? 'Pensando' : 'IA'}
              </Button>
            ) : null}
          </div>

          {aiMenuOpen && onAskAI ? (
            <div className="task-ai-menu-card mt-2 w-[min(92vw,440px)] rounded-[22px] border border-border bg-card/98 p-3 shadow-2xl backdrop-blur" onMouseDown={(event) => event.preventDefault()}>
              <div className="flex items-center justify-between gap-3 px-1 pb-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Menu</p>
                  <p className="text-xs text-muted-foreground">Acciones contextuales aplicadas directamente sobre la seleccion.</p>
                </div>
                <button type="button" onMouseDown={(event) => { event.preventDefault(); closeAiMenu(); }} className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-accent hover:text-foreground">
                  Cerrar
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'replace', label: 'Reemplazar', icon: <Sparkles className="h-3.5 w-3.5" /> },
                  { value: 'below', label: 'Debajo', icon: <Rows3 className="h-3.5 w-3.5" /> },
                  { value: 'section', label: 'Seccion', icon: <PanelLeft className="h-3.5 w-3.5" /> },
                  { value: 'copy', label: 'Copiar', icon: <Copy className="h-3.5 w-3.5" /> },
                ].map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      setAiApplyMode(mode.value as AiApplyMode);
                    }}
                    className={aiApplyMode === mode.value ? 'inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary' : 'inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground'}
                  >
                    {mode.icon}
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {visibleAiActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      void handleAiAction(action);
                    }}
                    disabled={isAiLoading}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-background/80 px-3 py-3 text-left transition hover:border-primary/35 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="mt-0.5 text-primary">{action.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-foreground">{action.label}</span>
                      <span className="block text-xs leading-5 text-muted-foreground">{action.hint}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 rounded-2xl border border-border bg-background/80 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Prompt libre</p>
                <textarea
                  value={aiCustomPrompt}
                  onChange={(event) => setAiCustomPrompt(event.target.value)}
                  placeholder="Pide algo especifico: conviertelo en brief, documenta este codigo, resume en checklist..."
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary/45 focus:ring-2 focus:ring-primary/20"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onPress={closeAiMenu}>Cancelar</Button>
                  <Button size="sm" color="primary" isDisabled={isAiLoading || !aiCustomPrompt.trim()} onPress={() => void handleCustomPrompt()}>
                    {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Ejecutar
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {editor && commandPalette.visible ? (
        <div className="fixed z-50 w-72 overflow-hidden rounded-2xl border border-border bg-card/98 shadow-2xl backdrop-blur" style={{ top: commandPalette.top, left: commandPalette.left }}>
          <div className="border-b border-border px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Comandos</div>
          <div className="max-h-72 overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="rounded-xl px-3 py-2 text-sm text-muted-foreground">No hay coincidencias para {commandPalette.query}</div>
            ) : (
              filteredCommands.map((command, index) => (
                <button
                  key={command.id}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    if (editor) runSlashCommand(command, editor);
                  }}
                  className={index === activeCommandIndex ? 'flex w-full items-start gap-3 rounded-xl bg-accent px-3 py-2 text-left transition-colors' : 'flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-accent'}
                >
                  <span className="mt-0.5 text-muted-foreground">{command.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-foreground">{command.label}</span>
                    <span className="block text-xs leading-5 text-muted-foreground">{command.hint}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* AI loading indicator */}
      {isAiLoading && aiSelectionPreview ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
          <p className="min-w-0 truncate text-muted-foreground">La IA esta trabajando...</p>
        </div>
      ) : null}

      {/* AI preview — shows result before applying */}
      {aiPreview ? (
        <div className="mt-3 rounded-xl border border-primary/25 bg-primary/5">
          <div className="flex items-center justify-between border-b border-primary/15 px-4 py-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">{aiPreview.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={discardAiPreview} className="rounded-md px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">Descartar</button>
              <button type="button" onClick={() => void acceptAiPreview()} className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90">Sustituir</button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto px-4 py-3 text-sm leading-6 text-foreground whitespace-pre-wrap">
            {aiPreview.text}
          </div>
        </div>
      ) : null}

      <div className={`task-editor-frame task-editor-frame--${documentWidth} task-editor-frame--${documentDensity}`}>
        <EditorContent editor={editor} />
      </div>
    </>
  );
}