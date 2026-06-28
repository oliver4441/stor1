import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatKES } from '../utils/constants';
import NiaContextualTrigger from '../components/NiaContextualTrigger';
import Breadcrumb from '../components/Breadcrumb';

export default function CartPage() {
  const { getItems, getTotal, updateQuantity, removeItem, getItemCount } = useCart();
  const items = getItems();
  const total = getTotal();
  const count = getItemCount();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-zinc-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Your cart is empty</h1>
          <p className="text-zinc-400 mb-8">Browse our products and add items to your cart.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-[var(--seasonal-primary,#1a5632)] hover:bg-[#e62e4f] text-white font-semibold px-8 py-4 rounded-xl transition-colors mb-8">
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
      <h1 className="text-3xl font-black text-white mb-8">Shopping Cart ({count} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-zinc-900 rounded-3xl border border-zinc-800 p-4 flex gap-4">
              <div className="w-24 h-24 rounded-2xl bg-zinc-800 overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <Link to={`/listing/${item.id}`} className="font-bold text-white hover:text-[var(--seasonal-primary,#1a5632)] transition-colors">
                  {item.name}
                </Link>
                {item.variant && (
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.variant.size && (
                      <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md">Size: {item.variant.size}</span>
                    )}
                    {item.variant.color && item.variant.colorName && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md">
                        <span className="w-2.5 h-2.5 rounded-full border border-zinc-300 dark:border-zinc-600 inline-block" style={{ backgroundColor: item.variant.color?.startsWith('#') ? item.variant.color : '#ccc' }} />
                        {item.variant.colorName}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-[var(--seasonal-primary,#1a5632)] font-bold">{formatKES(item.price)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-8 text-center text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-red-500 p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-white">{formatKES(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-zinc-900 rounded-3xl border border-zinc-800 p-6 h-fit sticky top-24">
          <h2 className="text-lg font-bold text-white mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Subtotal ({count} items)</span>
              <span>{formatKES(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-400">
              <span>Delivery</span>
              <span className="text-emerald-500">Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t border-zinc-700 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Total</span>
              <span className="text-2xl font-black text-[var(--seasonal-primary,#1a5632)]">{formatKES(total)}</span>
            </div>
          </div>
          <Link to="/checkout" className="flex items-center justify-center gap-2 w-full bg-[var(--seasonal-primary,#1a5632)] text-white font-black py-4 rounded-2xl hover:bg-[var(--seasonal-secondary,#14472a)] transition-all shadow-lg shadow-[var(--seasonal-primary,#1a5632)]/20">
            Proceed to Checkout <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/" className="block text-center text-sm text-zinc-500 hover:text-[var(--seasonal-primary,#1a5632)] mt-4 font-medium">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
