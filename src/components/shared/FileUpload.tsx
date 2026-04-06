'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { File as FileIcon, Loader2, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { logClientError, logClientWarning } from '@/lib/observability/logger';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';

/* ─── Types ─── */

export interface UploadedFile {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

interface FileUploadProps {
  bucket: string;
  path: string;
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
  previews?: boolean;
  layout?: 'grid' | 'list';
  compact?: boolean;
  label?: string;
  disabled?: boolean;
}

/* ─── Helpers ─── */

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type: string) {
  return type.startsWith('image/');
}

/* ─── Component ─── */

export function FileUpload({
  bucket,
  path,
  files,
  onChange,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024,
  maxFiles = 10,
  previews = true,
  layout = 'grid',
  compact = false,
  label,
  disabled = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const openFilePreview = useUIStore((state) => state.openFilePreview);

  const upload = useCallback(async (fileList: FileList | File[]) => {
    const toUpload = Array.from(fileList);

    if (files.length + toUpload.length > maxFiles) {
      toast.error(`Maximo ${maxFiles} archivos`);
      return;
    }

    const oversized = toUpload.find((f) => f.size > maxSize);
    if (oversized) {
      toast.error(`${oversized.name} supera ${formatFileSize(maxSize)}`);
      return;
    }

    setUploading(true);
    const uploaded: UploadedFile[] = [];

    for (const file of toUpload) {
      try {
        const ext = file.name.split('.').pop() ?? 'bin';
        const storagePath = `${path}/${crypto.randomUUID()}.${ext}`;
        const payload = new FormData();
        payload.append('bucket', bucket);
        payload.append('path', storagePath);
        payload.append('file', file);

        const res = await fetch('/api/storage/object', {
          method: 'POST',
          body: payload,
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string; requestId?: string; details?: string } | null;
          logClientWarning('FileUpload', 'Upload request failed', {
            fileName: file.name,
            status: res.status,
            requestId: body?.requestId,
            details: body?.details,
          });
          toast.error(body?.error ?? `Error subiendo ${file.name}`);
          continue;
        }

        const body = (await res.json()) as { file?: UploadedFile; requestId?: string };
        if (!body.file) {
          logClientWarning('FileUpload', 'Upload response missing file payload', {
            fileName: file.name,
            requestId: body.requestId,
          });
          toast.error(`Respuesta invalida al subir ${file.name}`);
          continue;
        }

        uploaded.push(body.file);
      } catch (err) {
        logClientError('FileUpload', err, { fileName: file.name, bucket, path });
        toast.error(`Error subiendo ${file.name}`);
      }
    }

    if (uploaded.length > 0) {
      onChange([...files, ...uploaded]);
      toast.success(uploaded.length === 1 ? 'Archivo subido' : `${uploaded.length} archivos subidos`);
    }

    setUploading(false);
  }, [bucket, files, maxFiles, maxSize, onChange, path]);

  const remove = useCallback(async (fileId: string) => {
    onChange(files.filter((f) => f.id !== fileId));
    try {
      const response = await fetch('/api/storage/object', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucket, path: fileId }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string; requestId?: string; details?: string } | null;
        logClientWarning('FileUpload', 'Delete request failed', {
          fileId,
          status: response.status,
          requestId: body?.requestId,
          details: body?.details,
        });
      }
    } catch (error) {
      logClientError('FileUpload', error, { fileId, bucket });
    }
  }, [bucket, files, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
  }, [disabled, upload, uploading]);

  function openPreview(file: UploadedFile) {
    const idx = files.findIndex((item) => item.id === file.id);
    if (idx >= 0) {
      openFilePreview(files, idx);
    }
  }

  const atLimit = files.length >= maxFiles;

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      {!atLimit && (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed transition-colors',
            compact ? 'px-3 py-2.5' : 'px-4 py-5',
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          {uploading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <Upload className="size-4 text-muted-foreground" />}
          <span className="text-xs text-muted-foreground">{uploading ? 'Subiendo...' : label ?? (compact ? 'Subir archivo' : 'Arrastra o haz click')}</span>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            className="hidden"
            disabled={disabled || uploading}
            onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ''; }}
          />
        </div>
      )}

      {/* Grid layout */}
      {files.length > 0 && layout === 'grid' && (
        <div className="grid grid-cols-2 gap-1.5">
          {files.map((file) => (
            <div key={file.id} className="group relative overflow-hidden rounded-lg border border-border">
              {previews && isImage(file.type) ? (
                <Image
                  src={file.url}
                  alt={file.name}
                  width={320}
                  height={320}
                  unoptimized
                  className="aspect-square w-full cursor-pointer object-cover"
                  onClick={() => openPreview(file)}
                />
              ) : (
                <button type="button" onClick={() => openPreview(file)} className="flex aspect-square w-full items-center justify-center bg-accent/30 transition hover:bg-accent/45"><FileIcon className="size-6 text-muted-foreground" /></button>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4">
                <p className="truncate text-[10px] text-white">{file.name}</p>
              </div>
              <button type="button" onClick={() => void remove(file.id)} className="absolute right-1 top-1 rounded-md bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"><X className="size-3" /></button>
            </div>
          ))}
        </div>
      )}

      {/* List layout */}
      {files.length > 0 && layout === 'list' && (
        <div className="space-y-1">
          {files.map((file) => (
            <div key={file.id} className="group flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5">
              {previews && isImage(file.type) ? (
                <Image
                  src={file.url}
                  alt={file.name}
                  width={32}
                  height={32}
                  unoptimized
                  className="size-8 shrink-0 cursor-pointer rounded object-cover"
                  onClick={() => openPreview(file)}
                />
              ) : (
                <button type="button" onClick={() => openPreview(file)} className="shrink-0 rounded text-muted-foreground transition hover:text-foreground"><FileIcon className="size-4 shrink-0" /></button>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-foreground">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
              </div>
              <button type="button" onClick={() => void remove(file.id)} className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition hover:text-foreground group-hover:opacity-100"><Trash2 className="size-3" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
