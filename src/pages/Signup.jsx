import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../utils/api';
import { useLang } from '../utils/lang';
import { User, Mail, Lock, Phone, ArrowRight, CheckCircle2, Store } from 'lucide-react';

function Signup() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleContinue = () => {
    if (!formData.fullName.trim()) { setError('Please enter your full name'); return; }
    if (!formData.email.trim() || !formData.email.includes('@')) { setError('Please enter a valid email'); return; }
    if (!formData.phone.trim()) { setError('Please enter your phone number'); return; }
    setError('');
    setStep(2);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agreed) { setError('Please agree to the Terms of Service'); return; }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    setError('');

    const result = await signUp({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      phone: formData.phone,
    });

    if (result.success) {
      if (result.session) {
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setNeedsVerification(true);
        setRegisteredEmail(formData.email);
        setLoading(false);
      }
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center" data-name="signup-verify">
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 p-8 rounded-3xl mb-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h2 className="text-2xl font-black mb-2">{t('auth.checkEmail')}</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-2">
            {t('auth.checkEmailDesc')} <strong className="text-zinc-700 dark:text-zinc-300">{registeredEmail}</strong>
          </p>
          <p className="text-sm text-zinc-400">{t('auth.checkEmailInstr')}</p>
        </div>
        <Link to="/login" className="text-[#ff385c] font-bold hover:underline">{t('auth.goToLogin')}</Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-8 rounded-3xl inline-block mb-4">
          <h2 className="text-3xl font-black mb-2">{t('auth.accountCreated')}</h2>
          <p className="text-zinc-500 dark:text-zinc-400">{t('auth.accountCreatedDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 w-full" data-name="signup-page">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-[#ff385c]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-[#ff385c]" />
        </div>
        <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">Create Your Seller Account</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Join Omix Marketplace and start selling in minutes.</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${step >= 1 ? 'bg-[#ff385c] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Profile</span>
          <span className="sm:hidden">1</span>
        </div>
        <div className="w-8 h-0.5 bg-zinc-200 dark:bg-zinc-700" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${step >= 2 ? 'bg-[#ff385c] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">Security</span>
          <span className="sm:hidden">2</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      {/* Step 1: Profile Info */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                value={formData.fullName}
                onChange={e => updateField('fullName', e.target.value)}
                placeholder="e.g. Kiprono Yegon"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="email"
                value={formData.email}
                onChange={e => updateField('email', e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={e => updateField('phone', e.target.value)}
                placeholder="+254 700 000 000"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm"
              />
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">Buyers will use this to contact you about your listings.</p>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20 flex items-center justify-center gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2: Password & Agreement */}
      {step === 2 && (
        <form onSubmit={handleSignup} className="space-y-5">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#ff385c]/10 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-[#ff385c]" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">{formData.fullName}</p>
              <p className="text-xs text-zinc-500 truncate">{formData.email}</p>
            </div>
            <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs font-bold text-[#ff385c] hover:underline flex-shrink-0">
              Edit
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Create Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                required
                name="password"
                type="password"
                value={formData.password}
                onChange={e => updateField('password', e.target.value)}
                placeholder="Minimum 6 characters"
                minLength={6}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm"
              />
            </div>
          </div>

          {/* User Agreement */}
          <label className="flex items-start gap-3 cursor-pointer group pt-2">
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
              I agree to the <Link to="/terms" className="text-[#ff385c] font-semibold hover:underline" target="_blank" rel="noopener noreferrer">Terms of Service</Link> and <Link to="/privacy" className="text-[#ff385c] font-semibold hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
            </span>
          </label>

          <button type="submit" disabled={loading} className="w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20">
            {loading ? t('auth.creatingAccount') : 'Create Account & Start Selling'}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-zinc-500 text-sm">
        {t('auth.hasAccount')} <Link to="/login" className="text-[#ff385c] font-bold hover:underline">{t('auth.logIn')}</Link>
      </p>
    </div>
  );
}

export default Signup;
