import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CART_STORAGE_KEY = 'omix_cart';

const CartContext = createContext(null);

// ── Reducers ──────────────────────────────────────────────
function cartReducer(state, action) {
  switch (action.type) {
    case 'SET_CART':
      return action.payload;

    case 'ADD_ITEM': {
      const existing = state.find(item => item.id === action.payload.id);
      if (existing) {
        return state.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...state, { ...action.payload, quantity: 1 }];
    }

    case 'REMOVE_ITEM':
      return state.filter(item => item.id !== action.payload);

    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      if (quantity <= 0) {
        return state.filter(item => item.id !== id);
      }
      return state.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
    }

    case 'CLEAR_CART':
      return [];

    default:
      return state;
  }
}

// ── Helpers ───────────────────────────────────────────────
function loadCartFromStorage() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // storage full or unavailable — silently fail
  }
}

// ── Provider ──────────────────────────────────────────────
export function CartProvider({ children }) {
  const [cart, dispatch] = useReducer(cartReducer, [], loadCartFromStorage);

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  // ── Actions ──
  const addItem = (product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
  };

  const removeItem = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  };

  const updateQuantity = (id, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // ── Selectors ──
  const getItems = () => cart;

  const getTotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const getItemCount = () =>
    cart.reduce((count, item) => count + item.quantity, 0);

  const value = {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItems,
    getTotal,
    getItemCount,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

export default { CartProvider, useCart };
