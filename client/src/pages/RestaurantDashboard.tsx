import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { 
  Store, 
  Package, 
  Clock,
  CheckCircle,
  AlertCircle,
  LayoutGrid,
  UtensilsCrossed,
  Tag,
  Truck,
  Star,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronDown,
  Menu,
  MessageCircle,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MenuManagement from "@/components/MenuManagement";
import ReviewsManagement from "@/components/ReviewsManagement";
import OrdersKanban from "@/components/OrdersKanban";
import CouponsManagement from "@/components/CouponsManagement";
import DeliverySettings from "@/components/DeliverySettings";
import RestaurantSettings from "@/components/RestaurantSettings";
import RestaurantReports from "@/components/RestaurantReports";
import RestaurantCustomization from "@/components/RestaurantCustomization";
import ShareRestaurantLink from "@/components/ShareRestaurantLink";
import CrmWrapper from "@/components/CrmWrapper";
import Login from "@/pages/Login";

const SIDEBAR_ITEMS = [
  { key: 'pedidos', label: 'Pedidos', icon: LayoutGrid },
  { key: 'cardapio', label: 'Cardápio', icon: UtensilsCrossed },
  { key: 'promocoes', label: 'Promoções', icon: Tag },
  { key: 'crm', label: 'CRM', icon: Users },
  { key: 'entrega', label: 'Entrega', icon: Truck },
  { key: 'avaliacoes', label: 'Avaliações', icon: Star },
  { key: 'relatorios', label: 'Relatórios', icon: BarChart3 },
  { key: 'compartilhar', label: 'Compartilhar', icon: MessageCircle },
  { 
    key: 'configuracoes', 
    label: 'Configurações', 
    icon: Settings,
    submenu: [
      { key: 'configuracoes-gerais', label: 'Informações Gerais' },
      { key: 'configuracoes-personalizacao', label: 'Personalização' },
    ]
  },
];

export default function RestaurantDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pedidos');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [configuracoesExpanded, setConfiguracoesExpanded] = useState(false);

  // Buscar pedidos do restaurante
  const { data: orders } = trpc.orders.restaurantOrders.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: restaurant } = trpc.restaurants.getMine.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Buscar dados do restaurante (usar a query que existe no backend)
  // Para agora, vamos usar os dados do user que já temos

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const pendingOrders = orders?.filter((o: any) => o.status === "pending" || o.status === "received") || [];
  const preparingOrders = orders?.filter((o: any) => o.status === "preparing" || o.status === "confirmed") || [];
  const readyOrders = orders?.filter((o: any) => o.status === "ready") || [];
  const deliveringOrders = orders?.filter((o: any) => o.status === "delivering") || [];

  const renderContent = () => {
    switch (activeTab) {
      case 'pedidos':
        return <OrdersKanban />;
      case 'cardapio':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Cardápio</CardTitle>
              <CardDescription>Gerencie categorias, itens e adicionais do seu cardápio</CardDescription>
            </CardHeader>
            <CardContent>
              <MenuManagement />
            </CardContent>
          </Card>
        );
      case 'promocoes':
        return <CouponsManagement />;
      case 'entrega':
        return <DeliverySettings />;
      case 'avaliacoes':
        return <ReviewsManagement />;
      case 'relatorios':
        return <RestaurantReports />;
      case 'compartilhar':
        return restaurant?.slug ? (
          <ShareRestaurantLink
            restaurantSlug={restaurant.slug}
            restaurantName={restaurant.name}
          />
        ) : null;
      case 'crm':
        return <CrmWrapper />;
      case 'configuracoes':
      case 'configuracoes-gerais':
        return <RestaurantSettings />;
      case 'configuracoes-personalizacao':
        return <RestaurantCustomization />;
      default:
        return <OrdersKanban />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r transition-all duration-300 flex flex-col`}>
        {/* Logo */}
        <div className="h-16 border-b flex items-center justify-between px-4">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Store className="w-6 h-6 text-primary" />
              <span className="font-bold text-lg">Painel</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key || (item.submenu && item.submenu.some((sub: any) => sub.key === activeTab));
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            
            return (
              <div key={item.key}>
                <button
                  onClick={() => {
                    if (hasSubmenu) {
                      setConfiguracoesExpanded(!configuracoesExpanded);
                    } else {
                      setActiveTab(item.key);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary border-r-2 border-primary'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="font-medium flex-1">{item.label}</span>
                      {hasSubmenu && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          configuracoesExpanded ? 'rotate-180' : ''
                        }`} />
                      )}
                    </>
                  )}
                </button>
                
                {/* Submenu */}
                {hasSubmenu && configuracoesExpanded && sidebarOpen && (
                  <div className="bg-gray-50">
                    {item.submenu.map((subItem: any) => (
                      <button
                        key={subItem.key}
                        onClick={() => setActiveTab(subItem.key)}
                        className={`w-full flex items-center gap-3 pl-12 pr-4 py-2 text-left text-sm transition-colors ${
                          activeTab === subItem.key
                            ? 'bg-primary/10 text-primary border-r-2 border-primary'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Back to Home */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => setLocation("/")}
          >
            <ChevronLeft className="w-4 h-4" />
            {sidebarOpen && <span>Voltar ao início</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-bold">
              {SIDEBAR_ITEMS.find(i => i.key === activeTab)?.label || 'Painel'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Olá, {user.name}</span>
          </div>
        </header>

        {/* Stats Bar (only on Pedidos tab) */}
        {activeTab === 'pedidos' && (
          <div className="bg-white border-b px-6 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Novos</p>
                      <p className="text-2xl font-bold">{pendingOrders.length}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Em Preparo</p>
                      <p className="text-2xl font-bold">{preparingOrders.length}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Prontos</p>
                      <p className="text-2xl font-bold">{readyOrders.length}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Em Entrega</p>
                      <p className="text-2xl font-bold">{deliveringOrders.length}</p>
                    </div>
                    <Package className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
