import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatKES } from '../utils/constants';

export default function CartPage() {
  const { items, getTotal, updateQuantity, removeItem, getItemCount } = useCart();
  const total = getTotal();
  const count = getItemCount();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <ShoppingCart className="w-12 h-12 text-zinc-400" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">Your cart is empty</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">Browse our products and add items to your cart.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-[#ff385c] hover:bg-[#e62e4f] text-white font-semibold px-8 py-4 rounded-xl transition-colors">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-name="cart-page">
      <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-8">Shopping Cart ({count} items)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 flex gap-4">
              <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <Link to={`/listing/${item.id}`} className="font-bold text-zinc-900 dark:text-white hover:text-[#ff385c] transition-colors">
                  {item.name}
                </Link>
                <p className="text-[#ff385c] font-bold">{formatKES(item.price)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-8 text-center text-zinc-900 dark:text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-zinc-400 hover:text-red-500 p-1 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-black text-zinc-900 dark:text-white">{formatKES(item.price * item.quantity)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 h-fit sticky top-24">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Subtotal ({count} items)</span>
              <span>{formatKES(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
              <span>Delivery</span>
              <span className="text-emerald-500">Calculated at checkout</span>
            </div>
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="font-bold text-zinc-900 dark:text-white">Total</span>
              <span className="text-2xl font-black text-[#ff385c]">{formatKES(total)}</span>
            </div>
          </div>
          <Link to="/checkout" className="flex items-center justify-center gap-2 w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20">
            Proceed to Checkout <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/" className="block text-center text-sm text-zinc-500 hover:text-[#ff385c] mt-4 font-medium">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
