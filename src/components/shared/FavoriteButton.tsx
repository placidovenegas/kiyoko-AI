'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
  className?: string;
}

export function FavoriteButton({ isFavorite, onToggle, size = 16, className }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        'shrink-0 transition-colors duration-150',
        isFavorite
          ? 'text-amber-400 hover:text-amber-500'
          : 'text-foreground/20 hover:text-foreground/50',
        className,
      )}
      title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
    >
      <Star size={size} fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  );
}
