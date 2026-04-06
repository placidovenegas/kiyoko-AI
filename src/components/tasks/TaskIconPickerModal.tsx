'use client';

import { useMemo, useState } from 'react';
import { Button, Input, Label, Modal, useOverlayState } from '@heroui/react';
import { Search, Sparkles, X } from 'lucide-react';

interface TaskIconPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (icon: string) => void;
}

const ICON_GROUPS = [
  {
    title: 'Trabajo',
    icons: ['📝', '✅', '📌', '📎', '📂', '📋', '📊', '📈', '📣', '📦', '🧾', '🗂️'],
  },
  {
    title: 'Creativo',
    icons: ['🎬', '🎨', '🪄', '✨', '💡', '🧠', '🖼️', '🎭', '🎙️', '🎧', '📷', '🎥'],
  },
  {
    title: 'Tecnico',
    icons: ['💻', '⚙️', '🛠️', '🔍', '🧪', '🚀', '🧩', '🔧', '📡', '🤖', '🗃️', '🧱'],
  },
  {
    title: 'Estado',
    icons: ['🔥', '⏳', '🚧', '🚨', '📅', '⭐', '🌙', '☀️', '🎯', '🏁', '🔒', '🔁'],
  },
];

export function TaskIconPickerModal({ open, onOpenChange, value, onSelect }: TaskIconPickerModalProps) {
  const modalState = useOverlayState({
    isOpen: open,
    onOpenChange,
  });
  const [query, setQuery] = useState('');

  const filteredGroups = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ICON_GROUPS;

    return ICON_GROUPS
      .map((group) => ({
        ...group,
        icons: group.icons.filter((icon) => `${group.title} ${icon}`.toLowerCase().includes(normalized)),
      }))
      .filter((group) => group.icons.length > 0);
  }, [query]);

  return (
    <Modal state={modalState}>
      <Modal.Backdrop isDismissable>
        <Modal.Container placement="center">
          <Modal.Dialog className="w-[min(92vw,760px)] rounded-[28px] border border-border bg-background p-0 shadow-2xl">
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold tracking-tight text-foreground">Elegir icono</p>
                  <p className="mt-1 text-sm text-muted-foreground">Selecciona un icono para que la tarea se identifique mejor en la vista de documento.</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card text-3xl">
                  {value || '📝'}
                </div>
              </div>

              <div className="mt-4 flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Buscar</Label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Busca rapido o escribe un emoji"
                      className="w-full [&_input]:pl-9"
                    />
                  </div>
                </div>
                <Button
                  variant="flat"
                  color="primary"
                  onPress={() => {
                    const trimmed = query.trim();
                    if (!trimmed) return;
                    onSelect(trimmed.slice(0, 2));
                    onOpenChange(false);
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Usar texto
                </Button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {filteredGroups.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card/70 px-4 py-8 text-center text-sm text-muted-foreground">
                    No hay iconos para esa busqueda. Puedes escribir un emoji arriba y usarlo directamente.
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <section key={group.title} className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{group.title}</p>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
                        {group.icons.map((icon) => {
                          const active = icon === value;

                          return (
                            <button
                              key={`${group.title}-${icon}`}
                              type="button"
                              onClick={() => {
                                onSelect(icon);
                                onOpenChange(false);
                              }}
                              className={active
                                ? 'flex h-14 items-center justify-center rounded-2xl border border-primary bg-primary/8 text-2xl shadow-sm ring-2 ring-primary/20'
                                : 'flex h-14 items-center justify-center rounded-2xl border border-border bg-card text-2xl transition hover:border-primary/50 hover:bg-accent'}
                              aria-label={`Seleccionar icono ${icon}`}
                            >
                              {icon}
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  ))
                )}
              </div>
            </div>

            <Modal.CloseTrigger className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-accent hover:text-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar selector de iconos</span>
            </Modal.CloseTrigger>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}