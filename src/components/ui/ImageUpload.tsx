'use client';

import { useState, useCallback, type DragEvent } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ImageUploadProps {
  onUpload: (file: File) => void;
  maxSize?: number;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

export function ImageUpload({
  onUpload,
  maxSize = 10 * 1024 * 1024,
  accept = 'image/*',
  className,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file.');
        return;
      }

      if (file.size > maxSize) {
        setError(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      onUpload(file);
    },
    [maxSize, onUpload],
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8',
          'transition-colors duration-200 cursor-pointer',
          isDragging
            ? 'border-brand-500 bg-brand-500/5'
            : 'border-foreground-muted/30 bg-surface hover:border-foreground-muted/50',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        {preview ? (
          <img
            src={preview}
            alt="Upload preview"
            className="max-h-48 rounded-md object-contain"
          />
        ) : (
          <>
            <svg
              className="h-10 w-10 text-foreground-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drop an image here, or click to browse
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                Max size: {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          </>
        )}
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>
      {error && (
        <p className="text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
