import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { ShoppingCart, Plus } from "lucide-react";
import { getLoginUrl } from "@/const";
import type { Product } from "../../../drizzle/schema";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isLoading } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    await addToCart(product, quantity);
    setQuantity(1);
  };

  const displayPrice = product.discount ? product.price - product.discount : product.price;
  const priceInReais = (displayPrice / 100).toFixed(2);
  const originalPrice = product.price / 100;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/20">
      {/* Imagem */}
      <div className="relative bg-black h-48 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <span className="text-4xl">🍣</span>
          </div>
        )}

        {/* Badge */}
        {product.badge && product.badge !== "none" && (
          <div className="absolute top-2 right-2">
            <Badge className="bg-primary text-white">
              {product.badge === "destaque" ? "Destaque" : "Promoção"}
            </Badge>
          </div>
        )}

        {/* Desconto */}
        {product.discount && (
          <div className="absolute top-2 left-2 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
            -{Math.round((product.discount / product.price) * 100)}%
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-white text-lg font-serif">{product.name}</h3>
          {product.description && (
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{product.description}</p>
          )}
        </div>

        {/* Preço */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-primary">R$ {priceInReais}</span>
          {product.discount && (
            <span className="text-sm text-gray-500 line-through">R$ {originalPrice.toFixed(2)}</span>
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-gray-700 rounded-lg">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-1 text-gray-400 hover:text-white transition"
            >
              −
            </button>
            <span className="px-3 py-1 text-white font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-1 text-gray-400 hover:text-white transition"
            >
              +
            </button>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={isLoading}
            className="flex-1 bg-primary text-white hover:bg-red-700"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
