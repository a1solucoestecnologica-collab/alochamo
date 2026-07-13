import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { Store, Clock, Phone, Mail, MapPin, Save, Image } from 'lucide-react';
import { HoursManagement } from './HoursManagement';


export default function RestaurantSettings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    averagePrepTime: '',
    isOpen: true,
  });

  const { data: restaurant, refetch } = trpc.restaurants.getMine.useQuery();

  useEffect(() => {
    if (restaurant) {
      setFormData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        street: restaurant.street || '',
        number: restaurant.number || '',
        complement: restaurant.complement || '',
        neighborhood: restaurant.neighborhood || '',
        city: restaurant.city || '',
        state: restaurant.state || '',
        zipCode: restaurant.zipCode || '',
        averagePrepTime: (restaurant.averagePrepTime || 30).toString(),
        isOpen: restaurant.status === 'approved',
      });
    }
  }, [restaurant]);

  const updateRestaurant = trpc.restaurants.update.useMutation({
    onSuccess: () => {
      toast({ title: 'Configurações salvas!', description: 'Os dados do restaurante foram atualizados.' });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    updateRestaurant.mutate({
      name: formData.name,
      description: formData.description,
      phone: formData.phone,
      email: formData.email,
      street: formData.street,
      number: formData.number,
      complement: formData.complement,
      neighborhood: formData.neighborhood,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      averagePrepTime: parseInt(formData.averagePrepTime) || 30,
    });
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Informações do Restaurante
          </CardTitle>
          <CardDescription>Dados básicos que aparecem para os clientes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Restaurante</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tempo Médio de Preparo (minutos)</Label>
              <Input
                type="number"
                value={formData.averagePrepTime}
                onChange={(e) => setFormData({ ...formData, averagePrepTime: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              rows={3}
              placeholder="Descreva seu restaurante..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Contato
          </CardTitle>
          <CardDescription>Informações de contato do restaurante</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Telefone / WhatsApp</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Endereço
          </CardTitle>
          <CardDescription>Localização do restaurante</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Rua</Label>
              <Input
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Número</Label>
              <Input
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Complemento</Label>
              <Input
                value={formData.complement}
                onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                placeholder="Sala, Loja, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                maxLength={2}
                placeholder="UF"
              />
            </div>
            <div className="space-y-2">
              <Label>CEP</Label>
              <Input
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="00000-000"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horário de Funcionamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Horário de Funcionamento
          </CardTitle>
          <CardDescription>Configure os horários em que seu restaurante aceita pedidos</CardDescription>
        </CardHeader>
        <CardContent>
          <HoursManagement />
        </CardContent>
      </Card>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button size="lg" onClick={handleSave} disabled={updateRestaurant.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateRestaurant.isPending ? 'Salvando...' : 'Salvar Todas as Alterações'}
          </Button>
        </div>
    </div>
  );
}
