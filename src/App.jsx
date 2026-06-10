import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './utils/lang';
import { CartProvider } from './context/CartContext';
import { NiaChatProvider } from './context/NiaChatContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NiaChat from './components/NiaChat';
import NiaFloatingButton from './components/NiaFloatingButton';
import NiaOnboarding from './components/NiaOnboarding';
import Home from './pages/Home';
import ListingDetails from './pages/ListingDetails';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HowItWorks from './pages/HowItWorks';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import TrackOrder from './pages/TrackOrder';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Install from './pages/Install';
import Cart from './pages/Cart';
import ContactFloat from './components/ContactFloat';
import ScrollToTop from './components/ScrollToTop';

import { supabase } from './utils/supabase';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) {
    console.error('App Crash:', error, errorInfo);
    console.error('Error stack:', error?.stack);
    console.error('Error message:', error?.message);
    console.error('ErrorInfo componentStack:', errorInfo?.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 text-center">
          <div className="max-w-md bg-red-50 dark:bg-red-900/20 p-8 rounded-3xl border border-red-100 dark:border-red-900/50">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-2 text-sm font-mono">{this.state.error?.message || this.state.error?.toString() || 'The application failed to load.'}</p>
            <p className="text-zinc-500 dark:text-zinc-500 mb-6 text-xs">{this.state.error?.stack?.split('\n').slice(0, 3).join('\n') || ''}</p>
            <button onClick={() => window.location.href = '/'} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold">Reload App</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  React.useEffect(() => {
    console.log('Omix Store Mounted');

    // Listen for auth state changes (OAuth login/signup)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if profile exists, create if not (for OAuth users)
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single();

        if (!existing) {
          await supabase.from('profiles').insert({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Google User',
            email: session.user.email,
            phone: session.user.user_metadata?.phone || null,
            role: 'customer',
          });
        }
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <LanguageProvider>
    <CartProvider>
    <NiaChatProvider>
    <ErrorBoundary>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased">
        <Navbar />
        <main className="flex-grow page-transition">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/listing/:id" element={<ListingDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/account" element={<UserDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/install" element={<Install />} />
            <Route path="/cart" element={<Cart />} />
          </Routes>
        </main>
        <Footer />
        <ContactFloat />
        <NiaOnboarding />
        <NiaChat />
        <NiaFloatingButton />
      </div>
    </ErrorBoundary>
    </NiaChatProvider>
    </CartProvider>
    </LanguageProvider>
  )
}

export default App
