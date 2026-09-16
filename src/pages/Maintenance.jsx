import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, AlertTriangle, Lightbulb } from 'lucide-react';
import { maintenanceCopy as copy, PREVIEW_URL } from '../config/maintenance';

/**
 * Renders the hero title with a per-letter color cycle. The full text is
 * exposed via aria-label so assistive tech announces it as one heading.
 */
function renderTitleLetters(text, colors) {
  let i = 0;
  return text.split('').map((ch, idx) =>
    ch === ' ' ? (
      <span key={idx}>{' '}</span>
    ) : (
      <span key={idx} style={{ color: colors[i++ % colors.length] }}>
        {ch}
      </span>
    )
  );
}

/**
 * Omix Market — Maintenance / Transition experience.
 *
 * Shown INSTEAD of the public storefront while maintenance mode is on
 * (see MaintenanceGate + docs/MAINTENANCE_MODE.md). All copy comes from
 * src/config/maintenance.json — edit there, not here.
 *
 * Deliberately dependency-light: no cart, no auth, no data fetching.
 */
export default function Maintenance() {
  const canonical = 'https://market.omixsystems.store/';
  const logoSrc = copy.brand.imageSrc || copy.brand.logoSvg;
  const tileTheme = copy.brand.imageSrc ? (copy.brand.tileTheme || 'dark') : 'dark';

  // The third-party Tidio chat widget loads globally from index.html.
  // Hide it while the transition experience is shown (it loads async,
  // so a style rule is more robust than querying the element once).
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-omix-maintenance', 'hide-widgets');
    style.textContent = '#tidio-chat,[id^="tidio-chat"]{display:none!important}';
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  return (
    <div className="omix-maintenance">
      <Helmet>
        <title>{copy.seo.title}</title>
        <meta name="description" content={copy.seo.description} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={copy.seo.title} />
        <meta property="og:description" content={copy.seo.description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={copy.seo.title} />
        <meta name="twitter:description" content={copy.seo.description} />
      </Helmet>

      <a href="#maintenance-main" className="omix-maintenance-skip">
        Skip to main content
      </a>

      {/* ── Persistent announcement banner ─────────────────────────── */}
      <header className="omix-maintenance-banner" role="region" aria-label="Service announcement">
        <div className="omix-maintenance-banner-inner">
          <AlertTriangle className="omix-maintenance-banner-icon" aria-hidden="true" />
          <p className="omix-maintenance-banner-text">
            <strong>{copy.banner.title}</strong>
            <span>{copy.banner.body}</span>
          </p>
        </div>
      </header>

      {/* ── Hero / announcement ────────────────────────────────────── */}
      <main id="maintenance-main" className="omix-maintenance-main">
        <div className="omix-maintenance-hero">
          <div className="omix-maintenance-brand" aria-label="Omix Market">
            <span className={`omix-maintenance-logo${tileTheme === 'light' ? ' is-light' : ''}`}>
              <img src={logoSrc} alt={copy.brand.logoAlt} width="116" height="116" />
            </span>
            <span className="omix-maintenance-eyebrow">{copy.brand.eyebrow}</span>
          </div>

          <h1 className="omix-maintenance-title" aria-label={copy.hero.title}>
            <span aria-hidden="true">{renderTitleLetters(copy.hero.title, copy.hero.titleColors)}</span>
          </h1>
          <span className="omix-maintenance-build-line" aria-hidden="true">
            <span />
          </span>
          <p className="omix-maintenance-lede">{copy.hero.body}</p>

          <section className="omix-maintenance-feedback" aria-labelledby="maintenance-feedback-heading">
            <span className="omix-maintenance-feedback-icon" aria-hidden="true">
              <Lightbulb />
            </span>
            <h2 id="maintenance-feedback-heading">{copy.feedback.heading}</h2>
            <p>{copy.feedback.body1}</p>
            <p>{copy.feedback.body2}</p>

            <div className="omix-maintenance-actions">
              <a
                href={copy.feedback.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="marketplace-button marketplace-button-primary omix-maintenance-cta"
                aria-label={`${copy.feedback.ctaLabel} — opens our feedback form in a new tab`}
              >
                {copy.feedback.ctaLabel}
                <ArrowRight aria-hidden="true" />
              </a>
              {PREVIEW_URL && (
                <a
                  href={PREVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="marketplace-button marketplace-button-secondary omix-maintenance-cta"
                >
                  {copy.preview.ctaLabel}
                  <ArrowRight aria-hidden="true" />
                </a>
              )}
            </div>
          </section>

          <p className="omix-maintenance-signoff">
            <span className="omix-maintenance-pulse" aria-hidden="true" />
            {copy.signoff}
          </p>
        </div>
      </main>

      <footer className="omix-maintenance-footer">
        <p>
          © {new Date().getFullYear()}{' '}
          <a className="omix-maintenance-footer-link" href={copy.footer.url}>
            {copy.footer.copyrightHolder}
          </a>
        </p>
        <Link to="/login" className="omix-maintenance-staff-link">
          {copy.staff.label}
          <ArrowRight aria-hidden="true" />
        </Link>
      </footer>
    </div>
  );
}
