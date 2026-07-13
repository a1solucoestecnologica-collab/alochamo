import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { User, MapPin, Heart, Settings, LogOut, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import BottomNav from '@/components/BottomNav';

export default function Profile() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      toast.success('Logout realizado com sucesso!');
      setLocation('/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer logout');
    }
  };

  if (!user) {
    setLocation('/');
    return null;
  }

  const menuItems = [
    {
      icon: User,
      title: 'Dados pessoais',
      description: 'Nome, CPF e telefone',
      onClick: () => setLocation('/perfil/dados-pessoais'),
    },
    {
      icon: MapPin,
      title: 'Endereços',
      description: 'Gerenciar endereços de entrega',
      onClick: () => setLocation('/perfil/enderecos'),
    },
    {
      icon: Heart,
      title: 'Favoritos',
      description: 'Restaurantes favoritos',
      onClick: () => setLocation('/perfil/favoritos'),
    },
    {
      icon: Settings,
      title: 'Configurações',
      description: 'Notificações e preferências',
      onClick: () => setLocation('/perfil/configuracoes'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header Mobile */}
      <MobileHeader />

      {/* Header Desktop */}
      <div className="hidden md:block">
        <Header />
      </div>

      <div className="container py-4 md:py-6">
        {/* Informações do Usuário */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </Card>

        {/* Menu de Opções */}
        <div className="space-y-3">
          {menuItems.map((item, index) => (
            <Card
              key={index}
              className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={item.onClick}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Card>
          ))}

          {/* Botão Sair */}
          <Card
            className="p-4 cursor-pointer hover:bg-red-50 transition-colors border-red-200"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-600">Sair</h3>
                <p className="text-sm text-red-600/70">Desconectar da conta</p>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  );
}
