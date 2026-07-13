import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, User, ShoppingCart, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

export default function CrmCustomerDetail() {
  const [, params] = useRoute("/painel-restaurante/crm/clientes/:id");
  const [, setLocation] = useLocation();
  const customerId = params?.id ? parseInt(params.id) : null;

  const { data, isLoading } = trpc.restaurant.crm.getCustomer.useQuery(
    { customerId: customerId! },
    { enabled: !!customerId }
  );

  if (!customerId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">ID do cliente inválido</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Cliente não encontrado</p>
        </CardContent>
      </Card>
    );
  }

  const { customer, stats, recentOrders } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/painel-restaurante?tab=crm")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            {customer.phone && <span>📞 {customer.phone}</span>}
            {customer.cpf && <span>🆔 {customer.cpf}</span>}
          </div>
        </div>
        <Badge
          className={`ml-auto ${
            stats.status === "VIP"
              ? "bg-purple-100 text-purple-700"
              : stats.status === "RECURRING"
              ? "bg-green-100 text-green-700"
              : stats.status === "NEW"
              ? "bg-blue-100 text-blue-700"
              : stats.status === "INACTIVE"
              ? "bg-gray-100 text-gray-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {stats.status}
        </Badge>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.ordersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpentCents / 100)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgTicketCents / 100)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último Pedido</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {stats.lastOrderAt
                ? new Date(stats.lastOrderAt).toLocaleDateString("pt-BR")
                : "N/A"}
            </div>
            {stats.frequencyDaysAvg && (
              <p className="text-xs text-muted-foreground mt-1">
                Frequência: {stats.frequencyDaysAvg.toFixed(1)} dias
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Pedidos</CardTitle>
          <CardDescription>Últimos 20 pedidos deste cliente</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum pedido encontrado</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold">Pedido #{order.orderNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <Badge
                      variant={
                        order.status === "delivered"
                          ? "default"
                          : order.status === "cancelled"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-2">Itens:</div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {order.items.map((item: any, idx: number) => (
                          <li key={idx}>
                            {item.quantity}x {item.name} - {formatCurrency(item.subtotal / 100)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t">
                    <span className="text-sm text-muted-foreground">
                      {order.items?.length || 0} {order.items?.length === 1 ? "item" : "itens"}
                    </span>
                    <span className="font-bold text-lg">
                      {formatCurrency(order.total / 100)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
