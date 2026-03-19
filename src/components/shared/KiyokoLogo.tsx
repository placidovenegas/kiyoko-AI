import { cn } from '@/lib/utils/cn';

interface KiyokoLogoProps {
  /** 'dark' uses color-dark variant, 'light' uses color-light, 'white'/'black' for mono */
  variant?: 'dark' | 'light' | 'white' | 'black';
  /** Size in pixels (applied to height, width auto) */
  size?: number;
  className?: string;
}

const LOGO_MAP = {
  dark: '/logo-color-dark.svg',
  light: '/logo-color-light.svg',
  white: '/logo-white.svg',
  black: '/logo-black.svg',
} as const;

export function KiyokoLogo({ variant = 'dark', size = 24, className }: KiyokoLogoProps) {
  return (
    <img
      src={LOGO_MAP[variant]}
      alt="Kiyoko AI"
      height={size}
      width={Math.round(size * (627.14 / 770.55))}
      className={cn('shrink-0', className)}
      style={{ height: size, width: 'auto' }}
    />
  );
}

interface KiyokoLogoBrandProps {
  variant?: 'dark' | 'light' | 'white' | 'black';
  size?: number;
  textClassName?: string;
  className?: string;
  showText?: boolean;
}

/** Logo + "Kiyoko AI" text combo */
export function KiyokoLogoBrand({
  variant = 'dark',
  size = 28,
  textClassName,
  className,
  showText = true,
}: KiyokoLogoBrandProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <KiyokoLogo variant={variant} size={size} />
      {showText && (
        <span className={cn('text-lg font-bold', textClassName)}>
          Kiyoko AI
        </span>
      )}
    </div>
  );
}
