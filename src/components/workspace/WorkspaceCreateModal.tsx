'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ArrowLeft, Plus, Loader2, Building2, Home, Laptop, GraduationCap, Link2, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import { useOrganizations } from '@/hooks/useOrganizations';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

/* ── Types ───────────────────────────────────────────────── */

type OrgTypeValue = 'personal' | 'freelance' | 'team' | 'school';

const WORKSPACE_TYPES: {
  value: OrgTypeValue;
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
  description: string;
  placeholder: string;
}[] = [
  { value: 'team',      icon: Building2,     color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Empresa',   description: 'Proyectos de empresa, equipo o marca',  placeholder: 'Mi empresa' },
  { value: 'personal',  icon: Home,          color: 'text-primary',   bg: 'bg-primary/10',   label: 'Personal',  description: 'Proyectos propios y experimentación',   placeholder: 'Mi espacio personal' },
  { value: 'freelance', icon: Laptop,        color: 'text-blue-500',   bg: 'bg-blue-500/10',   label: 'Freelance', description: 'Trabajo para múltiples clientes',        placeholder: 'Mi estudio freelance' },
  { value: 'school',    icon: GraduationCap, color: 'text-rose-500',   bg: 'bg-rose-500/10',   label: 'Educación', description: 'Proyectos académicos o formativos',      placeholder: 'Mi proyecto educativo' },
];

/* ── Variants ────────────────────────────────────────────── */

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.95, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
  exit:    { opacity: 0, scale: 0.95, y: 12, transition: { duration: 0.16 } },
};

const stepVariants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir > 0 ? 28 : -28 }),
  center: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 420, damping: 34 } },
  exit:   (dir: number) => ({ opacity: 0, x: dir > 0 ? -28 : 28, transition: { duration: 0.12 } }),
};

/* ── Component ───────────────────────────────────────────── */

