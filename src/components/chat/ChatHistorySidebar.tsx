'use client';

import { useState, useMemo } from 'react';
import { MessageSquare, Plus, Search, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  message_count: number;
}

interface ChatHistorySidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelect: (convId: string) => void;
  onNewChat: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function groupConversations(conversations: Conversation[]): Record<string, Conversation[]> {
  const groups: Record<string, Conversation[]> = {};
  const now = new Date();

  for (const conv of conversations) {
    const date = new Date(conv.created_at);
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);

    let group: string;
    if (diffDays === 0) group = 'Hoy';
    else if (diffDays === 1) group = 'Ayer';
    else if (diffDays < 7) group = 'Esta semana';
    else if (diffDays < 30) group = 'Este mes';
    else group = 'Anteriores';

    if (!groups[group]) groups[group] = [];
    groups[group].push(conv);
  }

  return groups;
}

// ---------------------------------------------------------------------------
// ChatHistorySidebar
// ---------------------------------------------------------------------------

export function ChatHistorySidebar({
  conversations,
  activeConversationId,
  onSelect,
  onNewChat,
}: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const grouped = useMemo(() => groupConversations(filtered), [filtered]);
  const groupOrder = ['Hoy', 'Ayer', 'Esta semana', 'Este mes', 'Anteriores'];

  return (
    <div className="flex flex-col h-full w-[260px] border-r border-border bg-card/50 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between h-11 px-3 shrink-0 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Historial</span>
        </div>
        <button
          type="button"
          onClick={onNewChat}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium',
            'text-primary bg-primary/10 hover:bg-primary/20 transition-colors',
          )}
        >
          <Plus size={12} />
          Nuevo
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 shrink-0">
        <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-2.5 py-1.5">
          <Search size={12} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar conversaciones..."
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
            <MessageSquare size={20} className="text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">
              {searchQuery ? 'Sin resultados' : 'Sin conversaciones previas'}
            </p>
          </div>
        ) : (
          groupOrder
            .filter((group) => grouped[group]?.length)
            .map((group) => (
              <div key={group}>
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {group}
                </p>
                {grouped[group].map((conv) => (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => onSelect(conv.id)}
                    className={cn(
                      'flex items-start gap-2.5 w-full px-3 py-2 text-left transition-colors',
                      'hover:bg-accent/50',
                      activeConversationId === conv.id && 'bg-accent border-l-2 border-l-primary',
                    )}
                  >
                    <MessageSquare
                      size={13}
                      className={cn(
                        'shrink-0 mt-0.5',
                        activeConversationId === conv.id
                          ? 'text-primary'
                          : 'text-muted-foreground/60',
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate leading-tight">
                        {conv.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(conv.created_at)}
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">·</span>
                        <span className="text-[10px] text-muted-foreground">
                          {conv.message_count} msgs
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ))
        )}
      </div>
    </div>
  );
}
