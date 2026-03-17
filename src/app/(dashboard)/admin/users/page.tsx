'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

type UserRole = 'admin' | 'editor' | 'viewer' | 'pending' | 'blocked';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  last_active_at: string | null;
}

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-700',
  editor: 'bg-green-100 text-green-700',
  viewer: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  blocked: 'bg-red-100 text-red-700',
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
  pending: 'Pendiente',
  blocked: 'Bloqueado',
};

const FILTERS = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendientes', value: 'pending' },
  { label: 'Editores', value: 'editor' },
  { label: 'Bloqueados', value: 'blocked' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const supabase = createClient();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers((data || []) as UserProfile[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function updateRole(userId: string, newRole: UserRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      toast.error('Error al actualizar rol');
      return;
    }

    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success(`Rol actualizado a ${ROLE_LABELS[newRole]}`);
  }

  const filtered = filter === 'all' ? users : users.filter(u => u.role === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
        <p className="text-sm text-foreground-muted">{users.length} usuarios registrados</p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === f.value
                ? 'bg-brand-500/10 text-brand-500'
                : 'text-foreground-muted hover:bg-surface-secondary'
            }`}
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ml-1 text-xs">
                ({users.filter(u => u.role === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-surface-tertiary" />
          ))
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-surface-tertiary py-12 text-center text-foreground-muted">
            No hay usuarios en esta categoría
          </div>
        ) : (
          filtered.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between rounded-xl border border-surface-tertiary bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-sm font-bold text-brand-500">
                  {(user.full_name || user.email)[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-foreground">{user.full_name || 'Sin nombre'}</p>
                  <p className="text-xs text-foreground-muted">{user.email}</p>
                  <p className="text-xs text-foreground-muted">
                    Registrado {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>

                {user.role === 'pending' && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => updateRole(user.id, 'editor')}
                      className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-600"
                    >
                      Aprobar Editor
                    </button>
                    <button
                      onClick={() => updateRole(user.id, 'viewer')}
                      className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-600"
                    >
                      Viewer
                    </button>
                    <button
                      onClick={() => updateRole(user.id, 'blocked')}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
                    >
                      Bloquear
                    </button>
                  </div>
                )}

                {user.role !== 'pending' && user.role !== 'admin' && (
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value as UserRole)}
                    className="rounded-lg border border-surface-tertiary bg-surface-secondary px-2 py-1 text-xs text-foreground"
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                    <option value="blocked">Bloqueado</option>
                  </select>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
