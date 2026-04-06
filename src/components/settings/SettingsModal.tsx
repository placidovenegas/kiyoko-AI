'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { cn } from '@/lib/utils/cn';
import {
  X, User, Settings, Bell, Shield, Building2, Users,
  Key as KeyIcon, CreditCard, LayoutGrid,
} from 'lucide-react';
import {
  PerfilSection,
  PreferenciasSection,
  NotificacionesSection,
  SeguridadSection,
  OrganizacionesSection,
  OrgGeneralSection,
  OrgMiembrosSection,
  ApiKeysSection,
  SuscripcionSection,
} from './modal-settings';

// ─── Nav config ──────────────────────────────────────────────────────────────

const NAV = [
  {
    group: 'Cuenta',
    items: [
      { id: 'perfil', label: 'Perfil', icon: User },
      { id: 'preferencias', label: 'Preferencias', icon: Settings },
      { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
      { id: 'seguridad', label: 'Seguridad', icon: Shield },
    ],
  },
  {
    group: 'Organización',
    items: [
      { id: 'organizaciones', label: 'Mis organizaciones', icon: LayoutGrid },
      { id: 'org-general', label: 'General', icon: Building2 },
      { id: 'org-miembros', label: 'Miembros', icon: Users },
    ],
  },
  {
    group: 'Integraciones',
    items: [
      { id: 'api-keys', label: 'Proveedores de IA', icon: KeyIcon },
    ],
  },
  {
    group: 'Facturación',
    items: [
      { id: 'suscripcion', label: 'Suscripción', icon: CreditCard },
    ],
  },
];

// ─── Section map ─────────────────────────────────────────────────────────────

const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
  perfil: PerfilSection,
  preferencias: PreferenciasSection,
  notificaciones: NotificacionesSection,
  seguridad: SeguridadSection,
  organizaciones: OrganizacionesSection,
  'org-general': OrgGeneralSection,
  'org-miembros': OrgMiembrosSection,
  'api-keys': ApiKeysSection,
  suscripcion: SuscripcionSection,
};

// ─── Modal ───────────────────────────────────────────────────────────────────

export function SettingsModal() {
  const { settingsModalOpen, settingsSection, closeSettingsModal, openSettingsModal } = useUIStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSettingsModal(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeSettingsModal]);

  const SectionComponent = SECTION_COMPONENTS[settingsSection] ?? PerfilSection;

  if (!settingsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSettingsModal} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative flex flex-row w-[80vw] h-[85vh] rounded-xl border border-border bg-background shadow-xl overflow-hidden">
          {/* ── Left nav ──────────────────────────────────────────── */}
          <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
            <div className="px-4 pt-5 pb-2">
              <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-2">Ajustes</p>
            </div>

            <nav className="flex-1 px-2 pb-4">
              {NAV.map((group) => (
                <div key={group.group} className="mb-2.5">
                  <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{group.group}</p>
                  {group.items.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => openSettingsModal(id)}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] rounded-md transition-colors',
                        settingsSection === id
                          ? 'bg-accent text-foreground font-medium'
                          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          </aside>

          {/* ── Right content ─────────────────────────────────────── */}
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="max-w-xl mx-auto px-8 py-8">
              <SectionComponent />
            </div>
          </main>

          {/* ── Close ─────────────────────────────────────────────── */}
          <button
            onClick={closeSettingsModal}
            className="absolute right-3 top-3 flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
