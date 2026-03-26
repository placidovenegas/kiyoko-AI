'use client';

import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { KiyokoIcon } from '@/components/ui/logo';

/* ── Avatar ───────────────────────────────────────────────── */

interface ChatAvatarProps {
  src?:       string;
  name?:      string;
  size?:      'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const AVATAR_SIZE = { xs: 'size-5', sm: 'size-7', md: 'size-8', lg: 'size-10' };
const AVATAR_TEXT = { xs: 'text-[9px]', sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' };

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export function ChatAvatar({ src, name, size = 'md', className }: ChatAvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ring-2 ring-background',
        AVATAR_SIZE[size],
        AVATAR_TEXT[size],
        'bg-default-200 text-default-600 dark:bg-default-700 dark:text-default-300',
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name ?? 'avatar'} className="size-full object-cover" />
      ) : (
        name ? initials(name) : '?'
      )}
    </span>
  );
}

/* ── Typing indicator ─────────────────────────────────────── */

export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1.25 py-0.5 px-1', className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground/60"
          animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 0.7,
            repeat: Infinity,
            delay: i * 0.18,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/* ── Chat message ─────────────────────────────────────────── */

export type ChatRole = 'user' | 'ai' | 'system';

export interface ChatMessageProps {
  role:         ChatRole;
  content?:     string | React.ReactNode;
  name?:        string;
  avatarSrc?:   string;
  avatarClass?: string;
  timestamp?:   string;
  isLoading?:   boolean;
  isFailed?:    boolean;
  onRetry?:     () => void;
  showAvatar?:  boolean;   /* false = collapse avatar for consecutive messages */
  className?:   string;
}

export function ChatMessage({
  role,
  content,
  name,
  avatarSrc,
  avatarClass,
  timestamp,
  isLoading,
  isFailed,
  onRetry,
  showAvatar = true,
  className,
}: ChatMessageProps) {
  const isUser   = role === 'user';
  const isSystem = role === 'system';

  /* ── system ── */
  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn('flex items-center gap-3 py-1', className)}
      >
        <div className="h-px flex-1 bg-border" />
        <span className="shrink-0 text-[11px] text-muted-foreground">{content}</span>
        <div className="h-px flex-1 bg-border" />
      </motion.div>
    );
  }

  /* ── user / ai ── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.6 }}
      className={cn(
        'flex items-start gap-2.5',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className,
      )}
    >
      {/* Avatar — AI only; user messages never show avatar */}
      {!isUser && (
        showAvatar ? (
          avatarSrc ? (
            <ChatAvatar
              src={avatarSrc}
              name={name ?? 'AI'}
              size="sm"
              className={cn('mt-0.5', avatarClass)}
            />
          ) : (
            /* Kiyoko logo mark — teal */
            <span
              className={cn(
                'mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full ring-2 ring-background',
                'bg-primary text-white',
                avatarClass,
              )}
            >
              <KiyokoIcon size={14} />
            </span>
          )
        ) : (
          /* placeholder keeps bubbles aligned for consecutive AI messages */
          <span className="size-7 shrink-0" />
        )
      )}

      {/* Bubble column */}
      <div className={cn('flex max-w-[72%] flex-col gap-1', isUser && 'items-end')}>


        {/* Bubble */}
        <div
          className={cn(
            'relative px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
            /* AI bubble */
            !isUser && 'rounded-2xl rounded-tl-md bg-muted text-foreground dark:bg-default-800',
            /* User bubble — dark teal */
            isUser && 'rounded-2xl rounded-tr-md bg-primary text-primary-foreground',
            /* Failed */
            isFailed && 'opacity-60',
          )}
        >
          {isLoading ? <TypingIndicator /> : <>{content}</>}
        </div>

        {/* Footer — timestamp / error */}
        {(timestamp || isFailed) && (
          <div className={cn(
            'flex items-center gap-1.5 px-1 text-[11px]',
            isUser ? 'flex-row-reverse' : 'flex-row',
            isFailed ? 'text-danger-500' : 'text-muted-foreground',
          )}>
            {isFailed ? (
              <>
                <span>Error al enviar</span>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex items-center gap-0.5 underline underline-offset-2 hover:opacity-80 transition-opacity"
                  >
                    <RotateCcw className="size-3" />
                    Reintentar
                  </button>
                )}
              </>
            ) : (
              <span>{timestamp}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ── Chat container ───────────────────────────────────────── */

export function ChatContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 p-4', className)}>
      {children}
    </div>
  );
}
