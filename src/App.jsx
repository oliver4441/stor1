import React, { Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { SeasonalProvider } from './context/SeasonalContext';
import { LanguageProvider } from './utils/lang';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NiaChatProvider } from './context/NiaChatContext';
import { NotificationProvider } from './context/NotificationContext';
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
import RealtimeOrderWatcher from './components/RealtimeOrderWatcher';
import RouteFallback from './components/RouteFallback';

// Lazy-loaded pages — split at route boundaries for granular code splitting
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const AuthCallback = React.lazy(() => import('./pages/AuthCallback'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const OrderSuccess = React.lazy(() => import('./pages/OrderSuccess'));
const ListingDetails = React.lazy(() => import('./pages/ListingDetails'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const Compare = React.lazy(() => import('./pages/Compare'));
const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const TrackOrder = React.lazy(() => import('./pages/TrackOrder'));
const Install = React.lazy(() => import('./pages/Install'));
const HowItWorks = React.lazy(() => import('./pages/HowItWorks'));
const About = React.lazy(() => import('./pages/About'));
const Privacy = React.lazy(() => import('./pages/Privacy'));
const Terms = React.lazy(() => import('./pages/Terms'));
const QRCodePage = React.lazy(() => import('./pages/QRCodePage'));
const Refurbished = React.lazy(() => import('./pages/Refurbished'));
const SearchPage = React.lazy(() => import('./pages/SearchPage'));
const FlashDeals = React.lazy(() => import('./pages/FlashDeals'));
const SellerProfile = React.lazy(() => import('./pages/SellerProfile'));

// Admin pages — co-split as an admin chunk
const AdminLayout = React.lazy(() => import('./pages/AdminLayout'));
const AdminOverview = React.lazy(() => import('./pages/AdminOverview'));
const AdminProducts = React.lazy(() => import('./pages/AdminProducts'));
const AdminOrders = React.lazy(() => import('./pages/AdminOrders'));
const AdminCustomers = React.lazy(() => import('./pages/AdminCustomers'));
const AdminAnalytics = React.lazy(() => import('./pages/AdminAnalytics'));
const AdminPromoCodes = React.lazy(() => import('./pages/AdminPromoCodes'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));
const AdminNotifications = React.lazy(() => import('./pages/AdminNotifications'));
const AdminAffiliates = React.lazy(() => import('./pages/AdminAffiliates'));
const AdminInbox = React.lazy(() => import('./pages/AdminInbox'));
const AdminDeals = React.lazy(() => import('./pages/AdminDeals'));
const AffiliateDashboard = React.lazy(() => import('./pages/AffiliateDashboard'));
const AffiliatePage = React.lazy(() => import('./pages/AffiliatePage'));
const AffiliateApply = React.lazy(() => import('./pages/AffiliateApply'));
const AffiliateAgreement = React.lazy(() => import('./pages/AffiliateAgreement'));

// Help Center pages — co-split as a help chunk
const HelpCenter = React.lazy(() => import('./pages/help/HelpCenter'));
const ShoppingGuide = React.lazy(() => import('./pages/help/ShoppingGuide'));
const Refund = React.lazy(() => import('./pages/help/Refund'));
const DisputeResolution = React.lazy(() => import('./pages/help/DisputeResolution'));
const AfterSale = React.lazy(() => import('./pages/help/AfterSale'));
const Delivery = React.lazy(() => import('./pages/help/Delivery'));
const FAQ = React.lazy(() => import('./pages/help/FAQ'));
const Payment = React.lazy(() => import('./pages/help/Payment'));
const DeliveryTime = React.lazy(() => import('./pages/help/DeliveryTime'));
const FlashSale = React.lazy(() => import('./pages/help/FlashSale'));

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
    <NotificationProvider>
    <ErrorBoundary>
      <ScrollToTop />
      <RealtimeOrderWatcher />
      <div className="min-h-screen flex flex-col bg-zinc-950">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-white focus:text-black focus:px-4 focus:py-2 focus:rounded-lg focus:font-bold">Skip to main content</a>
        <Navbar />
        <main id="main-content" className="flex-grow pb-16 lg:pb-0">
          <Suspense fallback={<RouteFallback />}>
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
              <Route path="/search" element={<SearchPage />} />
              <Route path="/flash-deals" element={<FlashDeals />} />
              <Route path="/store" element={<SellerProfile />} />
              <Route path="/affiliate-dashboard" element={<AffiliateDashboard />} />
              <Route path="/affiliate" element={<AffiliatePage />} />
              <Route path="/affiliate/apply" element={<AffiliateApply />} />
              <Route path="/affiliate/agreement" element={<AffiliateAgreement />} />
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
                <Route path="inbox" element={<AdminInbox />} />
              <Route path="deals" element={<AdminDeals />} />
              </Route>
            </Routes>
          </Suspense>
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
    </NotificationProvider>
    </NiaChatProvider>
    </CartProvider>
    </AuthProvider>
    </LanguageProvider>
    </SeasonalProvider>
  )
}

export default App;