export function WorkspaceCreateModal() {
  const { workspaceModalOpen, closeWorkspaceModal } = useUIStore();
  const { createOrg, createOrgMutation, canCreateOrg } = useOrganizations();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState(1);
  const [orgType, setOrgType] = useState<OrgTypeValue>('team');
  const [name, setName] = useState('');
  const [emails, setEmails] = useState(['', '', '']);
  const [showCancel, setShowCancel] = useState(false);

  const reset = useCallback(() => {
    setStep(1); setDirection(1); setOrgType('team');
    setName(''); setEmails(['', '', '']); setShowCancel(false);
  }, []);

  const handleClose = useCallback(() => {
    closeWorkspaceModal();
    setTimeout(reset, 300);
  }, [closeWorkspaceModal, reset]);

  const goTo = useCallback((next: 1 | 2 | 3, dir?: number) => {
    setDirection(dir ?? (next > step ? 1 : -1));
    setStep(next);
  }, [step]);

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      await createOrg(name.trim(), orgType);
      toast.success('Workspace creado');
      handleClose();
      router.push('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear el workspace');
    }
  }

  function handleCopyInviteLink() {
    const link = `${window.location.origin}/invite/workspace`;
    navigator.clipboard.writeText(link).then(() => toast.success('Enlace copiado'));
  }

  const showInvites = orgType !== 'personal';
  const totalSteps = showInvites ? 3 : 2;
  const selectedType = WORKSPACE_TYPES.find((t) => t.value === orgType)!;

  return (
    <AnimatePresence>
      {workspaceModalOpen && (
        <motion.div
          key="ws-backdrop"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowCancel(true)}
        >
          <motion.div
            key="ws-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            transition={{ layout: { type: 'spring' as const, stiffness: 320, damping: 30 } }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-background shadow-2xl"
          >
            {/* Cancel confirm overlay */}
            <ConfirmDialog
              open={showCancel}
              inline
              title="¿Cancelar la creación?"
              description="Volverás a tu workspace anterior sin crear nada."
              actions={[
                { label: 'Sí, cancelar',           variant: 'danger', onClick: handleClose },
                { label: 'Continuar configurando',  variant: 'ghost',  onClick: () => setShowCancel(false) },
              ]}
            />

            {/* Top bar */}
            <div className="flex items-center justify-between px-6 pt-5">
              <button
                onClick={() => step > 1 ? goTo((step - 1) as 1 | 2 | 3) : setShowCancel(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              {/* Step dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <motion.span
                    key={i}
                    animate={{ width: step === i + 1 ? 20 : 6, opacity: step === i + 1 ? 1 : 0.25 }}
                    transition={{ type: 'spring' as const, stiffness: 500, damping: 35 }}
                    className="block h-1.5 rounded-full bg-foreground"
                    style={{ width: 6 }}
                  />
                ))}
              </div>

              <button
                onClick={() => setShowCancel(true)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step content */}
            <div className="overflow-hidden px-7 pb-7 pt-5">
              <AnimatePresence mode="wait" custom={direction}>

                {/* ── Step 1: type — click card to advance ── */}
                {step === 1 && (
                  <motion.div key="step1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                    <h2 className="text-center text-xl font-semibold text-foreground">¿Para qué es este espacio?</h2>
                    <p className="mt-1 mb-5 text-center text-sm text-muted-foreground">Elige el tipo que mejor describe tu uso</p>

                    <div className="space-y-2">
                      {WORKSPACE_TYPES.map((type) => {
                        const Icon = type.icon;
                        return (
                          <motion.button
                            key={type.value}
                            type="button"
                            onClick={() => { setOrgType(type.value); goTo(2, 1); }}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex w-full items-center gap-4 rounded-xl border border-border px-4 py-3.5 text-left transition-colors hover:bg-muted/50"
                          >
                            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', type.bg)}>
                              <Icon className={cn('h-5 w-5', type.color)} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground">{type.label}</p>
                              <p className="text-xs text-muted-foreground">{type.description}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: name ── */}
                {step === 2 && (
                  <motion.div key="step2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                    <h2 className="text-center text-xl font-semibold text-foreground">Nombre del workspace</h2>
                    <p className="mt-1 mb-5 text-center text-sm text-muted-foreground">Puedes cambiarlo en cualquier momento</p>

                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 transition-colors focus-within:border-foreground/30">
                      <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', selectedType.bg)}>
                        <selectedType.icon className={cn('h-4 w-4', selectedType.color)} />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && name.trim() && (showInvites ? goTo(3) : handleCreate())}
                        placeholder={selectedType.placeholder}
                        autoFocus
                        className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                      onClick={() => showInvites ? goTo(3) : handleCreate()}
                      disabled={!name.trim() || createOrgMutation.isPending}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {createOrgMutation.isPending
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</>
                        : showInvites ? 'Continuar' : 'Crear workspace'
                      }
                    </motion.button>
                  </motion.div>
                )}

                {/* ── Step 3: invite ── */}
                {step === 3 && (
                  <motion.div key="step3" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                    <h2 className="text-center text-xl font-semibold text-foreground">¿Quién más está en tu equipo?</h2>
                    <p className="mt-1 mb-5 text-center text-sm text-muted-foreground">Invita por email · puedes hacerlo más tarde</p>

                    <div className="space-y-2">
                      {emails.map((email, i) => (
                        <input
                          key={i}
                          type="email"
                          value={email}
                          autoFocus={i === 0}
                          onChange={(e) => {
                            const next = [...emails];
                            next[i] = e.target.value;
                            setEmails(next);
                          }}
                          placeholder="nombre@empresa.com"
                          className="h-10 w-full rounded-lg border border-border bg-muted/30 px-3.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground/30 focus:outline-none"
                        />
                      ))}

                      <div className="flex items-center justify-between pt-0.5">
                        <button
                          type="button"
                          onClick={() => setEmails((p) => [...p, ''])}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                        >
                          <Plus className="h-3.5 w-3.5" /> Añadir más
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyInviteLink}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
                        >
                          <Link2 className="h-3.5 w-3.5" /> Copiar enlace de invitación
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      <motion.button
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        onClick={handleCreate}
                        disabled={createOrgMutation.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-40"
                      >
                        {createOrgMutation.isPending
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando...</>
                          : 'Crear workspace'
                        }
                      </motion.button>
                      <button
                        type="button"
                        onClick={handleCreate}
                        disabled={createOrgMutation.isPending}
                        className="w-full py-1.5 text-center text-xs text-muted-foreground transition hover:text-foreground"
                      >
                        Omitir por ahora
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {!canCreateOrg && (
              <p className="pb-4 text-center text-xs text-muted-foreground">Has alcanzado el límite de 5 workspaces</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
