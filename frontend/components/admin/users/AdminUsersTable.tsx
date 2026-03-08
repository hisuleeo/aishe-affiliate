'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { User } from '@shared/types';
import { getAdminUsers } from '@/services/adminService';
import { deleteUser } from '@/services/userService';
import { AdminUserForm } from './AdminUserForm';
import { useToast } from '@/components/ui/ToastProvider';

export function AdminUsersTable() {
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading, error } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUser(undefined);
    },
    onError: () => {
      showToast({
        title: 'Kullanıcı silinemedi',
        description: 'Bu kullanıcıyı silmeye yetkiniz olmayabilir.',
        variant: 'error',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        Admin kullanıcıları yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
        Admin kullanıcıları alınamadı. Admin rolü ile giriş yapın.
      </div>
    );
  }

  const users = data ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
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
                        onClick={() => setSelectedUser(user)}
                        className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-indigo-500"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMutation.mutate(user.id)}
                        className="rounded-lg border border-rose-500/60 px-3 py-1 text-xs text-rose-200 hover:border-rose-400"
                      >
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-300">
            <h3 className="text-base font-semibold text-white">Yeni Kullanıcı</h3>
            <p className="mt-1 text-xs text-slate-400">Admin panelinden kullanıcı oluşturun.</p>
          </div>
          <AdminUserForm mode="create" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
          Güncelleme için tablodan bir kullanıcı seçin.
        </div>
        {selectedUser ? <AdminUserForm mode="update" initialValues={selectedUser} /> : null}
      </div>
    </div>
  );
}
