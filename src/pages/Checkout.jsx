import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Loader2, Package, CreditCard, Trash2, Plus, Minus, CheckCircle, MapPin, Phone, User, Mail, Wrench, AlertTriangle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder } from '../utils/api';
import { formatKES } from '../utils/constants';
import { supabase } from '../utils/supabase';
import { useMaintenanceMode } from '../hooks/useMaintenanceMode';
import NiaContextualTrigger from '../components/NiaContextualTrigger';
import Breadcrumb from '../components/Breadcrumb';
import { sounds } from '../utils/sounds';
import TrustBadges from '../components/TrustBadges';
import { trackBeginCheckout, trackError } from '../utils/analytics';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

function loadPaystackScript() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// ── Design Tokens (matching Nia chat) ──────────────────────────────
const C = {
  accent: 'var(--seasonal-primary,#1a5632)',
  accentDark: '#14472a',
  bg: '#ffffff',
  bgDark: '#18181b',
  bgGray: '#f9fafb',
  bgGrayDark: '#27272a',
  text: '#27272a',
  textDark: '#e4e4e7',
  textMuted: '#71717a',
  textMutedDark: '#a1a1aa',
  border: '#e4e4e7',
  borderDark: '#3f3f46',
  success: '#10b981',
  warning: '#f59e0b',
};

// ── Step Indicator ──────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = [
    { n: 1, label: 'Cart', icon: ShoppingCart },
    { n: 2, label: 'Details', icon: User },
    { n: 3, label: 'Payment', icon: CreditCard },
  ];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const active = step >= s.n;
        const current = step === s.n;
        return (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && (
              <div className="w-8 sm:w-12 h-0.5 rounded-full transition-colors" style={{ backgroundColor: active ? C.accent : C.border }} />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  backgroundColor: active ? C.accent : 'transparent',
                  color: active ? '#fff' : C.textMuted,
                  border: `2px solid ${active ? C.accent : C.border}`,
                  transform: current ? 'scale(1.1)' : 'scale(1)',
                }}
              >
                {active && step > s.n ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className="text-xs font-semibold hidden sm:inline" style={{ color: active ? C.text : C.textMuted }}>
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Input Field ─────────────────────────────────────────────────────
function Field({ icon: Icon, label, error, dark, ...props }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: dark ? C.textMutedDark : C.textMuted }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: dark ? C.textMutedDark : C.textMuted }} />
        )}
        <input
          {...props}
          className="w-full text-sm focus:outline-none transition-all"
          style={{
            backgroundColor: dark ? C.bgGrayDark : C.bgGray,
            color: dark ? C.textDark : C.text,
            border: `1px solid ${error ? '#ef4444' : dark ? C.borderDark : C.border}`,
            borderRadius: '12px',
            paddingLeft: Icon ? '2.5rem' : '1rem',
            paddingRight: '1rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
          }}
        />
      </div>
      {error && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  );
}

// ── TextArea Field ──────────────────────────────────────────────────
function TextAreaField({ icon: Icon, label, error, dark, ...props }) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: dark ? C.textMutedDark : C.textMuted }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3 w-4 h-4" style={{ color: dark ? C.textMutedDark : C.textMuted }} />
        )}
        <textarea
          {...props}
          className="w-full text-sm focus:outline-none transition-all resize-none"
          style={{
            backgroundColor: dark ? C.bgGrayDark : C.bgGray,
            color: dark ? C.textDark : C.text,
            border: `1px solid ${error ? '#ef4444' : dark ? C.borderDark : C.border}`,
            borderRadius: '12px',
            paddingLeft: Icon ? '2.5rem' : '1rem',
            paddingRight: '1rem',
            paddingTop: '0.75rem',
            paddingBottom: '0.75rem',
          }}
        />
      </div>
      {error && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{error}</p>}
    </div>
  );
}

