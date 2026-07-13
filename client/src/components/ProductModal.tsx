import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus, X, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Addition {
  id: number;
  name: string;
  price: number;
  isAvailable?: boolean;
  isRequired?: boolean;
  maxQuantity?: number;
}

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
}

interface ProductModalProps {
  open: boolean;
  onClose: () => void;
  item: MenuItem | null;
  restaurantId: number;
  restaurantName: string;
}

export default function ProductModal({
  open,
  onClose,
  item,
  restaurantId,
  restaurantName,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');
  const [selectedAdditions, setSelectedAdditions] = useState<number[]>([]);
  const { addItem } = useCart();

  // Buscar adicionais do item quando o modal abrir
  const { data: additions, isLoading: loadingAdditions } = trpc.menu.additionals.getByItem.useQuery(
    { itemId: item?.id || 0 },
    { enabled: open && !!item?.id }
  );

  // Reset quando o modal fechar ou item mudar
  useEffect(() => {
    if (!open) {
      setQuantity(1);
      setObservations('');
      setSelectedAdditions([]);
    }
  }, [open, item?.id]);

  if (!item) return null;

  const handleAdditionToggle = (additionId: number) => {
    setSelectedAdditions((prev) =>
      prev.includes(additionId)
        ? prev.filter((id) => id !== additionId)
        : [...prev, additionId]
    );
  };

  const calculateTotal = () => {
    const itemTotal = item.price * quantity;
    const additionsTotal = (additions || [])
      .filter((add) => selectedAdditions.includes(add.id))
      .reduce((sum, add) => sum + add.price * quantity, 0);
    return itemTotal + additionsTotal;
  };

  const handleAddToCart = () => {
    const selectedAdditionsList = (additions || [])
      .filter((add) => selectedAdditions.includes(add.id))
      .map((add) => ({
        id: add.id,
        name: add.name,
        price: add.price,
      }));

    addItem(
      {
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
        imageUrl: item.imageUrl,
        observations: observations || undefined,
        additions: selectedAdditionsList.length > 0 ? selectedAdditionsList : undefined,
      },
      restaurantId,
      restaurantName
    );

    toast.success('Item adicionado ao carrinho!');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{item.name}</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        {/* Imagem */}
        {item.imageUrl && (
          <div className="w-full h-64 -mt-6 -mx-6 mb-4">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Informações do Produto */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
            {item.description && (
              <p className="text-gray-600">{item.description}</p>
            )}
            <p className="text-2xl font-bold text-primary mt-4">
              R$ {(item.price / 100).toFixed(2)}
            </p>
          </div>

          {/* Adicionais */}
          {loadingAdditions ? (
            <div className="flex items-center justify-center py-4 border-t">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Carregando adicionais...</span>
            </div>
          ) : additions && additions.length > 0 ? (
            <div className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Adicionais</h3>
              {additions.filter(add => add.isAvailable !== false).map((addition) => (
                <div
                  key={addition.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleAdditionToggle(addition.id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedAdditions.includes(addition.id)}
                      onCheckedChange={() => handleAdditionToggle(addition.id)}
                    />
                    <span>{addition.name}</span>
                    {addition.isRequired && (
                      <span className="text-xs text-red-500">(Obrigatório)</span>
                    )}
                  </div>
                  <span className="font-semibold">
                    + R$ {(addition.price / 100).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : null}

          {/* Observações */}
          <div className="space-y-2 border-t pt-4">
            <label className="font-semibold">Observações</label>
            <Textarea
              placeholder="Ex: Sem cebola, bem passado, etc."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>

          {/* Quantidade e Total */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-xl font-semibold w-8 text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={handleAddToCart}
              size="lg"
              className="gap-2"
            >
              Adicionar • R$ {(calculateTotal() / 100).toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
