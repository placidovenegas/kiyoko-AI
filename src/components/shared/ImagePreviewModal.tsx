'use client';

import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  File,
  FileImage,
  FileText,
  Loader2,
  Music4,
  RotateCcw,
  Video,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PreviewItem {
  id?: string;
  url: string;
  name: string;
  type: string;
  size?: number;
}

interface ImagePreviewModalProps {
  files: PreviewItem[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

type PreviewKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'other';

function getPreviewKind(file: PreviewItem): PreviewKind {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  if (
    file.type.startsWith('text/') ||
    file.type.includes('json') ||
    file.type.includes('xml') ||
    file.type.includes('javascript') ||
    file.type.includes('markdown')
  ) {
    return 'text';
  }

  return 'other';
}

function formatFileSize(size?: number) {
  if (!size) return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function PreviewTypeIcon({ kind }: { kind: PreviewKind }) {
  switch (kind) {
    case 'image':
      return <FileImage className="size-4" />;
    case 'pdf':
    case 'text':
      return <FileText className="size-4" />;
    case 'video':
      return <Video className="size-4" />;
    case 'audio':
      return <Music4 className="size-4" />;
    default:
      return <File className="size-4" />;
  }
}

function TextDocumentPreview({ url }: { url: string }) {
  const [textPreview, setTextPreview] = useState('');
  const [textLoading, setTextLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo cargar el documento');
        }

        return response.text();
      })
      .then((content) => {
        setTextPreview(content);
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name === 'AbortError') {
          return;
        }

        setTextPreview('No se pudo renderizar este documento en vista previa. Usa abrir en pestaña o descargar.');
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setTextLoading(false);
        }
      });

    return () => controller.abort();
  }, [url]);

  return (
    <div className="h-[78vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90">
      {textLoading ? (
        <div className="flex h-full items-center justify-center gap-3 text-sm text-white/70">
          <Loader2 className="size-4 animate-spin" />
          Cargando documento...
        </div>
      ) : (
        <pre className="h-full overflow-auto whitespace-pre-wrap px-5 py-4 font-mono text-xs leading-6 text-white/80">
          {textPreview}
        </pre>
      )}
    </div>
  );
}

