import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartItem, Category, Product, RestaurantSettings } from '../types/restaurant.ts';

interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface RestaurantContextValue {
  settings: RestaurantSettings | null;
  categories: Category[];
  products: Product[];
  loadingMenu: boolean;
  cart: CartItem[];
  cartCount: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  refreshMenu: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  notify: (text: string, type?: 'success' | 'error' | 'info') => void;
}

const CART_STORAGE_KEY = 'tfk_cart_v1';

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingMenu, setLoadingMenu] = useState<boolean>(true);
  const [cartOpen, setCartOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  const notify = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = (await res.json()) as RestaurantSettings;
        setSettings(data);
      }
    } catch {
      // Handled gracefully by UI defaults
    }
  }, []);

  const refreshMenu = useCallback(async () => {
    setLoadingMenu(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products?includeUnavailable=1'),
      ]);
      if (catRes.ok) {
        setCategories(await catRes.json());
      }
      if (prodRes.ok) {
        setProducts(await prodRes.json());
      }
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshMenu();
  }, [refreshSettings, refreshMenu]);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      if (!product.is_available) {
        notify(`${product.name} is currently unavailable.`, 'error');
        return;
      }
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, product, quantity: Math.min(50, i.quantity + quantity) } : i
          );
        }
        return [...prev, { product, quantity: Math.min(50, quantity) }];
      });
      notify(`Added ${product.name} to your order`, 'success');
    },
    [notify]
  );

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: Math.min(50, quantity) } : i))
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const value = useMemo<RestaurantContextValue>(
    () => ({
      settings,
      categories,
      products,
      loadingMenu,
      cart,
      cartCount,
      cartOpen,
      setCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshMenu,
      refreshSettings,
      notify,
    }),
    [
      settings,
      categories,
      products,
      loadingMenu,
      cart,
      cartCount,
      cartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshMenu,
      refreshSettings,
      notify,
    ]
  );

  return (
    <RestaurantContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all duration-200 ${
              toast.type === 'error'
                ? 'bg-[#7F1D1D] text-white border-[#991B1B]'
                : toast.type === 'info'
                ? 'bg-[#17201B] text-white border-[#2E3B33]'
                : 'bg-[#133827] text-white border-[#1D563C]'
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </RestaurantContext.Provider>
  );
}

export function useRestaurant(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error('useRestaurant must be used inside RestaurantProvider');
  }
  return ctx;
}
