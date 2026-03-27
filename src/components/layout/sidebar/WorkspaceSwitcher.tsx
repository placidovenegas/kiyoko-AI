'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Check, ChevronDown, ChevronsLeft, LogOut, Plus,
  Settings, UserPlus,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { ORG_TYPE_LABELS, useOrganizations } from '@/hooks/useOrganizations';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils/cn';

type SidebarLevel = 'dashboard' | 'project' | 'video';

interface WorkspaceSwitcherProps {
  isExpanded: boolean;
  level: SidebarLevel;
  onToggleSidebar: () => void;
}

const ORG_TYPE_COLORS: Record<string, string> = {
  personal: 'bg-primary/15 text-primary',
  freelance: 'bg-sky-500/15 text-sky-400',
  team: 'bg-violet-500/15 text-violet-300',
  agency: 'bg-orange-500/15 text-orange-300',
  school: 'bg-emerald-500/15 text-emerald-300',
};

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function OrgBadge({ name, orgType, size = 'md' }: { name: string; orgType?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const colors = ORG_TYPE_COLORS[orgType ?? 'team'] ?? ORG_TYPE_COLORS.team;
  const sizeClass = size === 'lg' ? 'h-9 w-9 rounded-lg text-xs'
    : size === 'sm' ? 'h-6 w-6 rounded text-[9px]'
    : 'h-7 w-7 rounded-md text-[10px]';
  return (
    <span className={cn('flex shrink-0 items-center justify-center font-bold', sizeClass, colors)}>
      {initials(name)}
    </span>
  );
}

export function WorkspaceSwitcher({ isExpanded, level, onToggleSidebar }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { user, signOut } = useAuth();
  const { organizations, currentOrg, currentOrgId, switchOrg, loading } = useOrganizations();
  const { openWorkspaceModal, openSettingsModal } = useUIStore();

  const userEmail = user?.email ?? '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div
        className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
              'hover:bg-sidebar-accent',
              open && 'bg-sidebar-accent',
              !isExpanded && 'justify-center px-0',
            )}
          >
            {currentOrg ? (
              <OrgBadge name={currentOrg.name} orgType={currentOrg.org_type} />
            ) : (
              <div className="h-7 w-7 rounded-md bg-muted animate-pulse shrink-0" />
            )}

            {isExpanded && (
              <>
                <div className="min-w-0 flex-1">
                  {currentOrg ? (
                    <p className="truncate text-[13px] font-semibold leading-tight text-foreground">
                      {currentOrg.name}
                    </p>
                  ) : (
                    <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
                  )}
                </div>
                <ChevronDown className={cn('h-3 w-3 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')} />
              </>
            )}
          </button>
        </PopoverTrigger>

        {isExpanded && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleSidebar(); }}
            className={cn(
              'absolute right-0.5 top-1/2 z-10 flex items-center justify-center size-5 -translate-y-1/2 rounded text-muted-foreground transition-opacity',
              'hover:bg-sidebar-accent hover:text-foreground',
              hovered && !open ? 'opacity-100' : 'opacity-0',
            )}
            aria-label="Colapsar menú"
          >
            <ChevronsLeft size={12} />
          </button>
        )}
      </div>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        className="w-72 overflow-hidden rounded-lg border border-border bg-popover p-0 shadow-lg"
      >
        {currentOrg && (
          <div className="p-2">
            <div className="flex items-center gap-2.5 px-1 py-1">
              <OrgBadge name={currentOrg.name} orgType={currentOrg.org_type} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{currentOrg.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {ORG_TYPE_LABELS[currentOrg.org_type ?? 'team']} · Plan Gratis
                </p>
              </div>
            </div>
            <div className="flex gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => { setOpen(false); openSettingsModal('perfil'); }}
                className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-[11px] font-medium text-foreground hover:bg-accent transition-colors"
              >
                <Settings className="h-3 w-3 text-muted-foreground" />
                Ajustes
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); openSettingsModal('org-miembros'); }}
                className="flex h-7 flex-1 items-center justify-center gap-1.5 rounded-md border border-border text-[11px] font-medium text-foreground hover:bg-accent transition-colors"
              >
                <UserPlus className="h-3 w-3 text-muted-foreground" />
                Invitar
              </button>
            </div>
          </div>
        )}

        <Separator />

        <div className="p-1">
          {loading ? (
            <div className="px-2 py-2 text-xs text-muted-foreground">Cargando…</div>
          ) : (
            organizations.map((org) => {
              const isActive = org.id === currentOrgId;
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => { switchOrg(org.id); router.push('/dashboard'); setOpen(false); }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors',
                    'hover:bg-accent',
                    isActive && 'bg-accent/60',
                  )}
                >
                  <OrgBadge name={org.name} orgType={org.org_type} size="sm" />
                  <p className={cn('flex-1 min-w-0 truncate text-[13px]', isActive && 'font-semibold')}>
                    {org.name}
                  </p>
                  {isActive && <Check className="h-3 w-3 shrink-0 text-primary" />}
                </button>
              );
            })
          )}

          <button
            type="button"
            onClick={() => { openWorkspaceModal(); setOpen(false); }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-primary hover:bg-accent transition-colors mt-0.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-[13px] font-medium">Nueva organización</span>
          </button>
        </div>

        <Separator />

        <div className="p-1">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/15 text-[8px] font-bold text-primary">
              {initials(user?.full_name)}
            </span>
            <p className="flex-1 min-w-0 truncate text-xs text-muted-foreground">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); signOut(); }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-foreground hover:bg-accent transition-colors"
          >
            <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[13px]">Cerrar sesión</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
