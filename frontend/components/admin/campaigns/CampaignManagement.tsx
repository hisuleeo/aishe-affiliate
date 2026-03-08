import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createCampaign,
  deleteCampaign,
  getCampaigns,
  getPrograms,
  updateCampaign,
  type Campaign,
  type CreateCampaignDto,
  type UpdateCampaignDto,
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

export function CampaignManagement() {
  const queryClient = useQueryClient();
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  const [formData, setFormData] = useState<CreateCampaignDto>({
    programId: '',
    name: '',
    status: 'active',
    startsAt: '',
    endsAt: '',
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['admin', 'programs'],
    queryFn: getPrograms,
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['admin', 'campaigns', selectedProgramId],
    queryFn: () => getCampaigns(selectedProgramId),
    enabled: !!selectedProgramId,
  });

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      toast.success('Kampanya başarıyla oluşturuldu');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kampanya oluşturulamadı');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignDto }) =>
      updateCampaign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      toast.success('Kampanya başarıyla güncellendi');
      setIsEditOpen(false);
      setSelectedCampaign(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kampanya güncellenemedi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      toast.success('Kampanya başarıyla silindi');
      setIsDeleteOpen(false);
      setSelectedCampaign(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Kampanya silinemedi');
    },
  });

  const resetForm = () => {
    setFormData({
      programId: selectedProgramId,
      name: '',
      status: 'active',
      startsAt: '',
      endsAt: '',
    });
  };

  const handleCreate = () => {
    const payload: CreateCampaignDto = {
      programId: formData.programId,
      name: formData.name,
      status: formData.status,
    };

    if (formData.startsAt) {
      payload.startsAt = new Date(formData.startsAt).toISOString();
    }
    if (formData.endsAt) {
      payload.endsAt = new Date(formData.endsAt).toISOString();
    }

    createMutation.mutate(payload);
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      programId: campaign.programId,
      name: campaign.name,
      status: campaign.status,
      startsAt: campaign.startsAt
        ? new Date(campaign.startsAt).toISOString().split('T')[0]
        : '',
      endsAt: campaign.endsAt
        ? new Date(campaign.endsAt).toISOString().split('T')[0]
        : '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedCampaign) return;

    const payload: UpdateCampaignDto = {
      name: formData.name,
      status: formData.status,
    };

    if (formData.startsAt) {
      payload.startsAt = new Date(formData.startsAt).toISOString();
    }
    if (formData.endsAt) {
      payload.endsAt = new Date(formData.endsAt).toISOString();
    }

    updateMutation.mutate({ id: selectedCampaign.id, data: payload });
  };

  const handleDelete = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedCampaign) return;
    deleteMutation.mutate(selectedCampaign.id);
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

  const formatDate = (date: string | null) => {
    if (!date) return 'Belirtilmemiş';
    return new Date(date).toLocaleDateString('tr-TR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kampanya Yönetimi</h2>
          <p className="text-muted-foreground">
            Program kampanyalarınızı yönetin
          </p>
        </div>
        <Button
          onClick={() => {
            setFormData({ ...formData, programId: selectedProgramId });
            setIsCreateOpen(true);
          }}
          disabled={!selectedProgramId}
        >
          Yeni Kampanya Oluştur
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="program-select">Program Seçin</Label>
          <select
            id="program-select"
            value={selectedProgramId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedProgramId(e.target.value)}
            className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            <option value="">Bir program seçin...</option>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProgramId && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Yükleniyor...</div>
              </div>
            ) : campaigns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-8">
                  <p className="text-muted-foreground mb-4">
                    Bu programa ait kampanya bulunmuyor
                  </p>
                  <Button
                    onClick={() => {
                      setFormData({ ...formData, programId: selectedProgramId });
                      setIsCreateOpen(true);
                    }}
                  >
                    İlk Kampanyayı Oluştur
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {campaigns.map((campaign) => (
                  <Card key={campaign.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <CardDescription>
                            {campaign._count?.affiliateLinks || 0} affiliate link
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Başlangıç:</span>
                            <span>{formatDate(campaign.startsAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bitiş:</span>
                            <span>{formatDate(campaign.endsAt)}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEdit(campaign)}
                          >
                            Düzenle
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDelete(campaign)}
                          >
                            Sil
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kampanya Oluştur</DialogTitle>
            <DialogDescription>
              Seçili program için yeni kampanya oluşturun
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Kampanya Adı *</Label>
              <Input
                id="campaign-name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Örn: Yaz İndirimi 2024"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaign-status">Durum</Label>
              <select
                id="campaign-status"
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
                <Label htmlFor="starts-at">Başlangıç Tarihi</Label>
                <Input
                  id="starts-at"
                  type="date"
                  value={formData.startsAt}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, startsAt: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ends-at">Bitiş Tarihi</Label>
                <Input
                  id="ends-at"
                  type="date"
                  value={formData.endsAt}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, endsAt: e.target.value })
                  }
                />
              </div>
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
            <Button onClick={handleCreate} disabled={!formData.name}>
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kampanyayı Düzenle</DialogTitle>
            <DialogDescription>
              Kampanya bilgilerini güncelleyin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-campaign-name">Kampanya Adı *</Label>
              <Input
                id="edit-campaign-name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-campaign-status">Durum</Label>
              <select
                id="edit-campaign-status"
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
                <Label htmlFor="edit-starts-at">Başlangıç Tarihi</Label>
                <Input
                  id="edit-starts-at"
                  type="date"
                  value={formData.startsAt}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, startsAt: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-ends-at">Bitiş Tarihi</Label>
                <Input
                  id="edit-ends-at"
                  type="date"
                  value={formData.endsAt}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, endsAt: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditOpen(false);
                setSelectedCampaign(null);
                resetForm();
              }}
            >
              İptal
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name}>
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kampanyayı Sil</DialogTitle>
            <DialogDescription>
              <strong>{selectedCampaign?.name}</strong> kampanyasını silmek istediğinize emin misiniz?
              Bu işlem geri alınamaz ve kampanyaya bağlı tüm affiliate linkleri de silinecektir.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteOpen(false);
                setSelectedCampaign(null);
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
