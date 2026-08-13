import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, Bookmark } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatKES } from '../utils/constants';
import NiaContextualTrigger from '../components/NiaContextualTrigger';
import Breadcrumb from '../components/Breadcrumb';

const SAVED_KEY = 'stor1_saved_for_later';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); } catch { return []; }
}

export default function CartPage() {
  const { getItems, getTotal, updateQuantity, removeItem, getItemCount, addItem } = useCart();
  const items = getItems();
  const total = getTotal();
  const count = getItemCount();
  const [saved, setSaved] = useState(loadSaved);

  const persistSaved = (next) => {
    setSaved(next);
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch {}
  };

  const saveForLater = (item) => {
    persistSaved([item, ...saved.filter((s) => (s._cartKey || s.id) !== (item._cartKey || item.id))]);
    removeItem(item.id, item._cartKey);
  };

  const moveToCart = (item) => {
    addItem(item);
    persistSaved(saved.filter((s) => (s._cartKey || s.id) !== (item._cartKey || item.id)));
  };

  // ── Offline check removed ──

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#28303F] flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-[#4A5771]" />
          </div>
          <h1 className="text-2xl font-bold text-[#FAFAFA] mb-3">Your cart is empty</h1>
          <p className="text-[#4A5771] mb-8">Browse our products and add items to your cart.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-[#71717a] hover:bg-[#e62e4f] text-[#FAFAFA] font-semibold px-8 py-4 rounded-xl transition-colors mb-8">
            Browse Products
          </Link>
          <NiaContextualTrigger page="emptyCart" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-name="cart-page">
      <Breadcrumb />
      <h1 className="text-3xl font-black text-[#FAFAFA] mb-8">Shopping Cart ({count} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-[#28303F] rounded-3xl border border-[#353F54] p-4 flex gap-4">
              <div className="w-24 h-24 rounded-2xl bg-[#28303F] overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#4A5771]">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <Link to={`/listing/${item.id}`} className="font-bold text-[#FAFAFA] hover:text-[#71717a] transition-colors">
                  {item.name}
                </Link>
                {item.variant && (
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.variant.size && (
                      <span className="text-[10px] font-bold bg-[#28303F] text-[#4A5771] px-1.5 py-0.5 rounded-md">Size: {item.variant.size}</span>
                    )}
                    {item.variant.color && item.variant.colorName && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-[#28303F] text-[#4A5771] px-1.5 py-0.5 rounded-md">
                        <span className="w-2.5 h-2.5 rounded-full border border-zinc-300 dark:border-zinc-600 inline-block" style={{ backgroundColor: item.variant.color?.startsWith('#') ? item.variant.color : '#ccc' }} />
                        {item.variant.colorName}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-[#71717a] font-bold">{formatKES(item.price)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1, item._cartKey)} className="w-8 h-8 rounded-lg bg-[#28303F] flex items-center justify-center hover:bg-[#323B4F] transition-colors" aria-label={`Decrease quantity of ${item.name}`}>
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-8 text-center text-[#FAFAFA]">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1, item._cartKey)} className="w-8 h-8 rounded-lg bg-[#28303F] flex items-center justify-center hover:bg-[#323B4F] transition-colors" aria-label={`Increase quantity of ${item.name}`}>
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => saveForLater(item)} className="text-[#4A5771] hover:text-[#14b8a6] p-1 transition-colors" aria-label={`Save ${item.name} for later`}>
                      <Bookmark className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeItem(item.id, item._cartKey)} className="text-[#4A5771] hover:text-red-500 p-1 transition-colors" aria-label={`Remove ${item.name} from cart`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-[#FAFAFA]">{formatKES(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-[#28303F] rounded-3xl border border-[#353F54] p-6 h-fit sticky top-24">
          <h2 className="text-lg font-bold text-[#FAFAFA] mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-[#4A5771]">
              <span>Subtotal ({count} items)</span>
              <span>{formatKES(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#4A5771]">
              <span>Delivery</span>
              <span className="text-[#38B8EA]">Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t border-[#353F54] pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#FAFAFA]">Total</span>
              <span className="text-2xl font-black text-[#71717a]">{formatKES(total)}</span>
            </div>
          </div>
          <Link to="/checkout" className="flex items-center justify-center gap-2 w-full bg-[#71717a] text-[#FAFAFA] font-black py-4 rounded-2xl hover:bg-[#71717a] transition-all shadow-lg shadow-[#71717a]/20">
            Proceed to Checkout <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/" className="block text-center text-sm text-[#4A5771] hover:text-[#71717a] mt-4 font-medium">
            Continue Shopping
          </Link>
        </div>
      </div>

      {saved.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-bold text-[#FAFAFA] mb-4">Saved for later</h2>
          <div className="space-y-3">
            {saved.map((item) => (
              <div key={item._cartKey || item.id} className="bg-[#28303F] rounded-2xl border border-[#353F54] p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#242C3B] shrink-0">
                  {item.image_url ? <img src={item.image_url} alt="" className="w-full h-full object-cover" /> : <Package className="w-6 h-6 m-5 text-[#4A5771]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white truncate">{item.name}</p>
                  <p className="text-sm text-[#14b8a6]">{formatKES(item.price)}</p>
                </div>
                <button type="button" onClick={() => moveToCart(item)} className="text-xs font-bold px-3 py-2 rounded-lg bg-[#14b8a6] text-black">Move to cart</button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}