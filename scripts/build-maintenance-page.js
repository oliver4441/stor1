// Build the standalone maintenance fallback page from the central copy deck.
//
// Single source of truth: src/config/maintenance.json
// Output: public/maintenance.html (copied to dist/ at build time,
// served with HTTP 503 by server.js while MAINTENANCE_MODE=true).
//
// Runs automatically as part of `npm run build`. Run manually with:
//   node scripts/build-maintenance-page.js
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const copy = JSON.parse(
  readFileSync(join(__dirname, '..', 'src', 'config', 'maintenance.json'), 'utf8')
);

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const previewCta = copy.preview.url
  ? `<a href="${esc(copy.preview.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">${esc(copy.preview.ctaLabel)} <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>`
  : '';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <title>${esc(copy.seo.title)}</title>
  <meta name="description" content="${esc(copy.seo.description)}" />
  <meta name="robots" content="noindex, nofollow" />
  <link rel="canonical" href="https://market.omixsystems.store/" />
  <meta property="og:title" content="${esc(copy.seo.title)}" />
  <meta property="og:description" content="${esc(copy.seo.description)}" />
  <meta property="og:url" content="https://market.omixsystems.store/" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
  <link rel="icon" type="image/jpeg" href="/logo.jpg" />
  <meta name="theme-color" content="#0e7665" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@600;700;800&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #f5f7f3; --ink: #17211d; --ink-soft: #405049; --muted: #73817a; --subtle: #a3afa8;
      --line: #e2e9e3; --brand: #0e7665; --brand-deep: #0b594d; --brand-soft: #e1f2eb;
      --ease-out: cubic-bezier(.22, 1, .36, 1);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0c1412; --ink: #f1f6f2; --ink-soft: #c2d0c8; --muted: #8a9d93; --subtle: #60736a;
        --line: #263730; --brand: #52c9a5; --brand-deep: #2ba783; --brand-soft: #173d32;
      }
    }
    * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
      background: var(--bg); color: var(--ink);
      min-height: 100svh; display: flex; flex-direction: column;
      -webkit-font-smoothing: antialiased;
      position: relative; overflow-x: clip;
    }
    body::before {
      content: ''; position: absolute; inset: -24px; z-index: 0; pointer-events: none;
      background-image: linear-gradient(rgba(14,118,101,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(14,118,101,.055) 1px, transparent 1px);
      background-size: 44px 44px; background-position: center top;
      -webkit-mask-image: radial-gradient(ellipse 90% 70% at 50% 30%, black 20%, transparent 75%);
      mask-image: radial-gradient(ellipse 90% 70% at 50% 30%, black 20%, transparent 75%);
      animation: m-grid-drift 18s ease-in-out infinite alternate;
    }
    @media (prefers-color-scheme: dark) {
      body::before { background-image: linear-gradient(rgba(82,201,165,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(82,201,165,.07) 1px, transparent 1px); }
    }
    a:focus-visible {
      outline: 3px solid rgba(14, 118, 101, .55);
      outline-offset: 3px; border-radius: 8px;
    }
    .skip {
      position: absolute; left: 12px; top: -48px; z-index: 100;
      padding: 10px 16px; border-radius: 10px;
      background: #0e7665; color: #fff;
      font-size: 13px; font-weight: 800; text-decoration: none;
    }
    .skip:focus-visible { top: 12px; outline-color: rgba(255,255,255,.7); }
    .banner { background: #211910; border-bottom: 1px solid #4a3a22; position: relative; z-index: 1; animation: m-drop 450ms var(--ease-out) both; }
    .banner-inner {
      width: min(100% - 32px, 860px); margin: 0 auto;
      display: flex; align-items: flex-start; gap: 12px; padding: 12px 0;
    }
    .banner-inner svg { flex: none; width: 20px; height: 20px; margin-top: 1px; color: #f0c46c; }
    .banner-inner p { margin: 0; font-size: 13px; line-height: 1.5; display: flex; flex-direction: column; gap: 2px; }
    .banner-inner strong { color: #fff7e8; font-weight: 800; }
    .banner-inner span { color: #d8c6a3; }
    main { flex: 1; display: flex; justify-content: center; padding: 56px 20px 40px; position: relative; z-index: 1; }
    .hero { width: min(100%, 620px); display: flex; flex-direction: column; align-items: center; text-align: center; }
    .brand { display: flex; flex-direction: column; align-items: center; gap: 14px; animation: m-rise-sm 600ms var(--ease-out) 40ms both; }
    .brand-mark {
      width: 56px; height: 56px; display: grid; place-items: center;
      border-radius: 17px; transform: rotate(-5deg);
      background: linear-gradient(145deg, #0e7665, #0b594d); color: #fff;
      box-shadow: 0 6px 12px rgba(14, 118, 101, .2);
    }
    .brand-mark span { font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 30px; transform: rotate(5deg); }
    .eyebrow {
      font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 800;
      letter-spacing: .24em; text-transform: uppercase; color: var(--brand);
    }
    h1 {
      margin: 22px 0 0; font-family: 'Poppins', sans-serif; font-weight: 800;
      letter-spacing: -.03em; line-height: 1.08;
      font-size: clamp(2.1rem, 7.5vw, 3.4rem); text-wrap: balance;
      animation: m-rise 600ms var(--ease-out) 130ms both;
    }
    .build-line { margin-top: 22px; width: 72px; height: 2px; border-radius: 999px; background: var(--line); overflow: hidden; animation: m-fade 600ms var(--ease-out) 220ms both; }
    .build-line > span { display: block; width: 6px; height: 2px; border-radius: 999px; background: var(--brand); animation: m-dot-travel 9s ease-in-out infinite alternate; }
    .lede {
      margin: 22px 0 0; max-width: 46ch; color: var(--ink-soft);
      font-size: clamp(.95rem, 2.6vw, 1.05rem); line-height: 1.7; text-wrap: pretty;
      animation: m-rise 600ms var(--ease-out) 280ms both;
    }
    .feedback {
      margin-top: 40px; padding-top: 36px; border-top: 1px solid var(--line);
      width: 100%; display: flex; flex-direction: column; align-items: center;
      animation: m-rise 600ms var(--ease-out) 380ms both;
    }
    .feedback-icon {
      width: 44px; height: 44px; display: grid; place-items: center;
      border-radius: 14px; background: var(--brand-soft); color: var(--brand);
    }
    .feedback-icon svg { width: 22px; height: 22px; }
    .feedback h2 {
      margin: 16px 0 0; font-family: 'Poppins', sans-serif;
      font-size: clamp(1.15rem, 4vw, 1.4rem); font-weight: 800;
      letter-spacing: -.02em; text-wrap: balance;
    }
    .feedback p { margin: 10px 0 0; max-width: 48ch; color: var(--ink-soft); font-size: .925rem; line-height: 1.7; text-wrap: pretty; }
    .actions { margin-top: 26px; display: flex; flex-direction: column; align-items: center; gap: 12px; width: 100%; }
    .btn {
      min-height: 52px; min-width: min(100%, 300px); padding: 0 28px;
      display: inline-flex; align-items: center; justify-content: center; gap: 9px;
      border-radius: 12px; border: 1px solid transparent;
      font-size: 15px; font-weight: 800; text-decoration: none; line-height: 1;
      transition: transform 180ms var(--ease-out), background 180ms ease;
    }
    .btn:hover { transform: translateY(-1px); }
    .btn:active { transform: translateY(0) scale(.98); }
    .btn svg { transition: transform 200ms var(--ease-out); }
    .btn:hover svg, .btn:focus-visible svg { transform: translateX(3px); }
    .btn-primary { background: #0e7665; color: #fff; box-shadow: 0 9px 18px rgba(14, 118, 101, .16); }
    .btn-primary:hover { background: #0b594d; }
    .btn-secondary { background: transparent; color: var(--ink); border-color: var(--line); }
    .signoff {
      margin: 40px 0 0; display: inline-flex; align-items: center; gap: 10px;
      font-size: .9rem; font-weight: 600; color: var(--ink-soft);
      animation: m-fade 600ms var(--ease-out) 500ms both;
    }
    .dot { width: 8px; height: 8px; border-radius: 999px; background: var(--brand); animation: m-pulse 3.2s ease-in-out infinite; }
    footer {
      display: flex; flex-direction: column; align-items: center; gap: 10px;
      padding: 22px 20px 28px; border-top: 1px solid var(--line); text-align: center;
      position: relative; z-index: 1; animation: m-fade 600ms var(--ease-out) 560ms both;
    }
    footer p { margin: 0; font-size: 12px; color: var(--ink-soft); }
    .staff {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12.5px; font-weight: 700; color: var(--ink-soft);
      text-decoration: none; padding: 8px 4px; border-radius: 8px;
    }
    .staff:hover { color: var(--brand); }
    .staff svg { width: 14px; height: 14px; }
    @keyframes m-drop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes m-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes m-rise-sm { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes m-fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes m-grid-drift { from { transform: translate3d(0,0,0); } to { transform: translate3d(-16px,-10px,0); } }
    @keyframes m-dot-travel { from { transform: translateX(0); opacity: .55; } 50% { opacity: 1; } to { transform: translateX(66px); opacity: .55; } }
    @keyframes m-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .45; transform: scale(.82); } }
    @media (prefers-reduced-motion: reduce) {
      body::before, .banner, .brand, h1, .build-line, .build-line > span, .lede, .feedback, .signoff, footer, .dot { animation: none; }
      .btn:hover, .btn:active { transform: none; }
      .btn:hover svg, .btn:focus-visible svg { transform: none; }
      .btn svg { transition: none; }
    }
    @media (min-width: 640px) {
      main { padding: 72px 24px 56px; }
      .banner-inner { align-items: center; }
      .banner-inner svg { margin-top: 0; }
      .actions { flex-direction: row; justify-content: center; }
      .btn { min-width: 0; }
      footer { flex-direction: row; justify-content: center; gap: 24px; }
    }
  </style>
</head>
<body>
  <a class="skip" href="#main">Skip to main content</a>
  <header class="banner" role="region" aria-label="Service announcement">
    <div class="banner-inner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      <p><strong>${esc(copy.banner.title)}</strong><span>${esc(copy.banner.body)}</span></p>
    </div>
  </header>
  <main id="main">
    <div class="hero">
      <div class="brand" aria-label="Omix Market">
        <span class="brand-mark" aria-hidden="true"><span>O</span></span>
        <span class="eyebrow">${esc(copy.brand.eyebrow)}</span>
      </div>
      <h1>${esc(copy.hero.title)}</h1>
      <span class="build-line" aria-hidden="true"><span></span></span>
      <p class="lede">${esc(copy.hero.body)}</p>
      <section class="feedback" aria-labelledby="feedback-heading">
        <span class="feedback-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
        </span>
        <h2 id="feedback-heading">${esc(copy.feedback.heading)}</h2>
        <p>${esc(copy.feedback.body1)}</p>
        <p>${esc(copy.feedback.body2)}</p>
        <div class="actions">
          <a href="${esc(copy.feedback.ctaUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" aria-label="${esc(copy.feedback.ctaLabel)} — opens our feedback form in a new tab">${esc(copy.feedback.ctaLabel)} <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
          ${previewCta}
        </div>
      </section>
      <p class="signoff"><span class="dot" aria-hidden="true"></span>${esc(copy.signoff)}</p>
    </div>
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} Omix Market</p>
    <a class="staff" href="/login">${esc(copy.staff.label)} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a>
  </footer>
</body>
</html>
`;

const outputPath = join(__dirname, '..', 'public', 'maintenance.html');
writeFileSync(outputPath, html);
console.log(`Maintenance page generated: public/maintenance.html`);
