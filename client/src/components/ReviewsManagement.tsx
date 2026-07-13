import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function ReviewsManagement() {
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');

  const { data: user } = trpc.auth.me.useQuery();
  
  // Buscar pedidos para pegar restaurantId
  const { data: orders } = trpc.orders.restaurantOrders.useQuery(
    undefined,
    { enabled: !!user }
  );
  
  const restaurantId = orders?.[0]?.restaurantId || 0;
  
  const { data: reviews, refetch } = trpc.reviews.listByRestaurant.useQuery(
    { restaurantId },
    { enabled: !!restaurantId }
  );

  const respondMutation = trpc.reviews.respond.useMutation();

  const handleRespond = async (reviewId: number) => {
    if (!responseText.trim()) {
      toast.error('Por favor, escreva uma resposta');
      return;
    }

    try {
      await respondMutation.mutateAsync({
        reviewId,
        response: responseText,
      });

      toast.success('Resposta enviada com sucesso!');
      setRespondingTo(null);
      setResponseText('');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar resposta');
    }
  };

  if (!reviews || reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
          <CardDescription>Gerencie as avaliações do seu restaurante</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma avaliação ainda</p>
            <p className="text-sm">As avaliações dos clientes aparecerão aqui</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calcular média geral
  const averageRating = reviews.reduce((acc: number, r: any) => acc + r.overallRating, 0) / reviews.length / 100;

  return (
    <div className="space-y-6">
      {/* Card de Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{averageRating.toFixed(1)}</div>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 mt-1">{reviews.length} avaliações</p>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm w-20">Comida:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${(reviews.reduce((acc: number, r: any) => acc + r.foodRating, 0) / reviews.length / 500) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm w-12 text-right">
                  {(reviews.reduce((acc: number, r: any) => acc + r.foodRating, 0) / reviews.length / 100).toFixed(1)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm w-20">Embalagem:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${(reviews.reduce((acc: number, r: any) => acc + r.packagingRating, 0) / reviews.length / 500) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm w-12 text-right">
                  {(reviews.reduce((acc: number, r: any) => acc + r.packagingRating, 0) / reviews.length / 100).toFixed(1)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm w-20">Tempo:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${(reviews.reduce((acc: number, r: any) => acc + r.timeRating, 0) / reviews.length / 500) * 100}%`,
                    }}
                  />
                </div>
                <span className="text-sm w-12 text-right">
                  {(reviews.reduce((acc: number, r: any) => acc + r.timeRating, 0) / reviews.length / 100).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Avaliações</CardTitle>
          <CardDescription>Responda às avaliações dos seus clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{review.customer?.name || 'Cliente'}</p>
                    <p className="text-sm text-gray-500">
                      Pedido #{review.orderId} •{' '}
                      {new Date(review.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{(review.overallRating / 100).toFixed(1)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                  <div>
                    <p className="text-gray-600">Comida</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{(review.foodRating / 100).toFixed(1)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">Embalagem</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{(review.packagingRating / 100).toFixed(1)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">Tempo</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{(review.timeRating / 100).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {review.comment && (
                  <p className="text-gray-700 mb-3 bg-gray-50 p-3 rounded">{review.comment}</p>
                )}

                {review.response ? (
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="font-semibold text-sm mb-1 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Sua resposta:
                    </p>
                    <p className="text-sm text-gray-700">{review.response}</p>
                  </div>
                ) : respondingTo === review.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Escreva sua resposta..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(review.id)}
                        disabled={respondMutation.isPending}
                      >
                        {respondMutation.isPending ? 'Enviando...' : 'Enviar resposta'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRespondingTo(review.id)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Responder
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
