import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  type: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export function SystemSettings() {
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['admin', 'settings', selectedCategory],
    queryFn: async () => {
      const url =
        selectedCategory === 'all'
          ? '/admin/system/settings'
          : `/admin/system/settings?category=${selectedCategory}`;
      const response = await apiClient.get<SystemSetting[]>(url);
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await apiClient.patch(`/admin/system/settings/${key}`, {
        value,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Ayar güncellendi');
      setEditingKey(null);
      setEditValue('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Ayar güncellenemedi');
    },
  });

  const handleEdit = (setting: SystemSetting) => {
    setEditingKey(setting.key);
    setEditValue(setting.value);
  };

  const handleSave = (key: string) => {
    updateMutation.mutate({ key, value: editValue });
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const categories = [
    { value: 'all', label: 'Tümü' },
    { value: 'general', label: 'Genel' },
    { value: 'maintenance', label: 'Bakım' },
    { value: 'notification', label: 'Bildirim' },
  ];

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
          <h2 className="text-2xl font-bold">Sistem Ayarları</h2>
          <p className="text-muted-foreground">
            Sistem genelindeki ayarları yönetin
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === cat.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-medium">Anahtar</th>
              <th className="p-4 text-left font-medium">Değer</th>
              <th className="p-4 text-left font-medium">Kategori</th>
              <th className="p-4 text-left font-medium">Tip</th>
              <th className="p-4 text-right font-medium">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {settings.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Ayar bulunamadı
                </td>
              </tr>
            ) : (
              settings.map((setting) => (
                <tr key={setting.id} className="border-b last:border-0">
                  <td className="p-4 font-mono text-sm">{setting.key}</td>
                  <td className="p-4">
                    {editingKey === setting.key ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full rounded border px-2 py-1"
                        autoFocus
                      />
                    ) : (
                      <span className="break-all">{setting.value}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="inline-flex rounded-full bg-secondary px-2 py-1 text-xs">
                      {setting.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {setting.type}
                  </td>
                  <td className="p-4 text-right">
                    {editingKey === setting.key ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleSave(setting.key)}
                          disabled={updateMutation.isPending}
                          className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
                        >
                          Kaydet
                        </button>
                        <button
                          onClick={handleCancel}
                          className="rounded bg-secondary px-3 py-1 text-sm hover:bg-secondary/80"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(setting)}
                        className="rounded bg-secondary px-3 py-1 text-sm hover:bg-secondary/80"
                      >
                        Düzenle
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
