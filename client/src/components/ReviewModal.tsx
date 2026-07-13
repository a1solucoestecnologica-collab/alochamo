import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  restaurantId: number;
  restaurantName: string;
  onSuccess?: () => void;
}

export default function ReviewModal({
  open,
  onOpenChange,
  orderId,
  restaurantId,
  restaurantName,
  onSuccess,
}: ReviewModalProps) {
  const [foodRating, setFoodRating] = useState(0);
  const [packagingRating, setPackagingRating] = useState(0);
  const [timeRating, setTimeRating] = useState(0);
  const [comment, setComment] = useState('');

  const createReviewMutation = trpc.reviews.create.useMutation();

  const handleSubmit = async () => {
    if (foodRating === 0 || packagingRating === 0 || timeRating === 0) {
      toast.error('Por favor, avalie todos os aspectos');
      return;
    }

    try {
      await createReviewMutation.mutateAsync({
        orderId,
        restaurantId,
        foodRating: foodRating * 100, // Converter para escala 0-500
        packagingRating: packagingRating * 100,
        timeRating: timeRating * 100,
        comment: comment || undefined,
      });

      toast.success('Avaliação enviada com sucesso!');
      onOpenChange(false);
      
      // Reset form
      setFoodRating(0);
      setPackagingRating(0);
      setTimeRating(0);
      setComment('');
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar avaliação');
    }
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Avaliar Pedido</DialogTitle>
          <DialogDescription>
            Como foi sua experiência com {restaurantName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <StarRating
            value={foodRating}
            onChange={setFoodRating}
            label="Qualidade da comida"
          />

          <StarRating
            value={packagingRating}
            onChange={setPackagingRating}
            label="Embalagem"
          />

          <StarRating
            value={timeRating}
            onChange={setTimeRating}
            label="Tempo de entrega"
          />

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos mais sobre sua experiência..."
              rows={4}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createReviewMutation.isPending}
              className="flex-1"
            >
              {createReviewMutation.isPending ? 'Enviando...' : 'Enviar avaliação'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
