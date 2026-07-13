import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Search, Star, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";
import { useCart } from "@/contexts/CartContext";
import { isRestaurantOpen } from "@/../../shared/restaurantStatus";

export default function RestaurantsList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [categoryScroll, setCategoryScroll] = useState(0);
  const { getItemCount } = useCart();


  const { data: categories } = trpc.categories.list.useQuery();
  const { data: restaurants } = trpc.restaurants.list.useQuery({
    categoryId: selectedCategory,
    search: searchQuery,
  });
  const { data: banners } = trpc.banners.list.useQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/busca?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    const container = document.getElementById('categories-container');
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollSection = (sectionId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(sectionId);
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header Mobile */}
      <MobileHeader />

      {/* Header Desktop */}
      <div className="hidden md:block">
        <Header />
      </div>

      <main className="container px-4 py-4 md:py-8 space-y-6 md:space-y-8">
        {/* Campo de Busca Mobile */}
        <div className="md:hidden">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Busque por item ou loja"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-gray-100 border-0 text-base"
              />
            </div>
          </form>
        </div>

        {/* Título */}
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-gray-900 mb-1">
            Pedir seu delivery no Chamô é rápido e prático!
          </h1>
          <p className="text-xs md:text-sm text-gray-600">Conheça as categorias</p>
        </div>

        {/* Carrossel de Categorias */}
        {categories && categories.length > 0 && (
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full hidden md:flex"
              onClick={() => scrollCategories('left')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div
              id="categories-container"
              className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-8 md:px-12"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <style>{`
                #categories-container::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id === selectedCategory ? undefined : category.id)}
                  className="flex flex-col items-center gap-2 flex-shrink-0 group"
                >
                  <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all ${
                    selectedCategory === category.id
                      ? 'bg-primary/10 ring-2 ring-primary'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}>
                    {category.icon && category.icon.startsWith('http') ? (
                      <img 
                        src={category.icon} 
                        alt={category.name}
                        className="w-10 h-10 md:w-12 md:h-12 object-contain"
                      />
                    ) : (
                      <span className="text-2xl md:text-3xl">{category.icon || '🍽️'}</span>
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center max-w-[80px] ${
                    selectedCategory === category.id ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {category.name}
                  </span>
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full hidden md:flex"
              onClick={() => scrollCategories('right')}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Banners */}
        {banners && banners.length > 0 && (
          <div className="relative mb-8">
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full hidden md:flex"
              onClick={() => scrollSection('banners-container', 'left')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div id="banners-container" className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-2 md:px-12">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex-shrink-0 w-full md:w-[calc(40%-8px)] cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
                  onClick={() => banner.linkUrl && setLocation(banner.linkUrl)}
                >
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-32 md:h-40 object-cover"
                  />
                </div>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full hidden md:flex"
              onClick={() => scrollSection('banners-container', 'right')}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Seção de Promoções */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Tudo a partir de R$0,99</h2>
            <Button variant="link" className="text-primary">Ver mais</Button>
          </div>
        </div>

        {/* Lista de Restaurantes */}
        <div>
          <h2 className="text-base md:text-lg font-bold text-gray-900 mb-3">Restaurantes</h2>
          
          {restaurants && restaurants.length > 0 ? (
            <div className="space-y-3">
              {restaurants.map((restaurant) => (
                <Card
                  key={restaurant.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                  onClick={() => setLocation(`/restaurante/${restaurant.slug}`)}
                >
                  <div className="flex gap-3 p-3">
                    {/* Logo do Restaurante */}
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                      {restaurant.logoUrl ? (
                        <img
                          src={restaurant.logoUrl}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : restaurant.coverUrl ? (
                        <img
                          src={restaurant.coverUrl}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5"></div>
                      )}
                    </div>

                    {/* Informações do Restaurante */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm line-clamp-1 text-gray-900">{restaurant.name}</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                        {restaurant.rating && restaurant.rating > 0 && (
                          <>
                            <div className="flex items-center gap-0.5">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{(restaurant.rating / 100).toFixed(1)}</span>
                            </div>
                            <span>•</span>
                          </>
                        )}
                        
                        <span>{restaurant.averagePrepTime}-{restaurant.averagePrepTime + 10} min</span>
                        
                        {restaurant.deliveryFee === 0 ? (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-medium">Grátis</span>
                          </>
                        ) : (
                          <>
                            <span>•</span>
                            <span>R$ {(restaurant.deliveryFee / 100).toFixed(2)}</span>
                          </>
                        )}
                      </div>

                      {/* Badge de Status Aberto/Fechado */}
                      {(() => {
                        const status = isRestaurantOpen(restaurant.operatingHours || []);
                        return (
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge 
                              variant={status.isOpen ? "default" : "secondary"}
                              className={`text-[10px] px-1.5 py-0 h-5 ${
                                status.isOpen 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-100' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              {status.isOpen ? '🟢 Aberto' : '🔴 Fechado'}
                            </Badge>
                            {!status.isOpen && status.nextOpenTime && (
                              <span className="text-[10px] text-gray-500">
                                Abre {status.nextOpenTime}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Badges de Promoção */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-green-100 text-green-700 hover:bg-green-100">
                          🎉 R$ 5 off
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold mb-2">Nenhum restaurante encontrado</h3>
              <p className="text-muted-foreground">
                Tente buscar por outra categoria ou termo
              </p>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-16 py-8 border-t">
        <div className="container text-center text-gray-600">
          <p className="font-semibold text-gray-900 mb-2">Chamô</p>
          <p className="text-sm">Delivery simples e rápido para sua cidade</p>
          <p className="text-xs mt-4">&copy; 2024 Chamô. Todos os direitos reservados.</p>
        </div>
      </footer>

      {/* Navegação Inferior Mobile */}
      <BottomNav />
    </div>
  );
}
