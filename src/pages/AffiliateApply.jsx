import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Send, FileText } from 'lucide-react';
import { GooeyLoader } from '@/components/ui/loader-10';

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

const PROMO_OPTIONS = [
  'Social Media',
  'WhatsApp/Telegram Groups',
  'Blog/Website',
  'Word of Mouth/Referrals',
  'Influencer/Content Creator',
  'Paid Ads',
  'Other',
];

const HEAR_OPTIONS = [
  'Social Media',
  'Friend or Family',
  'Search Engine',
  'Online Advertisement',
  'Email Newsletter',
  'Other',
];

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;
  if (!token) {
    try {
      const stored = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      token = stored?.currentSession?.access_token || stored?.access_token;
    } catch { /* ignore */ }
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export default function AffiliateApply() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    alternative_phone: '',
    email: '',
    password: '',
    physical_address: '',
    id_number: '',
    date_of_birth: '',
    mpesa_number: '',
    mpesa_account_name: '',
    promotional_methods: [],
    other_promo_text: '',
    social_media_handles: '',
    how_heard: '',
    agreed: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Track whether user was created during this submission
  const [accountCreated, setAccountCreated] = useState(false);

  // Pre-fill email from user session
  useEffect(() => {
    if (user?.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#242C3B] flex items-center justify-center">
        <GooeyLoader />
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePromoMethod = (method) => {
    setFormData(prev => {
      const methods = prev.promotional_methods.includes(method)
        ? prev.promotional_methods.filter(m => m !== method)
        : [...prev.promotional_methods, method];
      return { ...prev, promotional_methods: methods };
    });
  };

  const validate = () => {
    const errors = {};
    if (!formData.full_name?.trim()) errors.full_name = 'Full name is required';
    if (!formData.phone?.trim()) errors.phone = 'Phone number is required';
    if (!formData.email?.trim()) errors.email = 'Email is required';
    if (!user && (!formData.password || formData.password.length < 6)) errors.password = 'Password must be at least 6 characters';
    if (!formData.mpesa_number?.trim()) errors.mpesa_number = 'M-Pesa payout number is required';
    if (!formData.agreed) errors.agreed = 'You must agree to the affiliate agreement';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const headers = await getAuthHeaders();

      const promoMethods = formData.promotional_methods.includes('Other') && formData.other_promo_text?.trim()
        ? [...formData.promotional_methods.filter(m => m !== 'Other'), `Other: ${formData.other_promo_text.trim()}`]
        : formData.promotional_methods;

      const body = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        alternative_phone: formData.alternative_phone.trim() || null,
        email: formData.email.trim(),
        password: !user ? formData.password : undefined,
        physical_address: formData.physical_address.trim() || null,
        id_number: formData.id_number.trim() || null,
        date_of_birth: formData.date_of_birth || null,
        mpesa_number: formData.mpesa_number.trim(),
        mpesa_account_name: formData.mpesa_account_name.trim() || null,
        promotional_methods: promoMethods,
        social_media_handles: formData.social_media_handles.trim() || null,
        how_heard: formData.how_heard || null,
        agreed: formData.agreed,
      };

      const res = await fetch(`${API_BASE}/api/affiliates/apply`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Application failed. Please try again.');
        return;
      }

      setSuccess(true);
      if (!user) setAccountCreated(true);
    } catch (err) {
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Success view
  if (success) {
    return (
      <div className="min-h-screen bg-[#242C3B] flex items-center justify-center px-4 py-20">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#007AFF]/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#007AFF]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Application Submitted</h1>
          {accountCreated ? (
            <>
              <p className="text-[#4A5771] mb-2 leading-relaxed">
                Your account and affiliate application have been created successfully.
              </p>
              <p className="text-[#4A5771] mb-8 leading-relaxed">
                You can now sign in with your email and password to track your application status.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  Sign In to Your Account
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-[#8E9BB5] border border-[#353F54] hover:bg-[#28303F] transition-colors"
                >
                  Browse Store
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-[#4A5771] mb-8 leading-relaxed">
                Application submitted successfully. We will review your application and get back to you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/affiliate"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back to Affiliate Program
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-[#8E9BB5] border border-[#353F54] hover:bg-[#28303F] transition-colors"
                >
                  Browse Store
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const inputClass = (name) =>
    `w-full px-4 py-3 rounded-lg bg-[#28303F]/50 border ${
      fieldErrors[name] ? 'border-red-500/50' : 'border-[#353F54]'
    } text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors`;

  return (
    <div className="min-h-screen bg-[#242C3B] py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/affiliate"
            className="inline-flex items-center gap-1.5 text-sm text-[#4A5771] hover:text-zinc-200 transition-colors mb-4"
          >
            <ArrowLeft size={14} />
            Back to Affiliate Program
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Affiliate Application</h1>
          <p className="text-[#4A5771]">
            {user
              ? 'Complete the form below to apply for the Omix Store Affiliate Program. Fields marked with an asterisk are required.'
              : 'Create your affiliate account by completing the form below. You will set a password to access your dashboard after submission.'}
          </p>
        </div>

        {/* Already an affiliate? */}
        <div className="mb-6 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-200">Already an affiliate?</p>
            <p className="text-xs text-[#4A5771]">Sign in to access your dashboard, view commissions, and manage referrals.</p>
          </div>
          <Link
            to="/login"
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-500 transition-colors"
          >
            Sign In
            <ArrowLeft size={14} className="rotate-180" />
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ── Personal Information ── */}
          <div className="p-6 rounded-xl bg-[#28303F]/50 border border-[#353F54]">
            <h2 className="text-lg font-semibold text-white mb-1">Personal Information</h2>
            <p className="text-[#4A5771] text-sm mb-6">As per your national ID</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter your full name as per national ID"
                  className={inputClass('full_name')}
                />
                {fieldErrors.full_name && <p className="text-red-400 text-xs mt-1">{fieldErrors.full_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                  ID / Passport Number
                </label>
                <input
                  type="text"
                  name="id_number"
                  value={formData.id_number}
                  onChange={handleChange}
                  placeholder="Enter your ID or passport number"
                  className={inputClass('id_number')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className={inputClass('date_of_birth')}
                />
              </div>
            </div>
          </div>

          {/* ── Contact Information ── */}
          <div className="p-6 rounded-xl bg-[#28303F]/50 border border-[#353F54]">
            <h2 className="text-lg font-semibold text-white mb-1">Contact Information</h2>
            <p className="text-[#4A5771] text-sm mb-6">How we can reach you</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 0712345678"
                  className={inputClass('phone')}
                />
                {fieldErrors.phone && <p className="text-red-400 text-xs mt-1">{fieldErrors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                  Alternative Phone
                </label>
                <input
                  type="tel"
                  name="alternative_phone"
                  value={formData.alternative_phone}
                  onChange={handleChange}
                  placeholder="e.g. 0723456789"
                  className={inputClass('alternative_phone')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className={inputClass('email')}
                  readOnly={!!user?.email}
                />
                {fieldErrors.email && <p className="text-red-400 text-xs mt-1">{fieldErrors.email}</p>}
              </div>

              {!user && (
                <div>
                  <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                    Create Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className={inputClass('password')}
                  />
                  {fieldErrors.password && <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>}
                  <p className="text-[#4A5771] text-xs mt-1.5">
                    Set a password for your account. You will use this to sign in and access your affiliate dashboard.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                  Physical Address (Town / Estate)
                </label>
                <input
                  type="text"
                  name="physical_address"
                  value={formData.physical_address}
                  onChange={handleChange}
                  placeholder="e.g. Nairobi, Westlands"
                  className={inputClass('physical_address')}
                />
              </div>
            </div>
          </div>

          {/* ── M-Pesa Payout ── */}
          <div className="p-6 rounded-xl bg-[#28303F]/50 border border-[#353F54]">
            <h2 className="text-lg font-semibold text-white mb-1">M-Pesa Payout Details</h2>
            <p className="text-[#4A5771] text-sm mb-6">Where your commissions will be paid</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                  M-Pesa Payout Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  name="mpesa_number"
                  value={formData.mpesa_number}
                  onChange={handleChange}
                  placeholder="Must be registered and active on M-Pesa"
                  className={inputClass('mpesa_number')}
                />
                {fieldErrors.mpesa_number && <p className="text-red-400 text-xs mt-1">{fieldErrors.mpesa_number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                  M-Pesa Account Name
                </label>
                <input
                  type="text"
                  name="mpesa_account_name"
                  value={formData.mpesa_account_name}
                  onChange={handleChange}
                  placeholder="As registered with Safaricom"
                  className={inputClass('mpesa_account_name')}
                />
              </div>
            </div>
          </div>

          {/* ── Promotional Methods ── */}
          <div className="p-6 rounded-xl bg-[#28303F]/50 border border-[#353F54]">
            <h2 className="text-lg font-semibold text-white mb-1">Promotional Methods</h2>
            <p className="text-[#4A5771] text-sm mb-6">How do you plan to promote Omix Store?</p>

            <div className="space-y-3">
              {PROMO_OPTIONS.map((method) => (
                <label
                  key={method}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData.promotional_methods.includes(method)
                      ? 'border-blue-500/30 bg-blue-500/5'
                      : 'border-[#353F54] bg-[#28303F]/30 hover:bg-[#28303F]/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.promotional_methods.includes(method)}
                    onChange={() => handlePromoMethod(method)}
                    className="w-4 h-4 rounded border-zinc-600 bg-[#28303F] text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-zinc-200">{method}</span>
                </label>
              ))}
              {formData.promotional_methods.includes('Other') && (
                <div className="ml-7">
                  <input
                    type="text"
                    name="other_promo_text"
                    value={formData.other_promo_text}
                    onChange={handleChange}
                    placeholder="Please specify your promotional method"
                    className={inputClass('other_promo_text')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Social Media & How Heard ── */}
          <div className="p-6 rounded-xl bg-[#28303F]/50 border border-[#353F54]">
            <h2 className="text-lg font-semibold text-white mb-1">Additional Information</h2>
            <p className="text-[#4A5771] text-sm mb-6">Help us understand your reach</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                  Social Media Handles / Website URLs
                </label>
                <input
                  type="text"
                  name="social_media_handles"
                  value={formData.social_media_handles}
                  onChange={handleChange}
                  placeholder="e.g. @yourhandle on Instagram, yoursite.com"
                  className={inputClass('social_media_handles')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                  How did you hear about the program?
                </label>
                <select
                  name="how_heard"
                  value={formData.how_heard}
                  onChange={handleChange}
                  className={inputClass('how_heard')}
                >
                  <option value="">Select an option</option>
                  {HEAR_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Agreement ── */}
          <div className="p-6 rounded-xl bg-[#28303F]/50 border border-[#353F54]">
            <label className={`flex items-start gap-3 cursor-pointer ${fieldErrors.agreed ? 'border-red-500/30' : ''}`}>
              <input
                type="checkbox"
                name="agreed"
                checked={formData.agreed}
                onChange={handleChange}
                className="w-5 h-5 mt-0.5 rounded border-zinc-600 bg-[#28303F] text-blue-500 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm text-[#8E9BB5]">
                  I have read and agree to the{' '}
                  <Link to="/affiliate/agreement" target="_blank" className="text-blue-400 hover:text-blue-300 underline">
                    Omix Store Affiliate Partner Agreement
                  </Link>
                </span>
                {fieldErrors.agreed && <p className="text-red-400 text-xs mt-1">{fieldErrors.agreed}</p>}
              </div>
            </label>
          </div>

          {/* ── Submit ── */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
            <p className="text-xs text-[#4A5771]">
              By submitting this application, you confirm that all information provided is accurate and complete.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/20 shrink-0"
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={18} />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>

        {/* Agreement link in footer */}
        <div className="mt-8 text-center">
          <Link
            to="/affiliate/agreement"
            className="inline-flex items-center gap-1.5 text-sm text-[#4A5771] hover:text-[#8E9BB5] transition-colors"
          >
            <FileText size={14} />
            View Full Affiliate Partner Agreement
          </Link>
        </div>
      </div>
    </div>
  );
}
