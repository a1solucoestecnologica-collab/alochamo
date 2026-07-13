import React, { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import type { CartItem, Product } from "../../../drizzle/schema";

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const cartListQuery = trpc.cart.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const addMutation = trpc.cart.add.useMutation();
  const removeMutation = trpc.cart.remove.useMutation();
  const updateMutation = trpc.cart.update.useMutation();
  const clearMutation = trpc.cart.clear.useMutation();

  useEffect(() => {
    if (cartListQuery.data) {
      setItems(cartListQuery.data);
    }
  }, [cartListQuery.data]);

  const addToCart = async (product: Product, quantity: number) => {
    if (!isAuthenticated) {
      toast.error("Faça login para adicionar itens ao carrinho");
      return;
    }

    setIsLoading(true);
    try {
      await addMutation.mutateAsync({ productId: product.id, quantity });
      const updatedCart = await cartListQuery.refetch();
      if (updatedCart.data) {
        setItems(updatedCart.data);
      }
      toast.success(`${product.name} adicionado ao carrinho!`);
    } catch (error) {
      toast.error("Erro ao adicionar ao carrinho");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (cartItemId: number) => {
    setIsLoading(true);
    try {
      await removeMutation.mutateAsync(cartItemId);
      const updatedCart = await cartListQuery.refetch();
      if (updatedCart.data) {
        setItems(updatedCart.data);
      }
      toast.success("Item removido do carrinho");
    } catch (error) {
      toast.error("Erro ao remover item");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    setIsLoading(true);
    try {
      await updateMutation.mutateAsync({ cartItemId, quantity });
      const updatedCart = await cartListQuery.refetch();
      if (updatedCart.data) {
        setItems(updatedCart.data);
      }
    } catch (error) {
      toast.error("Erro ao atualizar quantidade");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      await clearMutation.mutateAsync();
      setItems([]);
      toast.success("Carrinho limpo");
    } catch (error) {
      toast.error("Erro ao limpar carrinho");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotal = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getItemCount = () => {
    return items.length;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
