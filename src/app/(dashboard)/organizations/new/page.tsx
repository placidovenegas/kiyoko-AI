'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function NewOrganizationPage() {
  const [name, setName] = useState('');
  const [type, setType] = useState<'personal' | 'team'>('personal');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { count } = await supabase
        .from('organizations')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      if ((count ?? 0) >= 3) {
        toast.error('Maximo 3 organizaciones permitidas');
        setLoading(false);
        return;
      }

      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

      const { data: org, error } = await supabase
        .from('organizations')
        .insert({ name: name.trim(), slug, type, owner_id: user.id })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('organization_members')
        .insert({ organization_id: org.id, user_id: user.id, role: 'owner' });

      toast.success('Organizacion creada');
      router.push('/organizations');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="rounded-lg border border-foreground/10 bg-surface-secondary">
        {/* Header */}
        <div className="border-b border-foreground/8 px-8 py-6">
          <h1 className="text-lg font-bold text-foreground">Crear nueva organizacion</h1>
          <p className="text-sm text-foreground/50 mt-1">
            Las organizaciones agrupan tus proyectos. Cada una puede tener su propio equipo y configuracion.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate}>
          <div className="divide-y divide-foreground/6">
            {/* Name */}
            <div className="flex items-start gap-8 px-8 py-5">
              <div className="w-28 shrink-0 pt-2">
                <label className="text-sm font-medium text-foreground">Nombre</label>
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre de la organizacion"
                  required
                  className="w-full rounded-md border border-foreground/10 bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/20"
                />
                <p className="mt-1.5 text-xs text-foreground/30">
                  Nombre de tu empresa o equipo. Puedes cambiarlo despues.
                </p>
              </div>
            </div>

            {/* Type */}
            <div className="flex items-start gap-8 px-8 py-5">
              <div className="w-28 shrink-0 pt-2">
                <label className="text-sm font-medium text-foreground">Tipo</label>
              </div>
              <div className="flex-1">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'personal' | 'team')}
                  className="w-full rounded-md border border-foreground/10 bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-500"
                >
                  <option value="personal">Personal</option>
                  <option value="team">Equipo / Empresa</option>
                </select>
                <p className="mt-1.5 text-xs text-foreground/30">
                  Define como se usa esta organizacion.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-foreground/8 px-8 py-4">
            <Link
              href="/organizations"
              className="rounded-md border border-foreground/10 px-4 py-2 text-sm text-foreground/60 hover:text-foreground hover:bg-foreground/4 transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-md bg-brand-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear organizacion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