export function ImagePreviewModal({ files, initialIndex, open, onClose }: ImagePreviewModalProps) {
  const [index, setIndex] = useState(() => initialIndex);
  const [zoom, setZoom] = useState(1);

  const current = files[index];
  const currentKind = useMemo(() => (current ? getPreviewKind(current) : 'other'), [current]);
  const hasPrev = index > 0;
  const hasNext = index < files.length - 1;

  const prev = useCallback(() => {
    if (hasPrev) {
      setIndex((currentIndex) => currentIndex - 1);
      setZoom(1);
    }
  }, [hasPrev]);

  const next = useCallback(() => {
    if (hasNext) {
      setIndex((currentIndex) => currentIndex + 1);
      setZoom(1);
    }
  }, [hasNext]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') prev();
      if (event.key === 'ArrowRight') next();
      if (currentKind === 'image' && (event.key === '+' || event.key === '=')) setZoom((value) => Math.min(value + 0.25, 4));
      if (currentKind === 'image' && event.key === '-') setZoom((value) => Math.max(value - 0.25, 0.5));
      if (currentKind === 'image' && event.key === '0') setZoom(1);
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentKind, next, onClose, open, prev]);

  if (!open || !current) return null;

  const fileSize = formatFileSize(current.size);

  function renderPreview() {
    if (currentKind === 'image') {
      return (
        <div className="relative flex min-h-[70vh] w-full min-w-[320px] items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-black/40 p-6">
          <Image
            src={current.url}
            alt={current.name}
            width={1800}
            height={1800}
            unoptimized
            className="max-h-[78vh] w-auto max-w-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        </div>
      );
    }

    if (currentKind === 'pdf') {
      return (
        <div className="h-[78vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-white">
          <iframe src={current.url} title={current.name} className="h-full w-full" />
        </div>
      );
    }

    if (currentKind === 'video') {
      return (
        <div className="flex h-[78vh] w-full items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-6">
          <video src={current.url} controls className="max-h-full max-w-full rounded-xl" />
        </div>
      );
    }

    if (currentKind === 'audio') {
      return (
        <div className="flex h-[78vh] w-full flex-col items-center justify-center gap-6 rounded-2xl border border-white/10 bg-black/40 p-8 text-white">
          <div className="flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80">
            <Music4 className="size-8" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium">{current.name}</p>
            {fileSize ? <p className="mt-1 text-sm text-white/45">{fileSize}</p> : null}
          </div>
          <audio src={current.url} controls className="w-full max-w-2xl" />
        </div>
      );
    }

    if (currentKind === 'text') {
      return (
        <TextDocumentPreview key={current.url} url={current.url} />
      );
    }

    return (
      <div className="flex h-[78vh] w-full flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-white/15 bg-black/30 p-8 text-center text-white">
        <div className="flex size-20 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80">
          <File className="size-8" />
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium">Vista previa no disponible</p>
          <p className="max-w-lg text-sm text-white/55">Este formato no se puede renderizar dentro del modal. Puedes abrirlo en una pestaña nueva o descargarlo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-220 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />

      <div className="relative z-10 flex h-full w-full flex-col px-4 py-4 lg:px-8 lg:py-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white shadow-2xl backdrop-blur-xl lg:px-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-sm text-white/75">
              <PreviewTypeIcon kind={currentKind} />
              <span className="truncate">{current.name}</span>
              <span className="text-white/35">{index + 1} / {files.length}</span>
              {fileSize ? <span className="hidden text-white/35 sm:inline">{fileSize}</span> : null}
            </div>
            <p className="mt-1 text-xs text-white/35">{current.type || 'Archivo'}</p>
          </div>

          <div className="flex items-center gap-1">
            {currentKind === 'image' ? (
              <>
                <button type="button" onClick={() => setZoom((value) => Math.max(value - 0.25, 0.5))} className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
                  <ZoomOut className="size-4" />
                </button>
                <span className="min-w-12 text-center text-xs text-white/50">{Math.round(zoom * 100)}%</span>
                <button type="button" onClick={() => setZoom((value) => Math.min(value + 0.25, 4))} className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
                  <ZoomIn className="size-4" />
                </button>
                <button type="button" onClick={() => setZoom(1)} className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
                  <RotateCcw className="size-4" />
                </button>
              </>
            ) : null}

            <a href={current.url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
              <ExternalLink className="size-4" />
            </a>
            <a href={current.url} download={current.name} className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
              <Download className="size-4" />
            </a>
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="relative mt-4 flex min-h-0 flex-1 items-center justify-center">
          {hasPrev ? (
            <button type="button" onClick={prev} className="absolute left-0 z-10 rounded-full border border-white/10 bg-black/40 p-3 text-white/80 transition hover:bg-black/60 hover:text-white lg:left-3">
              <ChevronLeft className="size-6" />
            </button>
          ) : null}

          <div className="mx-auto flex h-full w-full max-w-[min(1800px,100%)] items-center justify-center px-12 lg:px-20">
            {renderPreview()}
          </div>

          {hasNext ? (
            <button type="button" onClick={next} className="absolute right-0 z-10 rounded-full border border-white/10 bg-black/40 p-3 text-white/80 transition hover:bg-black/60 hover:text-white lg:right-3">
              <ChevronRight className="size-6" />
            </button>
          ) : null}
        </div>

        {files.length > 1 ? (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 px-3 py-3 backdrop-blur-xl">
            {files.map((file, fileIndex) => {
              const kind = getPreviewKind(file);

              return (
                <button
                  key={file.id ?? file.url}
                  type="button"
                  onClick={() => {
                    setIndex(fileIndex);
                    setZoom(1);
                  }}
                  className={cn(
                    'group flex shrink-0 items-center gap-3 rounded-xl border px-2.5 py-2 text-left transition',
                    fileIndex === index
                      ? 'border-white/70 bg-white/10 text-white'
                      : 'border-white/10 bg-black/20 text-white/70 hover:border-white/30 hover:bg-white/5'
                  )}
                >
                  {kind === 'image' ? (
                    <Image src={file.url} alt={file.name} width={48} height={48} unoptimized className="size-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex size-12 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                      <PreviewTypeIcon kind={kind} />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="max-w-44 truncate text-xs font-medium">{file.name}</p>
                    <p className="mt-0.5 text-[11px] text-white/40">{kind.toUpperCase()}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
