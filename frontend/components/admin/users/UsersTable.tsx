'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@shared/types';
import { deleteUser, getUsers, updateUser, UpdateUserPayload } from '@/services/userService';
import { useToast } from '@/components/ui/ToastProvider';
import { Edit2, Trash2, X } from 'lucide-react';

export function UsersTable() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserPayload>({});
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast({ title: 'Kullanıcı güncellendi', variant: 'success' });
      setSelectedUser(null);
      setEditForm({});
    },
    onError: () => {
      showToast({ title: 'Kullanıcı güncellenemedi', variant: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast({ title: 'Kullanıcı silindi', variant: 'success' });
    },
    onError: () => {
      showToast({ title: 'Kullanıcı silinemedi', variant: 'error' });
    },
  });

  const handleDelete = (userId: string, userEmail: string) => {
    if (confirm(`"${userEmail}" kullanıcısını silmek istediğinize emin misiniz?`)) {
      deleteMutation.mutate(userId);
    }
  };

  const handleUpdate = () => {
    if (!selectedUser) return;
    updateMutation.mutate({ id: selectedUser.id, payload: editForm });
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        Kullanıcılar yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
        Kullanıcı listesi alınamadı. Admin token ile giriş yapın.
      </div>
    );
  }

  const users = data ?? [];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-5 gap-4 border-b border-slate-800 px-4 sm:px-6 py-3 sm:py-4 text-xs uppercase text-slate-400">
              <span>E-posta</span>
              <span>İsim</span>
              <span>Durum</span>
              <span>Id</span>
              <span className="text-right">Aksiyon</span>
            </div>
            <div className="divide-y divide-slate-800">
              {users.map((user) => (
                <div key={user.id} className="grid grid-cols-5 gap-4 px-4 sm:px-6 py-3 sm:py-4 text-sm text-slate-200">
                  <span className="truncate">{user.email}</span>
                  <span className="truncate">{user.name ?? '—'}</span>
                  <span className={user.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}>
                    {user.status === 'active' ? 'Aktif' : 'Engellenmiş'}
                  </span>
                  <span className="truncate text-xs text-slate-500">{user.id.slice(0, 8)}...</span>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(user);
                    setEditForm({
                      name: user.name ?? '',
                      username: user.username ?? '',
                      status: user.status,
                      role: user.roles?.[0]?.role as 'USER' | 'ADMIN',
                    });
                  }}
                  className="flex items-center gap-1 rounded-lg border border-indigo-500/60 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-200 hover:border-indigo-400"
                >
                  <Edit2 className="h-3 w-3" />
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(user.id, user.email)}
                  className="flex items-center gap-1 rounded-lg border border-rose-500/60 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 hover:border-rose-400"
                >
                  <Trash2 className="h-3 w-3" />
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Kullanıcı Düzenle</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setEditForm({});
                }}
                className="rounded-lg p-2 hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  E-posta (Değiştirilemez)
                </label>
                <div className="mt-1 rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm text-slate-500">
                  {selectedUser.email}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  İsim
                </label>
                <input
                  type="text"
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="İsim"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Kullanıcı Adı
                </label>
                <input
                  type="text"
                  value={editForm.username ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Kullanıcı adı"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Durum
                </label>
                <select
                  value={editForm.status ?? 'active'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value as 'active' | 'blocked' })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="active">Aktif</option>
                  <option value="blocked">Bloklu</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Rol
                </label>
                <select
                  value={editForm.role ?? 'USER'}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value as 'USER' | 'ADMIN' })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/50 px-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="USER">Kullanıcı</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null);
                  setEditForm({});
                }}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
                className="rounded-lg border border-indigo-500/60 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-200 hover:border-indigo-400 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Güncelleniyor...' : 'Güncelle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
