import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Upload, X, Image as ImageIcon, CreditCard, CheckCircle2 } from 'lucide-react'
import { CATEGORIES, LOCATIONS } from '../utils/constants'
import { createListing, uploadImage, createListingPayment, updateListingPaymentStatus } from '../utils/api'
import { useLang } from '../utils/lang'

const PAYSTACK_PUBLIC_KEY = 'pk_live_27f0020f17e275660e4a92c34fb7f7a9fc36ea94';
const LISTING_FEE_KES = 5;

function Sell() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [pendingListingData, setPendingListingData] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!agreed) {
      setError(t('sell.errorAgree'));
      return;
    }

    setSubmitting(true);
    setError('');

    let imageUrl = '';
    if (imageFile) {
      const uploadResult = await uploadImage(imageFile);
      if (uploadResult.success) {
        imageUrl = uploadResult.url;
      } else {
        setError('Failed to upload image: ' + uploadResult.error);
        setSubmitting(false);
        return;
      }
    }

    const form = e.currentTarget;
    const formData = {
      title: form.title.value,
      price: form.price.value,
      condition: form.condition.value,
      category: form.category.value,
      location: form.location.value,
      description: form.description.value,
      image_url: imageUrl,
      seller_name: form.seller_name.value,
      seller_phone: form.seller_phone.value,
    };

    const paymentResult = await createListingPayment(formData);
    if (!paymentResult.success) {
      setError('Failed to create payment record: ' + paymentResult.error);
      setSubmitting(false);
      return;
    }

    const paymentId = paymentResult.payment.id;
    setPendingListingData(formData);

    setPaying(true);

    if (!window.PaystackPop) {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        initiatePaystackPayment(paymentId, formData);
      };
      script.onerror = () => {
        setError(t('sell.errorPayment'));
        setSubmitting(false);
        setPaying(false);
      };
    } else {
      initiatePaystackPayment(paymentId, formData);
    }
  };

  const initiatePaystackPayment = async (paymentId, formData) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';

      const initRes = await fetch(`${API_BASE}/api/paystack/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: `listing_${paymentId}_${Date.now()}`,
          email: formData.seller_name ? `${formData.seller_name.replace(/\s+/g, '.').toLowerCase()}@omix.co.ke` : 'buyer@omix.co.ke',
          amount: LISTING_FEE_KES * 100,
          payment_id: paymentId,
          callback_url: `${window.location.origin}/sell?payment_callback=true&payment_id=${paymentId}`,
        }),
      });

      if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}));
        setError(err.message || t('sell.errorPaymentInit'));
        setSubmitting(false);
        setPaying(false);
        return;
      }

      const initData = await initRes.json();

      const handler = window.PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY,
        email: initData.email || 'buyer@omix.co.ke',
        amount: LISTING_FEE_KES * 100,
        ref: initData.reference,
        currency: 'KES',
        onClose: async () => {
          setPaying(false);
          setSubmitting(false);
          setError(t('sell.paymentCancelled'));
          await updateListingPaymentStatus(paymentId, {
            paystackReference: initData.reference,
            paymentStatus: 'failed',
          });
        },
        callback: async (response) => {
          await verifyAndCreateListing(paymentId, response.reference, formData);
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error('Paystack init error:', err);
      setError('Payment failed to start. Please try again.');
      setSubmitting(false);
      setPaying(false);
    }
  };

  const verifyAndCreateListing = async (paymentId, reference, formData) => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const verifyRes = await fetch(`${API_BASE}/api/paystack/verify/${reference}`);

      if (!verifyRes.ok) {
        setError(t('sell.errorPaymentVerify'));
        setPaying(false);
        setSubmitting(false);
        return;
      }

      const verifyData = await verifyRes.json();

      if (verifyData.success && verifyData.data?.status === 'success') {
        await updateListingPaymentStatus(paymentId, {
          paystackReference: reference,
          paymentStatus: 'success',
        });

        const result = await createListing(formData);

        if (result.success) {
          setSuccess(true);
          setPaying(false);
          setTimeout(() => { navigate('/'); }, 2000);
        } else {
          setError(t('sell.errorListingCreate') + ': ' + (result.error || 'Unknown error') + '. Contact support for assistance.');
          setPaying(false);
          setSubmitting(false);
        }
      } else {
        await updateListingPaymentStatus(paymentId, {
          paystackReference: reference,
          paymentStatus: 'failed',
        });
        setError(t('sell.errorPaymentVerify'));
        setPaying(false);
        setSubmitting(false);
      }
    } catch (err) {
      console.error('verifyAndCreateListing error:', err);
      setError('An error occurred during payment verification.');
      setPaying(false);
      setSubmitting(false);
    }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_callback') === 'true' && params.get('payment_id')) {
      const paymentId = params.get('payment_id');
      const reference = params.get('reference');

      if (reference && pendingListingData) {
        verifyAndCreateListing(paymentId, reference, pendingListingData);
      }

      window.history.replaceState({}, document.title, '/sell');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (success) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-8 rounded-3xl inline-block mb-4">
          <h2 className="text-3xl font-black mb-2">{t('sell.listingPosted')}</h2>
          <p className="text-zinc-500 dark:text-zinc-400">{t('sell.listingPostedDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full" data-name="sell-page">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">{t('sell.title')}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">{t('sell.subtitle')}</p>
      </div>

      {/* Listing Fee Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-4 mb-6 flex items-start gap-3">
        <CreditCard className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{t('sell.listingFee')}</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">{t('sell.listingFeeDesc')}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      {paying && (
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl mb-6 text-sm font-medium border border-blue-200 dark:border-blue-800/50 flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          {t('sell.paymentRedirect')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Image Upload Area */}
          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('sell.productPhoto')}</label>
            {imagePreview ? (
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden group">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={removeImage}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all">
                <Upload className="w-10 h-10 text-zinc-400 mb-2" />
                <span className="text-sm text-zinc-500 font-medium">{t('sell.clickUpload')}</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('sell.titleLabel')}</label>
            <input required name="title" type="text" placeholder={t('sell.titlePlaceholder')} className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('sell.price')}</label>
              <input required name="price" type="number" placeholder={t('sell.pricePlaceholder')} className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('sell.condition')}</label>
              <select required name="condition" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm appearance-none">
                <option value="New">New</option>
                <option value="Used - Like New">Used - Like New</option>
                <option value="Used - Good">Used - Good</option>
                <option value="Used - Fair">Used - Fair</option>
                <option value="N/A">N/A (Services)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('sell.category')}</label>
              <select required name="category" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm appearance-none">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('sell.location')}</label>
              <select required name="location" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm appearance-none">
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('sell.description')}</label>
            <textarea required name="description" rows="4" placeholder={t('sell.descriptionPlaceholder')} className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm resize-none"></textarea>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">{t('sell.sellerInfo')}</h3>
          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('sell.yourName')}</label>
            <input required name="seller_name" type="text" placeholder={t('sell.yourNamePlaceholder')} className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('sell.phone')}</label>
            <input name="seller_phone" type="tel" placeholder={t('sell.phonePlaceholder')} className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
          </div>
        </div>

        {/* User Agreement Checkbox */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-md border-2 border-zinc-300 dark:border-zinc-600 peer-checked:border-[#ff385c] peer-checked:bg-[#ff385c] transition-all flex items-center justify-center">
                {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </div>
            </div>
            <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {t('sell.agreeTerms')}
            </span>
          </label>
        </div>

        <button type="submit" disabled={submitting || paying} className="w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20 flex items-center justify-center gap-2">
          {paying ? (
            <>
              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              {t('sell.processing')}
            </>
          ) : submitting ? (
            t('sell.uploading')
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              {t('sell.payAndPost')}
            </>
          )}
        </button>

        <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mt-2">
          {t('sell.securePayment')}
        </p>
      </form>
    </div>
  );
}

export default Sell;
