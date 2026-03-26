'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Check,
  Plus,
  Settings,
  UserPlus,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  useSidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { KiyokoIcon } from '@/components/ui/logo';
import { useOrganizations, ORG_TYPE_LABELS } from '@/hooks/useOrganizations';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ORG_TYPE_COLORS: Record<string, string> = {
  personal:  'bg-primary/20 text-primary',
  freelance: 'bg-blue-500/20 text-blue-500',
  team:      'bg-purple-500/20 text-purple-500',
  agency:    'bg-orange-500/20 text-orange-500',
};

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function OrgBadge({ name, orgType, size = 'md' }: { name: string; orgType?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const colors = ORG_TYPE_COLORS[orgType ?? 'team'] ?? ORG_TYPE_COLORS.team;
  const sizeClass =
    size === 'lg' ? 'h-10 w-10 text-sm rounded-lg' :
    size === 'sm' ? 'h-6 w-6 text-[10px] rounded-md' :
                    'h-8 w-8 text-xs rounded-lg';
  return (
    <span className={cn('flex shrink-0 items-center justify-center font-bold', sizeClass, colors)}>
      {initials(name)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// SidebarExpandButton — shown in footer when sidebar is collapsed
// ---------------------------------------------------------------------------

export function SidebarExpandButton() {
  const { state, toggleSidebar } = useSidebar();
  if (state === 'expanded') return null;
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton onClick={toggleSidebar} tooltip="Abrir menú">
          <ChevronsRight className="h-4 w-4" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ---------------------------------------------------------------------------
// SidebarHeaderSection
// ---------------------------------------------------------------------------

export function SidebarHeaderSection() {
  const { state, toggleSidebar } = useSidebar();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const { user, signOut } = useAuth();
  const { organizations, currentOrg, currentOrgId, switchOrg, loading } = useOrganizations();
  const { openWorkspaceModal, openSettingsModal } = useUIStore();

  const isExpanded = state === 'expanded';
  const userName = user?.full_name ?? user?.email ?? 'Usuario';
  const userEmail = user?.email ?? '';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Popover open={open} onOpenChange={setOpen}>
          {/* Wrapper with hover state + relative positioning for the overlay button */}
          <div
            className="relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          >
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 h-auto',
                  'hover:bg-sidebar-accent text-foreground',
                  open && 'bg-sidebar-accent',
                )}
              >
                <KiyokoIcon size={20} className="shrink-0 text-foreground mb-1" />
                {isExpanded && (
                  <div className="min-w-0 flex-1 text-left pr-5">
                    <p className="truncate text-[13px] font-semibold leading-tight">{userName}</p>
                    {currentOrg && (
                      <p className="truncate text-[11px] text-muted-foreground leading-tight">
                        {currentOrg.name}
                      </p>
                    )}
                  </div>
                )}
              </Button>
            </PopoverTrigger>

            {/* Collapse button — overlaid on top-right of the trigger, appears on hover */}
            {isExpanded && (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                isIconOnly
                onClick={(e) => { e.stopPropagation(); toggleSidebar(); }}
                className={cn(
                  'absolute right-1 top-1/2 -translate-y-1/2 z-10 size-5',
                  hovered ? 'opacity-100' : 'opacity-0',
                )}
                title="Colapsar menú"
              >
                <ChevronsLeft size={13} />
              </Button>
            )}
          </div>

          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={4}
            className="w-72 p-0 overflow-hidden"
          >
            {/* ── Org activa ───────────────────────────────────────────── */}
            {currentOrg ? (
              <div className="px-3 pt-3 pb-2">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <OrgBadge name={currentOrg.name} orgType={currentOrg.org_type} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-foreground leading-snug">
                      {currentOrg.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-tight">
                      Plan Gratis · {ORG_TYPE_LABELS[currentOrg.org_type ?? 'team']}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    type="button"
                    variant="bordered"
                    size="xs"
                    onClick={() => { setOpen(false); openSettingsModal('perfil'); }}
                    className="flex-1 h-7 text-[12px]"
                  >
                    <Settings className="h-3 w-3 shrink-0 text-muted-foreground" />
                    Ajustes
                  </Button>
                  <Button
                    type="button"
                    variant="bordered"
                    size="xs"
                    onClick={() => { setOpen(false); openSettingsModal('org-miembros'); }}
                    className="flex-1 h-7 text-[12px]"
                  >
                    <UserPlus className="h-3 w-3 shrink-0 text-muted-foreground" />
                    Invitar
                  </Button>
                </div>
              </div>
            ) : loading ? (
              <div className="px-3 py-3 text-[12px] text-muted-foreground">Cargando…</div>
            ) : null}

            <Separator />

            {/* ── Lista de organizaciones ──────────────────────────────── */}
            <div className="py-1">
              {organizations.map((org) => {
                const isActive = org.id === currentOrgId;
                return (
                  <Button
                    key={org.id}
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={() => { switchOrg(org.id); router.push('/dashboard'); setOpen(false); }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-1.5 h-auto text-left rounded-none',
                      'hover:bg-accent',
                      isActive && 'bg-accent/50',
                    )}
                  >
                    <OrgBadge name={org.name} orgType={org.org_type} size="sm" />
                    <p className={cn(
                      'flex-1 min-w-0 truncate text-[13px] leading-tight',
                      isActive ? 'font-semibold text-foreground' : 'text-foreground',
                    )}>
                      {org.name}
                    </p>
                    {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />}
                  </Button>
                );
              })}

              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => { openWorkspaceModal(); setOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 h-auto text-left rounded-none hover:bg-accent text-primary"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                  <Plus className="h-3.5 w-3.5" />
                </span>
                <span className="text-[13px] font-medium">Nueva organización</span>
              </Button>
            </div>

            <Separator />

            {/* ── Cuenta ───────────────────────────────────────────────── */}
            <div className="py-1">
              <div className="flex items-center gap-2 px-3 py-1.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary text-[9px] font-bold">
                  {initials(user?.full_name)}
                </span>
                <p className="flex-1 min-w-0 truncate text-[12px] text-muted-foreground">{userEmail}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={() => { setOpen(false); signOut(); }}
                className="flex w-full items-center gap-2 px-3 py-1.5 h-auto text-[13px] text-foreground rounded-none hover:bg-accent"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                Cerrar sesión
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
