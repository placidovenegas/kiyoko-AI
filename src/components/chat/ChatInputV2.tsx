'use client';

import { useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChatInput } from '@/components/chat/ChatInput';
import type { ChatContextType } from '@/components/chat/ChatInput';
import { ChatQuestionPrompt } from '@/components/chat/ChatQuestionPrompt';
import type { ChatQuestion } from '@/components/chat/ChatQuestionPrompt';
import {
  CHAT_DOCK_OVERLAY_ANIMATE,
  CHAT_DOCK_OVERLAY_EXIT,
  CHAT_DOCK_OVERLAY_INITIAL,
  CHAT_DOCK_OVERLAY_TRANSITION,
  CHAT_DOCK_WIDTH_CLASS,
} from '@/components/chat/chatDockOverlay';

export function ChatInputV2({
  question,
  onQuestionAnswer,
  onQuestionSkip,
  disableProvidersFetch,
  creationDockOpen,
  dockTail,
  embeddedInComposer,
  ...inputProps
}: {
  question?: ChatQuestion | null;
  onQuestionAnswer?: (answer: { id: string; label: string }) => void;
  onQuestionSkip?: () => void;
  disableProvidersFetch?: boolean;
  creationDockOpen?: boolean;
  dockTail?: boolean;
  embeddedInComposer?: boolean;
  onSend: (text: string, files?: File[]) => void;
  onStop: () => void;
  onClearConversation?: () => void;
  isStreaming: boolean;
  activeProvider: string | null;
  placeholder?: string;
  allowFiles?: boolean;
  contextLabel?: string;
  contextType?: ChatContextType;
  prefillText?: string | null;
  onPrefillConsumed?: () => void;
}) {
  const handleAnswer = useCallback(
    (ans: { id: string; label: string }) => {
      onQuestionAnswer?.(ans);
      // En modo chat, lo normal es enviar la selección como mensaje.
      inputProps.onSend(ans.label);
    },
    [onQuestionAnswer, inputProps],
  );

  const handleSkip = useCallback(() => {
    onQuestionSkip?.();
  }, [onQuestionSkip]);

  const questionMotionKey = useMemo(() => {
    if (!question) return '';
    if (question.id) return question.id;
    return `${question.prompt}::${question.options.map((o) => o.id).join('|')}`;
  }, [question]);

  return (
    <div className="shrink-0">
      <div className="relative z-20">
        <AnimatePresence mode="wait">
          {question && (
            <motion.div
              key={questionMotionKey}
              className="absolute left-0 right-0 bottom-full mb-0 flex justify-center pointer-events-none"
              initial={CHAT_DOCK_OVERLAY_INITIAL}
              animate={CHAT_DOCK_OVERLAY_ANIMATE}
              exit={CHAT_DOCK_OVERLAY_EXIT}
              transition={CHAT_DOCK_OVERLAY_TRANSITION}
            >
              <div className={`${CHAT_DOCK_WIDTH_CLASS} pointer-events-auto`}>
                <ChatQuestionPrompt
                  placement="overlay"
                  question={question}
                  onContinue={handleAnswer}
                  onSkip={onQuestionSkip ? handleSkip : undefined}
                  disabled={inputProps.isStreaming || !!creationDockOpen}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input siempre visible */}
        <ChatInput
          {...inputProps}
          disableProvidersFetch={disableProvidersFetch}
          creationDockOpen={creationDockOpen}
          dockTail={dockTail}
          embeddedInComposer={embeddedInComposer}
        />
      </div>
    </div>
  );
}

