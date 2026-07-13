import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Users, TrendingUp, DollarSign, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLocation } from "wouter";

type CrmOverviewProps = {
  onNavigateToCustomer?: (customerId: number) => void;
};

export default function CrmOverview({ onNavigateToCustomer }: CrmOverviewProps = {}) {
  const [, setLocation] = useLocation();
  const { data: overview, isLoading } = trpc.restaurant.crm.overview.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!overview) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {overview.activeCustomers} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {overview.customersGrowth30d >= 0 ? '+' : ''}{overview.customersGrowth30d} nos últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview.avgTicketCents / 100)}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos (30d)</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.orders30d}</div>
            <p className="text-xs text-muted-foreground">
              {overview.inactiveCustomers} clientes inativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Últimos Clientes Ativos */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Clientes Ativos</CardTitle>
          <CardDescription>Clientes que fizeram pedidos recentemente</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.recentActiveCustomers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum cliente ativo encontrado</p>
          ) : (
            <div className="space-y-4">
              {overview.recentActiveCustomers.map((customer) => (
                <div
                  key={customer.customerId}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    if (onNavigateToCustomer) {
                      onNavigateToCustomer(customer.customerId);
                    } else {
                      setLocation(`/painel-restaurante/crm/clientes/${customer.customerId}`);
                    }
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{customer.customerName}</p>
                      <span className={`px-2 py-1 text-xs rounded ${
                        customer.status === 'VIP' ? 'bg-purple-100 text-purple-700' :
                        customer.status === 'RECURRING' ? 'bg-green-100 text-green-700' :
                        customer.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                        customer.status === 'INACTIVE' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {customer.status}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                      {customer.customerPhone && <span>📞 {customer.customerPhone}</span>}
                      {customer.customerCpf && <span>🆔 {customer.customerCpf}</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{customer.ordersCount} pedidos</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(customer.totalSpentCents / 100)}
                    </p>
                    {customer.lastOrderAt && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(customer.lastOrderAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
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
