import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { SeasonalProvider } from './context/SeasonalContext';
import { LanguageProvider } from './utils/lang';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NiaChatProvider } from './context/NiaChatContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import { supabase } from './utils/supabase';
import { useMaintenanceMode } from './hooks/useMaintenanceMode';
import MaintenanceBanner from './components/MaintenanceBanner';
import { trackPageView } from './utils/analytics';

const Home = React.lazy(() => import('./pages/Home'));

function PageLoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const { isMaintenance } = useMaintenanceMode();
  const location = useLocation();

  React.useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: existing } = await supabase.from('profiles').select('id').eq('id', session.user.id).single();
        if (!existing) {
          await supabase.from('profiles').insert({
            id: session.user.id,
            full_name: session.user.user_metadata?.full_name || 'User',
            email: session.user.email,
            role: 'customer',
          });
        }
      }
    });
    return () => subscription?.unsubscribe();
  }, []);

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
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </ErrorBoundary>
    </NiaChatProvider>
    </CartProvider>
    </AuthProvider>
    </LanguageProvider>
    </SeasonalProvider>
  )
}

export default App;
