import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { SeasonalProvider } from './context/SeasonalContext';
import { LanguageProvider } from './utils/lang';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { NiaChatProvider } from './context/NiaChatContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
import BackToTop from './components/BackToTop';
import ScrollToTop from './components/ScrollToTop';
import FloatingCartButton from './components/FloatingCartButton';
import NiaChat from './components/NiaChat';
import InstallBanner from './components/InstallBanner';
import PushNudge from './components/PushNudge';
import CartReminder from './components/CartReminder';
import ThemeStyles from './components/ThemeStyles';
import PWAUpdateChecker from './components/PWAUpdateChecker';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
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
import AdminLayout from './pages/AdminLayout';
import AdminOverview from './pages/AdminOverview';
import AdminProducts from './pages/AdminProducts';
import AdminOrders from './pages/AdminOrders';
import AdminCustomers from './pages/AdminCustomers';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminPromoCodes from './pages/AdminPromoCodes';
import AdminSettings from './pages/AdminSettings';
import AdminNotifications from './pages/AdminNotifications';

function App() {
  return (
    <SeasonalProvider>
      <ThemeStyles />
    <LanguageProvider>
    <AuthProvider>
    <CartProvider>
    <NiaChatProvider>
    <ErrorBoundary>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        <main className="flex-grow">
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
            <Route path="/qr" element={<QRCodePage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="promo-codes" element={<AdminPromoCodes />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="notifications" element={<AdminNotifications />} />
            </Route>
          </Routes>
        </main>
        <Footer />
        <MobileBottomNav />
        <BackToTop />
        <FloatingCartButton />
        <NiaChat />
        <InstallBanner />
        <PushNudge />
        <CartReminder />
        <PWAUpdateChecker />
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
