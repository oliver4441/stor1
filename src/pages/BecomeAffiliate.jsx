import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { submitAffiliateApplication, getApplicationStatus, getAffiliateProfile } from '../utils/affiliate_api';
import { Award, Send, CheckCircle, Clock, XCircle, Loader2, AlertCircle } from 'lucide-react';

export default function BecomeAffiliate() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);        // 'form' | 'pending' | 'rejected' | 'success' | 'redirecting'
  const [applicationData, setApplicationData] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // ─── Load user & check existing status ─────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          navigate('/login');
          return;
        }
        if (cancelled) return;
        setUser(session.user);

        // Pre-fill name from user metadata
        const meta = session.user.user_metadata || {};
        setFullName(meta.full_name || meta.name || '');

        // Check if user is already an active affiliate → redirect
        const profile = await getAffiliateProfile(session.user.id);

        if (profile) {
          if (profile.status === 'active') {
            if (!cancelled) navigate('/affiliate-dashboard');
            return;
          }
          if (profile.status === 'pending' || profile.status === 'rejected') {
            if (!cancelled) {
              setApplicationData(profile);
              setStatus(profile.status);
            }
            return;
          }
        }

        // Check for any application record
        const appStatus = await getApplicationStatus(session.user.id);
        if (appStatus) {
          if (!cancelled) {
            let s = appStatus.status || 'pending';
            // Approved/active → redirect to affiliate dashboard
            if (s === 'approved' || s === 'active') {
              navigate('/affiliate-dashboard');
              return;
            }
            setApplicationData(appStatus);
            setStatus(s === 'terminated' ? 'rejected' : s);
          }
          return;
        }

        // No application yet — show form
        if (!cancelled) setStatus('form');
      } catch (err) {
        console.error('BecomeAffiliate init error:', err);
        if (!cancelled) {
          setError(err.message);
          setStatus('form');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [navigate]);

  // ─── Validation ────────────────────────────────────────────────
  function validateForm() {
    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full name is required';
    if (!mpesaNumber.trim()) errs.mpesaNumber = 'M-Pesa number is required';
    else if (!/^(\+?254|0)[17]\d{8}$/.test(mpesaNumber.trim())) {
      errs.mpesaNumber = 'Enter a valid M-Pesa number (e.g. 0712345678)';
    }
    if (!agreeToTerms) errs.agreeToTerms = 'You must agree to the terms';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Submit application ────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError('');
    try {
      const result = await submitAffiliateApplication({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        mpesa_number: mpesaNumber.trim(),
      });
      setSubmitResult(result);
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // ─── Affiliate status already known (pending/rejected) ─────────
  if (status === 'pending') {
    const app = applicationData || {};
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Application Pending</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Your affiliate application is being reviewed. We will notify you once it has been approved.
          </p>
          <div className="bg-zinc-800/50 rounded-xl p-4 text-left space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Name</span>
              <span className="text-white font-medium">{app.full_name || user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">M-Pesa</span>
              <span className="text-white font-medium">{app.mpesa_number || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Status</span>
              <span className="text-amber-400 font-bold uppercase text-xs">Pending</span>
            </div>
            {app.created_at && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Submitted</span>
                <span className="text-white font-medium">{new Date(app.created_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/account')}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors"
          >
            Back to Account
          </button>
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    const app = applicationData || {};
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Application Not Approved</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Unfortunately your affiliate application was not approved at this time.
            {app.rejection_reason && (
              <>
                <br /><br />
                <span className="text-zinc-300">Reason: {app.rejection_reason}</span>
              </>
            )}
          </p>
          <div className="bg-zinc-800/50 rounded-xl p-4 text-left space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Name</span>
              <span className="text-white font-medium">{app.full_name || user?.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">M-Pesa</span>
              <span className="text-white font-medium">{app.mpesa_number || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Status</span>
              <span className="text-red-400 font-bold uppercase text-xs">Rejected</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setStatus('form');
                setApplicationData(null);
                setError('');
              }}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors"
            >
              Apply Again
            </button>
            <button
              onClick={() => navigate('/account')}
              className="w-full py-2.5 bg-zinc-800 text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors"
            >
              Back to Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Success state after submission ────────────────────────────
  if (status === 'success' && submitResult) {
    const code = submitResult.referral_code || applicationData?.referral_code || '';
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Application Submitted</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Your affiliate application has been received. We will review it and notify you once it is approved.
          </p>
          {code && (
            <div className="bg-zinc-800/50 rounded-xl p-4 mb-4">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Your Referral Code</p>
              <p className="text-lg font-bold text-primary font-mono">{code}</p>
              <p className="text-xs text-zinc-500 mt-2">
                You can start sharing this code once your application is approved.
              </p>
            </div>
          )}
          <button
            onClick={() => navigate('/account')}
            className="w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover transition-colors"
          >
            Back to Account
          </button>
        </div>
      </div>
    );
  }

  // ─── Signup form ───────────────────────────────────────────────
  if (status !== 'form') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-6 text-center">
          <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <p className="text-zinc-400 text-sm">{error || 'An unexpected error occurred. Please try again.'}</p>
          <button
            onClick={() => { setStatus('form'); setError(''); }}
            className="mt-4 w-full py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/20 to-zinc-950 px-4 py-8">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Award className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-white">Become an Affiliate</h1>
          </div>
          <p className="text-zinc-400 text-sm">
            Join our affiliate program and earn commissions on every sale you refer.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 mt-6">
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
          <h2 className="text-sm font-bold text-zinc-300 mb-5">Apply Now</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-300">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); setFormErrors((p) => ({ ...p, fullName: '' })); }}
                placeholder="John Doe"
                className={`w-full px-4 py-2.5 rounded-xl bg-zinc-800 border text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 ${formErrors.fullName ? 'border-red-500' : 'border-zinc-700'}`}
              />
              {formErrors.fullName && (
                <p className="text-xs text-red-400 mt-1">{formErrors.fullName}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-300">
                Phone Number <span className="text-zinc-500 text-xs">(optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 712 345 678"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* M-Pesa Number */}
            <div>
              <label className="block text-sm font-bold mb-1.5 text-zinc-300">
                M-Pesa Number <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                value={mpesaNumber}
                onChange={(e) => { setMpesaNumber(e.target.value); setFormErrors((p) => ({ ...p, mpesaNumber: '' })); }}
                placeholder="0712345678"
                className={`w-full px-4 py-2.5 rounded-xl bg-zinc-800 border text-white text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary/50 ${formErrors.mpesaNumber ? 'border-red-500' : 'border-zinc-700'}`}
              />
              {formErrors.mpesaNumber && (
                <p className="text-xs text-red-400 mt-1">{formErrors.mpesaNumber}</p>
              )}
              <p className="text-xs text-zinc-500 mt-1">Used for commission payouts via M-Pesa B2C.</p>
            </div>

            {/* Agree to terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => { setAgreeToTerms(e.target.checked); setFormErrors((p) => ({ ...p, agreeToTerms: '' })); }}
                  className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-primary focus:ring-primary/50"
                />
                <span className={`text-sm ${formErrors.agreeToTerms ? 'text-red-400' : 'text-zinc-300'}`}>
                  I agree to the{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                    Affiliate Program Terms & Conditions
                  </a>
                  . <span className="text-red-400">*</span>
                </span>
              </label>
              {formErrors.agreeToTerms && (
                <p className="text-xs text-red-400 mt-1 ml-7">{formErrors.agreeToTerms}</p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>

            <p className="text-xs text-zinc-500 text-center">
              By submitting, you agree to our affiliate program terms. Applications are reviewed within 1-3 business days.
            </p>
          </form>
        </div>

        {/* Info card */}
        <div className="mt-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 p-5">
          <h3 className="text-sm font-bold text-zinc-300 mb-2">How It Works</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              Submit your application and wait for approval
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              Share your unique referral link with customers
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              Earn up to 12% commission on every qualifying sale
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
              Request payouts to your M-Pesa account
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
