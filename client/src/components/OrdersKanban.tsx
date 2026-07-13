import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  Check, 
  ChefHat, 
  Package, 
  Truck, 
  X, 
  MessageCircle, 
  Printer,
  Phone,
  MapPin,
  Timer,
  DollarSign,
  User,
  Volume2,
  VolumeX
} from 'lucide-react';

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  createdAt: string | Date;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryComplement?: string | null;
  deliveryNeighborhood: string;
  deliveryCity: string;
  deliveryState: string;
  deliveryZipCode: string;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number | null;
  total: number;
  notes?: string | null;
  paymentMethod?: string;
  customerName?: string;
  customerPhone?: string;
  items?: any[];
}

const KANBAN_COLUMNS = [
  { 
    key: 'pending', 
    label: 'Novos Pedidos', 
    icon: Clock, 
    bgColor: 'bg-gradient-to-br from-red-500 to-orange-500',
    lightBg: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  { 
    key: 'confirmed', 
    label: 'Em Análise', 
    icon: Check, 
    bgColor: 'bg-gradient-to-br from-orange-500 to-yellow-500',
    lightBg: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  { 
    key: 'preparing', 
    label: 'Em Preparo', 
    icon: ChefHat, 
    bgColor: 'bg-gradient-to-br from-yellow-500 to-amber-500',
    lightBg: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  { 
    key: 'ready', 
    label: 'Prontos', 
    icon: Package, 
    bgColor: 'bg-gradient-to-br from-green-500 to-emerald-500',
    lightBg: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  { 
    key: 'delivering', 
    label: 'Em Entrega', 
    icon: Truck, 
    bgColor: 'bg-gradient-to-br from-blue-500 to-purple-500',
    lightBg: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
];

const STATUS_FLOW: Record<string, string> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivering',
  delivering: 'delivered',
};

const STATUS_ACTIONS: Record<string, string> = {
  pending: 'Aceitar',
  confirmed: 'Iniciar',
  preparing: 'Pronto',
  ready: 'Saiu',
  delivering: 'Entregue',
};

export default function OrdersKanban() {
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showTimeDialog, setShowTimeDialog] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState('30');
  const [orderForTime, setOrderForTime] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('orderSoundEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const previousPendingCount = useRef<number>(0);
  const isFirstRender = useRef(true);

  const { data: orders, refetch } = trpc.orders.restaurantOrders.useQuery();

  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      toast({ title: 'Status atualizado!', description: 'O pedido foi atualizado com sucesso.' });
      refetch();
      setSelectedOrder(null);
    },
    onError: (error) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });

  const handleAdvanceStatus = (order: Order) => {
    const nextStatus = STATUS_FLOW[order.status];
    if (nextStatus) {
      updateStatus.mutate({ orderId: order.id, status: nextStatus as any });
    }
  };

  const handleReject = (order: Order) => {
    updateStatus.mutate({ orderId: order.id, status: 'cancelled' });
  };

  const handleWhatsApp = (order: Order) => {
    const phone = order.customerPhone?.replace(/\D/g, '') || '';
    const message = encodeURIComponent(
      `Olá! Seu pedido #${order.orderNumber} está sendo preparado. Em breve você receberá atualizações!`
    );
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  const handlePrint = (order: Order) => {
    const printContent = `
      <html>
        <head>
          <title>Pedido #${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            .info { margin-bottom: 5px; }
            .items { margin-top: 20px; }
            .item { padding: 5px 0; border-bottom: 1px dashed #ccc; }
            .total { font-size: 18px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>Pedido #${order.orderNumber}</h1>
          <div class="info"><strong>Data:</strong> ${new Date(order.createdAt).toLocaleString('pt-BR')}</div>
          <div class="info"><strong>Cliente:</strong> ${order.customerName || 'Não informado'}</div>
          <div class="info"><strong>Telefone:</strong> ${order.customerPhone || 'Não informado'}</div>
          <div class="info"><strong>Endereço:</strong> ${order.deliveryStreet}, ${order.deliveryNumber}${order.deliveryComplement ? ` - ${order.deliveryComplement}` : ''}</div>
          <div class="info">${order.deliveryNeighborhood} - ${order.deliveryCity}/${order.deliveryState}</div>
          ${order.notes ? `<div class="info"><strong>Observações:</strong> ${order.notes}</div>` : ''}
          <div class="items">
            <h3>Itens:</h3>
            ${order.items?.map(item => `
              <div class="item">
                ${item.quantity}x ${item.name} - R$ ${(item.subtotal / 100).toFixed(2)}
              </div>
            `).join('') || '<div>Sem itens</div>'}
          </div>
          <div class="total">Total: R$ ${(order.total / 100).toFixed(2)}</div>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleSetTime = (order: Order) => {
    setOrderForTime(order);
    setShowTimeDialog(true);
  };

  const confirmTime = () => {
    if (orderForTime) {
      toast({
        title: 'Tempo estimado definido',
        description: `Tempo de preparo: ${estimatedTime} minutos`,
      });
      // Avançar para próximo status após definir tempo
      handleAdvanceStatus(orderForTime);
    }
    setShowTimeDialog(false);
    setOrderForTime(null);
  };

  const getOrdersByStatus = (status: string) => {
    return orders?.filter((o: Order) => o.status === status) || [];
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeSince = (date: string | Date) => {
    const diff = Date.now() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}min`;
  };

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configurar som (frequência e volume)
      oscillator.frequency.value = 800; // Hz - tom agudo
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3; // Volume (0 a 1)

      // Tocar som por 200ms
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      // Segundo beep após 250ms
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.2);
      }, 250);
    } catch (error) {
      console.error('Erro ao tocar som:', error);
    }
  };

  // Toggle de som
  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('orderSoundEnabled', JSON.stringify(newValue));
    toast({
      title: newValue ? '🔔 Som ativado' : '🔇 Som desativado',
      description: newValue ? 'Você será notificado quando novos pedidos chegarem' : 'Notificações sonoras desativadas',
    });
  };

  // Detectar novos pedidos
  useEffect(() => {
    if (!orders) return;

    const pendingOrders = orders.filter((o: Order) => o.status === 'pending');
    const currentPendingCount = pendingOrders.length;

    // Não tocar som no primeiro render
    if (isFirstRender.current) {
      previousPendingCount.current = currentPendingCount;
      isFirstRender.current = false;
      return;
    }

    // Se houver mais pedidos pendentes do que antes, tocar som
    if (currentPendingCount > previousPendingCount.current && soundEnabled) {
      playNotificationSound();
      toast({
        title: '🔔 Novo pedido!',
        description: `Você tem ${currentPendingCount} pedido(s) aguardando`,
      });
    }

    previousPendingCount.current = currentPendingCount;
  }, [orders, soundEnabled, toast]);

  return (
    <div className="h-full flex flex-col">
      {/* Sound Toggle Button */}
      <div className="mb-3 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleSound}
          className="flex items-center gap-2"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-4 h-4" />
              Som Ativado
            </>
          ) : (
            <>
              <VolumeX className="w-4 h-4" />
              Som Desativado
            </>
          )}
        </Button>
      </div>

      {/* Kanban Board - Full Height */}
      <div className="flex-1 flex gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => {
          const columnOrders = getOrdersByStatus(column.key);
          const Icon = column.icon;

          return (
            <div key={column.key} className="flex-1 min-w-[320px] flex flex-col">
              {/* Column Header */}
              <div className={`${column.bgColor} text-white rounded-t-xl px-4 py-3 flex items-center justify-between shadow-md`}>
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span className="font-bold text-base">{column.label}</span>
                </div>
                <Badge variant="secondary" className="bg-white/30 text-white font-bold px-2 py-1">
                  {columnOrders.length}
                </Badge>
              </div>

              {/* Column Content */}
              <div className={`flex-1 ${column.lightBg} rounded-b-xl p-3 space-y-3 overflow-y-auto`} style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {columnOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12">
                    <Icon className="w-12 h-12 mb-2 opacity-30" />
                    <p className="text-sm">Nenhum pedido</p>
                  </div>
                ) : (
                  columnOrders.map((order: Order) => (
                    <Card
                      key={order.id}
                      className={`cursor-pointer hover:shadow-lg transition-all duration-200 border-2 ${column.borderColor} hover:scale-[1.02]`}
                      onClick={() => setSelectedOrder(order)}
                    >
                      <CardContent className="p-4">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="font-bold text-xl text-gray-900">#{order.orderNumber}</span>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Timer className="w-3 h-3" />
                              Há {getTimeSince(order.createdAt)} • {formatTime(order.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* Cliente */}
                        <div className="mb-2 pb-2 border-b border-gray-200">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{order.customerName || 'Cliente não informado'}</span>
                          </div>
                          {order.customerPhone && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 ml-6">
                              <Phone className="w-3 h-3" />
                              {order.customerPhone}
                            </div>
                          )}
                        </div>

                        {/* Endereço */}
                        <div className="mb-3 text-sm text-gray-600">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-700">{order.deliveryStreet}, {order.deliveryNumber}</p>
                              <p className="text-xs text-gray-500">{order.deliveryNeighborhood}</p>
                            </div>
                          </div>
                        </div>

                        {/* Itens do Pedido */}
                        {order.items && order.items.length > 0 && (
                          <div className="mb-3 text-xs text-gray-600 bg-white rounded p-2 border border-gray-100">
                            <p className="font-semibold text-gray-700 mb-1">Itens:</p>
                            {order.items.slice(0, 2).map((item: any, idx: number) => (
                              <div key={idx} className="flex justify-between">
                                <span>{item.quantity}x {item.name}</span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <p className="text-gray-400 mt-1">+ {order.items.length - 2} item(ns)</p>
                            )}
                          </div>
                        )}

                        {/* Observações */}
                        {order.notes && (
                          <div className="mb-3 text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                            <p className="font-semibold text-yellow-800 mb-1">⚠️ Observações:</p>
                            <p className="text-yellow-700">{order.notes}</p>
                          </div>
                        )}

                        {/* Total */}
                        <div className="flex items-center justify-between mb-3 pt-2 border-t border-gray-200">
                          <span className="text-sm font-semibold text-gray-700">Total</span>
                          <span className="text-xl font-bold text-primary">
                            R$ {(order.total / 100).toFixed(2)}
                          </span>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex gap-2">
                          {column.key === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="flex-1 h-9 font-semibold"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetTime(order);
                                }}
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Aceitar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-9 w-9 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReject(order);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {column.key !== 'pending' && STATUS_FLOW[column.key] && (
                            <Button
                              size="sm"
                              className="flex-1 h-9 font-semibold"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAdvanceStatus(order);
                              }}
                            >
                              {STATUS_ACTIONS[column.key]}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              Pedido #{selectedOrder?.orderNumber}
              <Badge variant="outline" className="text-sm">
                {KANBAN_COLUMNS.find(c => c.key === selectedOrder?.status)?.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Info do Cliente */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-lg">
                  <User className="w-5 h-5" /> Informações do Cliente
                </h4>
                <div className="space-y-1">
                  <p className="text-sm"><span className="font-medium">Nome:</span> {selectedOrder.customerName || 'Não informado'}</p>
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedOrder.customerPhone || 'Sem telefone'}
                  </p>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5" /> Endereço de Entrega
                </h4>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {selectedOrder.deliveryStreet}, {selectedOrder.deliveryNumber}
                    {selectedOrder.deliveryComplement && ` - ${selectedOrder.deliveryComplement}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedOrder.deliveryNeighborhood} - {selectedOrder.deliveryCity}/{selectedOrder.deliveryState}
                  </p>
                  <p className="text-sm text-gray-600">CEP: {selectedOrder.deliveryZipCode}</p>
                </div>
              </div>

              {/* Itens */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-lg">Itens do Pedido</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.quantity}x {item.name}</p>
                        {item.additionals && item.additionals.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            + {item.additionals.map((a: any) => a.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-semibold">R$ {(item.subtotal / 100).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totais */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R$ {(selectedOrder.subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de entrega</span>
                  <span>R$ {(selectedOrder.deliveryFee / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxa de serviço</span>
                  <span>R$ {(selectedOrder.serviceFee / 100).toFixed(2)}</span>
                </div>
                {(selectedOrder.discount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>- R$ {((selectedOrder.discount ?? 0) / 100).toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-xl pt-2">
                  <span>Total</span>
                  <span className="text-primary">R$ {(selectedOrder.total / 100).toFixed(2)}</span>
                </div>
              </div>

              {/* Observações */}
              {selectedOrder.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 text-yellow-800">⚠️ Observações do Cliente</h4>
                  <p className="text-sm text-yellow-700">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Pagamento */}
              {selectedOrder.paymentMethod && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-5 h-5" /> Forma de Pagamento
                  </h4>
                  <p className="text-sm mt-1">{selectedOrder.paymentMethod}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => selectedOrder && handleWhatsApp(selectedOrder)}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => selectedOrder && handlePrint(selectedOrder)}
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            {selectedOrder && STATUS_FLOW[selectedOrder.status] && (
              <Button
                className="flex-1"
                onClick={() => handleAdvanceStatus(selectedOrder)}
                disabled={updateStatus.isPending}
              >
                {STATUS_ACTIONS[selectedOrder.status]}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Time Estimation Dialog */}
      <Dialog open={showTimeDialog} onOpenChange={setShowTimeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tempo Estimado de Preparo</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              Informe o tempo estimado (minutos):
            </label>
            <Input
              type="number"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              min="5"
              max="120"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmTime}>
              Confirmar e Aceitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
