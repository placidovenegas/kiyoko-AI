'use client';

import { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { Camera, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface AvatarUploadProps {
  src?: string | null;
  fallback: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  storagePath: string;
  onUploaded: (url: string, path: string) => void;
  onRemoved?: () => void;
  disabled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-10 w-10 text-xs',
  md: 'h-16 w-16 text-sm',
  lg: 'h-24 w-24 text-lg',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function AvatarUpload({
  src,
  fallback,
  color = '#6B7280',
  size = 'md',
  storagePath,
  onUploaded,
  onRemoved,
  disabled,
  className,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${storagePath}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('project-assets')
        .upload(path, file, { cacheControl: '3600', upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from('project-assets').getPublicUrl(path);
      onUploaded(publicUrl, path);
      toast.success('Imagen actualizada');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(`Error al subir: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setUploading(false);
    }
  }, [storagePath, onUploaded]);

  return (
    <div className={cn('group relative inline-flex', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = '';
        }}
      />

      {/* Avatar */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        aria-label="Cambiar imagen"
        className={cn(
          'relative flex items-center justify-center rounded-full font-bold text-white transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          sizeClasses[size],
        )}
        style={!src ? { backgroundColor: color } : undefined}
      >
        {uploading ? (
          <Loader2 className={cn('animate-spin', iconSizes[size])} />
        ) : src ? (
          <img src={src} alt={fallback} className={cn('rounded-full object-cover', sizeClasses[size])} />
        ) : (
          fallback.slice(0, 2).toUpperCase()
        )}

        {/* Hover overlay */}
        <div className={cn(
          'absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition',
          'group-hover:opacity-100',
        )}>
          <Camera className={cn('text-white', iconSizes[size])} />
        </div>
      </button>

      {/* Remove button */}
      {src && onRemoved && !disabled && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemoved(); }}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
          aria-label="Eliminar imagen"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
