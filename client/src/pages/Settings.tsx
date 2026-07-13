import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Settings as SettingsIcon, Bell, Tag, Store } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import BottomNav from '@/components/BottomNav';

export default function Settings() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();

  const [settings, setSettings] = useState({
    orderNotifications: true,
    promotions: true,
    newRestaurants: false,
  });

  const handleSaveSettings = () => {
    // Aqui você pode adicionar a lógica para salvar as preferências no backend
    toast.success('Preferências salvas com sucesso!');
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
            <SettingsIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-gray-600">Preferências e notificações</p>
          </div>
        </div>

        {/* Seção de Notificações */}
        <Card className="p-6 mb-4">
          <h2 className="text-lg font-semibold mb-4">Notificações</h2>
          <div className="space-y-6">
            {/* Notificações de Pedidos */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <Label htmlFor="orderNotifications" className="font-medium cursor-pointer">
                    Notificações de pedidos
                  </Label>
                  <p className="text-sm text-gray-600">Receba atualizações sobre seus pedidos</p>
                </div>
              </div>
              <Switch
                id="orderNotifications"
                checked={settings.orderNotifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, orderNotifications: checked })
                }
              />
            </div>

            {/* Promoções e Ofertas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <Label htmlFor="promotions" className="font-medium cursor-pointer">
                    Promoções e ofertas
                  </Label>
                  <p className="text-sm text-gray-600">Receba cupons e descontos exclusivos</p>
                </div>
              </div>
              <Switch
                id="promotions"
                checked={settings.promotions}
                onCheckedChange={(checked) => setSettings({ ...settings, promotions: checked })}
              />
            </div>

            {/* Novos Restaurantes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Store className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <Label htmlFor="newRestaurants" className="font-medium cursor-pointer">
                    Novos restaurantes
                  </Label>
                  <p className="text-sm text-gray-600">Saiba quando novos restaurantes entrarem</p>
                </div>
              </div>
              <Switch
                id="newRestaurants"
                checked={settings.newRestaurants}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, newRestaurants: checked })
                }
              />
            </div>
          </div>
        </Card>

        {/* Botão Salvar */}
        <Button onClick={handleSaveSettings} className="w-full">
          Salvar preferências
        </Button>
      </div>

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  );
}
