import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Minus, Plus, Trash2, Tag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import BottomNav from '@/components/BottomNav';

export default function Cart() {
  const [, setLocation] = useLocation();
  const {
    items,
    restaurantId,
    restaurantName,
    updateQuantity,
    removeItem,
    clearCart,
    getTotal,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const { data: user } = trpc.auth.me.useQuery();

  const SERVICE_FEE = 0.99;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      // Simular validação de cupom (implementar query depois)
      toast.info('Validação de cupom em desenvolvimento');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao validar cupom');
    }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    const subtotal = getTotal();
    if (appliedCoupon.discountType === 'percentage') {
      return (subtotal * appliedCoupon.discountValue) / 100;
    }
    return appliedCoupon.discountValue;
  };

  const calculateFinalTotal = () => {
    const subtotal = getTotal();
    const discount = calculateDiscount();
    return subtotal + SERVICE_FEE - discount;
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('Faça login para continuar');
      setLocation('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }

    // Navegar para checkout
    setLocation('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
        {/* Header Mobile */}
        <MobileHeader />

        {/* Header Desktop */}
        <div className="hidden md:block">
          <Header />
        </div>

        <div className="container py-4 md:py-6">
        </div>

        <div className="container py-12">
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-600 mb-6">
              Adicione itens ao carrinho para continuar
            </p>
            <Button onClick={() => setLocation('/')}>
              Ver restaurantes
            </Button>
          </Card>
        </div>

        {/* Bottom Navigation Mobile */}
        <BottomNav />
      </div>
    );
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Meu Carrinho</h1>
          <Button
            variant="ghost"
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Limpar
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Itens do Carrinho */}
          <div className="lg:col-span-2 space-y-4">
            {/* Restaurante */}
            <Card className="p-4">
              <h2 className="font-semibold text-lg">{restaurantName}</h2>
            </Card>

            {/* Lista de Itens */}
            <div className="space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}

                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      
                      {item.additions && item.additions.length > 0 && (
                        <p className="text-sm text-gray-600 mb-1">
                          + {item.additions.map((add) => add.name).join(', ')}
                        </p>
                      )}

                      {item.observations && (
                        <p className="text-sm text-gray-600 mb-2">
                          Obs: {item.observations}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-semibold w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-bold text-primary">
                            R${' '}
                            {(
                              ((item.price +
                                (item.additions?.reduce((sum, add) => sum + add.price, 0) || 0)) *
                              item.quantity) / 100
                            ).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Resumo do pedido</h2>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R$ {(getTotal() / 100).toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Taxa de serviço</span>
                  <span>R$ {SERVICE_FEE.toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto ({appliedCoupon.code})</span>
                    <span>- R$ {(calculateDiscount() / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span className="text-primary">R$ {(calculateFinalTotal() / 100 + SERVICE_FEE).toFixed(2)}</span>
              </div>

              {/* Cupom */}
              <div className="mb-4">
                <label className="text-sm font-semibold mb-2 block">
                  Cupom de desconto
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Código do cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="pl-10"
                      disabled={!!appliedCoupon}
                    />
                  </div>
                  {appliedCoupon ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAppliedCoupon(null);
                        setCouponCode('');
                      }}
                    >
                      Remover
                    </Button>
                  ) : (
                    <Button onClick={handleApplyCoupon}>Aplicar</Button>
                  )}
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                size="lg"
                className="w-full"
              >
                Finalizar pedido
              </Button>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  );
}
