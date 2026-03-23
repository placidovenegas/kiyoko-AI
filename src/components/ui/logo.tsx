import { cn } from '@/lib/utils/cn';

/* ── KiyokoIcon — solo el símbolo (bear mark), un único color ── */

interface KiyokoIconProps {
  size?: number;
  className?: string;
}

export function KiyokoIcon({ size = 20, className }: KiyokoIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 627.14 770.55"
      width={size}
      height={size}
      className={cn('shrink-0', className)}
      aria-label="Kiyoko AI"
    >
      <path
        fill="currentColor"
        d="M1.81,613.11V286.78A309.833,309.833,0,0,1,23.96,158.1C34.56,131.99,58.28,73.01,120,33.47A229.289,229.289,0,0,1,210.81,0V368.28c80.73-107.55,114.48-156.27,128.88-179.56,1.6-2.58,8.45-13.1,22.15-34.15,24.86-38.18,29.47-44.77,37.71-51.31,16.01-12.71,33.62-17.82,53.26-17.82H627.14Q517.625,257.085,408.1,428.71q51.3,77.265,102.61,154.54C483.33,550.16,398.7,456.82,267.99,442.24c-36.73-4.1-109.58-11.3-176.94,36.32C26.96,523.88,7.26,591.2,1.81,613.11Z"
      />
      <path
        fill="currentColor"
        d="M62.77,499.93c9.03-9.85,44.54-47.02,97.2-66.52,99.01-36.65,194.33,13,220.5,26.64,71.34,37.17,111.38,92.3,130.24,123.2q58.215,93.645,116.43,187.3H464.01a93.929,93.929,0,0,1-63.8-24.93,99.493,99.493,0,0,1-21.05-27.77c-14.25-27.47-33.23-52.22-48.8-78.96-8.89-15.26-3.03-4.38-62.88-96.06-26.27-40.24-35.63-54.95-56.67-64.87-22.03-10.38-42.87-8.91-54.64-7.95C82.31,476.1,32.92,543.49,22.29,558.67a258.651,258.651,0,0,1,40.48-58.75Z"
      />
      <path
        fill="currentColor"
        d="M0,770.55a383.852,383.852,0,0,1,41.25-96.11c22.46-37.16,44.36-73.41,79.9-76.67,15.22-1.4,27.14,3.79,33,6.33,32.12,13.96,47.52,46.99,65.33,85.16,8.76,18.77,11.85,29.63,24.29,49.35a262.146,262.146,0,0,0,23.71,31.93H0Z"
      />
    </svg>
  );
}

/* ── KiyokoWordmark — logo + texto ── */

interface KiyokoWordmarkProps {
  size?: number;
  className?: string;
  textClassName?: string;
  showText?: boolean;
}

export function KiyokoWordmark({
  size = 24,
  className,
  textClassName,
  showText = true,
}: KiyokoWordmarkProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <KiyokoIcon size={size} />
      {showText && (
        <span className={cn('font-bold leading-none', textClassName)}>
          Kiyoko AI
        </span>
      )}
    </div>
  );
}
