'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAIStore } from '@/stores/ai-store';
import { KiyokoButton } from '@/components/kiyoko/KiyokoButton';
import { KiyokoChat } from '@/components/chat/KiyokoChat';

/**
 * KiyokoPanel — 3 modes: sidebar, floating, fullscreen.
 * RULE: Only renders inside /project/... routes (Section 1).
 * All hooks MUST be called before any conditional return.
 */
export function KiyokoPanel() {
  const pathname = usePathname();
  const { isOpen, mode, sidebarWidth, setSidebarWidth, closeChat, setMode } = useAIStore();

  // ---- ALL hooks must be above any return ----

  const isResizing = useRef(false);

  const handleSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startW = sidebarWidth;

    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      setSidebarWidth(startW + delta);
    };
    const onUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [sidebarWidth, setSidebarWidth]);

  const [floatPos, setFloatPos] = useState({ x: -1, y: -1 });
  const [floatSize] = useState({ w: 450, h: 500 });
  const floatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === 'floating' && floatPos.x === -1) {
      setFloatPos({
        x: Math.max(0, window.innerWidth - floatSize.w - 20),
        y: Math.max(0, window.innerHeight - floatSize.h - 20),
      });
    }
  }, [mode, floatPos.x, floatSize.w, floatSize.h]);

  const handleFloatDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...floatPos };

    const onMove = (ev: MouseEvent) => {
      setFloatPos({
        x: Math.max(0, startPos.x + (ev.clientX - startX)),
        y: Math.max(0, startPos.y + (ev.clientY - startY)),
      });
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'move';
  }, [floatPos]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (isMobile && isOpen && mode !== 'fullscreen') {
      setMode('fullscreen');
    }
  }, [isMobile, isOpen, mode, setMode]);

  // ---- NOW safe to do conditional returns (all hooks are above) ----

  const isInsideProject = /\/project\/[^/]+/.test(pathname);
  if (!isInsideProject) return null;

  if (!isOpen) return <KiyokoButton />;

  // ---- Sidebar mode ----
  if (mode === 'sidebar') {
    return (
      <div
        className="shrink-0 h-full flex border-l border-border bg-background relative z-30"
        style={{ width: sidebarWidth }}
      >
        <div
          className="absolute top-0 left-0 w-1 h-full cursor-col-resize z-10 hover:bg-teal-500/40 active:bg-teal-500/60 transition-colors"
          onMouseDown={handleSidebarResize}
        />
        <div className="flex-1 min-w-0 h-full">
          <KiyokoChat mode="panel" onClose={closeChat} />
        </div>
      </div>
    );
  }

  // ---- Floating mode ----
  if (mode === 'floating') {
    return (
      <div
        ref={floatRef}
        className="fixed z-50 rounded-xl border border-border shadow-2xl bg-background overflow-hidden flex flex-col"
        style={{
          left: floatPos.x,
          top: floatPos.y,
          width: floatSize.w,
          height: floatSize.h,
          minWidth: 350,
          minHeight: 400,
        }}
      >
        <div
          className="h-2 cursor-move shrink-0 bg-muted/50 hover:bg-muted transition-colors"
          onMouseDown={handleFloatDrag}
        />
        <div className="flex-1 min-h-0">
          <KiyokoChat mode="panel" onClose={closeChat} />
        </div>
      </div>
    );
  }

  // ---- Fullscreen mode ----
  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col md:relative md:inset-auto md:flex-1">
      <KiyokoChat mode="expanded" onClose={closeChat} />
    </div>
  );
}
