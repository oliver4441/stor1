import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LanguageProvider } from './utils/lang';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NiaChatProvider } from './context/NiaChatContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import NiaChat from './components/NiaChat';
import NiaFloatingButton from './components/NiaFloatingButton';
import NiaOnboarding from './components/NiaOnboarding';
import ErrorBoundary from './components/ErrorBoundary';
import MobileBottomNav from './components/MobileBottomNav';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import PWAUpdateChecker from './components/PWAUpdateChecker';
import InstallPrompt from './components/InstallPrompt';
import AbandonedCartBanner from './components/AbandonedCartBanner';
import FloatingCartButton from './components/FloatingCartButton';
import { SeasonalProvider } from './context/SeasonalContext';
import { supabase } from './utils/supabase';
import { useMaintenanceMode } from './hooks/useMaintenanceMode';
import MaintenanceBanner from './components/MaintenanceBanner';
import { trackPageView, trackUserLogin, trackUserSignup, setUserId } from './utils/analytics';

console.log('[TRACE 8] App.jsx module loaded');

// Lazy-loaded page components for route-based code splitting
const Home = React.lazy(() => import('./pages/Home'));
const ListingDetails = React.lazy(() => import('./pages/ListingDetails'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const About = React.lazy(() => import('./pages/About'));
const HowItWorks = React.lazy(() => import('./pages/HowItWorks'));
const Install = React.lazy(() => import('./pages/Install'));
const OrderSuccess = React.lazy(() => import('./pages/OrderSuccess'));
const TrackOrder = React.lazy(() => import('./pages/TrackOrder'));
const QRCodePage = React.lazy(() => import('./pages/QRCodePage'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const Compare = React.lazy(() => import('./pages/Compare'));
const AdminLayout = React.lazy(() => import('./pages/AdminLayout'));
const AdminOverview = React.lazy(() => import('./pages/AdminOverview'));
const AdminProducts = React.lazy(() => import('./pages/AdminProducts'));
const AdminOrders = React.lazy(() => import('./pages/AdminOrders'));
const AdminCustomers = React.lazy(() => import('./pages/AdminCustomers'));
const AdminAnalytics = React.lazy(() => import('./pages/AdminAnalytics'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));
const AdminPromoCodes = React.lazy(() => import('./pages/AdminPromoCodes'));

console.log('[TRACE 9] Lazy imports declared');

/** A simple centered spinner shown while lazy page chunks load. */
function PageLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  console.log('[TRACE 10] App component rendering');
  const { isMaintenance } = useMaintenanceMode();
  console.log('[TRACE 11] useMaintenanceMode called, isMaintenance:', isMaintenance);
  const location = useLocation();

  // Track page views for SPA navigation
  React.useEffect(() => {
    console.log('[TRACE 12] App mounted useEffect');
    trackPageView(location.pathname);
  }, [location.pathname]);

  React.useEffect(() => {
    console.log('[TRACE 13] Auth listener useEffect');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const isNewUser = !session.user.user_metadata?.email_verified;
        if (isNewUser) {
          trackUserSignup('google', session.user.id);
        } else {
          trackUserLogin('google', session.user.id);
        }
        setUserId(session.user.id);
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

  console.log('[TRACE 14] About to return JSX from App');

  return (
    <SeasonalProvider>
    <LanguageProvider>
    <AuthProvider>
    <CartProvider>
    <NiaChatProvider>
    <ErrorBoundary>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased pb-16 lg:pb-0">
        <Navbar />
        {isMaintenance && <MaintenanceBanner />}
        <main className="flex-grow page-transition">
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/listing/:id" element={<ListingDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/account" element={<UserDashboard />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminOverview />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="promo-codes" element={<AdminPromoCodes />} />
              </Route>
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/install" element={<Install />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/compare" element={<Compare />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <MobileBottomNav />
        <BackToTop />
        <FloatingCartButton />
        <NiaOnboarding />
        <NiaChat />
        <NiaFloatingButton />
        <PWAUpdateChecker />
        <InstallPrompt />
        <AbandonedCartBanner />
      </div>
    </ErrorBoundary>
    </NiaChatProvider>
    </CartProvider>
    </AuthProvider>
    </LanguageProvider>
    </SeasonalProvider>
  )
}

console.log('[TRACE 15] App function defined, exporting');

export default App
