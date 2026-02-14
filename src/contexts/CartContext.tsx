import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export type CartItem = {
  id: number;
  title: string;
  price: number;
  image: string | null;
  quantity: number;
  size?: string;
  color?: string;
  free_shipping?: boolean;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: number, size?: string, color?: string) => void;
  updateQuantity: (id: number, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on init
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems((current) => {
      const existing = current.find((item) => 
        item.id === product.id && item.size === product.size && item.color === product.color
      );
      const quantityToAdd = product.quantity || 1;
      
      if (existing) {
        return current.map((item) =>
          item.id === product.id && item.size === product.size && item.color === product.color
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      }
      return [...current, { ...product, quantity: quantityToAdd }];
    });
  }, []);

  const removeItem = useCallback((id: number, size?: string, color?: string) => {
    setItems((current) => current.filter((item) => 
      !(item.id === id && item.size === size && item.color === color)
    ));
  }, []);

  const updateQuantity = useCallback((id: number, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeItem(id, size, color);
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.id === id && item.size === size && item.color === color
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
