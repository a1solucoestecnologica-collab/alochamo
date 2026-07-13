import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, MapPin, Package, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import BottomNav from '@/components/BottomNav';
import ReviewModal from '@/components/ReviewModal';
import OrderTimeline from '@/components/OrderTimeline';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  preparing: { label: 'Preparando', color: 'bg-purple-100 text-purple-800' },
  ready: { label: 'Pronto', color: 'bg-green-100 text-green-800' },
  delivering: { label: 'Saiu para entrega', color: 'bg-indigo-100 text-indigo-800' },
  delivered: { label: 'Entregue', color: 'bg-gray-100 text-gray-800' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

export default function Orders() {
  const [, setLocation] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState<any>(null);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: orders, isLoading } = trpc.orders.myOrders.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (!user) {
    setLocation('/login');
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
        <h1 className="text-2xl font-bold mb-6">Meus Pedidos</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
              const isExpanded = selectedOrder === order.id;

              return (
                <Card key={order.id} className="overflow-hidden">
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedOrder(isExpanded ? null : order.id)}
                  >
                    {/* Header do Pedido */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg mb-1">
                          {order.restaurant?.name || 'Restaurante'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Pedido #{order.id} •{' '}
                          {new Date(order.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge className={status.color}>{status.label}</Badge>
                    </div>

                    {/* Resumo Rápido */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        <span>{order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-primary">
                          R$ {((order.total || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Detalhes Expandidos */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        {/* Timeline de Status */}
                        <div>
                          <h4 className="font-semibold mb-2">Acompanhe seu pedido</h4>
                          <OrderTimeline
                            status={order.status}
                            createdAt={order.createdAt}
                          />
                        </div>

                        <Separator />

                        {/* Itens do Pedido */}
                        <div>
                          <h4 className="font-semibold mb-2">Itens</h4>
                          <div className="space-y-2">
                            {order.items?.map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <div>
                                  <span className="font-medium">{item.quantity}x</span>{' '}
                                  {item.name}
                                  {item.notes && (
                                    <p className="text-xs text-gray-500 ml-6">
                                      Obs: {item.notes}
                                    </p>
                                  )}
                                  {item.additionals && item.additionals.length > 0 && (
                                    <p className="text-xs text-gray-500 ml-6">
                                      + {item.additionals.map((add: any) => add.name).join(', ')}
                                    </p>
                                  )}
                                </div>
                                <span className="text-gray-600">
                                  R$ {((item.unitPrice || 0) / 100).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Endereço de Entrega */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Endereço de Entrega
                          </h4>
                          <p className="text-sm text-gray-600">
                            {order.deliveryStreet}, {order.deliveryNumber}
                            {order.deliveryComplement && ` - ${order.deliveryComplement}`}
                            <br />
                            {order.deliveryNeighborhood && `${order.deliveryNeighborhood}, `}
                            {order.deliveryCity} - {order.deliveryState}
                          </p>
                        </div>

                        <Separator />

                        {/* Valores */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>R$ {((order.subtotal || 0) / 100).toFixed(2)}</span>
                          </div>
                          {order.deliveryFee > 0 && (
                            <div className="flex justify-between">
                              <span>Taxa de entrega</span>
                              <span>R$ {((order.deliveryFee || 0) / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {order.serviceFee > 0 && (
                            <div className="flex justify-between">
                              <span>Taxa de serviço</span>
                              <span>R$ {((order.serviceFee || 0) / 100).toFixed(2)}</span>
                            </div>
                          )}
                          {order.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Desconto</span>
                              <span>- R$ {((order.discount || 0) / 100).toFixed(2)}</span>
                            </div>
                          )}
                          <Separator />
                          <div className="flex justify-between font-bold text-base">
                            <span>Total</span>
                            <span className="text-primary">
                              R$ {((order.total || 0) / 100).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Ações */}
                        {order.status === 'delivered' && (
                          <div className="flex gap-3">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReviewingOrder(order);
                                setReviewModalOpen(true);
                              }}
                            >
                              <Star className="w-4 h-4 mr-2" />
                              Avaliar
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/restaurante/${order.restaurant?.slug}`);
                              }}
                            >
                              Pedir novamente
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-2xl font-bold mb-2">Nenhum pedido ainda</h2>
            <p className="text-gray-600 mb-6">
              Faça seu primeiro pedido e acompanhe aqui
            </p>
            <Button onClick={() => setLocation('/')}>
              Ver restaurantes
            </Button>
          </Card>
        )}
      </div>

      {/* Bottom Navigation Mobile */}
      <BottomNav />

      {/* Review Modal */}
      {reviewingOrder && (
        <ReviewModal
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          orderId={reviewingOrder.id}
          restaurantId={reviewingOrder.restaurantId}
          restaurantName={reviewingOrder.restaurant?.name || 'Restaurante'}
          onSuccess={() => {
            // Refetch orders to update UI
          }}
        />
      )}
    </div>
  );
}
