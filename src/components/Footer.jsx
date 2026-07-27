import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../utils/lang'
import { useActiveTheme } from '../context/SeasonalContext'
import { Smartphone, Download, Facebook, Twitter, Instagram, MessageCircle } from 'lucide-react'

function Footer() {
  const { user } = useAuth();
  const { t } = useLang()
  const theme = useActiveTheme()
  const footerBg = theme?.colors?.footerBg
  const footerText = theme?.colors?.footerText
  const footerLink = theme?.colors?.footerLink
  const sticker = theme?.sticker || ''
  const badgeText = theme?.badgeText || ''

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/omixstore', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/omixstore', label: 'Twitter' },
    { icon: Instagram, href: 'https://instagram.com/omixstore', label: 'Instagram' },
    { icon: MessageCircle, href: 'https://wa.me/254700000000', label: 'WhatsApp' },
  ]

  return (
    <footer
      className="border-t py-12 mt-12 transition-colors duration-500"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: footerBg || undefined,
        borderColor: footerBg ? `${footerBg}66` : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        {/* Main grid: 4 columns on md+, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Branding + App Download */}
          <div>
            <Link
              to="/"
              className="text-lg font-bold tracking-tight"
              style={{ color: footerText || undefined }}
            >
              Omix
            </Link>
            <p
              className="mt-2 text-sm text-zinc-400 leading-relaxed"
              style={{ color: footerLink || undefined }}
            >
              Kenya's trusted online marketplace. Buy and sell with confidence.
            </p>
            <div className="mt-4">
              <Link
                to="/install"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                <Smartphone className="w-4 h-4" />
                <span>Download App</span>
                <Download className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: footerText || undefined }}
            >
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: footerLink || undefined }}
                >
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link
                  to="/help"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: footerLink || undefined }}
                >
                  {t('footer.helpCenter')}
                </Link>
              </li>
              <li>
                <Link
                  to="/affiliate"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: footerLink || undefined }}
                >
                  Affiliate Program
                </Link>
              </li>
              {!user && (
                <li>
                  <Link
                    to="/how-it-works"
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: footerLink || undefined }}
                  >
                    {t('footer.howItWorks')}
                  </Link>
                </li>
              )}
              <li>
                <Link
                  to="/install"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: footerLink || undefined }}
                >
                  {t('footer.install')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: footerText || undefined }}
            >
              Customer Service
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: footerLink || undefined }}
                >
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: footerLink || undefined }}
                >
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link
                  to="/sell-with-us"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: footerLink || undefined }}
                >
                  Sell With Us
                </Link>
              </li>
              <li>
                <Link
                  to="/track-order"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: footerLink || undefined }}
                >
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Connect / Social */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: footerText || undefined }}
            >
              Connect
            </h3>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg transition-colors hover:bg-zinc-800"
                  style={{ color: footerLink || undefined }}
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar with OmixSystems branding */}
        <div
          className="mt-10 pt-6 border-t"
          style={{ borderColor: footerBg ? `${footerBg}66` : undefined }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: footerText || undefined }}>
              &copy; 2026 Omix Systems. All rights reserved.
            </p>
            {badgeText && (
              <span
                className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={{ color: footerText || undefined }}
              >
                {sticker} {badgeText}
              </span>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
