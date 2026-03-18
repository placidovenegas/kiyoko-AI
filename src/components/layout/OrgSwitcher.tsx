'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Building2, ChevronDown, Plus, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useOrganizations } from '@/hooks/useOrganizations';
import { toast } from 'sonner';

interface OrgSwitcherProps {
  collapsed: boolean;
}

export function OrgSwitcher({ collapsed }: OrgSwitcherProps) {
  const { organizations, currentOrg, currentOrgId, switchOrg, createOrg, canCreateOrg, loading } = useOrganizations();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setOpen(false);
      setCreating(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  async function handleCreateOrg() {
    if (!newOrgName.trim()) return;
    try {
      await createOrg(newOrgName.trim());
      toast.success('Organizacion creada');
      setNewOrgName('');
      setCreating(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear');
    }
  }

  if (loading) return null;

  const displayName = currentOrg?.name ?? 'Organizacion';

  return (
    <div ref={ref} className="relative px-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? displayName : undefined}
        className={cn(
          'flex items-center w-full rounded-md transition-colors duration-100',
          collapsed ? 'justify-center p-2' : 'gap-2 px-2.5 py-1.75',
          'hover:bg-foreground/5 text-foreground/60 hover:text-foreground',
          open && 'bg-foreground/5 text-foreground',
        )}
      >
        {currentOrg?.type === 'personal' ? (
          <User size={15} className="shrink-0" />
        ) : (
          <Building2 size={15} className="shrink-0" />
        )}
        {!collapsed && (
          <>
            <span className="flex-1 text-left text-[13px] font-medium truncate">
              {displayName}
            </span>
            <ChevronDown size={12} className={cn('shrink-0 text-foreground/30 transition-transform', open && 'rotate-180')} />
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            'absolute z-[100] mt-1 w-60 bg-surface border border-foreground/10 rounded-lg shadow-2xl shadow-black/30 py-1',
            collapsed ? 'left-full ml-2 top-0 mt-0' : 'left-0 top-full',
          )}
        >
          <div className="px-3 py-1.5">
            <p className="text-[10px] font-semibold text-foreground/30 uppercase tracking-wider">Organizaciones</p>
          </div>

          {/* Link to all organizations */}
          <Link
            href="/organizations"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-brand-500 hover:bg-brand-500/10 transition-colors"
          >
            <Building2 size={14} className="shrink-0" />
            <span className="truncate flex-1 text-left">Todas las organizaciones</span>
          </Link>

          <div className="my-1 mx-2 h-px bg-foreground/6" />

          {organizations.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => { switchOrg(org.id); setOpen(false); }}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2 text-[13px] transition-colors',
                org.id === currentOrgId
                  ? 'bg-brand-500/10 text-brand-500 font-medium'
                  : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5',
              )}
            >
              {org.type === 'personal' ? <User size={14} /> : <Building2 size={14} />}
              <span className="truncate flex-1 text-left">{org.name}</span>
              {org.type === 'personal' && <span className="text-[10px] text-foreground/30">Personal</span>}
            </button>
          ))}

          {canCreateOrg && !creating && (
            <>
              <div className="my-1 mx-2 h-px bg-foreground/6" />
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                <Plus size={14} />
                <span>Nueva organizacion</span>
              </button>
            </>
          )}

          {creating && (
            <div className="px-3 py-2 space-y-2">
              <input
                type="text"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateOrg(); }}
                placeholder="Nombre..."
                className="w-full px-2 py-1.5 text-[13px] bg-surface-secondary border border-foreground/10 rounded-md text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-brand-500"
                autoFocus
              />
              <div className="flex gap-1.5">
                <button type="button" onClick={handleCreateOrg} className="flex-1 px-2 py-1 text-[12px] font-medium bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors">Crear</button>
                <button type="button" onClick={() => { setCreating(false); setNewOrgName(''); }} className="px-2 py-1 text-[12px] text-foreground/50 hover:text-foreground transition-colors">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
