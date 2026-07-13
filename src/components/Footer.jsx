import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../utils/lang'
import { useActiveTheme } from '../context/SeasonalContext'

function Footer() {
  const { user } = useAuth();
  const { t } = useLang()
  const theme = useActiveTheme()
  const footerBg = theme?.colors?.footerBg
  const footerText = theme?.colors?.footerText
  const footerLink = theme?.colors?.footerLink
  const sticker = theme?.sticker || ''
  const badgeText = theme?.badgeText || ''

  return (
    <footer
      className="border-t py-8 mt-12 transition-colors duration-500"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        backgroundColor: footerBg || undefined,
        borderColor: footerBg ? `${footerBg}66` : undefined,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p
          className="text-sm"
          style={{ color: footerText || undefined }}
        >
          &copy; 2026 Omix Store. Your trusted online store in Kericho, Kenya.
          {badgeText && (
            <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full align-middle">
              {sticker} {badgeText}
            </span>
          )}
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link to="/affiliate" className="text-sm transition-colors" style={{ color: footerLink || undefined }}>Affiliate Program</Link>
          {!user && <Link to="/how-it-works" className="text-sm transition-colors" style={{ color: footerLink || undefined }}>{t('footer.howItWorks')}</Link>}
          <Link to="/about" className="text-sm transition-colors" style={{ color: footerLink || undefined }}>{t('footer.about')}</Link>
          <Link to="/help" className="text-sm transition-colors" style={{ color: footerLink || undefined }}>{t('footer.helpCenter')}</Link>
          <Link to="/install" className="text-sm transition-colors" style={{ color: footerLink || undefined }}>{t('footer.install')}</Link>
        </div>
        <div className="flex gap-4">
          <Link to="/terms" className="text-sm transition-colors" style={{ color: footerLink || undefined }}>{t('footer.terms')}</Link>
          <Link to="/privacy" className="text-sm transition-colors" style={{ color: footerLink || undefined }}>{t('footer.privacy')}</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
