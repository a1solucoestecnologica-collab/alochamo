import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, MapPin, Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import BottomNav from '@/components/BottomNav';

export default function Addresses() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: addresses, refetch: refetchAddresses } = trpc.addresses.list.useQuery();
  
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const addAddressMutation = trpc.addresses.create.useMutation();
  const updateAddressMutation = trpc.addresses.update.useMutation();
  const deleteAddressMutation = trpc.addresses.delete.useMutation();

  const [addressData, setAddressData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false,
  });

  const handleAddAddress = async () => {
    try {
      if (editingAddress) {
        await updateAddressMutation.mutateAsync({
          id: editingAddress.id,
          ...addressData,
        });
        toast.success('Endereço atualizado com sucesso!');
      } else {
        await addAddressMutation.mutateAsync(addressData);
        toast.success('Endereço adicionado com sucesso!');
      }
      setShowAddAddress(false);
      setEditingAddress(null);
      setAddressData({
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        isDefault: false,
      });
      refetchAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar endereço');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Deseja realmente excluir este endereço?')) return;
    
    try {
      await deleteAddressMutation.mutateAsync({ id });
      toast.success('Endereço excluído com sucesso!');
      refetchAddresses();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir endereço');
    }
  };

  if (!user) {
    setLocation('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header Mobile */}
      <MobileHeader />

      {/* Header Desktop */}
      <div className="hidden md:block">
        <Header />
      </div>

      <div className="container py-4 md:py-6">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => setLocation('/perfil')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Título */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Meus Endereços</h1>
            <p className="text-gray-600">Gerencie seus endereços de entrega</p>
          </div>
          <Button onClick={() => setShowAddAddress(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Lista de Endereços */}
        <div className="space-y-4">
          {addresses && addresses.length > 0 ? (
            addresses.map((address: any) => (
              <Card key={address.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold">{address.street}, {address.number}</p>
                    {address.complement && <p className="text-sm text-gray-600">{address.complement}</p>}
                    <p className="text-sm text-gray-600">
                      {address.neighborhood}, {address.city} - {address.state}
                    </p>
                    <p className="text-sm text-gray-600">CEP: {address.zipCode}</p>
                    {address.isDefault && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded mt-2 inline-block">
                        Padrão
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAddress(address);
                        setAddressData(address);
                        setShowAddAddress(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12">
              <div className="text-center text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-semibold mb-2">Nenhum endereço cadastrado</p>
                <p className="text-sm mb-4">Adicione um endereço para facilitar suas entregas</p>
                <Button onClick={() => setShowAddAddress(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar primeiro endereço
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modal Adicionar/Editar Endereço */}
      <Dialog open={showAddAddress} onOpenChange={(open) => {
        setShowAddAddress(open);
        if (!open) {
          setEditingAddress(null);
          setAddressData({
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: '',
            isDefault: false,
          });
        }
      }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Editar' : 'Adicionar'} Endereço</DialogTitle>
            <DialogDescription>Preencha os dados do endereço</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="street">Rua *</Label>
              <Input
                id="street"
                value={addressData.street}
                onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                placeholder="Nome da rua"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="number">Número *</Label>
                <Input
                  id="number"
                  value={addressData.number}
                  onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
                  placeholder="123"
                  required
                />
              </div>
              <div>
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={addressData.complement}
                  onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })}
                  placeholder="Apto 101"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="neighborhood">Bairro *</Label>
              <Input
                id="neighborhood"
                value={addressData.neighborhood}
                onChange={(e) => setAddressData({ ...addressData, neighborhood: e.target.value })}
                placeholder="Nome do bairro"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={addressData.city}
                  onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                  placeholder="Cidade"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  value={addressData.state}
                  onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                  placeholder="UF"
                  maxLength={2}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="zipCode">CEP *</Label>
              <Input
                id="zipCode"
                value={addressData.zipCode}
                onChange={(e) => setAddressData({ ...addressData, zipCode: e.target.value })}
                placeholder="00000-000"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={addressData.isDefault}
                onChange={(e) => setAddressData({ ...addressData, isDefault: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isDefault" className="cursor-pointer">
                Definir como endereço padrão
              </Label>
            </div>
            <Button onClick={handleAddAddress} className="w-full">
              {editingAddress ? 'Atualizar' : 'Adicionar'} endereço
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  );
}
