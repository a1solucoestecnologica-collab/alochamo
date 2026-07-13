import { Check, Clock, ChefHat, Package, Truck, Home, X } from 'lucide-react';

interface OrderTimelineProps {
  status: string;
  createdAt: Date | string;
  confirmedAt?: Date | string | null;
  preparingAt?: Date | string | null;
  readyAt?: Date | string | null;
  deliveringAt?: Date | string | null;
  deliveredAt?: Date | string | null;
  cancelledAt?: Date | string | null;
}

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Recebido', icon: Clock },
  { key: 'confirmed', label: 'Confirmado', icon: Check },
  { key: 'preparing', label: 'Preparando', icon: ChefHat },
  { key: 'ready', label: 'Pronto', icon: Package },
  { key: 'delivering', label: 'Saiu para entrega', icon: Truck },
  { key: 'delivered', label: 'Entregue', icon: Home },
];

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered'];

export default function OrderTimeline({ status, createdAt }: OrderTimelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(status);
  const isCancelled = status === 'cancelled';

  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return null;
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
          <X className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-red-700">Pedido Cancelado</p>
          <p className="text-sm text-red-600">Este pedido foi cancelado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="relative">
        {/* Linha de conexão */}
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-200" />
        
        {/* Steps */}
        <div className="space-y-4">
          {TIMELINE_STEPS.map((step, index) => {
            const isCompleted = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="relative flex items-center gap-4">
                {/* Círculo do step */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted
                      ? isCurrent
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Label e hora */}
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      isCompleted ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {isCompleted && index === 0 && (
                    <p className="text-sm text-gray-500">
                      {formatTime(createdAt)}
                    </p>
                  )}
                  {isCurrent && index > 0 && (
                    <p className="text-sm text-primary font-medium">
                      Em andamento...
                    </p>
                  )}
                </div>

                {/* Indicador de status atual */}
                {isCurrent && (
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
