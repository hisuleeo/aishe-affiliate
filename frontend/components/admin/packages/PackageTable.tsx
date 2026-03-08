import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Package } from '@shared/types';
import { deletePackage, getPackages } from '@/services/packageService';
import { useToast } from '@/components/ui/ToastProvider';

const formatCurrency = (amount: string, currency: string) => {
  const value = Number(amount);
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isNaN(value) ? 0 : value);
};

type PackageTableProps = {
  onEdit: (pkg: Package) => void;
};

export function PackageTable({ onEdit }: PackageTableProps) {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);
  const { showToast } = useToast();
  const { data, isLoading } = useQuery<Package[]>({
    queryKey: ['packages'],
    queryFn: getPackages,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePackage(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['packages'] });
      setDeleteTarget(null);
    },
    onError: () => {
      showToast({
        title: 'Paket silinemedi',
        description: 'Silme işlemi sırasında hata oluştu.',
        variant: 'error',
      });
    },
  });

  const packages = data ?? [];

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        Paketler yükleniyor...
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
      <div className="grid grid-cols-6 gap-4 border-b border-slate-800 px-6 py-4 text-xs uppercase text-slate-400">
        <span>Paket</span>
        <span>Fiyat</span>
        <span>Komisyon</span>
        <span>Durum</span>
        <span>Para Birimi</span>
        <span className="text-right">Aksiyon</span>
      </div>
      <div className="divide-y divide-slate-800">
        {packages.map((pkg) => (
          <div key={pkg.id} className="grid grid-cols-6 gap-4 px-6 py-4 text-sm text-slate-200">
            <div>
              <p className="font-semibold">{pkg.name}</p>
              <p className="text-xs text-slate-400">{pkg.description ?? '—'}</p>
            </div>
            <span>{formatCurrency(pkg.price, pkg.currency)}</span>
            <span>%{(Number(pkg.commissionRate) * 100).toFixed(0)}</span>
            <span className={pkg.isActive ? 'text-emerald-400' : 'text-rose-400'}>
              {pkg.isActive ? 'Aktif' : 'Pasif'}
            </span>
            <span>{pkg.currency}</span>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => onEdit(pkg)}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200 hover:border-indigo-500"
              >
                Düzenle
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(pkg)}
                className="rounded-lg border border-rose-500/60 px-3 py-1 text-xs text-rose-200 hover:border-rose-400"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>
      {deleteTarget ? (
        <div className="border-t border-slate-800 bg-slate-950/60 px-6 py-4 text-sm text-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-semibold">Silme onayı</p>
              <p className="text-xs text-slate-400">
                {deleteTarget.name} paketi silinecek. Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-200"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="rounded-lg border border-rose-500/60 px-3 py-1 text-xs text-rose-200"
                disabled={deleteMutation.isPending}
              >
                Silmeyi Onayla
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
