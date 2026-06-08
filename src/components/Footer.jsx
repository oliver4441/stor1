import { Link } from 'react-router-dom'
import { useLang } from '../utils/lang'
import { supabase } from '../utils/supabase'
import { useState, useEffect } from 'react'

function Footer() {
  const { t } = useLang()
  const [isUserAdmin, setIsUserAdmin] = useState(false)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: { role } } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setIsUserAdmin(role === 'admin')
      }
    }
    checkAdmin()
  }, [])

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-8 mt-12" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          &copy; 2026 Omix Marketplace. {t('footer.tagline')}
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link to="/events" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">{t('footer.events')}</Link>
          <Link to="/how-it-works" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">{t('footer.howItWorks')}</Link>
          <Link to="/wishes" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">{t('footer.wishes')}</Link>
          <Link to="/about" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">{t('footer.about')}</Link>
          <Link to="/sell" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">{t('footer.sell')}</Link>
          {isUserAdmin && (
            <Link to="/admin/events" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c] font-semibold">
              Admin Events
            </Link>
          )}
        </div>
        <div className="flex gap-4">
          <Link to="/terms" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">{t('footer.terms')}</Link>
          <Link to="/privacy" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-[#ff385c]">{t('footer.privacy')}</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
