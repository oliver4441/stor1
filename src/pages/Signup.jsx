import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp } from '../utils/api';
import { useLang } from '../utils/lang';

function Signup() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError(t('sell.errorAgree'));
      return;
    }
    setLoading(true);
    setError('');

    const { email, password, fullName } = e.target.elements;
    const emailVal = email.value;
    const result = await signUp({
      email: emailVal,
      password: password.value,
      fullName: fullName.value,
    });

    if (result.success) {
      if (result.session) {
        setSuccess(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setNeedsVerification(true);
        setRegisteredEmail(emailVal);
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
    <div className="max-w-md mx-auto px-4 py-20 w-full" data-name="signup-page">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">{t('auth.startSelling')}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">{t('auth.signupSubtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('auth.fullName')}</label>
          <input required name="fullName" type="text" placeholder={t('auth.fullNamePlaceholder')} className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('auth.email')}</label>
          <input required name="email" type="email" placeholder={t('auth.emailPlaceholder')} className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
        </div>
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">{t('auth.password')}</label>
          <input required name="password" type="password" placeholder={t('auth.passwordPlaceholder')} minLength={6} className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
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
              {agreed && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
          </div>
          <span className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t('sell.agreeTerms').split('Terms of Service')[0]}<Link to="/terms" className="text-[#ff385c] font-semibold hover:underline" target="_blank" rel="noopener noreferrer">Terms of Service</Link> {t('sell.agreeTerms').split('Terms of Service')[1] || ''}
          </span>
        </label>

        <button type="submit" disabled={loading} className="w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20">
          {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
        </button>
      </form>

      <p className="mt-8 text-center text-zinc-500 text-sm">
        {t('auth.hasAccount')} <Link to="/login" className="text-[#ff385c] font-bold hover:underline">{t('auth.logIn')}</Link>
      </p>
    </div>
  );
}

export default Signup;
