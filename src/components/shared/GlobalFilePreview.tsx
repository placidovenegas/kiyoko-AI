'use client';

import { ImagePreviewModal } from '@/components/shared/ImagePreviewModal';
import { useUIStore } from '@/stores/useUIStore';

export function GlobalFilePreview() {
  const open = useUIStore((state) => state.filePreviewOpen);
  const files = useUIStore((state) => state.filePreviewFiles);
  const initialIndex = useUIStore((state) => state.filePreviewIndex);
  const closeFilePreview = useUIStore((state) => state.closeFilePreview);

  return (
    <ImagePreviewModal
      key={`global-preview-${open ? `${initialIndex}-${files.length}` : 'closed'}`}
      files={files}
      initialIndex={initialIndex}
      open={open}
      onClose={closeFilePreview}
    />
  );
}