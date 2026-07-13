import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  observations?: string;
  additions?: Array<{
    id: number;
    name: string;
    price: number;
  }>;
}

interface CartContextType {
  items: CartItem[];
  restaurantId: number | null;
  restaurantName: string | null;
  addItem: (item: Omit<CartItem, 'id'>, restaurantId: number, restaurantName: string) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart_items');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [restaurantId, setRestaurantId] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart_restaurant_id');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [restaurantName, setRestaurantName] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart_restaurant_name');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  // Persistir no localStorage quando mudar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart_items', JSON.stringify(items));
    }
  }, [items]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart_restaurant_id', JSON.stringify(restaurantId));
    }
  }, [restaurantId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cart_restaurant_name', JSON.stringify(restaurantName));
    }
  }, [restaurantName]);

  const addItem = (
    item: Omit<CartItem, 'id'>,
    newRestaurantId: number,
    newRestaurantName: string
  ) => {
    // Se o carrinho tem itens de outro restaurante, limpar
    if (restaurantId && restaurantId !== newRestaurantId) {
      const confirm = window.confirm(
        `Seu carrinho contém itens de ${restaurantName}. Deseja limpar o carrinho e adicionar itens de ${newRestaurantName}?`
      );
      if (!confirm) return;
      setItems([]);
    }

    setRestaurantId(newRestaurantId);
    setRestaurantName(newRestaurantName);

    setItems((prev) => {
      // Verificar se o item já existe (mesmo item e mesmas adições)
      const existingIndex = prev.findIndex(
        (i) =>
          i.menuItemId === item.menuItemId &&
          JSON.stringify(i.additions) === JSON.stringify(item.additions) &&
          i.observations === item.observations
      );

      if (existingIndex >= 0) {
        // Atualizar quantidade
        const updated = [...prev];
        updated[existingIndex].quantity += item.quantity;
        return updated;
      }

      // Adicionar novo item
      return [
        ...prev,
        {
          ...item,
          id: Date.now(), // ID temporário
        },
      ];
    });
  };

  const removeItem = (id: number) => {
    setItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (updated.length === 0) {
        setRestaurantId(null);
        setRestaurantName(null);
      }
      return updated;
    });
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantName(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cart_items');
      localStorage.removeItem('cart_restaurant_id');
      localStorage.removeItem('cart_restaurant_name');
    }
  };

  const getTotal = () => {
    return items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity;
      const additionsTotal = (item.additions || []).reduce(
        (sum, add) => sum + add.price * item.quantity,
        0
      );
      return total + itemTotal + additionsTotal;
    }, 0);
  };

  const getItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        restaurantId,
        restaurantName,
        addItem,
        removeItem,
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
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
