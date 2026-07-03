import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { SeasonalProvider } from './context/SeasonalContext';
import { LanguageProvider } from './utils/lang';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NiaChatProvider } from './context/NiaChatContext';
import { initTracking } from './utils/analytics';
import { initReferralTracking } from './utils/affiliate_api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import BackToTop from './components/BackToTop';
import ScrollToTop from './components/ScrollToTop';
import FloatingCartButton from './components/FloatingCartButton';
import NiaChat from './components/NiaChat';
import NiaFloatingButton from './components/NiaFloatingButton';
import InstallBanner from './components/InstallBanner';
import PushNudge from './components/PushNudge';
import CartReminder from './components/CartReminder';
import CartWishlistNudge from './components/CartWishlistNudge';
import ThemeStyles from './components/ThemeStyles';
import PWAUpdateChecker from './components/PWAUpdateChecker';
import CookieConsentBanner from './components/CookieConsentBanner';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import ListingDetails from './pages/ListingDetails';
import Wishlist from './pages/Wishlist';
import Compare from './pages/Compare';
import UserDashboard from './pages/UserDashboard';
import TrackOrder from './pages/TrackOrder';
import Install from './pages/Install';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import QRCodePage from './pages/QRCodePage';
import Refurbished from './pages/Refurbished';
import AdminLayout from './pages/AdminLayout';
import AdminOverview from './pages/AdminOverview';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminCustomers from './pages/AdminCustomers';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminPromoCodes from './pages/AdminPromoCodes';
import AdminSettings from './pages/AdminSettings';
import AdminNotifications from './pages/AdminNotifications';
import AdminAffiliates from './pages/AdminAffiliates';
import AffiliateDashboard from './pages/AffiliateDashboard';

// Help Center pages
import HelpCenter from './pages/help/HelpCenter';
import ShoppingGuide from './pages/help/ShoppingGuide';
import Refund from './pages/help/Refund';
import DisputeResolution from './pages/help/DisputeResolution';
import AfterSale from './pages/help/AfterSale';
import Delivery from './pages/help/Delivery';
import FAQ from './pages/help/FAQ';
import Payment from './pages/help/Payment';
import DeliveryTime from './pages/help/DeliveryTime';
import FlashSale from './pages/help/FlashSale';

function App() {
  // Initialize tracking cookies and activity monitoring
  useEffect(() => {
    initTracking();
    initReferralTracking();
  }, []);

  return (
    <SeasonalProvider>
      <ThemeStyles />
    <LanguageProvider>
    <AuthProvider>
    <CartProvider>
    <NiaChatProvider>
    <ErrorBoundary>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-zinc-950">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold">Skip to main content</a>
        <Navbar />
        <main id="main-content" className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/listing/:id" element={<ListingDetails />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/account" element={<UserDashboard />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/install" element={<Install />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/qr" element={<QRCodePage />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/help/shopping-guide" element={<ShoppingGuide />} />
            <Route path="/help/refund" element={<Refund />} />
            <Route path="/help/dispute-resolution" element={<DisputeResolution />} />
            <Route path="/help/after-sale" element={<AfterSale />} />
            <Route path="/help/delivery" element={<Delivery />} />
            <Route path="/help/faq" element={<FAQ />} />
            <Route path="/help/payment" element={<Payment />} />
            <Route path="/help/delivery-time" element={<DeliveryTime />} />
            <Route path="/help/flash-sale" element={<FlashSale />} />
            <Route path="/refurbished" element={<Refurbished />} />
            <Route path="/affiliate-dashboard" element={<AffiliateDashboard />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="promo-codes" element={<AdminPromoCodes />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="affiliates" element={<AdminAffiliates />} />
              <Route path="notifications" element={<AdminNotifications />} />
            </Route>
          </Routes>
        </main>
        <Footer />
        <MobileBottomNav />
        <BackToTop />
        <FloatingCartButton />
        <NiaFloatingButton />
        <NiaChat />
        <InstallBanner />
        <PushNudge />
        <CartReminder />
        <CartWishlistNudge />
        <PWAUpdateChecker />
        <CookieConsentBanner />
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
