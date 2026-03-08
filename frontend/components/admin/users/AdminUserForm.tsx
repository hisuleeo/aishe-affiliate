'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { User } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser, updateUser } from '@/services/userService';
import { useToast } from '@/components/ui/ToastProvider';

const createSchema = z.object({
  email: z.string().email('Geçerli bir e-posta girin'),
  username: z.string().min(3, 'Kullanıcı adı en az 3 karakter olmalı'),
  name: z.string().optional(),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalı'),
});

const updateSchema = z.object({
  username: z.string().min(3).optional(),
  name: z.string().optional(),
  status: z.enum(['active', 'blocked']).optional(),
  role: z.enum(['ADMIN', 'AFFILIATE', 'USER']).optional(),
});

export type AdminUserFormValues = z.infer<typeof createSchema> & {
  status?: 'active' | 'blocked';
  role?: 'ADMIN' | 'AFFILIATE' | 'USER';
};

type AdminUserFormProps = {
  initialValues?: User;
  mode: 'create' | 'update';
};

export function AdminUserForm({ initialValues, mode }: AdminUserFormProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const form = useForm<AdminUserFormValues>({
    resolver: zodResolver(mode === 'create' ? createSchema : updateSchema),
    defaultValues: {
      email: initialValues?.email ?? '',
      username: initialValues?.username ?? '',
      name: initialValues?.name ?? '',
      password: '',
      status: initialValues?.status ?? 'active',
      role: initialValues?.roles?.[0]?.role ?? 'USER',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: AdminUserFormValues) =>
      createUser({
        email: values.email,
        username: values.username,
        name: values.name,
        password: values.password,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      form.reset({ email: '', name: '', password: '', status: 'active' });
    },
    onError: () => {
      showToast({
        title: 'Kullanıcı oluşturulamadı',
        description: 'Lütfen bilgileri kontrol edip tekrar deneyin.',
        variant: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: AdminUserFormValues) =>
      updateUser(initialValues?.id ?? '', {
        username: values.username,
        name: values.name,
        status: values.status,
        role: values.role,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => {
      showToast({
        title: 'Kullanıcı güncellenemedi',
        description: 'Yetkiniz veya bağlantınız kontrol edilmeli.',
        variant: 'error',
      });
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset({
        email: initialValues.email,
        username: initialValues.username ?? '',
        name: initialValues.name ?? '',
        password: '',
        status: initialValues.status,
        role: initialValues.roles?.[0]?.role ?? 'USER',
      });
    }
  }, [initialValues, form]);

  const onSubmit = (values: AdminUserFormValues) => {
    if (mode === 'create') {
      return createMutation.mutate(values);
    }
    return updateMutation.mutate(values);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
    >
      <div>
        <label className="text-xs text-slate-400">E-posta</label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          {...form.register('email')}
          disabled={mode === 'update'}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-rose-400">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <label className="text-xs text-slate-400">Kullanıcı adı</label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          {...form.register('username')}
        />
        {form.formState.errors.username ? (
          <p className="text-xs text-rose-400">{form.formState.errors.username.message}</p>
        ) : null}
      </div>

      <div>
        <label className="text-xs text-slate-400">İsim</label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          {...form.register('name')}
        />
      </div>

      {mode === 'create' ? (
        <div>
          <label className="text-xs text-slate-400">Şifre</label>
          <input
            type="password"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            {...form.register('password')}
          />
          {form.formState.errors.password ? (
            <p className="text-xs text-rose-400">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
      ) : null}

      {mode === 'update' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Durum</label>
            <select
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              {...form.register('status')}
            >
              <option value="active">Aktif</option>
              <option value="blocked">Bloklu</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400">Rol</label>
            <select
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              {...form.register('role')}
            >
              <option value="USER">User</option>
              <option value="AFFILIATE">Affiliate</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {mode === 'create' ? 'Kullanıcı Oluştur' : 'Kullanıcı Güncelle'}
      </button>
    </form>
  );
}
