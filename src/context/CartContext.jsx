import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { trackAddToCart } from '../utils/analytics';

const CART_STORAGE_KEY = 'omix_cart';
const DB_NAME = 'omix_store';
const DB_VERSION = 1;
const STORE_NAME = 'cart';

const CartContext = createContext(null);

// ── IndexedDB helpers ──────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

async function saveCartToIndexedDB(cart) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // Clear existing and re-add all
    store.clear();
    for (const item of cart) {
      store.put(item);
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (e) {
    console.warn('IndexedDB save failed:', e.message);
  }
}

async function loadCartFromIndexedDB() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

async function clearCartInIndexedDB() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (e) {
    console.warn('IndexedDB clear failed:', e.message);
  }
}

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
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        );
      }
      return [...state, { ...action.payload, quantity: action.payload.quantity || 1 }];
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
  console.log('🔵 CartProvider rendering');
  const [cart, dispatch] = useReducer(cartReducer, [], loadCartFromStorage);
  console.log('🔵 CartProvider useReducer done');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  console.log('🔵 CartProvider useState done');
  const onAddCallback = useRef(null);
  const initialLoadDone = useRef(false);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // On mount, try to restore cart from IndexedDB if localStorage is empty
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const stored = loadCartFromStorage();
    if (stored.length === 0) {
      // localStorage is empty — try IndexedDB
      loadCartFromIndexedDB().then((idbCart) => {
        if (idbCart.length > 0) {
          dispatch({ type: 'SET_CART', payload: idbCart });
          saveCartToStorage(idbCart);
        }
      });
    }
  }, []);

  // Persist cart to localStorage + IndexedDB whenever it changes
  useEffect(() => {
    saveCartToStorage(cart);
    if (cart.length > 0) {
      saveCartToIndexedDB(cart);
    } else {
      clearCartInIndexedDB();
    }
  }, [cart]);

  // When coming back online, sync cart (re-save to both stores)
  useEffect(() => {
    if (isOnline && cart.length > 0) {
      saveCartToStorage(cart);
      saveCartToIndexedDB(cart);
    }
  }, [isOnline]);

  // ── Actions ──
  const addItem = useCallback((product) => {
    dispatch({ type: 'ADD_ITEM', payload: product });
    // Track add to cart event
    trackAddToCart(product.id, product.name, product.price, product.quantity || 1);
    // Trigger animation callback
    if (onAddCallback.current) {
      onAddCallback.current(product);
    }
  }, []);

  const removeItem = useCallback((id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
  }, []);

  const updateQuantity = useCallback((id, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  // ── Selectors ──
  const getItems = () => cart;
  const getTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const getItemCount = () => cart.reduce((count, item) => count + item.quantity, 0);

  // ── Animation callback registration ──
  const setOnAddCallback = useCallback((cb) => {
    onAddCallback.current = cb;
  }, []);

  const syncCart = useCallback(async () => {
    // Sync cart between localStorage and IndexedDB
    try {
      const stored = loadCartFromStorage();
      if (stored.length > 0) {
        await saveCartToIndexedDB(stored);
      }
    } catch (e) {
      console.warn('syncCart failed:', e.message);
    }
  }, []);

  const value = {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItems,
    getTotal,
    getItemCount,
    setOnAddCallback,
    syncCart,
    isOnline,
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
