import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createProgram,
  deleteProgram,
  getPrograms,
  updateProgram,
  type CreateProgramDto,
  type Program,
  type UpdateProgramDto,
} from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export function ProgramManagement() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  const [formData, setFormData] = useState<CreateProgramDto>({
    name: '',
    status: 'active',
    attributionWindowDays: 30,
    cookieTtlDays: 30,
    defaultCurrency: 'USD',
  });

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['admin', 'programs'],
    queryFn: getPrograms,
  });

  const createMutation = useMutation({
    mutationFn: createProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] });
      toast.success('Program başarıyla oluşturuldu');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Program oluşturulamadı');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramDto }) =>
      updateProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] });
      toast.success('Program başarıyla güncellendi');
      setIsEditOpen(false);
      setSelectedProgram(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Program güncellenemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'programs'] });
      toast.success('Program başarıyla silindi');
      setIsDeleteOpen(false);
      setSelectedProgram(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Program silinemedi');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      status: 'active',
      attributionWindowDays: 30,
      cookieTtlDays: 30,
      defaultCurrency: 'USD',
    });
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (program: Program) => {
    setSelectedProgram(program);
    setFormData({
      name: program.name,
      status: program.status,
      attributionWindowDays: program.attributionWindowDays,
      cookieTtlDays: program.cookieTtlDays,
      defaultCurrency: program.defaultCurrency,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedProgram) return;
    updateMutation.mutate({ id: selectedProgram.id, data: formData });
  };

  const handleDelete = (program: Program) => {
    setSelectedProgram(program);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedProgram) return;
    deleteMutation.mutate(selectedProgram.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
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
          <h2 className="text-2xl font-bold">Program Yönetimi</h2>
          <p className="text-muted-foreground">
            Affiliate programlarınızı yönetin
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          Yeni Program Oluştur
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programs.map((program) => (
          <Card key={program.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{program.name}</CardTitle>
                  <CardDescription>
                    {program.defaultCurrency} • {program.attributionWindowDays} gün
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(program.status)}>
                  {program.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Kampanyalar</div>
                    <div className="font-medium">
                      {program._count?.campaigns || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Linkler</div>
                    <div className="font-medium">
                      {program._count?.affiliateLinks || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Satışlar</div>
                    <div className="font-medium">
                      {program._count?.conversions || 0}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>Attribution: {program.attributionWindowDays} gün</div>
                  <div>Cookie TTL: {program.cookieTtlDays} gün</div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(program)}
                  >
                    Düzenle
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDelete(program)}
                  >
                    Sil
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Program Oluştur</DialogTitle>
            <DialogDescription>
              Yeni bir affiliate programı oluşturun
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Program Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Örn: Premium Program"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Durum</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="attributionWindowDays">Attribution (Gün)</Label>
                <Input
                  id="attributionWindowDays"
                  type="number"
                  min={1}
                  value={formData.attributionWindowDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      attributionWindowDays: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cookieTtlDays">Cookie TTL (Gün)</Label>
                <Input
                  id="cookieTtlDays"
                  type="number"
                  min={1}
                  value={formData.cookieTtlDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cookieTtlDays: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Para Birimi *</Label>
              <select
                id="currency"
                value={formData.defaultCurrency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, defaultCurrency: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                resetForm();
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.defaultCurrency}
            >
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programı Düzenle</DialogTitle>
            <DialogDescription>
              Program bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Program Adı *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Durum</Label>
              <select
                id="edit-status"
                value={formData.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-attribution">Attribution (Gün)</Label>
                <Input
                  id="edit-attribution"
                  type="number"
                  min={1}
                  value={formData.attributionWindowDays}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      attributionWindowDays: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-cookie">Cookie TTL (Gün)</Label>
                <Input
                  id="edit-cookie"
                  type="number"
                  min={1}
                  value={formData.cookieTtlDays}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      cookieTtlDays: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-currency">Para Birimi *</Label>
              <select
                id="edit-currency"
                value={formData.defaultCurrency}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, defaultCurrency: e.target.value })
                }
                className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="TRY">TRY</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedProgram(null);
                resetForm();
              }}
            >
              İptal
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || !formData.defaultCurrency}
            >
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programı Sil</DialogTitle>
            <DialogDescription>
              <strong>{selectedProgram?.name}</strong> programını silmek istediğinize emin misiniz?
              Bu işlem geri alınamaz ve programa bağlı tüm kampanyalar, linkler ve satışlar da silinecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setSelectedProgram(null);
              }}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
