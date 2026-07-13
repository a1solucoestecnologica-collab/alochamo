import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, User } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import BottomNav from '@/components/BottomNav';

export default function PersonalData() {
  const [, setLocation] = useLocation();
  const { data: user, refetch } = trpc.auth.me.useQuery();
  const updateProfileMutation = trpc.auth.updateProfile.useMutation();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    cpf: user?.cpf || '',
    phone: user?.phone || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateProfileMutation.mutateAsync(formData);
      toast.success('Dados atualizados com sucesso!');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar dados');
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
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dados Pessoais</h1>
            <p className="text-gray-600">Atualize suas informações pessoais</p>
          </div>
        </div>

        {/* Formulário */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Seu nome completo"
                required
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  );
}
