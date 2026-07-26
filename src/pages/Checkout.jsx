import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ArrowRight, Loader2, Package, CreditCard, Trash2, Plus, Minus, CheckCircle, MapPin, Phone, User, Mail, Wrench, AlertTriangle, Smartphone } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { createOrder, getDeliveryZones, getPickupStations, initMpesaPayment, checkMpesaStatus } from '../utils/api';
import { formatKES } from '../utils/constants';
import { supabase } from '../utils/supabase';
import { useMaintenanceMode } from '../hooks/useMaintenanceMode';
import { generateGuestId } from '../utils/guest';
import NiaContextualTrigger from '../components/NiaContextualTrigger';
import Breadcrumb from '../components/Breadcrumb';
import { sounds } from '../utils/sounds';
import { sendTypedNotification } from '../utils/notifications';
import TrustBadges from '../components/TrustBadges';
import { trackBeginCheckout, trackError } from '../utils/analytics';

// ── Design Tokens (matching Nia chat) ──────────────────────────────
const C = {
  accent: '#71717a',
  accentDark: '#71717a',
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
  success: '#38B8EA',
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

// ── Kenya Location Data (area/landmark free-text for now) ──────────

// ── Main Checkout Page ─────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { getItems, getTotal, clearCart, updateQuantity, removeItem } = useCart();
  const items = getItems();
  const { isMaintenance } = useMaintenanceMode();

  // ── Offline check removed ──

  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [mpesaPending, setMpesaPending] = useState(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    area: '',
    landmark: '',
    street: '',
    city: '',
    deliveryInstructions: '',
    alternatePhone: '',
    orderNotes: '',
    scheduledDate: '',
    idNumber: '',
    referralCode: '',
  });

  const total = getTotal();
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('delivery'); // 'delivery' or 'pickup'
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [pickupStations, setPickupStations] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedPickupStation, setSelectedPickupStation] = useState(null);
  const [deliveryEstimateMin, setDeliveryEstimateMin] = useState(null);
  const [deliveryEstimateMax, setDeliveryEstimateMax] = useState(null);
  const [deliveryFeeAmount, setDeliveryFeeAmount] = useState(null);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(null);
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
      setAuthChecked(true);
      if (session?.user) {
        setIsAuthenticated(true);
        supabase.from('profiles').select('loyalty_points').eq('id', session.user.id).single()
          .then(({ data }) => setUserPoints(data?.loyalty_points || 0))
          .catch(() => {});
      } else {
        setIsAuthenticated(false);
      }
    }).catch(() => { setAuthChecked(true); });
  }, []);

  // Fetch delivery zones and pickup stations
  useEffect(() => {
    getDeliveryZones().then(res => {
      if (res.success) setDeliveryZones(res.zones);
    });
    getPickupStations().then(res => {
      if (res.success) setPickupStations(res.stations);
    });
  }, []);

  // Generate or retrieve guest ID for guest checkout
  const guestId = useRef(generateGuestId());

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
      errs.phone = 'Required for payment';
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
    // For pickup, area and landmark are not required
    if (deliveryMethod === 'pickup') {
      delete errs.area;
      delete errs.landmark;
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const orderCreated = useRef(false);

  const handleCOD = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    sounds.processing();

    const currentItems = getItems();
    const currentDiscounted = (() => {
      let t = getTotal();
      if (promoApplied) {
        if (promoApplied.discount_type === 'percentage') t = Math.round(t * (1 - promoApplied.discount_value / 100));
        else if (promoApplied.discount_type === 'fixed') t = Math.max(0, t - promoApplied.discount_value);
      }
      if (redeemPoints) t = Math.max(0, t - computedPtsDiscount);
      return t;
    })();

    try {
      if (isMaintenance) {
        setError('Checkout is temporarily disabled due to maintenance. Please try again later.');
        setLoading(false);
        return;
      }

      if (orderCreated.current) {
        setError('Order already being processed. Please wait...');
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
          variant_label: item.variant?.label || null,
        })),
        total: currentDiscounted,
        customerName: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        address: `${form.landmark}, ${form.area}${form.city ? ', ' + form.city : ''}`,
        city: form.city || '',
        area: form.area,
        landmark: form.landmark,
        promoCode: promoApplied ? promoApplied.code : null,
        promoCodeId: promoApplied ? promoApplied.id : null,
        isFreeDelivery,
        loyaltyPointsUsed: redeemPoints ? computedPtsDiscount : 0,
        referralCode: form.referralCode || null,
        paymentMethod: 'cod',
        guestId: guestId.current,
        delivery_zone_id: selectedZone?.id || null,
        delivery_type: deliveryMethod,
        pickup_station_id: selectedPickupStation?.id || null,
        delivery_estimate_min: deliveryEstimateMin,
        delivery_estimate_max: deliveryEstimateMax,
        delivery_fee: deliveryFeeAmount,
        street: form.street.trim() || null,
        delivery_instructions: form.deliveryInstructions.trim() || null,
        alternate_phone: form.alternatePhone.trim() || null,
        order_notes: form.orderNotes.trim() || null,
        scheduled_date: form.scheduledDate || null,
        id_number: form.idNumber.trim() || null,
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
      sounds.checkout();
      sendTypedNotification('ORDER_CONFIRMED', {
        title: 'Order Confirmed',
        body: `Your order #${orderId.toString().slice(0,8).toUpperCase()} has been placed successfully! Total: KES ${currentDiscounted.toLocaleString()}`,
        tag: `order_${orderId}`,
      });

      // Build WhatsApp message with order details
      const itemList = currentItems.map(item =>
        `• ${item.name} x${item.quantity} — KES ${(item.price * item.quantity).toLocaleString()}`
      ).join('\n');

      const deliveryInfo = deliveryMethod === 'pickup' && selectedPickupStation
        ? `Pick-Up: ${selectedPickupStation.name}, ${selectedPickupStation.area}${selectedPickupStation.landmark ? ` (Near: ${selectedPickupStation.landmark})` : ''}`
        : `Delivery Address: ${form.landmark}, ${form.area}${form.city ? ', ' + form.city : ''}${selectedZone ? ` (Zone: ${selectedZone.display_name || selectedZone.zone_name})` : ''}`;

      const message = `Hello Omix Store!\n\nI have placed a Cash on Delivery order.\n\nOrder ID: #${orderId.toString().slice(0,8).toUpperCase()}\n\nItems:\n${itemList}\n\nTotal: KES ${currentDiscounted.toLocaleString()}\nPayment: Cash on Delivery\n\n${deliveryInfo}\nPhone: ${form.phone}\nName: ${form.fullName}\n\nPlease confirm my order. Asante!`;

      const whatsappUrl = `https://wa.me/254746674392?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      clearCart();
      navigate(`/order-success?orderId=${orderId}&cod=true`);

    } catch (err) {
      console.error('COD checkout error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
      orderCreated.current = false;
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
        address: `${form.landmark}, ${form.area}${form.city ? ', ' + form.city : ''}`,
        city: form.city || '',
        area: form.area,
        landmark: form.landmark,
        promoCode: promoApplied ? promoApplied.code : null,
        promoCodeId: promoApplied ? promoApplied.id : null,
        isFreeDelivery,
        loyaltyPointsUsed: redeemPoints ? computedPtsDiscount : 0,
        referralCode: form.referralCode || null,
        paymentMethod: 'mpesa',
        guestId: guestId.current,
        delivery_zone_id: selectedZone?.id || null,
        delivery_type: deliveryMethod,
        pickup_station_id: selectedPickupStation?.id || null,
        delivery_estimate_min: deliveryEstimateMin,
        delivery_estimate_max: deliveryEstimateMax,
        delivery_fee: deliveryFeeAmount,
        street: form.street.trim() || null,
        delivery_instructions: form.deliveryInstructions.trim() || null,
        alternate_phone: form.alternatePhone.trim() || null,
        order_notes: form.orderNotes.trim() || null,
        scheduled_date: form.scheduledDate || null,
        id_number: form.idNumber.trim() || null,
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

      // Initiate M-Pesa STK push
      try {
        const mpesaRes = await initMpesaPayment(form.phone.trim(), currentDiscounted, orderId);

        if (!mpesaRes.success && mpesaRes.code === 'MPESA_NOT_CONFIGURED') {
          setLoading(false);
          setError('M-Pesa is not configured yet. Please use Cash on Delivery.');
          return;
        }

        if (!mpesaRes.success) {
          setLoading(false);
          setError(mpesaRes.error || 'Failed to initiate M-Pesa payment. Please try again.');
          return;
        }

        sounds.checkout();
        await new Promise(resolve => setTimeout(resolve, 500));

        setLoading(false);
        setMpesaPending({
          checkoutRequestId: mpesaRes.checkoutRequestId,
          orderId,
          phone: form.phone.trim(),
          amount: currentDiscounted,
        });
      } catch (err) {
        console.error('M-Pesa init error:', err);
        setError(err.message || 'Failed to initiate payment. Your order has been saved.');
        setLoading(false);
        orderCreated.current = false;
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
        <div className="text-center py-12 rounded-2xl border border-[#71717a] dark:border-[#71717a]" style={{ backgroundColor: '#e8f4ff' }}>
          <div className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center bg-[#71717a]/10">
            <Wrench className="w-10 h-10 text-[#71717a] animate-pulse" />
          </div>
          <h1 className="text-2xl font-black mb-2 text-[#71717a]">Under Maintenance</h1>
          <p className="text-sm mb-2 text-[#71717a]">
            We're currently performing scheduled maintenance on our store.
          </p>
          <p className="text-xs mb-8 text-[#71717a]">
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
          <p className="text-[11px] mt-6 text-[#71717a]">
            Need help? Contact us at omixsystems@gmail.com or +254 768 213 649
          </p>
        </div>
      </div>
    );
  }

  // ── Auth Gate ───────────────────────────────────────────────────
  if (authChecked && !isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center py-12 rounded-2xl border" style={{ borderColor: C.border, backgroundColor: C.bg }}>
          <div className="w-20 h-20 mx-auto mb-5 rounded-full" style={{ backgroundColor: C.bgGray }}>
            <User className="w-10 h-10 mx-auto mt-5" style={{ color: C.textMuted }} />
          </div>
          <h1 className="text-2xl font-black mb-2" style={{ color: C.text }}>Log in to checkout</h1>
          <p className="text-sm mb-8" style={{ color: C.textMuted }}>You need an account to place orders.</p>
          <Link
            to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
            className="inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-xl transition-all text-white"
            style={{ backgroundColor: C.accent }}
          >Sign In</Link>
          <p className="mt-4 text-sm" style={{ color: C.textMuted }}>
            Don't have an account? <Link to={`/signup?redirect=${encodeURIComponent(window.location.pathname)}`} className="font-bold" style={{ color: C.accent }}>Sign Up</Link>
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
                        {item.variant.label ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: C.bgGray, color: C.textMuted }}>{item.variant.label}</span>
                        ) : (
                          <>
                            {item.variant.size && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: C.bgGray, color: C.textMuted }}>Size: {item.variant.size}</span>
                            )}
                            {item.variant.color && item.variant.colorName && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: C.bgGray, color: C.textMuted }}>
                                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: item.variant.color?.startsWith('#') ? item.variant.color : '#ccc', border: '1px solid #353F54' }} />
                                {item.variant.colorName}
                              </span>
                            )}
                          </>
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
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#e8f4ff', border: '1px solid #99d6ff' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#71717a]" />
                    <div>
                      <span className="text-sm font-bold text-[#71717a]">{promoApplied.code}</span>
                      <p className="text-[11px] text-[#71717a]">
                        {promoApplied.discount_type === 'free_delivery' ? 'Free delivery applied' : 'Discount applied'}
                      </p>
                    </div>
                  </div>
                  <button onClick={removePromo} className="text-xs font-semibold text-[#71717a] hover:text-[#004499] underline">
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
                    className="w-4 h-4 rounded border-[#8E9BB5] text-[#71717a] focus:ring-[#71717a]"
                  />
                  <span className="text-sm" style={{ color: C.textMuted }}>
                    Use loyalty points <strong className="text-[#71717a]">({userPoints} pts)</strong>
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
                {isFreeDelivery || (selectedZone && discountedTotal >= freeDeliveryThreshold) ? (
                  <span className="text-sm font-semibold" style={{ color: C.success }}>FREE</span>
                ) : selectedZone && deliveryFeeAmount !== null ? (
                  <span className="text-sm font-semibold" style={{ color: C.text }}>{formatKES(deliveryFeeAmount)}</span>
                ) : deliveryMethod === 'delivery' ? (
                  <span className="text-sm font-semibold" style={{ color: C.textMuted }}>Select zone</span>
                ) : (
                  <span className="text-sm font-semibold" style={{ color: C.textMuted }}>N/A (Pick-Up)</span>
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
                {deliveryMethod === 'pickup' ? <Package className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                {deliveryMethod === 'pickup' ? 'Pick-Up Details' : 'Delivery Details'}
              </h2>
              <p className="text-xs text-white/70 mt-0.5">{deliveryMethod === 'pickup' ? 'Choose a pickup station near you' : 'Where should we deliver your order?'}</p>
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

              {/* ── Location (Area + Landmark) ── */}
              {deliveryMethod === 'delivery' && <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textMuted }}>
                  Location <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value })}
                    name="area"
                    placeholder="Area / Estate / Neighbourhood (e.g. Westlands, Kilimani)"
                    className="w-full text-sm rounded-xl px-3.5 py-3 focus:outline-none transition-all"
                    style={{ backgroundColor: C.bgGray, color: C.text, border: `1px solid ${C.border}` }}
                  />
                  <input
                    type="text"
                    value={form.landmark}
                    onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                    name="landmark"
                    placeholder="Landmark / Nearest intersection (e.g. Junction, Mall, School)"
                    className="w-full text-sm rounded-xl px-3.5 py-3 focus:outline-none transition-all"
                    style={{ backgroundColor: C.bgGray, color: C.text, border: `1px solid ${C.border}` }}
                  />
                  <input
                    type="text"
                    value={form.street}
                    onChange={handleChange}
                    name="street"
                    placeholder="Street / Plot / Building Number (optional)"
                    className="w-full text-sm rounded-xl px-3.5 py-3 focus:outline-none transition-all"
                    style={{ backgroundColor: C.bgGray, color: C.text, border: `1px solid ${C.border}` }}
                  />
                </div>
              </div>
              }

              {/* City / Town */}
              <div className="col-span-2">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  name="city"
                  placeholder="City / Town (e.g. Nairobi, Mombasa, Kisumu)"
                  className="w-full text-sm rounded-xl px-3.5 py-3 focus:outline-none transition-all"
                  style={{
                    backgroundColor: C.bgGray,
                    color: C.text,
                    border: `1px solid ${C.border}`,
                  }}
                />
              </div>

              {/* ── Delivery Instructions & Additional Info ── */}
              {deliveryMethod === 'delivery' && <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textMuted }}>
                  Delivery Instructions & Additional Info
                </label>
                <div className="space-y-2">
                  {/* Delivery Instructions */}
                  <textarea
                    value={form.deliveryInstructions}
                    onChange={(e) => setForm({ ...form, deliveryInstructions: e.target.value })}
                    name="deliveryInstructions"
                    placeholder="Delivery instructions (e.g. leave at gate, call on arrival)"
                    rows={2}
                    className="w-full text-sm rounded-xl px-3.5 py-3 focus:outline-none transition-all resize-none"
                    style={{
                      backgroundColor: C.bgGray,
                      color: C.text,
                      border: `1px solid ${C.border}`,
                    }}
                  />

                  {/* Alternate Phone */}
                  <input
                    type="tel"
                    value={form.alternatePhone}
                    onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                    name="alternatePhone"
                    placeholder="Alternate phone number (optional)"
                    className="w-full text-sm rounded-xl px-3.5 py-3 focus:outline-none transition-all"
                    style={{
                      backgroundColor: C.bgGray,
                      color: C.text,
                      border: `1px solid ${C.border}`,
                    }}
                  />

                  {/* Order Notes */}
                  <textarea
                    value={form.orderNotes}
                    onChange={(e) => setForm({ ...form, orderNotes: e.target.value })}
                    name="orderNotes"
                    placeholder="Order notes / special requests (optional)"
                    rows={2}
                    className="w-full text-sm rounded-xl px-3.5 py-3 focus:outline-none transition-all resize-none"
                    style={{
                      backgroundColor: C.bgGray,
                      color: C.text,
                      border: `1px solid ${C.border}`,
                    }}
                  />

                  {/* ID Number */}
                  <input
                    type="text"
                    value={form.idNumber}
                    onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                    name="idNumber"
                    placeholder="ID / ID Number (optional, for delivery verification)"
                    className="w-full text-sm rounded-xl px-3.5 py-3 focus:outline-none transition-all"
                    style={{
                      backgroundColor: C.bgGray,
                      color: C.text,
                      border: `1px solid ${C.border}`,
                    }}
                  />

                  {/* Scheduled Date */}
                  <div>
                    <p className="text-[11px] font-semibold mb-1" style={{ color: C.textMuted }}>Preferred delivery date (optional)</p>
                    <input
                      type="date"
                      value={form.scheduledDate}
                      onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                      name="scheduledDate"
                      className="w-full text-sm rounded-xl px-3.5 py-3 focus:outline-none transition-all"
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      style={{
                        backgroundColor: C.bgGray,
                        color: C.text,
                        border: `1px solid ${C.border}`,
                      }}
                    />
                  </div>
                </div>
              </div>
              }

              {/* ── Delivery Method Toggle ── */}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textMuted }}>
                  Delivery Method <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMethod('delivery');
                      setSelectedPickupStation(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-bold transition-all ${
                      deliveryMethod === 'delivery' ? 'ring-2' : ''
                    }`}
                    style={{
                      border: `2px solid ${deliveryMethod === 'delivery' ? C.accent : C.border}`,
                      backgroundColor: deliveryMethod === 'delivery' ? `${C.accent}10` : C.bgGray,
                      color: deliveryMethod === 'delivery' ? C.accent : C.text,
                    }}
                  >
                    <MapPin className="w-4 h-4" />
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMethod('pickup');
                      setSelectedZone(null);
                      setDeliveryEstimateMin(null);
                      setDeliveryEstimateMax(null);
                      setDeliveryFeeAmount(null);
                      setFreeDeliveryThreshold(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-bold transition-all ${
                      deliveryMethod === 'pickup' ? 'ring-2' : ''
                    }`}
                    style={{
                      border: `2px solid ${deliveryMethod === 'pickup' ? C.accent : C.border}`,
                      backgroundColor: deliveryMethod === 'pickup' ? `${C.accent}10` : C.bgGray,
                      color: deliveryMethod === 'pickup' ? C.accent : C.text,
                    }}
                  >
                    <Package className="w-4 h-4" />
                    Pick-Up
                  </button>
                </div>
              </div>

              {/* ── Delivery Zone Selector ── */}
              {deliveryMethod === 'delivery' && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textMuted }}>
                    Delivery Zone <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedZone?.id || ''}
                      onChange={(e) => {
                        const zoneId = e.target.value;
                        if (!zoneId) {
                          setSelectedZone(null);
                          setDeliveryEstimateMin(null);
                          setDeliveryEstimateMax(null);
                          setDeliveryFeeAmount(null);
                          setFreeDeliveryThreshold(null);
                          return;
                        }
                        const zone = deliveryZones.find(z => z.id === zoneId);
                        setSelectedZone(zone);
                        setDeliveryEstimateMin(zone?.estimated_days_min || null);
                        setDeliveryEstimateMax(zone?.estimated_days_max || null);
                        setDeliveryFeeAmount(zone?.delivery_fee ?? null);
                        setFreeDeliveryThreshold(zone?.free_delivery_threshold || null);
                      }}
                      className="w-full text-sm rounded-xl px-3.5 py-3 appearance-none cursor-pointer focus:outline-none transition-all"
                      style={{
                        backgroundColor: C.bgGray,
                        color: selectedZone ? C.text : C.textMuted,
                        border: `1.5px solid ${C.border}`,
                      }}
                    >
                      <option value="">Select delivery zone...</option>
                      {deliveryZones.map((zone) => (
                        <option key={zone.id} value={zone.id}>
                          {zone.display_name || zone.zone_name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.textMuted }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                  {selectedZone && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium" style={{ color: C.textMuted }}>
                        <span>Estimated delivery: {deliveryEstimateMin}-{deliveryEstimateMax} days</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: C.text }}>
                        {deliveryFeeAmount !== null && discountedTotal >= freeDeliveryThreshold ? (
                          <span style={{ color: C.success }}>Free delivery</span>
                        ) : deliveryFeeAmount !== null ? (
                          <span>Delivery fee: {formatKES(deliveryFeeAmount)}</span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Pick-Up Station Selector ── */}
              {deliveryMethod === 'pickup' && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textMuted }}>
                    Pick-Up Station <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  {pickupStations.length === 0 ? (
                    <div className="p-4 rounded-xl text-sm" style={{ backgroundColor: C.bgGray, color: C.textMuted }}>
                      Loading pickup stations...
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pickupStations.map((station) => (
                        <button
                          key={station.id}
                          type="button"
                          onClick={() => setSelectedPickupStation(station)}
                          className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all"
                          style={{
                            border: `2px solid ${selectedPickupStation?.id === station.id ? C.accent : C.border}`,
                            backgroundColor: selectedPickupStation?.id === station.id ? `${C.accent}10` : C.bgGray,
                          }}
                        >
                          <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ borderColor: selectedPickupStation?.id === station.id ? C.accent : C.border }}>
                            {selectedPickupStation?.id === station.id && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.accent }} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: C.text }}>{station.name}</p>
                            <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{station.area}</p>
                            {station.address && (
                              <p className="text-xs" style={{ color: C.textMuted }}>{station.address}</p>
                            )}
                            {station.landmark && (
                              <p className="text-xs" style={{ color: C.textMuted }}>Near: {station.landmark}</p>
                            )}
                            {station.operating_hours && (
                              <p className="text-xs mt-1 font-medium" style={{ color: C.accent }}>Hours: {station.operating_hours}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Payment Method Selector ── */}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textMuted }}>
                  Payment Method <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      border: `2px solid ${paymentMethod === 'cod' ? C.accent : C.border}`,
                      backgroundColor: paymentMethod === 'cod' ? `${C.accent}10` : C.bgGray,
                    }}
                  >
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: paymentMethod === 'cod' ? C.accent : C.border }}>
                      {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.accent }} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: C.text }}>Cash on Delivery</p>
                      <p className="text-xs" style={{ color: C.textMuted }}>Pay when you receive -- inspect item before paying</p>
                    </div>
                    <Package className="w-5 h-5" style={{ color: C.accent }} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                    style={{
                      border: `2px solid ${paymentMethod === 'online' ? C.accent : C.border}`,
                      backgroundColor: paymentMethod === 'online' ? `${C.accent}10` : C.bgGray,
                    }}
                  >
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: paymentMethod === 'online' ? C.accent : C.border }}>
                      {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C.accent }} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold" style={{ color: C.text }}>Pay Online (M-Pesa)</p>
                      <p className="text-xs" style={{ color: C.textMuted }}>Secure STK Push payment</p>
                    </div>
                    <CreditCard className="w-5 h-5" style={{ color: C.accent }} />
                  </button>
                </div>
              </div>

              {/* Submit */}
              {paymentMethod === 'cod' ? (
                <button
                  type="button"
                  onClick={handleCOD}
                  disabled={loading}
                  className="fusion-chrome w-full font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base hover:opacity-90 active:scale-[0.98]"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                  ) : (
                    <><Package className="w-5 h-5" /> Order via WhatsApp — {formatKES(discountedTotal)}</>
                  )}
                </button>
              ) : (
              <button
                type="submit"
                disabled={loading}
                className="fusion-chrome w-full font-black py-4 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base hover:opacity-90 active:scale-[0.98]"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <><CreditCard className="w-5 h-5" /> Pay {formatKES(discountedTotal)} via M-Pesa</>
                )}
              </button>
              )}

              <p className="text-center text-xs" style={{ color: C.textMuted }}>
                M-Pesa STK Push. Secure and encrypted.
              </p>
            </form>
          </div>

          {/* ── M-Pesa Pending Dialog ── */}
          {mpesaPending && <MpesaPaymentDialog pending={mpesaPending} onDone={() => { setMpesaPending(null); orderCreated.current = false; }} />}

          {/* Nia contextual help */}
          <div className="mt-4">
            <NiaContextualTrigger page="checkout" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── M-Pesa Payment Dialog ───────────────────────────────────────────
function MpesaPaymentDialog({ pending, onDone }) {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('Waiting for M-Pesa prompt...');
  const pollRef = useRef(null);

  const maskedPhone = pending.phone.replace(/(\d{4})\d{4}(\d{2})/, '$1****$2');

  useEffect(() => {
    let attempts = 0;
    const MAX_ATTEMPTS = 40;

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await checkMpesaStatus(pending.checkoutRequestId);
        if (res.success && res.status === 'paid') {
          clearInterval(pollRef.current);
          setStatus('paid');
          setMessage('Payment received!');
          setTimeout(() => {
            clearCart();
            navigate(`/order-success?orderId=${pending.orderId}`);
          }, 1500);
          return;
        }
        if (attempts >= MAX_ATTEMPTS) {
          clearInterval(pollRef.current);
          setStatus('failed');
          setMessage('Payment not completed within the expected time. Please try again.');
        }
      } catch {
        // silent retry
      }
    }, 3000);

    return () => clearInterval(pollRef.current);
  }, [pending]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 text-center shadow-2xl">
        {status === 'paid' ? (
          <CheckCircle className="w-14 h-14 mx-auto mb-3 text-[#38B8EA]" />
        ) : (
          <Smartphone className="w-14 h-14 mx-auto mb-3 text-primary" />
        )}

        <h2 className="text-lg font-black mb-2">
          {status === 'paid' ? 'Payment Successful!' : 'Check Your Phone'}
        </h2>

        <p className="text-sm mb-4" style={{ color: '#71717a' }}>{message}</p>

        <div className="rounded-xl p-4 mb-4 text-sm space-y-2" style={{ backgroundColor: '#f4f4f5' }}>
          <div className="flex justify-between">
            <span style={{ color: '#71717a' }}>Amount</span>
            <span className="font-bold">KES {Number(pending.amount).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#71717a' }}>Phone</span>
            <span className="font-bold">{maskedPhone}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#71717a' }}>Order</span>
            <span className="font-bold">#{String(pending.orderId).slice(0, 8).toUpperCase()}</span>
          </div>
        </div>

        {status === 'failed' && (
          <button
            onClick={onDone}
            className="w-full py-3 rounded-xl font-bold text-white bg-primary hover:opacity-90 transition-all"
          >
            Try Again
          </button>
        )}

        {status === 'pending' && (
          <div className="flex items-center justify-center gap-2 text-sm" style={{ color: '#71717a' }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Waiting for PIN entry...</span>
          </div>
        )}
      </div>
    </div>
  );
}
