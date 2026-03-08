'use client';

import { useEffect } from 'react';
import { z } from 'zod';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Package } from '@shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPackage, updatePackage } from '@/services/packageService';
import { useToast } from '@/components/ui/ToastProvider';

const optionSchema = z.object({
  id: z.string().min(1, 'ID zorunlu'),
  label: z.string().min(1, 'Başlık zorunlu'),
  price: z.number().min(0, 'Fiyat negatif olamaz'),
});

const packageSchema = z.object({
  name: z.string().min(3, 'Paket adı en az 3 karakter olmalı'),
  description: z.string().optional(),
  price: z.number().positive('Fiyat 0’dan büyük olmalı'),
  currency: z.string().min(3, 'Para birimi girin'),
  commissionRate: z.number().min(0, 'Komisyon oranı 0’dan küçük olamaz'),
  isCustom: z.boolean().default(false),
  customOptions: z.array(optionSchema).optional(),
  isActive: z.boolean(),
});

export type PackageFormValues = z.infer<typeof packageSchema>;

type PackageFormProps = {
  initialValues?: Package;
};

export function PackageForm({ initialValues }: PackageFormProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      price: Number(initialValues?.price ?? 0),
      currency: initialValues?.currency ?? 'EUR',
      commissionRate: Number(initialValues?.commissionRate ?? 0),
      isCustom: initialValues?.isCustom ?? false,
      customOptions: initialValues?.customOptions ?? [],
      isActive: initialValues?.isActive ?? true,
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'customOptions',
  });
  const isCustom = useWatch({ control: form.control, name: 'isCustom' });

  const createMutation = useMutation({
    mutationFn: (values: PackageFormValues) => createPackage(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      form.reset();
    },
    onError: () => {
      showToast({
        title: 'Paket oluşturulamadı',
        description: 'Bilgileri kontrol edip tekrar deneyin.',
        variant: 'error',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: PackageFormValues) =>
      updatePackage(initialValues?.id ?? '', values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
    },
    onError: () => {
      showToast({
        title: 'Paket güncellenemedi',
        description: 'Yetki ve bağlantı durumunu kontrol edin.',
        variant: 'error',
      });
    },
  });

  useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name,
        description: initialValues.description ?? '',
        price: Number(initialValues.price),
        currency: initialValues.currency,
        commissionRate: Number(initialValues.commissionRate),
        isCustom: initialValues.isCustom ?? false,
        customOptions: initialValues.customOptions ?? [],
        isActive: initialValues.isActive,
      });
    }
  }, [initialValues, form]);

  const onSubmit = (values: PackageFormValues) => {
    if (initialValues) {
      return updateMutation.mutate(values);
    }
    return createMutation.mutate(values);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div>
        <label className="text-xs text-slate-400">Paket Adı</label>
        <input
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          {...form.register('name')}
        />
        {form.formState.errors.name ? (
          <p className="text-xs text-rose-400">{form.formState.errors.name.message}</p>
        ) : null}
      </div>

      <div>
        <label className="text-xs text-slate-400">Açıklama</label>
        <textarea
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          {...form.register('description')}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="text-xs text-slate-400">Fiyat</label>
          <input
            type="number"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            {...form.register('price', { valueAsNumber: true })}
          />
          {form.formState.errors.price ? (
            <p className="text-xs text-rose-400">{form.formState.errors.price.message}</p>
          ) : null}
        </div>
        <div>
          <label className="text-xs text-slate-400">Para Birimi</label>
          <input
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            {...form.register('currency')}
          />
          {form.formState.errors.currency ? (
            <p className="text-xs text-rose-400">{form.formState.errors.currency.message}</p>
          ) : null}
        </div>
        <div>
          <label className="text-xs text-slate-400">Komisyon Oranı</label>
          <input
            type="number"
            step="0.01"
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            {...form.register('commissionRate', { valueAsNumber: true })}
          />
          {form.formState.errors.commissionRate ? (
            <p className="text-xs text-rose-400">
              {form.formState.errors.commissionRate.message}
            </p>
          ) : null}
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input type="checkbox" {...form.register('isActive')} />
        Aktif paket
      </label>

      <label className="flex items-center gap-2 text-xs text-slate-300">
        <input type="checkbox" {...form.register('isCustom')} />
        Custom paket
      </label>

  {isCustom ? (
        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-300">Custom seçenekler</p>
            <button
              type="button"
              className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-200"
              onClick={() =>
                append({
                  id: `opt_${fields.length + 1}`,
                  label: 'Yeni seçenek',
                  price: 0,
                })
              }
            >
              Ekle
            </button>
          </div>
          {fields.length === 0 ? (
            <p className="text-xs text-slate-500">Henüz seçenek eklenmedi.</p>
          ) : (
            fields.map((field, index) => (
              <div key={field.id} className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  placeholder="ID"
                  {...form.register(`customOptions.${index}.id` as const)}
                />
                <input
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  placeholder="Başlık"
                  {...form.register(`customOptions.${index}.label` as const)}
                />
                <input
                  type="number"
                  step="0.01"
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                  {...form.register(`customOptions.${index}.price` as const, { valueAsNumber: true })}
                />
                <button
                  type="button"
                  className="rounded-lg border border-rose-500/40 px-2 py-1 text-xs text-rose-200"
                  onClick={() => remove(index)}
                >
                  Sil
                </button>
              </div>
            ))
          )}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-indigo-500 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {initialValues ? 'Paket Güncelle' : 'Paket Oluştur'}
      </button>
    </form>
  );
}
