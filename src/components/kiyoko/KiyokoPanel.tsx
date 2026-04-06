'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAIStore } from '@/stores/ai-store';
import { KiyokoButton } from '@/components/kiyoko/KiyokoButton';
import { KiyokoChat } from '@/components/chat/KiyokoChat';
import { CornerDownRight, CornerUpLeft } from 'lucide-react';

/**
 * KiyokoPanel — 3 modes: sidebar, floating, fullscreen.
 * RULE: Renders in the main app area (dashboard + project routes) so IA is always accessible.
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
  const [floatSize, setFloatSize] = useState({ w: 560, h: 600 });
  const [isFloatHovered, setIsFloatHovered] = useState(false);
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

  // ---- Floating resize (bottom-right corner) ----
  const handleFloatResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = floatSize.w;
    const startH = floatSize.h;
    const startPos = { ...floatPos };

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      // Keep the floating panel inside viewport bounds.
      const maxW = Math.max(320, window.innerWidth - startPos.x - 20);
      const maxH = Math.max(320, window.innerHeight - startPos.y - 20);

      const nextW = Math.max(320, Math.min(maxW, startW + dx));
      const nextH = Math.max(320, Math.min(maxH, startH + dy));

      setFloatSize({ w: nextW, h: nextH });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';
  }, [floatPos, floatSize.w, floatSize.h]);

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
  const isInsideDashboardArea = (
    pathname.startsWith('/dashboard')
    || pathname.startsWith('/new')
    || pathname.startsWith('/settings')
    || pathname.startsWith('/admin')
  );

  // Antes el panel sólo existía en /project/*; esto impedía usar IA desde el dashboard.
  // Ahora la IA/cliente se mantiene disponible en el área principal del app.
  if (!isInsideProject && !isInsideDashboardArea) return null;

  if (!isOpen) return <KiyokoButton />;

  // ---- Sidebar mode ----
  if (mode === 'sidebar') {
    return (
      <div
        className="shrink-0 h-full flex bg-background relative z-30"
        style={{ width: sidebarWidth }}
      >
        {/* Área de agarre (w-2) invisible + línea visible fina (w-px) */}
        <div
          className="absolute top-0 left-0 w-2 h-full cursor-col-resize z-10 bg-transparent group"
          onMouseDown={handleSidebarResize}
        >
          <div
            className="absolute inset-y-0 left-1 w-px bg-border group-hover:bg-[#3E4452] group-active:bg-[#3E4452] transition-colors"
          />
        </div>
        <div className="flex-1 min-w-0 h-full">
          {/* `sidebar` = chat panel lateral con historial visible */}
          <KiyokoChat mode="expanded" onClose={closeChat} />
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
        onMouseEnter={() => setIsFloatHovered(true)}
        onMouseLeave={() => setIsFloatHovered(false)}
        style={{
          left: floatPos.x,
          top: floatPos.y,
          width: floatSize.w,
          height: floatSize.h,
          minWidth: 320,
          minHeight: 320,
        }}
      >
        <div
          className="h-2 cursor-move shrink-0 bg-muted/50 hover:bg-muted transition-colors"
          onMouseDown={handleFloatDrag}
        />
        <div className="flex-1 min-h-0">
          {/* `floating` = ventana flotante compacta (sin historial persistente) */}
          <KiyokoChat mode="panel" onClose={closeChat} />
        </div>

        {/* Resize hint + handle (only on hover) */}
        {isFloatHovered && (
          <>
            {/* Top-left hint (only visual) */}
            <div className="absolute left-2 top-2 pointer-events-none opacity-80">
              <CornerUpLeft size={14} className="text-muted-foreground" />
            </div>

            {/* Bottom-right handle */}
            <div
              role="button"
              aria-label="Redimensionar chat flotante"
              title="Redimensionar"
              onMouseDown={handleFloatResizeMouseDown}
              className="absolute right-1 bottom-1 flex h-6 w-6 cursor-nwse-resize items-center justify-center rounded-md hover:bg-accent-soft-hover"
            >
              <CornerDownRight size={16} className="text-muted-foreground" />
            </div>
          </>
        )}
      </div>
    );
  }

  // ---- Fullscreen mode ----
  return (
    <div className="relative z-40 bg-background flex flex-col flex-1 min-h-0 w-full overflow-hidden">
      <KiyokoChat mode="expanded" onClose={closeChat} />
    </div>
  );
}
