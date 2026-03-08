import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ReportOverview {
  summary: {
    totalUsers: number;
    totalOrders: number;
    totalRevenue: string;
  };
}

export function ReportsPanel() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'overview', startDate, endDate],
    queryFn: async () => {
      let url = '/admin/system/reports/overview';
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await apiClient.get<ReportOverview>(url);
      return response.data;
    },
  });

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Raporlar</h2>
          <p className="text-muted-foreground">
            Sistem genelinde istatistikler ve raporlar
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="start-date" className="text-sm font-medium">
            Başlangıç:
          </label>
          <input
            type="date"
            id="start-date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="end-date" className="text-sm font-medium">
            Bitiş:
          </label>
          <input
            type="date"
            id="end-date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </div>

        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="rounded bg-secondary px-4 py-2 text-sm hover:bg-secondary/80"
          >
            Temizle
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Toplam Kullanıcı
          </div>
          <div className="mt-2 text-3xl font-bold">
            {data?.summary.totalUsers.toLocaleString('tr-TR') || 0}
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Toplam Sipariş
          </div>
          <div className="mt-2 text-3xl font-bold">
            {data?.summary.totalOrders.toLocaleString('tr-TR') || 0}
          </div>
        </div>

        <div className="rounded-lg border p-6">
          <div className="text-sm font-medium text-muted-foreground">
            Toplam Gelir
          </div>
          <div className="mt-2 text-3xl font-bold">
            {data ? formatCurrency(data.summary.totalRevenue) : '₺0'}
          </div>
        </div>
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold">Detaylı Raporlar</h3>
        <p className="text-muted-foreground">
          Daha detaylı raporlar için gelişmiş analitik araçları yakında eklenecektir.
        </p>
      </div>
    </div>
  );
}
