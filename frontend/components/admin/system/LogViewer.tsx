import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  metadata: any;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}

interface LogsResponse {
  logs: AuditLog[];
  total: number;
  limit: number;
  offset: number;
}

export function LogViewer() {
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data: actions = [] } = useQuery({
    queryKey: ['admin', 'log-actions'],
    queryFn: async () => {
      const response = await apiClient.get<string[]>('/admin/system/logs/actions');
      return response.data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'logs', selectedAction, page],
    queryFn: async () => {
      const offset = (page - 1) * limit;
      const url =
        selectedAction === 'all'
          ? `/admin/system/logs?limit=${limit}&offset=${offset}`
          : `/admin/system/logs?action=${selectedAction}&limit=${limit}&offset=${offset}`;
      const response = await apiClient.get<LogsResponse>(url);
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

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

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
            {data?.total || 0} toplam log kaydı
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <label htmlFor="action-filter" className="font-medium">
          Aksiyon:
        </label>
        <select
          id="action-filter"
          value={selectedAction}
          onChange={(e) => {
            setSelectedAction(e.target.value);
            setPage(1);
          }}
          className="rounded border px-3 py-2"
        >
          <option value="all">Tümü</option>
          {actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
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
                <th className="p-4 text-left font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody>
              {data?.logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Log bulunamadı
                  </td>
                </tr>
              ) : (
                data?.logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="p-4 text-sm">{formatDate(log.createdAt)}</td>
                    <td className="p-4">
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      {log.actor ? (
                        <div>
                          <div className="font-medium">{log.actor.name || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">
                            {log.actor.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded bg-secondary px-4 py-2 disabled:opacity-50"
          >
            Önceki
          </button>
          <span className="text-sm text-muted-foreground">
            Sayfa {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded bg-secondary px-4 py-2 disabled:opacity-50"
          >
            Sonraki
          </button>
        </div>
      )}
    </div>
  );
}
