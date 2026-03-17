'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface UploadOptions {
  bucket: string;
  path: string;
  maxSizeMB?: number;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const supabase = createClient();

  async function upload(
    file: File,
    options: UploadOptions
  ): Promise<string | null> {
    const { bucket, path, maxSizeMB = 50 } = options;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`El archivo supera el límite de ${maxSizeMB}MB`);
      return null;
    }

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${path}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      setProgress(100);
      toast.success('Imagen subida correctamente');
      return urlData.publicUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error subiendo imagen');
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function remove(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      toast.error('Error eliminando imagen');
      throw error;
    }
    toast.success('Imagen eliminada');
  }

  return { upload, remove, uploading, progress };
}
