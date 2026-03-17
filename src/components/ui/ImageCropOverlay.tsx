'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';

interface ImageCropOverlayProps {
  src: string;
  onCrop: (objectPosition: string) => void;
  onCancel: () => void;
}

export function ImageCropOverlay({ src, onCrop, onCancel }: ImageCropOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const CIRCLE_SIZE = 128;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.clientWidth, height: img.clientHeight });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || imageSize.width === 0) return;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      const pctX = (dx / imageSize.width) * 100;
      const pctY = (dy / imageSize.height) * 100;

      setPosition({
        x: Math.max(0, Math.min(100, dragStart.current.posX + pctX)),
        y: Math.max(0, Math.min(100, dragStart.current.posY + pctY)),
      });
    },
    [isDragging, imageSize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-4">
        {/* Instructions */}
        <p className="text-sm text-white/80">
          Arrastra el circulo para seleccionar el area del avatar
        </p>

        {/* Image container */}
        <div
          ref={containerRef}
          className="relative select-none overflow-hidden rounded-xl"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={src}
            alt="Crop preview"
            className="max-h-[70vh] max-w-[80vw] object-contain"
            onLoad={handleImageLoad}
            draggable={false}
          />

          {/* Dark overlay with circular cutout using CSS mask */}
          {imageSize.width > 0 && (
            <>
              {/* Semi-transparent overlay */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(circle ${CIRCLE_SIZE / 2}px at ${position.x}% ${position.y}%, transparent ${CIRCLE_SIZE / 2 - 1}px, rgba(0,0,0,0.5) ${CIRCLE_SIZE / 2}px)`,
                }}
              />

              {/* Draggable circle border */}
              <div
                onMouseDown={handleMouseDown}
                className="absolute border-2 border-white/90 rounded-full shadow-lg"
                style={{
                  width: CIRCLE_SIZE,
                  height: CIRCLE_SIZE,
                  left: `${position.x}%`,
                  top: `${position.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
              />
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <IconX size={16} />
            Cancelar
          </button>
          <button
            onClick={() => onCrop(`${position.x.toFixed(1)}% ${position.y.toFixed(1)}%`)}
            className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
          >
            <IconCheck size={16} />
            Confirmar avatar
          </button>
        </div>
      </div>
    </div>
  );
}
