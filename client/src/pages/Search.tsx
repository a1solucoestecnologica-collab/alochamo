import { useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import MobileHeader from '@/components/MobileHeader';
import BottomNav from '@/components/BottomNav';

export default function Search() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  
  const [searchTerm, setSearchTerm] = useState(urlParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(urlParams.get('categoria') || '');
  const [showFilters, setShowFilters] = useState(false);

  // Buscar categorias
  const { data: categories } = trpc.categories.list.useQuery();

  // Buscar restaurantes
  const { data: restaurants, isLoading: loadingRestaurants } = trpc.restaurants.list.useQuery({
    search: searchTerm || undefined,
  });

  // Buscar itens do cardápio
  const { data: menuItems, isLoading: loadingItems } = trpc.menu.items.search.useQuery(
    {
      search: searchTerm,
    },
    {
      enabled: searchTerm.length > 0,
    }
  );

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedCategory) params.set('categoria', selectedCategory);
    setLocation(`/busca?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setLocation('/busca');
  };

  const totalResults = (restaurants?.length || 0) + (menuItems?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Header Mobile */}
      <MobileHeader />

      {/* Header Desktop */}
      <div className="hidden md:block">
        <Header />
      </div>

      <div className="container py-4 md:py-6">
          {/* Campo de Busca */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Busque por restaurante ou prato"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-12"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>
            <Button onClick={handleSearch} size="lg" className="px-6">
              Buscar
            </Button>
          </div>

          {/* Botão de Filtros */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </Button>
            
            {(searchTerm || selectedCategory) && (
              <Button variant="ghost" onClick={clearFilters} className="text-sm">
                Limpar filtros
              </Button>
            )}
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <div className="space-y-3 pt-2 border-t">
              <h3 className="font-semibold text-sm">Categorias</h3>
              <div className="flex flex-wrap gap-2">
                {categories?.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategory === category.slug ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      setSelectedCategory(
                        selectedCategory === category.slug ? '' : category.slug
                      );
                    }}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        {/* Resultados */}
        <div className="space-y-6 mt-6">
        {/* Contador de Resultados */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {totalResults > 0 ? (
              <>
                {totalResults} resultado{totalResults !== 1 ? 's' : ''} encontrado
                {totalResults !== 1 ? 's' : ''}
              </>
            ) : (
              'Nenhum resultado encontrado'
            )}
          </h2>
        </div>

        {/* Restaurantes */}
        {restaurants && restaurants.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-700">Restaurantes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {restaurants.map((restaurant: any) => (
                <Card
                  key={restaurant.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setLocation(`/restaurante/${restaurant.slug}`)}
                >
                  <div className="relative">
                    {restaurant.coverUrl ? (
                      <img
                        src={restaurant.coverUrl}
                        alt={restaurant.name}
                        className="w-full h-40 object-cover"
                      />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                    {restaurant.logoUrl && (
                      <div className="absolute -bottom-6 left-4 w-16 h-16 rounded-full border-4 border-white bg-white overflow-hidden shadow-md">
                        <img
                          src={restaurant.logoUrl}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-4 pt-8">
                    <h3 className="font-bold text-lg mb-1">{restaurant.name}</h3>
                    {restaurant.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                        {restaurant.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Taxa: R$ {restaurant.deliveryFee ? (restaurant.deliveryFee / 100).toFixed(2) : '0,00'}
                      </span>
                      <span className="text-gray-600">
                        {restaurant.deliveryTime || '30-40'} min
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Itens do Cardápio */}
        {menuItems && menuItems.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-700">Pratos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {menuItems.map((item: any) => (
                <Card
                  key={item.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setLocation(`/restaurante/${item.restaurant?.slug}`)}
                >
                  <div className="flex gap-4 p-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{item.name}</h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">
                          R$ {(item.price / 100).toFixed(2)}
                        </span>
                        {item.restaurant && (
                          <span className="text-xs text-gray-500">
                            • {item.restaurant.name}
                          </span>
                        )}
                      </div>
                    </div>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Estado Vazio */}
        {!loadingRestaurants && !loadingItems && totalResults === 0 && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-600 mb-4">
              Tente buscar por outro termo ou ajuste os filtros
            </p>
            <Button onClick={clearFilters} variant="outline">
              Limpar filtros
            </Button>
          </Card>
        )}

        {/* Loading */}
        {(loadingRestaurants || loadingItems) && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
        </div>
      </div>

      {/* Bottom Navigation Mobile */}
      <BottomNav />
    </div>
  );
}
