import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, CheckCircle, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const FORMSPREE_URL = 'https://formspree.io/f/mjgdyrrg';

function ContactFloat() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { getItemCount } = useCart();
  const cartCount = getItemCount();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData(e.target);

    try {
      const res = await fetch(FORMSPREE_URL, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });

      if (res.ok) {
        setSuccess(true);
        e.target.reset();
      } else {
        setError('Something went wrong. Please try again.');
      }
    } catch {
      setError('Network error. Check your connection and try again.');
    }

    setSubmitting(false);
  };

  return (
    <>
      {/* Floating Cart Button — above contact */}
      <Link
        to="/cart"
        className="fixed bottom-24 right-4 sm:right-6 z-50 w-14 h-14 rounded-full bg-zinc-900 dark:bg-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all duration-300"
        aria-label="View cart"
      >
        <ShoppingCart className="w-6 h-6 text-white dark:text-zinc-900" />
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff385c] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {cartCount > 9 ? '9+' : cartCount}
          </span>
        )}
      </Link>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => { setIsOpen(false); setSuccess(false); setError(''); }}
        />
      )}

      {/* Form Panel */}
      <div
        className={`fixed bottom-40 right-4 sm:right-6 w-[calc(100%-2rem)] sm:w-[400px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 transition-all duration-300 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h3 className="font-black text-lg text-zinc-900 dark:text-white">Contact Omix</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">We'll get back to you within 24 hours</p>
          </div>
          <button
            onClick={() => { setIsOpen(false); setSuccess(false); setError(''); }}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-600" />
            </div>
            <h4 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Message sent!</h4>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Thank you for reaching out. Our team in Kericho will respond soon.</p>
            <button
              onClick={() => { setSuccess(false); setIsOpen(false); }}
              className="text-sm font-bold text-[#ff385c] hover:underline"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Your Name</label>
              <input required name="name" type="text" placeholder="e.g. Kiprono Yegon"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/10 focus:outline-none text-zinc-900 dark:text-white text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <input required name="email" type="email" placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/10 focus:outline-none text-zinc-900 dark:text-white text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Phone (optional)</label>
              <input name="phone" type="tel" placeholder="07XXXXXXXX"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/10 focus:outline-none text-zinc-900 dark:text-white text-sm transition-all" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Subject</label>
              <select name="subject"
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/10 focus:outline-none text-zinc-900 dark:text-white text-sm transition-all appearance-none"
              >
                <option value="General Inquiry">General Inquiry</option>
                <option value="Order Issue">Order Issue</option>
                <option value="Payment Problem">Payment Problem</option>
                <option value="Delivery Question">Delivery Question</option>
                <option value="Feedback / Suggestion">Feedback / Suggestion</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Message</label>
              <textarea required name="message" rows="3" placeholder="Tell us how we can help..."
                className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:ring-2 focus:ring-[#ff385c]/10 focus:outline-none text-zinc-900 dark:text-white text-sm transition-all resize-none" />
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full bg-[#ff385c] text-white font-bold py-3.5 rounded-xl hover:bg-[#e03150] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#ff385c]/20"
            >
              {submitting ? (
                <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Sending...</>
              ) : (
                <><Send className="w-4 h-4" />Send Message</>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Floating Contact Button — below cart */}
      <button
        onClick={() => { setIsOpen(!isOpen); setSuccess(false); setError(''); }}
        className={`fixed bottom-4 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-zinc-900 dark:bg-white rotate-0 scale-90'
            : 'bg-[#ff385c] hover:bg-[#e03150] hover:scale-110'
        }`}
        aria-label={isOpen ? 'Close contact form' : 'Contact Omix'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white dark:text-zinc-900" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Tooltip */}
      {!isOpen && (
        <div className="fixed bottom-[4.5rem] right-4 sm:right-6 z-40 pointer-events-none">
          <div className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold px-3 py-1.5 shadow-lg animate-[fadeIn_0.3s_ease_1s_forwards] opacity-0">
            Need help?
            <div className="absolute -bottom-1 right-4 w-2 h-2 bg-zinc-900 dark:bg-white rotate-45" />
          </div>
        </div>
      )}
    </>
  );
}

export default ContactFloat;
