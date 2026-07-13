# Review Instructions — Omix Store Frontend

## What Important means here
Reserve Important (red) for findings that would:
- Break the checkout or payment flow (M-Pesa STK push, COD placement, Paystack webhook handling)
- Cause data loss or corruption (cart state, order records, affiliate attribution)
- Break auth (login, signup, OAuth callback, guest checkout, admin session)
- Introduce XSS, CSRF, or leak user PII (emails, phone numbers, addresses)
- Break the build or cause runtime errors in production

Style, naming, component organization, and refactoring suggestions are Nit at most.

## Cap the nits
Report at most five Nits per review. If you found more, say "plus N similar items" in the summary. If everything you found is a Nit, lead with "No blocking issues."

## Do not report
- Tailwind class ordering or formatting (not lint-enforced in this project)
- Missing prop types or TypeScript (this is plain JSX, no TypeScript)
- Generated or third-party files
- Test coverage (no test suite exists yet)
- Anything CI already enforces (pnpm build must pass)

## Always check
- New routes are registered in `src/App.jsx`
- New admin pages are nested under `/admin` and protected by admin auth
- API calls handle both success and error responses (try/catch or .catch)
- Guest checkout path (no user_id) is not broken when adding new order fields
- No emoji characters in user-facing UI text or components — use Lucide React SVG icons
- Affiliate referral cookie handling is preserved when modifying checkout
- Cart items in localStorage maintain their shape: `{id, title, price, image, quantity, variant}`
- New env vars have corresponding entries in Render Dashboard (not just .env.local)

## Verification bar
Behavior claims need a `file:line` citation in the source. Do not flag issues based solely on naming or inference.

## Re-review convergence
After the first review, suppress new Nits and post Important findings only — unless the PR changed more than 20 files, in which case run a full review.
