import { Link } from 'react-router-dom';
import { Download, Facebook, Twitter, Instagram, MessageCircle, ArrowUpRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

function Footer() {
  return (
    <footer className="marketplace-footer">
      <div className="marketplace-footer-trust">
        <div className="marketplace-footer-trust-inner">
          <div><ShieldCheck className="h-5 w-5" /><span>Secure M-Pesa checkout</span></div>
          <div><Truck className="h-5 w-5" /><span>Delivery across Kenya</span></div>
          <div><RotateCcw className="h-5 w-5" /><span>7-day returns</span></div>
        </div>
      </div>

      <div className="marketplace-footer-main">
        <div className="marketplace-footer-brand">
          <Link to="/" className="marketplace-brand marketplace-brand-footer">
            <span className="marketplace-brand-mark" aria-hidden="true"><span>O</span></span>
            <span className="marketplace-brand-wordmark">omix<span>store</span></span>
          </Link>
          <p>A better way to discover quality goods from trusted local sellers.</p>
          <Link to="/install" className="marketplace-footer-app-link"><Download className="h-4 w-4" />Get the Omix app <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>

        <div className="marketplace-footer-column">
          <h3>Shop</h3>
          <Link to="/search">Browse products</Link>
          <Link to="/flash-deals">Flash deals</Link>
          <Link to="/refurbished">Refurbished</Link>
          <Link to="/wholesale">Wholesale</Link>
        </div>
        <div className="marketplace-footer-column">
          <h3>Sell with us</h3>
          <Link to="/seller/register">Become a seller</Link>
          <Link to="/affiliate">Earn with Omix</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/help/seller-guide">Seller guide</Link>
        </div>
        <div className="marketplace-footer-column">
          <h3>Need help?</h3>
          <Link to="/help">Help centre</Link>
          <Link to="/track-order">Track an order</Link>
          <Link to="/terms">Terms & conditions</Link>
          <Link to="/privacy">Privacy policy</Link>
        </div>
      </div>

      <div className="marketplace-footer-bottom">
        <p>&copy; 2026 Omix Store. Kenya. Built by <a href="https://omixsystems.store" target="_blank" rel="noopener noreferrer">Omix Systems</a>.</p>
        <div className="marketplace-footer-socials">
          <a href="https://facebook.com/omixstore" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><Facebook className="h-4 w-4" /></a>
          <a href="https://twitter.com/omixstore" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><Twitter className="h-4 w-4" /></a>
          <a href="https://instagram.com/omixstore" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><Instagram className="h-4 w-4" /></a>
          <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><MessageCircle className="h-4 w-4" /></a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
