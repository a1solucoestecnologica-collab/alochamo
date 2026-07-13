import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Heart, Star, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import BottomNav from '@/components/BottomNav';

export default function Favorites() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const { data: favorites, refetch } = trpc.favorites.list.useQuery();
  const removeFavoriteMutation = trpc.favorites.remove.useMutation();

  const handleRemoveFavorite = async (restaurantId: number) => {
    try {
      await removeFavoriteMutation.mutateAsync({ restaurantId });
      toast.success('Restaurante removido dos favoritos');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover favorito');
    }
  };

  if (!user) {
    setLocation('/');
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
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => setLocation('/perfil')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Título */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Meus Favoritos</h1>
            <p className="text-gray-600">Restaurantes que você favoritou</p>
          </div>
        </div>

        {/* Lista de Favoritos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites && favorites.length > 0 ? (
            favorites.map((favorite: any) => (
              <Card key={favorite.id} className="overflow-hidden">
                <div className="relative h-40">
                  <img
                    src={favorite.restaurant.imageUrl || '/placeholder-restaurant.jpg'}
                    alt={favorite.restaurant.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{favorite.restaurant.name}</h3>
                      <p className="text-sm text-gray-600">{favorite.restaurant.category}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFavorite(favorite.restaurantId)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{favorite.restaurant.rating || '5.0'}</span>
                    </div>
                    <span className="text-sm text-gray-600">•</span>
                    <span className="text-sm text-gray-600">{favorite.restaurant.deliveryTime || '30-40'} min</span>
                    <span className="text-sm text-gray-600">•</span>
                    <span className="text-sm text-gray-600">R$ {favorite.restaurant.deliveryFee || '5,00'}</span>
                  </div>

                  <Button
                    onClick={() => setLocation(`/restaurante/${favorite.restaurantId}`)}
                    className="w-full"
                  >
                    Ver cardápio
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="col-span-full p-12">
              <div className="text-center text-gray-500">
                <Heart className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-semibold mb-2">Nenhum restaurante favoritado</p>
                <p className="text-sm mb-4">
                  Explore restaurantes e adicione seus favoritos para acesso rápido
                </p>
                <Button onClick={() => setLocation('/')}>
                  Explorar restaurantes
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  );
}