// ── Kericho Area / Landmark Data ────────────────────────────────────
const AREA_LANDMARKS = {
  "Kericho CBD":      ["Kericho Town Hall", "Nakumatt / Former Superstore", "Kericho Bus Park", "Kericho Post Office", "Barclays / Absa Bank Junction"],
  "Moi Junction":     ["Moi Junction Roundabout", "Equity Bank Moi", "Shell Petrol Station", "Kericho Stadium Gate"],
  "Kericho Stage":    ["Kericho Main Stage", "Eldoret Road Turnoff", "Tuk-Tuk Stage"],
  "Litein Road":      ["Litein Rd Junction", "Tea Board Offices", "AIC Church Litein Rd"],
  "Hospital Area":    ["Kericho County Hospital Gate", "Kericho District Hospital", "Red Cross Offices"],
  "Chepseon":         ["Chepseon Market", "Chepseon Primary School", "Chepseon Chief's Office", "ACK Chepseon"],
  "Kipkelion":        ["Kipkelion Market", "Kipkelion Stage", "Kipkelion Chief's Camp", "Kipkelion Hospital"],
  "Ainamoi":          ["Ainamoi Market", "Ainamoi Tea Factory", "Ainamoi Primary School"],
  "Kabianga":         ["Kabianga University Gate", "Kabianga Market", "Kabianga Stage"],
  "Kapkugerwet":      ["Kapkugerwet Market", "Kapkugerwet Stage", "KTDA Factory Kapkugerwet"],
  "Londiani":         ["Londiani Town Center", "Londiani Stage", "Londiani Police Station"],
  "Kedowa":           ["Kedowa Market", "Kedowa Stage", "Kedowa Chief's Office"],
  "Brooke":           ["Brooke Market", "Brooke Tea Factory", "Brooke Stage"],
  "Sosiot":           ["Sosiot Market", "Sosiot Stage", "Sosiot Chief's Camp"],
  "Roret":            ["Roret Market", "Roret Stage", "Roret Girls High School"],
  "Fort Ternan":      ["Fort Ternan Market", "Fort Ternan Stage", "Fort Ternan Hospital"],
  "Cheborge":         ["Cheborge Market", "Cheborge Stage", "Cheborge Tea Factory"],
  "Sigowet":          ["Sigowet Market", "Sigowet Stage", "Sigowet Chief's Office"],
};

const AREA_GROUPS = [
  { label: "Kericho Town", areas: ["Kericho CBD", "Moi Junction", "Kericho Stage", "Litein Road", "Hospital Area"] },
  { label: "Residential", areas: ["Chepseon", "Kipkelion", "Ainamoi", "Kabianga", "Kapkugerwet", "Londiani", "Kedowa"] },
  { label: "Outskirts / Towns", areas: ["Brooke", "Sosiot", "Roret", "Fort Ternan", "Cheborge", "Sigowet"] },
];

