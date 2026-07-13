import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Star, Clock, DollarSign, MapPin, Heart, Share2 } from "lucide-react";
import { toast } from "sonner";
import ProductModal from "@/components/ProductModal";
import Header from "@/components/Header";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";
import { isRestaurantOpen, getRestaurantStatusMessage } from "@/../../shared/restaurantStatus";
import ClientIdentificationModal from "@/components/ClientIdentificationModal";
import { useClientIdentification } from "@/contexts/ClientIdentificationContext";

export default function Restaurant() {
  const [, params] = useRoute("/r/:slug") || useRoute("/restaurante/:slug");
  const [, setLocation] = useLocation();
  const slug = params?.slug || "";
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showIdentificationModal, setShowIdentificationModal] = useState(false);
  const [showHours, setShowHours] = useState(false);
  const { isIdentified } = useClientIdentification();

  // Mostrar modal de identificação se não estiver identificado
  useEffect(() => {
    if (!isIdentified) {
      setShowIdentificationModal(true);
    }
  }, [isIdentified]);

  const { data: restaurant, isLoading } = trpc.restaurants.getBySlug.useQuery({ slug });
  const { data: menuCategories } = trpc.menu.categories.listByRestaurant.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id }
  );
  const { data: menuItems } = trpc.menu.items.listByRestaurant.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id }
  );
  const { data: reviews } = trpc.reviews.listByRestaurant.useQuery(
    { restaurantId: restaurant?.id || 0 },
    { enabled: !!restaurant?.id }
  );

  const addFavoriteMutation = trpc.favorites.add.useMutation();

  const handleAddFavorite = async () => {
    if (!restaurant) return;
    
    try {
      await addFavoriteMutation.mutateAsync({ restaurantId: restaurant.id });
      toast.success("Restaurante adicionado aos favoritos!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao adicionar favorito");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: restaurant?.name,
        text: `Confira ${restaurant?.name} no Chamô!`,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Restaurante não encontrado</h2>
          <p className="text-muted-foreground mb-4">O restaurante que você procura não existe ou foi removido.</p>
          <Button onClick={() => setLocation("/")}>Voltar para Home</Button>
        </Card>
      </div>
    );
  }

  const itemsByCategory = menuCategories?.map(category => ({
    category,
    items: menuItems?.filter(item => item.categoryId === category.id && item.isAvailable) || []
  })) || [];
  
  // Verificar se restaurante está aberto
  const hours = restaurant && typeof restaurant.operatingHours === 'string' 
    ? JSON.parse(restaurant.operatingHours || '[]')
    : (restaurant?.operatingHours || []);
  const restaurantStatus = restaurant ? isRestaurantOpen(hours) : { isOpen: true };

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <ClientIdentificationModal
        open={showIdentificationModal}
        onOpenChange={setShowIdentificationModal}
        restaurantName={restaurant?.name}
      />

      {/* Header Mobile */}
      <MobileHeader />

      {/* Header Desktop */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Header com imagem de capa */}
      <div className="relative h-64 bg-gradient-to-br from-primary/20 to-secondary/20">
        {restaurant.coverUrl && (
          <img
            src={restaurant.coverUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        )}
        
        <div className="absolute top-4 left-4">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => setLocation("/")}
            className="shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            variant="secondary"
            size="icon"
            onClick={handleAddFavorite}
            className="shadow-lg"
          >
            <Heart className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={handleShare}
            className="shadow-lg"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Informações do restaurante */}
      <div className="container -mt-16 relative z-10">
        <Card className="shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {restaurant.logoUrl && (
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden flex-shrink-0">
                  <img
                    src={restaurant.logoUrl}
                    alt={`${restaurant.name} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{restaurant.name}</h1>
                  {(() => {
                    const hours = typeof restaurant.operatingHours === 'string' 
                      ? JSON.parse(restaurant.operatingHours || '[]')
                      : (restaurant.operatingHours || []);
                    const status = isRestaurantOpen(hours);
                    return (
                      <Badge 
                        variant={status.isOpen ? "default" : "secondary"}
                        className={`text-sm px-3 py-1 ${
                          status.isOpen 
                            ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                            : 'bg-red-100 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {status.isOpen ? '🟢 Aberto' : '🔴 Fechado'}
                      </Badge>
                    );
                  })()}
                </div>
                {(() => {
                  const hours = typeof restaurant.operatingHours === 'string' 
                    ? JSON.parse(restaurant.operatingHours || '[]')
                    : (restaurant.operatingHours || []);
                  const status = isRestaurantOpen(hours);
                  if (!status.isOpen && status.nextOpenTime) {
                    return (
                      <p className="text-sm text-muted-foreground mb-2">
                        Abre {status.nextOpenTime}
                      </p>
                    );
                  }
                  if (status.isOpen && status.closesAt) {
                    return (
                      <p className="text-sm text-muted-foreground mb-2">
                        Aberto até {status.closesAt}
                      </p>
                    );
                  }
                  return null;
                })()}
                
                {restaurant.description && (
                  <p className="text-muted-foreground mb-4">{restaurant.description}</p>
                )}

                {restaurant.bio && (
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold mb-2">Sobre nós</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{restaurant.bio}</p>
                  </div>
                )}

                {restaurant.openingHours && (() => {
                  try {
                    const hours = typeof restaurant.openingHours === 'string'
                      ? JSON.parse(restaurant.openingHours)
                      : restaurant.openingHours;
                    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
                    return (
                      <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                        <button
                          onClick={() => setShowHours(!showHours)}
                          className="w-full font-semibold flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                          <Clock className="w-4 h-4" />
                          Horário de Funcionamento
                          <span className="ml-auto text-sm">{showHours ? '▼' : '▶'}</span>
                        </button>
                        {showHours && (
                          <div className="text-sm text-muted-foreground space-y-1 mt-3">
                            {hours.map((h: any, idx: number) => (
                              <p key={idx}>
                                {daysOfWeek[h.dayOfWeek]}: {h.isClosed ? 'Fechado' : `${h.openTime} - ${h.closeTime}`}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  } catch (e) {
                    return null;
                  }
                })()}

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {restaurant.rating && restaurant.rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{(restaurant.rating / 100).toFixed(1)}</span>
                      <span className="text-muted-foreground">({restaurant.totalReviews || 0} avaliações)</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{restaurant.averagePrepTime} min</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span>Taxa: R$ {(restaurant.deliveryFee / 100).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{restaurant.neighborhood}, {restaurant.city}</span>
                  </div>
                </div>

                {restaurant.minimumOrder && restaurant.minimumOrder > 0 && (
                  <Badge variant="secondary" className="mt-3">
                    Pedido mínimo: R$ {(restaurant.minimumOrder / 100).toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cardápio */}
      <div className="container py-8">
        <h2 className="text-2xl font-bold mb-6">Cardápio</h2>

        {itemsByCategory.length > 0 ? (
          <div className="space-y-8">
            {itemsByCategory.map(({ category, items }) => (
              items.length > 0 && (
                <div key={category.id}>
                  <h3 className="text-xl font-bold mb-4">{category.name}</h3>
                  {category.description && (
                    <p className="text-muted-foreground mb-4">{category.description}</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => (
                      <Card
                        key={item.id}
                        className={`${
                          restaurantStatus.isOpen 
                            ? 'cursor-pointer hover:shadow-lg' 
                            : 'cursor-not-allowed opacity-60'
                        } transition-shadow`}
                        onClick={() => {
                          if (!restaurantStatus.isOpen) {
                            toast.error(`Restaurante fechado. Abre ${restaurantStatus.nextOpenTime || 'em breve'}`);
                            return;
                          }
                          setSelectedItem(item);
                          setShowProductModal(true);
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold mb-1">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-lg font-bold text-primary">
                                R$ {(item.price / 100).toFixed(2)}
                              </p>
                              {item.isFeatured && (
                                <Badge variant="secondary" className="mt-2">
                                  Mais pedido
                                </Badge>
                              )}
                            </div>

                            {item.imageUrl && (
                              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Este restaurante ainda não possui itens no cardápio.</p>
          </Card>
        )}
      </div>

      {/* Seção de Avaliações */}
      {reviews && reviews.length > 0 && (
        <div className="container py-8">
          <h2 className="text-2xl font-bold mb-6">Avaliações</h2>
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{review.customer?.name || 'Cliente'}</p>
                      <p className="text-sm text-gray-500">
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

                  <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
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
                    <p className="text-gray-700 mb-3">{review.comment}</p>
                  )}

                  {review.response && (
                    <div className="bg-gray-50 p-4 rounded-lg mt-4">
                      <p className="font-semibold text-sm mb-1">Resposta do restaurante:</p>
                      <p className="text-sm text-gray-700">{review.response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Produto */}
      <ProductModal
        open={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        restaurantId={restaurant?.id || 0}
        restaurantName={restaurant?.name || ''}
      />

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  );
}
