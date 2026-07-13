import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CreditCard, Wallet, MapPin, Home, Store, Tag, Check, X, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import BottomNav from '@/components/BottomNav';

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { items, restaurantId, restaurantName, getTotal, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [customAddress, setCustomAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chamoVoucher, setChamoVoucher] = useState<any>(null);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: addresses } = trpc.addresses.list.useQuery(undefined, { enabled: !!user });
  const createOrderMutation = trpc.orders.create.useMutation();
  const utils = trpc.useUtils();

  // Taxa de serviço fixa em centavos (R$ 0,99 = 99 centavos)
  const SERVICE_FEE = 99;
  const subtotal = getTotal();
  const oldVoucherDiscount = appliedVoucher?.discount || 0;
  const chamoVoucherDiscount = chamoVoucher?.discountValue ? chamoVoucher.discountValue * 100 : 0;
  const discount = oldVoucherDiscount + chamoVoucherDiscount;
  const deliveryFee = deliveryType === 'pickup' ? 0 : 0; // TODO: calcular taxa de entrega
  const finalTotal = Math.max(0, subtotal + SERVICE_FEE + deliveryFee - discount);

  // Selecionar primeiro endereço automaticamente
  useEffect(() => {
    if (addresses && addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [addresses, selectedAddressId]);



  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      toast.error('Digite um código de voucher');
      return;
    }

    setIsApplyingVoucher(true);
    try {
      const result = await utils.vouchers.validate.fetch({
        code: voucherCode.trim().toUpperCase(),
      });

      if (result.voucher && result.item) {
        // Calcular desconto baseado no item do voucher
        const discount = result.item.price || 0;
        setAppliedVoucher({
          code: voucherCode.trim().toUpperCase(),
          discount: discount,
        });
        toast.success(`Voucher aplicado! Desconto de R$ ${(discount / 100).toFixed(2)}`);
      } else {
        toast.error('Voucher inválido');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao validar voucher');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
    toast.info('Voucher removido');
  };

  const getSelectedAddress = () => {
    if (deliveryType === 'pickup') return null;
    if (selectedAddressId && addresses) {
      return addresses.find(a => a.id === selectedAddressId);
    }
    return null;
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Faça login para continuar');
      setLocation('/login');
      return;
    }

    if (deliveryType === 'delivery') {
      const selectedAddr = getSelectedAddress();
      if (!selectedAddr && !customAddress.trim()) {
        toast.error('Por favor, selecione ou informe um endereço de entrega');
        return;
      }
    }

    if (items.length === 0) {
      toast.error('Seu carrinho está vazio');
      setLocation('/carrinho');
      return;
    }

    if (!restaurantId) {
      toast.error('Erro: restaurante não identificado');
      setLocation('/carrinho');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('[Checkout] Items from cart:', items);
      console.log('[Checkout] Restaurant ID:', restaurantId);
      
      const orderItems = items.map((item) => {
        console.log('[Checkout] Mapping item:', item);
        return {
          itemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          notes: item.observations,
          additionals: item.additions?.map((add) => ({
            additionalId: add.id,
            name: add.name,
            quantity: 1,
            unitPrice: add.price,
          })),
        };
      });
      
      console.log('[Checkout] Order items to send:', orderItems);

      const selectedAddr = getSelectedAddress();
      const addressData = deliveryType === 'pickup' 
        ? {
            street: 'Retirada no local',
            number: '-',
            neighborhood: '-',
            city: '-',
            state: '-',
            zipCode: '-',
          }
        : selectedAddr
        ? {
            street: selectedAddr.street,
            number: selectedAddr.number,
            complement: selectedAddr.complement || undefined,
            neighborhood: selectedAddr.neighborhood,
            city: selectedAddr.city,
            state: selectedAddr.state,
            zipCode: selectedAddr.zipCode,
          }
        : {
            street: customAddress || 'Não informado',
            number: 'S/N',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '00000-000',
            complement: deliveryNotes || undefined,
          };

      await createOrderMutation.mutateAsync({
        restaurantId: restaurantId!,
        items: orderItems,
        deliveryAddress: addressData,
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        discount: discount,
        voucherCode: appliedVoucher?.code,
        notes: deliveryNotes || undefined,
      });

      toast.success('Pedido realizado com sucesso!');
      clearCart();
      setLocation('/pedidos');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar pedido');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    setLocation('/carrinho');
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
        {/* Título da Página */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/carrinho')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <h1 className="text-xl md:text-2xl font-bold">Finalizar Pedido</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tipo de Entrega */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Store className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Tipo de Pedido</h2>
              </div>

              <RadioGroup value={deliveryType} onValueChange={(v) => setDeliveryType(v as 'delivery' | 'pickup')}>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      deliveryType === 'delivery' ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setDeliveryType('delivery')}
                  >
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Home className="w-5 h-5" />
                        <span className="font-semibold">Entrega</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Receba em casa
                      </p>
                    </Label>
                  </div>

                  <div 
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      deliveryType === 'pickup' ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setDeliveryType('pickup')}
                  >
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Store className="w-5 h-5" />
                        <span className="font-semibold">Retirada</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Retire no local
                      </p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>

            {/* Endereço de Entrega - só mostra se for entrega */}
            {deliveryType === 'delivery' && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold">Endereço de Entrega</h2>
                </div>

                {/* Endereços salvos */}
                {addresses && addresses.length > 0 ? (
                  <div className="space-y-3 mb-4">
                    <Label className="text-sm text-gray-600">Selecione um endereço salvo:</Label>
                    <RadioGroup 
                      value={selectedAddressId?.toString() || ''} 
                      onValueChange={(v) => {
                        setSelectedAddressId(parseInt(v));
                        setCustomAddress('');
                      }}
                    >
                      {addresses.map((addr) => (
                        <div 
                          key={addr.id}
                          className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setCustomAddress('');
                          }}
                        >
                          <RadioGroupItem value={addr.id.toString()} id={`addr-${addr.id}`} className="mt-1" />
                          <Label htmlFor={`addr-${addr.id}`} className="flex-1 cursor-pointer">
                            <div className="font-semibold">Endereço {addr.id}</div>
                            <p className="text-sm text-gray-600">
                              {addr.street}, {addr.number}
                              {addr.complement && ` - ${addr.complement}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {addr.neighborhood}, {addr.city} - {addr.state}
                            </p>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ) : null}

                {/* Endereço manual */}
                <div className="space-y-4">
                  {addresses && addresses.length > 0 && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">
                          ou digite um novo endereço
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="address">Endereço completo</Label>
                    <Input
                      id="address"
                      placeholder="Rua, número, bairro, cidade"
                      value={customAddress}
                      onChange={(e) => {
                        setCustomAddress(e.target.value);
                        if (e.target.value) setSelectedAddressId(null);
                      }}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Complemento / Ponto de referência</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ex: Apartamento 301, portão azul, próximo ao mercado"
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Voucher/Cupom */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Cupom de Desconto</h2>
              </div>

              {appliedVoucher ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-700">{appliedVoucher.code}</p>
                      <p className="text-sm text-green-600">
                        Desconto de R$ {(appliedVoucher.discount / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveVoucher}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código do cupom"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleApplyVoucher}
                    disabled={isApplyingVoucher || !voucherCode.trim()}
                  >
                    {isApplyingVoucher ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Aplicar'
                    )}
                  </Button>
                </div>
              )}
            </Card>

            {/* Forma de Pagamento */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">Forma de Pagamento</h2>
              </div>

              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="credit" id="credit" />
                    <Label htmlFor="credit" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        <span className="font-semibold">Cartão de Crédito</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Pagamento na entrega
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="debit" id="debit" />
                    <Label htmlFor="debit" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5" />
                        <span className="font-semibold">Cartão de Débito</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Pagamento na entrega
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        <span className="font-semibold">Dinheiro</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Pagamento na entrega
                      </p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💳</span>
                        <span className="font-semibold">PIX</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Pagamento na entrega
                      </p>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </Card>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="text-lg font-bold mb-4">Resumo do Pedido</h2>

              {/* Restaurante */}
              <div className="mb-4 pb-4 border-b">
                <p className="font-semibold">{restaurantName}</p>
                <p className="text-sm text-gray-600">{items.length} {items.length === 1 ? 'item' : 'itens'}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {deliveryType === 'delivery' ? '🏠 Entrega' : '🏪 Retirada no local'}
                </p>
              </div>

              {/* Valores */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R$ {(subtotal / 100).toFixed(2)}</span>
                </div>

                {deliveryType === 'delivery' && deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega</span>
                    <span>R$ {(deliveryFee / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span>Taxa de serviço</span>
                  <span>R$ {(SERVICE_FEE / 100).toFixed(2)}</span>
                </div>

                {appliedVoucher && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto ({appliedVoucher.code})</span>
                    <span>- R$ {(appliedVoucher.discount / 100).toFixed(2)}</span>
                  </div>
                )}

                {chamoVoucher && (
                  <div className="flex justify-between text-sm text-green-600 font-semibold">
                    <span>🎉 {chamoVoucher.title}</span>
                    <span>- R$ {(chamoVoucherDiscount / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-bold text-lg mb-6">
                <span>Total</span>
                <span className="text-primary">R$ {(finalTotal / 100).toFixed(2)}</span>
              </div>

              <Button
                onClick={handlePlaceOrder}
                size="lg"
                className="w-full"
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : 'Confirmar Pedido'}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4">
                Ao confirmar, você concorda com os termos de uso
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  );
}