// ── Main Checkout Page ─────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { getItems, getTotal, clearCart, updateQuantity, removeItem } = useCart();
  const items = getItems();
  const { isMaintenance } = useMaintenanceMode();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    area: '',
    landmark: '',
    referralCode: '',
  });

  const total = getTotal();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0); // base delivery fee
  const [userPoints, setUserPoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [pointsDiscount, setPointsDiscount] = useState(0);

  // Apply promo code
  const applyPromoCode = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoApplied(null);

    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setPromoError('Invalid promo code');
        setPromoLoading(false);
        return;
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setPromoError('This promo code has expired');
        setPromoLoading(false);
        return;
      }

      // Check usage limit
      if (data.max_uses && (data.current_uses || data.times_used || 0) >= data.max_uses) {
        setPromoError('This promo code has reached its usage limit');
        setPromoLoading(false);
        return;
      }

      setPromoApplied(data);
      setPromoError('');
    } catch {
      setPromoError('Could not validate promo code');
    }
    setPromoLoading(false);
  };

  const removePromo = () => {
    setPromoApplied(null);
    setPromoCode('');
    setPromoError('');
  };

  const isFreeDelivery = promoApplied && promoApplied.discount_type === 'free_delivery';

  // Compute loyalty points discount value — useMemo, not setState during render
  const computedPtsDiscount = (() => {
    if (!redeemPoints || !userPoints) return 0;
    let base = total;
    if (promoApplied) {
      if (promoApplied.discount_type === 'percentage') base = Math.round(base * (1 - promoApplied.discount_value / 100));
      else if (promoApplied.discount_type === 'fixed') base = Math.max(0, base - promoApplied.discount_value);
    }
    return Math.min(userPoints, Math.floor(base / 2)); // max 50% off with points
  })();

  // Calculate discounted total
  const discountedTotal = (() => {
    let t = total;
    if (promoApplied) {
      if (promoApplied.discount_type === 'percentage') t = Math.round(t * (1 - promoApplied.discount_value / 100));
      else if (promoApplied.discount_type === 'fixed') t = Math.max(0, t - promoApplied.discount_value);
    }
    if (redeemPoints) {
      t = Math.max(0, t - computedPtsDiscount);
    }
    return t;
  })();

  // Sync computed discount into state (for display)
  useEffect(() => {
    setPointsDiscount(computedPtsDiscount);
  }, [computedPtsDiscount]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login?redirect=/checkout');
      if (session?.user) {
        supabase.from('profiles').select('loyalty_points').eq('id', session.user.id).single()
          .then(({ data }) => setUserPoints(data?.loyalty_points || 0))
          .catch(() => {});
      }
    }).catch(() => {});
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Required';
    if (!form.phone.trim()) {
      errs.phone = 'Required for M-Pesa';
    } else {
      // Kenyan phone validation: 07XX XXX XXX or 2547XX XXX XXX
      const cleaned = form.phone.trim().replace(/[^0-9]/g, '');
      if (!/^(?:254|0)?[17][0-9]{8}$/.test(cleaned)) {
        errs.phone = 'Enter a valid Kenyan M-Pesa number (e.g. 07XXXXXXXX)';
      }
    }
    if (form.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errs.email = 'Enter a valid email address';
      }
    }
    if (!form.area) errs.area = 'Please select your area';
    if (!form.landmark) errs.landmark = 'Please select a landmark';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const orderCreated = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    sounds.processing();

    // Get fresh cart state to avoid stale closure
    const currentItems = getItems();
    const currentTotal = getTotal();
    const currentDiscounted = (() => {
      let t = currentTotal;
      if (promoApplied) {
        if (promoApplied.discount_type === 'percentage') {
          t = Math.round(t * (1 - promoApplied.discount_value / 100));
        } else if (promoApplied.discount_type === 'fixed') {
          t = Math.max(0, t - promoApplied.discount_value);
        }
      }
      if (redeemPoints) {
        t = Math.max(0, t - computedPtsDiscount);
      }
      return t;
    })();

    try {
      // Track checkout initiation
      trackBeginCheckout(currentItems.map(item => ({
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })), currentTotal);
      
      // Block orders during maintenance mode
      if (isMaintenance) {
        setError('Checkout is temporarily disabled due to maintenance. Please try again later.');
        setLoading(false);
        return;
      }

      // Prevent duplicate order creation
      if (orderCreated.current) {
        setError('Order already being processed. Please wait...');
        setLoading(false);
        return;
      }

      // Check stock availability
      const productIds = currentItems.map(i => i.id).filter(Boolean);
      if (productIds.length > 0) {
        const { data: stockData, error: stockError } = await supabase
          .from('listings')
          .select('id, quantity, title')
          .in('id', productIds);
        if (!stockError && stockData) {
          for (const item of currentItems) {
            const stockItem = stockData.find(s => s.id === item.id);
            if (stockItem && stockItem.quantity !== null && stockItem.quantity < (item.quantity || 1)) {
              setError(`"${item.name}" only has ${stockItem.quantity} in stock. Please reduce the quantity.`);
              setLoading(false);
              return;
            }
          }
        }
      }

      await loadPaystackScript();

      if (!window.PaystackPop) {
        setError('Payment system failed to load. Please check your internet connection and try again.');
        setLoading(false);
        return;
      }

      const orderResult = await createOrder({
        items: currentItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_image: item.image_url,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
          variant: item.variant || null,
          variant_size: item.variant?.size || null,
          variant_color: item.variant?.colorName || null,
          variant_sku: item.variant?.sku || null,
        })),
        total: currentDiscounted,
        customerName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: `${form.landmark}, ${form.area}, Kericho`,
        city: 'Kericho',
        area: form.area,
        landmark: form.landmark,
        promoCode: promoApplied ? promoApplied.code : null,
        promoCodeId: promoApplied ? promoApplied.id : null,
        isFreeDelivery,
        loyaltyPointsUsed: redeemPoints ? computedPtsDiscount : 0,
        referralCode: form.referralCode || null,
      });

      if (!orderResult.success) {
        setError(orderResult.error || 'Failed to create order');
        setLoading(false);
        sounds.error();
        return;
      }

      const orderId = orderResult.order?.id;
      if (!orderId) {
        setError('Order created but could not get order ID. Please contact support.');
        setLoading(false);
        return;
      }
      orderCreated.current = true;

      // Store order data for purchase tracking on success page
      sessionStorage.setItem(`omix_order_${orderId}`, JSON.stringify({
        id: orderId,
        total: currentDiscounted,
        items: currentItems.map(item => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      }));

      try {
        window.PaystackPop.setup({
          key: PAYSTACK_PUBLIC_KEY,
          email: form.email.trim() || 'customer@omix.store',
          amount: Math.round(currentDiscounted * 100),
          currency: 'KES',
          ref: `omix_${orderId}_${Date.now()}`,
          metadata: {
            order_id: orderId,
            customer_name: form.fullName.trim(),
            phone: form.phone.trim(),
          },
          callback: function(response) {
            if (response && response.trxref) {
              clearCart();
              navigate(`/order-success?orderId=${orderId}&reference=${response.trxref}`);
            } else {
              setError('Payment was not verified. Please contact support with your order ID.');
              setLoading(false);
            }
          },
          onClose: function() {
            orderCreated.current = false;
            setLoading(false);
            setError('Payment was not completed. Your order is saved — you can try again from My Account.');
          },
        }).openIframe();
      } catch (paystackErr) {
        console.error('Paystack setup error:', paystackErr);
        setError('Payment system error. Please try again or contact support. Your order has been saved.');
        setLoading(false);
      }

    } catch (err) {
      console.error('Checkout error:', err);
      trackError(err.message || 'Checkout failed', 'Checkout.handleSubmit');
      setError(err.message || 'Something went wrong during checkout. Please try again.');
      orderCreated.current = false;
      setLoading(false);
    }
  };

  // ── Maintenance Mode ─────────────────────────────────────────────
  if (isMaintenance) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center py-12 rounded-2xl border border-amber-300 dark:border-amber-800" style={{ backgroundColor: '#fffbeb' }}>
          <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center bg-amber-100">
            <Wrench className="w-10 h-10 text-amber-600 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black mb-2 text-amber-800">Under Maintenance</h1>
          <p className="text-sm mb-2 text-amber-700">
            We're currently performing scheduled maintenance on our store.
          </p>
          <p className="text-xs mb-8 text-amber-600">
            You can still browse products, but checkout and payments are temporarily disabled. Please check back shortly!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: C.accent }}
            >
              Continue Browsing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-[11px] mt-6 text-amber-500">
            Need help? Contact us at omixsystems@gmail.com or +254 768 213 649
          </p>
        </div>
      </div>
    );
  }

  // ── Empty Cart ──────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center py-12 rounded-2xl border" style={{ borderColor: C.border, backgroundColor: C.bg }}>
          <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center" style={{ backgroundColor: C.bgGray }}>
            <ShoppingCart className="w-10 h-10" style={{ color: C.textMuted }} />
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ color: C.text }}>Your cart is empty</h1>
          <p className="text-sm mb-8" style={{ color: C.textMuted }}>Add some items before checking out.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: C.accent }}
          >
            Browse Products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Checkout Form ───────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8" data-name="checkout-page">
      <Breadcrumb compact />
      {/* Step Indicator */}
      <StepIndicator step={2} />

      {/* Trust Badges */}
      <div className="mt-4">
        <TrustBadges />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Order Summary (left, 2 cols) ──────────────────────── */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="rounded-2xl border overflow-hidden sticky top-4" style={{ borderColor: C.border, backgroundColor: C.bg }}>
            {/* Header */}
            <div className="px-5 py-4 border-b" style={{ borderColor: C.border, background: `linear-gradient(135deg, ${C.accent}08, ${C.accent}03)` }}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ color: C.text }}>Order Summary</h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${C.accent}15`, color: C.accent }}>
                  {items.length} item{items.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Items */}
            <div className="p-4 space-y-3 max-h-[320px] overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 items-center p-2 rounded-xl transition-colors" style={{ backgroundColor: C.bgGray }}>
                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ backgroundColor: C.bg }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-5 h-5" style={{ color: C.textMuted }} />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-sm truncate" style={{ color: C.text }}>{item.name}</h4>
                    {item.variant && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {item.variant.size && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: C.bgGray, color: C.textMuted }}>Size: {item.variant.size}</span>
                        )}
                        {item.variant.color && item.variant.colorName && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: C.bgGray, color: C.textMuted }}>
                            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.variant.color?.startsWith('#') ? item.variant.color : '#ccc', border: '1px solid #d4d4d8' }} />
                            {item.variant.colorName}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-xs font-bold" style={{ color: C.accent }}>{formatKES(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-5 text-center" style={{ color: C.text }}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg transition-colors hover:bg-red-900/20">
                    <Trash2 className="w-3.5 h-3.5" style={{ color: C.textMuted }} />
                  </button>
                </div>
              ))}
            </div>

            {/* Promo Code */}
            <div className="px-5 py-4 border-t" style={{ borderColor: C.border }}>
              {promoApplied ? (
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <span className="text-sm font-bold text-green-700">{promoApplied.code}</span>
                      <p className="text-[11px] text-green-600">
                        {promoApplied.discount_type === 'free_delivery' ? 'Free delivery applied' : 'Discount applied'}
                      </p>
                    </div>
                  </div>
                  <button onClick={removePromo} className="text-xs font-semibold text-green-700 hover:text-green-900 underline">
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: C.textMuted }}>Promo Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyPromoCode())}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 rounded-lg border text-sm font-mono tracking-wider uppercase"
                      style={{ borderColor: promoError ? '#ef4444' : C.border }}
                    />
                    <button
                      onClick={applyPromoCode}
                      disabled={promoLoading || !promoCode.trim()}
                      className="px-4 py-2 rounded-lg text-white text-xs font-bold transition-all hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: C.accent }}
                    >
                      {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] mt-1 font-medium" style={{ color: '#ef4444' }}>{promoError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Total */}
            {userPoints > 0 && (
              <div className="px-5 py-3 border-t" style={{ borderColor: C.border }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-[var(--seasonal-primary,#1a5632)] focus:ring-[var(--seasonal-primary,#1a5632)]"
                  />
                  <span className="text-sm" style={{ color: C.textMuted }}>
                    Use loyalty points <strong className="text-amber-500">({userPoints} pts)</strong>
                    <span className="text-xs block">100 pts = KES 50 • Max 50% of order</span>
                  </span>
                </label>
              </div>
            )}

            <div className="px-5 py-4 border-t" style={{ borderColor: C.border }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm" style={{ color: C.textMuted }}>Subtotal</span>
                <span className="text-sm font-semibold" style={{ color: C.text }}>{formatKES(total)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm" style={{ color: C.textMuted }}>Delivery</span>
                {isFreeDelivery ? (
                  <span className="text-sm font-semibold" style={{ color: C.success }}>FREE</span>
                ) : (
                  <span className="text-sm font-semibold" style={{ color: C.success }}>Calculated at delivery</span>
                )}
              </div>
              {promoApplied && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: C.success }}>Promo Discount</span>
                  <span className="text-sm font-semibold" style={{ color: C.success }}>
                    -{promoApplied.discount_type === 'percentage' ? `${promoApplied.discount_value}%` : promoApplied.discount_type === 'free_delivery' ? 'Delivery Fee' : formatKES(promoApplied.discount_value)}
                  </span>
                </div>
              )}
              {redeemPoints && pointsDiscount > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm" style={{ color: C.success }}>Loyalty Points</span>
                  <span className="text-sm font-semibold" style={{ color: C.success }}>-{formatKES(pointsDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: C.border }}>
                <span className="text-base font-bold" style={{ color: C.text }}>Total</span>
                <span className="text-xl font-black" style={{ color: C.accent }}>{formatKES(discountedTotal)}</span>
              </div>
            </div>

            {/* Trust Badges */}
            <TrustBadges />
          </div>
        </div>

        {/* ── Delivery Form (right, 3 cols) ─────────────────────── */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border, backgroundColor: C.bg }}>
            {/* Header */}
            <div className="px-5 py-4 border-b" style={{ borderColor: C.border, background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})` }}>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Delivery Details
              </h2>
              <p className="text-xs text-white/70 mt-0.5">Where should we deliver your order?</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mx-5 mt-4 p-3 rounded-xl text-sm font-medium border" style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <Field
                icon={User}
                label="Full Name *"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                error={fieldErrors.fullName}
              />

              <Field
                icon={Phone}
                label="M-Pesa Phone *"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="07XXXXXXXX"
                error={fieldErrors.phone}
              />
              <p className="text-xs -mt-2" style={{ color: C.textMuted }}>M-Pesa STK push will be sent to this number</p>

              <Field
                icon={Mail}
                label="Email (optional)"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                error={fieldErrors.email}
              />

              {/* ── Kericho Location Selector ── */}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textMuted }}>
                  Location <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="space-y-2">
                  {/* City - locked */}
                  <div className="flex items-center justify-between rounded-xl px-3.5 py-3" style={{ backgroundColor: C.bgGray, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" style={{ color: C.accent }} />
                      <span className="text-sm font-semibold" style={{ color: C.text }}>Kericho</span>
                    </div>
                    <span className="flex items-center gap-1 text-[11px]" style={{ color: C.textMuted }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      Fixed
                    </span>
                  </div>

                  {/* Area dropdown */}
                  <div className="relative">
                    <select
                      value={form.area}
                      onChange={(e) => setForm({ ...form, area: e.target.value, landmark: '' })}
                      className="w-full text-sm rounded-xl px-3.5 py-3 appearance-none cursor-pointer focus:outline-none transition-all"
                      style={{
                        backgroundColor: C.bgGray,
                        color: form.area ? C.text : C.textMuted,
                        border: `1.5px solid ${fieldErrors.area ? '#ef4444' : C.border}`,
                      }}
                    >
                      <option value="">Select your area...</option>
                      {AREA_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.areas.map((area) => (
                            <option key={area} value={area}>{area}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textMuted }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                  {fieldErrors.area && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{fieldErrors.area}</p>}

                  {/* Landmark dropdown */}
                  <div className="relative">
                    <select
                      value={form.landmark}
                      onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                      disabled={!form.area}
                      className="w-full text-sm rounded-xl px-3.5 py-3 appearance-none cursor-pointer focus:outline-none transition-all disabled:opacity-50"
                      style={{
                        backgroundColor: C.bgGray,
                        color: form.landmark ? C.text : C.textMuted,
                        border: `1.5px solid ${fieldErrors.landmark ? '#ef4444' : C.border}`,
                      }}
                    >
                      <option value="">{form.area ? 'Select a landmark...' : 'Select area first...'}</option>
                      {form.area && AREA_LANDMARKS[form.area]?.map((lm) => (
                        <option key={lm} value={lm}>{lm}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textMuted }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                  {fieldErrors.landmark && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{fieldErrors.landmark}</p>}

                  {/* Selected location chip */}
                  {form.area && form.landmark && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold" style={{ backgroundColor: '#fff0f2', border: '1px solid #fecdd3', color: '#c41f3a' }}>
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{form.landmark}, {form.area}, Kericho</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base hover:opacity-90 active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${C.accent}, ${C.accentDark})`,
                  boxShadow: `0 8px 24px ${C.accent}30`,
                }}
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard className="w-5 h-5" /> Pay {formatKES(discountedTotal)} via M-Pesa</>
                )}
              </button>

              <p className="text-center text-xs" style={{ color: C.textMuted }}>
                Powered by Paystack. Your payment is secure and encrypted.
              </p>
            </form>
          </div>

          {/* Nia contextual help */}
          <div className="mt-4">
            <NiaContextualTrigger page="checkout" />
          </div>
        </div>
      </div>
    </div>
  );
}
