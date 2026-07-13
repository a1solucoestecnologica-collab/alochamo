import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, MapPin, Truck, DollarSign, Save } from 'lucide-react';

interface DeliveryZone {
  id: string;
  neighborhood: string;
  fee: number;
}

export default function DeliverySettings() {
  const { toast } = useToast();
  const [deliveryFee, setDeliveryFee] = useState('');
  const [minimumOrder, setMinimumOrder] = useState('');
  const [freeDeliveryMinimum, setFreeDeliveryMinimum] = useState('');
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [newZone, setNewZone] = useState({ neighborhood: '', fee: '' });

  const { data: restaurant, refetch } = trpc.restaurants.getMine.useQuery();

  useEffect(() => {
    if (restaurant) {
      setDeliveryFee(((restaurant.deliveryFee || 0) / 100).toString());
      setMinimumOrder(((restaurant.minimumOrder || 0) / 100).toString());
    }
  }, [restaurant]);

  const updateRestaurant = trpc.restaurants.update.useMutation({
    onSuccess: () => {
      toast({ title: 'Configurações salvas!', description: 'As configurações de entrega foram atualizadas.' });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    updateRestaurant.mutate({
      deliveryFee: Math.round(parseFloat(deliveryFee || '0') * 100),
    });
  };

  const addZone = () => {
    if (!newZone.neighborhood || !newZone.fee) {
      toast({ title: 'Erro', description: 'Preencha o bairro e a taxa.', variant: 'destructive' });
      return;
    }
    setZones([...zones, {
      id: Date.now().toString(),
      neighborhood: newZone.neighborhood,
      fee: parseFloat(newZone.fee) * 100,
    }]);
    setNewZone({ neighborhood: '', fee: '' });
    toast({ title: 'Zona adicionada!', description: 'A zona de entrega foi adicionada.' });
  };

  const removeZone = (id: string) => {
    setZones(zones.filter(z => z.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Configurações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Configurações de Entrega
          </CardTitle>
          <CardDescription>Configure as taxas e regras de entrega do seu restaurante</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Taxa de Entrega Padrão (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 5.00"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
              />
              <p className="text-xs text-gray-500">Taxa cobrada para todas as entregas</p>
            </div>

            <div className="space-y-2">
              <Label>Pedido Mínimo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 20.00"
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(e.target.value)}
              />
              <p className="text-xs text-gray-500">Valor mínimo para aceitar pedidos</p>
            </div>

            <div className="space-y-2">
              <Label>Entrega Grátis a partir de (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 50.00"
                value={freeDeliveryMinimum}
                onChange={(e) => setFreeDeliveryMinimum(e.target.value)}
              />
              <p className="text-xs text-gray-500">Deixe vazio para não oferecer</p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={updateRestaurant.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateRestaurant.isPending ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </CardContent>
      </Card>

      {/* Taxas por Bairro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Taxas por Bairro
          </CardTitle>
          <CardDescription>Configure taxas diferenciadas para cada bairro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de Zonas */}
          {zones.length > 0 && (
            <div className="space-y-2 mb-4">
              {zones.map((zone) => (
                <div key={zone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{zone.neighborhood}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">
                      R$ {(zone.fee / 100).toFixed(2)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeZone(zone.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Separator />

          {/* Adicionar Nova Zona */}
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Bairro</Label>
              <Input
                placeholder="Ex: Centro"
                value={newZone.neighborhood}
                onChange={(e) => setNewZone({ ...newZone, neighborhood: e.target.value })}
              />
            </div>
            <div className="w-32 space-y-2">
              <Label>Taxa (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="5.00"
                value={newZone.fee}
                onChange={(e) => setNewZone({ ...newZone, fee: e.target.value })}
              />
            </div>
            <Button onClick={addZone}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>

          {zones.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma zona de entrega configurada</p>
              <p className="text-sm">Adicione bairros com taxas diferenciadas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aviso */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <p className="text-sm text-yellow-800">
            <strong>Nota:</strong> As taxas por bairro têm prioridade sobre a taxa padrão. 
            Se o cliente estiver em um bairro cadastrado, será cobrada a taxa específica daquele bairro.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
