import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface ActionLog {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    roles: { role: string }[];
  } | null;
}

interface LogsResponse {
  data: ActionLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const actionColors: Record<string, string> = {
  'user.registered': 'bg-green-500 text-white',
  'user.logged_in': 'bg-blue-500 text-white',
  'order.created': 'bg-purple-500 text-white',
  'payout.approved': 'bg-green-600 text-white',
  'payout.rejected': 'bg-red-500 text-white',
  'support.ticket_created': 'bg-yellow-500 text-white',
  'support.ticket_closed': 'bg-gray-500 text-white',
};

export function LogViewer() {
  const [filters, setFilters] = useState({ action: '', entityType: '' });
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'action-logs', filters, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filters.action && { action: filters.action }),
        ...(filters.entityType && { entityType: filters.entityType }),
      });
      const response = await apiClient.get<LogsResponse>(`/admin/action-logs?${params}`);
      return response.data;
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  if (isLoading && !data) {
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
          <h2 className="text-2xl font-bold">Sistem Logları</h2>
          <p className="text-muted-foreground">
            {data?.pagination.total || 0} toplam log kaydı
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label htmlFor="action-filter" className="font-medium">
          Aksiyon:
        </label>
        <select
          id="action-filter"
          value={filters.action}
          onChange={(e) => {
            setFilters({ ...filters, action: e.target.value });
            setPage(1);
          }}
          className="rounded border px-3 py-2"
        >
          <option value="">Tümü</option>
          <option value="user.registered">user.registered</option>
          <option value="user.logged_in">user.logged_in</option>
          <option value="order.created">order.created</option>
        </select>

        <label htmlFor="entity-filter" className="font-medium ml-4">
          Entity:
        </label>
        <select
          id="entity-filter"
          value={filters.entityType}
          onChange={(e) => {
            setFilters({ ...filters, entityType: e.target.value });
            setPage(1);
          }}
          className="rounded border px-3 py-2"
        >
          <option value="">Tümü</option>
          <option value="User">User</option>
          <option value="Order">Order</option>
          <option value="SupportTicket">SupportTicket</option>
        </select>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-4 text-left font-medium">Zaman</th>
                <th className="p-4 text-left font-medium">Aksiyon</th>
                <th className="p-4 text-left font-medium">Kullanıcı</th>
                <th className="p-4 text-left font-medium">Entity</th>
                <th className="p-4 text-left font-medium">Metadata</th>
                <th className="p-4 text-left font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Log bulunamadı
                  </td>
                </tr>
              ) : (
                data?.data.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-4 text-sm font-mono">{formatDate(log.createdAt)}</td>
                    <td className="p-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${actionColors[log.action] || 'bg-gray-500 text-white'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.user ? (
                        <div>
                          <div className="font-medium">{log.user.name || log.user.email}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sistem</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-xs">
                        <div className="font-semibold">{log.entityType}</div>
                        {log.entityId && (
                          <div className="text-muted-foreground truncate max-w-[120px]">
                            {log.entityId}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      {log.metadata ? (
                        <details className="cursor-pointer">
                          <summary className="text-sm text-muted-foreground hover:text-foreground">
                            Detayları göster
                          </summary>
                          <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-xs">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 font-mono text-xs">{log.ipAddress || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded bg-secondary px-4 py-2 disabled:opacity-50"
          >
            Önceki
          </button>
          <span className="text-sm text-muted-foreground">
            Sayfa {page} / {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
            className="rounded bg-secondary px-4 py-2 disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
