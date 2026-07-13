import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Tag, Percent, DollarSign, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumOrder?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number | null;
  validFrom: Date | string;
  validUntil: Date | string;
  isActive: boolean;
}

export default function CouponsManagement() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    minimumOrder: '',
    maxDiscount: '',
    usageLimit: '',
    validFrom: '',
    validUntil: '',
  });

  const { data: coupons, refetch } = trpc.coupons.listByRestaurant.useQuery();

  const createCoupon = trpc.coupons.create.useMutation({
    onSuccess: () => {
      toast({ title: 'Cupom criado!', description: 'O cupom foi criado com sucesso.' });
      refetch();
      resetForm();
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const deleteCoupon = trpc.coupons.delete.useMutation({
    onSuccess: () => {
      toast({ title: 'Cupom excluído!', description: 'O cupom foi removido.' });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'percentage',
      value: '',
      minimumOrder: '',
      maxDiscount: '',
      usageLimit: '',
      validFrom: '',
      validUntil: '',
    });
    setEditingCoupon(null);
    setShowDialog(false);
  };

  const handleSubmit = () => {
    if (!formData.code || !formData.value || !formData.validFrom || !formData.validUntil) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    createCoupon.mutate({
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: formData.type === 'percentage' 
        ? parseInt(formData.value) * 100 // Porcentagem * 100
        : parseInt(formData.value) * 100, // Valor em centavos
      minimumOrder: formData.minimumOrder ? parseInt(formData.minimumOrder) * 100 : undefined,
      maxDiscount: formData.maxDiscount ? parseInt(formData.maxDiscount) * 100 : undefined,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Tem certeza que deseja excluir este cupom?')) {
      deleteCoupon.mutate({ id });
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isExpired = (date: Date | string) => {
    return new Date(date) < new Date();
  };

  return (
    <Tabs defaultValue="cupons" className="space-y-6">
      <TabsList>
        <TabsTrigger value="cupons">Cupons</TabsTrigger>
        <TabsTrigger value="vouchers">Vouchers Chamô</TabsTrigger>
      </TabsList>

      <TabsContent value="cupons" className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cupons de Desconto</CardTitle>
            <CardDescription>Crie e gerencie cupons promocionais do seu restaurante</CardDescription>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cupom
          </Button>
        </CardHeader>
        <CardContent>
          {!coupons || coupons.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cupom cadastrado</p>
              <p className="text-sm">Crie seu primeiro cupom para atrair mais clientes!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {coupons.map((coupon: Coupon) => (
                <Card key={coupon.id} className={`${!coupon.isActive || isExpired(coupon.validUntil) ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${coupon.type === 'percentage' ? 'bg-blue-100' : 'bg-green-100'}`}>
                          {coupon.type === 'percentage' ? (
                            <Percent className="w-6 h-6 text-blue-600" />
                          ) : (
                            <DollarSign className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{coupon.code}</span>
                            {!coupon.isActive && <Badge variant="secondary">Inativo</Badge>}
                            {isExpired(coupon.validUntil) && <Badge variant="destructive">Expirado</Badge>}
                          </div>
                          <p className="text-sm text-gray-600">
                            {coupon.type === 'percentage' 
                              ? `${coupon.value / 100}% de desconto`
                              : `R$ ${(coupon.value / 100).toFixed(2)} de desconto`
                            }
                            {coupon.minimumOrder && ` (mín. R$ ${((coupon.minimumOrder || 0) / 100).toFixed(2)})`}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(coupon.validFrom)} até {formatDate(coupon.validUntil)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {coupon.usedCount || 0} / {coupon.usageLimit || '∞'}
                          </p>
                          <p className="text-xs text-gray-500">usos</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(coupon.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cupom de Desconto</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código do Cupom *</Label>
                <Input
                  placeholder="Ex: PROMO10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Desconto *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'percentage' | 'fixed') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor do Desconto *</Label>
                <Input
                  type="number"
                  placeholder={formData.type === 'percentage' ? 'Ex: 10' : 'Ex: 5'}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  {formData.type === 'percentage' ? 'Porcentagem de desconto' : 'Valor em reais'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Pedido Mínimo (R$)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 30"
                  value={formData.minimumOrder}
                  onChange={(e) => setFormData({ ...formData, minimumOrder: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Desconto Máximo (R$)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 20"
                  value={formData.maxDiscount}
                  onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                />
                <p className="text-xs text-gray-500">Apenas para cupons de porcentagem</p>
              </div>
              <div className="space-y-2">
                <Label>Limite de Usos</Label>
                <Input
                  type="number"
                  placeholder="Ilimitado"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Válido a partir de *</Label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Válido até *</Label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createCoupon.isPending}>
              {createCoupon.isPending ? 'Criando...' : 'Criar Cupom'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </TabsContent>


    </Tabs>
  );
}
