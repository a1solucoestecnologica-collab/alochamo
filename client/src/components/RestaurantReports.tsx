import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { BarChart3, TrendingUp, Package, DollarSign, Star, AlertTriangle } from 'lucide-react';

export default function RestaurantReports() {
  const { data: orders } = trpc.orders.restaurantOrders.useQuery();

  // Calcular estatísticas
  const totalOrders = orders?.length || 0;
  const deliveredOrders = orders?.filter((o: any) => o.status === 'delivered').length || 0;
  const cancelledOrders = orders?.filter((o: any) => o.status === 'cancelled').length || 0;
  const totalRevenue = orders?.reduce((sum: number, o: any) => {
    if (o.status === 'delivered') {
      return sum + (o.subtotal || 0);
    }
    return sum;
  }, 0) || 0;

  // Pedidos por dia (últimos 7 dias)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  const ordersByDay = last7Days.map(day => {
    const count = orders?.filter((o: any) => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate === day;
    }).length || 0;
    return { day: new Date(day).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }), count };
  });

  return (
    <div className="space-y-6">
      {/* Aviso */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            <strong>Valores estimados.</strong> Pagamento realizado fora do app.
          </p>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total de Pedidos</p>
                <p className="text-3xl font-bold">{totalOrders}</p>
              </div>
              <Package className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pedidos Entregues</p>
                <p className="text-3xl font-bold text-green-600">{deliveredOrders}</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cancelados</p>
                <p className="text-3xl font-bold text-red-600">{cancelledOrders}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-500 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Receita Estimada</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {(totalRevenue / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Pedidos por Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Pedidos nos Últimos 7 Dias
          </CardTitle>
          <CardDescription>Quantidade de pedidos recebidos por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-48 gap-2">
            {ordersByDay.map((item, idx) => {
              const maxCount = Math.max(...ordersByDay.map(d => d.count), 1);
              const height = (item.count / maxCount) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-sm font-medium">{item.count}</span>
                  <div
                    className="w-full bg-primary rounded-t transition-all"
                    style={{ height: `${Math.max(height, 5)}%` }}
                  />
                  <span className="text-xs text-gray-500">{item.day}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Conversão */}
      <Card>
        <CardHeader>
          <CardTitle>Taxa de Conclusão</CardTitle>
          <CardDescription>Porcentagem de pedidos entregues com sucesso</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0}%` }}
              />
            </div>
            <span className="text-lg font-bold">
              {totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0}%
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {deliveredOrders} de {totalOrders} pedidos foram entregues
          </p>
        </CardContent>
      </Card>

      {/* Itens Mais Vendidos - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Itens Mais Vendidos
          </CardTitle>
          <CardDescription>Os produtos mais populares do seu cardápio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Dados de vendas por item em breve</p>
            <p className="text-sm">Continue recebendo pedidos para gerar estatísticas</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
