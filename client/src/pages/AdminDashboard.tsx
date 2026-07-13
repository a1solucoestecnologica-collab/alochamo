import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { 
  Shield, 
  Store, 
  Package, 
  DollarSign, 
  Users,
  Tag,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Buscar dados administrativos
  const { data: restaurants } = trpc.restaurants.list.useQuery({});
  const { data: orders } = trpc.orders.myOrders.useQuery(undefined, { enabled: !!user });
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: banners } = trpc.banners.list.useQuery();

  // Redirecionar se não for admin
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

  if (!user || user.userType !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Painel do motor Chamo</CardTitle>
            <CardDescription>
              Area de administracao das lojas, cardapios, pedidos e dados da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" disabled>
              Acesso admin separado
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/")}>
              Voltar para o site
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRestaurants = restaurants?.length || 0;
  const totalOrders = orders?.length || 0;
  const totalCategories = categories?.length || 0;
  const totalBanners = banners?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Painel Administrativo</h1>
                <p className="text-sm text-muted-foreground">Gerencie toda a plataforma Chamô</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setLocation("/")}>
              Voltar para início
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Estatísticas Globais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Restaurantes</CardTitle>
              <Store className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRestaurants}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorias</CardTitle>
              <Tag className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCategories}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Banners Ativos</CardTitle>
              <ImageIcon className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBanners}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Gerenciamento */}
        <Card>
          <CardHeader>
            <CardTitle>Gerenciamento da Plataforma</CardTitle>
            <CardDescription>Gerencie restaurantes, categorias, banners e vouchers</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="restaurants" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="restaurants">Restaurantes</TabsTrigger>
                <TabsTrigger value="categories">Categorias</TabsTrigger>
                <TabsTrigger value="banners">Banners</TabsTrigger>
                <TabsTrigger value="vouchers">Vouchers</TabsTrigger>
              </TabsList>

              {/* Tab Restaurantes */}
              <TabsContent value="restaurants" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Lista de Restaurantes</h3>
                  <Button className="bg-primary hover:bg-primary/90">
                    Adicionar Restaurante
                  </Button>
                </div>
                <div className="space-y-2">
                  {restaurants?.map((restaurant: any) => (
                    <Card key={restaurant.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <Store className="w-8 h-8 text-gray-400" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{restaurant.name}</h4>
                              <p className="text-sm text-muted-foreground">{restaurant.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">Taxa: R$ {(restaurant.deliveryFee / 100).toFixed(2)}</Badge>
                                <Badge variant="outline">{restaurant.deliveryTime} min</Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Editar
                            </Button>
                            <Button variant="destructive" size="sm">
                              Desativar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Tab Categorias */}
              <TabsContent value="categories" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Categorias de Comida</h3>
                  <Button className="bg-primary hover:bg-primary/90">
                    Adicionar Categoria
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {categories?.map((category: any) => (
                    <Card key={category.id}>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <div className="text-4xl mb-2">{category.icon}</div>
                          <h4 className="font-semibold">{category.name}</h4>
                          <div className="flex gap-2 mt-4 justify-center">
                            <Button variant="outline" size="sm">Editar</Button>
                            <Button variant="destructive" size="sm">Remover</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Tab Banners */}
              <TabsContent value="banners" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Banners Promocionais</h3>
                  <Button className="bg-primary hover:bg-primary/90">
                    Adicionar Banner
                  </Button>
                </div>
                <div className="space-y-2">
                  {banners?.map((banner: any) => (
                    <Card key={banner.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden">
                              {banner.imageUrl ? (
                                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold">{banner.title}</h4>
                              <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                              <Badge variant="outline" className="mt-1">Ordem: {banner.order}</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">Editar</Button>
                            <Button variant="destructive" size="sm">Remover</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Tab Vouchers */}
              <TabsContent value="vouchers" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Vouchers e Cupons</h3>
                  <Button className="bg-primary hover:bg-primary/90">
                    Criar Voucher
                  </Button>
                </div>
                <div className="text-center py-12 text-muted-foreground">
                  Sistema de vouchers será implementado em breve.
                  <br />
                  Aqui você poderá criar e gerenciar cupons de desconto para a plataforma.
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
