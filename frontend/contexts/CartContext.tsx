import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Product } from '../types';
import { useAuth } from './AuthContext';

interface CartItem extends Product {
  quantity: number;
  selected: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleSelect: (productId: string) => void;
  selectAll: (selected: boolean) => void;
  removeSelected: () => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  selectedCount: number;
  selectedPrice: number;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Sync with User state
  useEffect(() => {
    const syncCart = async () => {
      setIsInitializing(true);
      if (user) {
        try {
          const res = await fetch(`/api/cart?userId=${user.uid}`);
          if (res.ok) {
            const dbItems = await res.json();
            setItems(dbItems);
          }
        } catch (e) {
          console.error("Cart fetch error:", e);
        }
      } else {
        // Guest cart is now strictly in-memory or would require a session-based DB sync
        setItems([]);
      }
      setIsInitializing(false);
    };

    syncCart();
  }, [user]);

  // Save changes
  useEffect(() => {
    if (isInitializing) return;

    if (user) {
      fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, items })
      }).catch(err => console.error("Cart save error:", err));
    }
    // No longer saving to localStorage for guests
  }, [items, user, isInitializing]);

  const addItem = (product: Product, quantity: number = 1) => {
    if (!user) {
      navigate('/auth', { state: { from: location } });
      return;
    }
    setItems(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item => 
          item._id === product._id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { ...product, quantity, selected: true }];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prev => prev.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems(prev => prev.map(item => 
      item._id === productId ? { ...item, quantity } : item
    ));
  };

  const toggleSelect = (productId: string) => {
    setItems(prev => prev.map(item => 
      item._id === productId ? { ...item, selected: !item.selected } : item
    ));
  };

  const selectAll = (selected: boolean) => {
    setItems(prev => prev.map(item => ({ ...item, selected })));
  };

  const removeSelected = () => {
    setItems(prev => prev.filter(item => !item.selected));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = item.flash_sale ? item.flash_sale.sale_price : item.price;
    return sum + (price * item.quantity);
  }, 0);
  
  const selectedCount = items.filter(i => i.selected).reduce((sum, item) => sum + item.quantity, 0);
  const selectedPrice = items.filter(i => i.selected).reduce((sum, item) => {
    const price = item.flash_sale ? item.flash_sale.sale_price : item.price;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ 
      items, addItem, removeItem, updateQuantity, toggleSelect, selectAll, removeSelected, clearCart, 
      totalItems, totalPrice, selectedCount, selectedPrice, isOpen, setIsOpen 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
