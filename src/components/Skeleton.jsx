// ── Skeleton Loading Components for Omix Marketplace ───────────────
// Matches actual component layouts: ProductCard, ListingDetails, Checkout

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={`animate-pulse bg-zinc-200 dark:bg-zinc-700 rounded-xl ${className || ''}`}
      {...props}
    />
  );
}

// ── ProductCard Skeleton ───────────────────────────────────────────
// Matches src/components/ProductCard.jsx layout
export function ProductCardSkeleton() {
  return (
    <div className="block group">
      {/* Image placeholder — matches aspect-[4/5] ratio used in ProductCard */}
      <div className="bg-zinc-900 rounded-2xl overflow-hidden aspect-[4/5] mb-3 relative">
        <Skeleton className="absolute inset-0 rounded-none bg-zinc-200 dark:bg-zinc-800" />
        {/* Condition badge skeleton */}
        <Skeleton className="absolute top-2 left-2 w-16 h-5 rounded-lg" />
      </div>

      {/* Details */}
      <div className="space-y-2">
        {/* Title line */}
        <Skeleton className="w-3/4 h-4" />
        {/* Category line */}
        <Skeleton className="w-1/2 h-3" />
        {/* Price + location row */}
        <div className="flex items-center justify-between mt-1">
          <Skeleton className="w-1/3 h-5" />
          <Skeleton className="w-12 h-3" />
        </div>
      </div>
    </div>
  );
}

// ── ListingDetail Skeleton ─────────────────────────────────────────
// Matches src/pages/ListingDetails.jsx layout (loading state + specs/description)
export function ListingDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Image gallery placeholder — matches aspect-[4/3] */}
        <div className="w-full lg:w-1/2 lg:w-3/5">
          <Skeleton className="w-full aspect-[4/3] rounded-3xl" />
        </div>

        {/* Details column */}
        <div className="w-full lg:w-1/2 flex flex-col space-y-4">
          {/* Title */}
          <Skeleton className="h-8 w-3/4" />
          {/* Price */}
          <Skeleton className="h-8 w-1/4" />

          {/* Delivery info badges (2 chips) */}
          <div className="flex gap-2">
            <Skeleton className="h-7 w-32 rounded-xl" />
            <Skeleton className="h-7 w-36 rounded-xl" />
          </div>

          {/* Key specs highlight strip (4 items) */}
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-24 rounded-xl flex-shrink-0" />
            ))}
          </div>

          {/* Specification grid (6 skeleton items — 2 cols x 3 rows) */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Description placeholder (3 lines) */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Cart section buttons */}
          <div className="space-y-3 pt-2">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Checkout Skeleton ──────────────────────────────────────────────
// Matches src/pages/Checkout.jsx layout (order summary + form)
export function CheckoutSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Breadcrumb placeholder */}
      <Skeleton className="h-4 w-40 mb-6" />

      {/* Step indicator placeholder (3 dots) */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 1 && <Skeleton className="w-8 sm:w-12 h-0.5 rounded-full" />}
            <Skeleton className="w-8 h-8 rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── Order Summary (left, 2 cols) ─────────────────────── */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </div>

            {/* Items (2 skeleton items) */}
            <div className="p-4 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3 items-center p-2 rounded-xl">
                  <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                  <div className="flex-grow space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Skeleton className="w-6 h-6 rounded-lg" />
                    <Skeleton className="w-5 h-4" />
                    <Skeleton className="w-6 h-6 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div className="px-5 py-4 border-t border-zinc-800">
              <Skeleton className="h-3 w-20 mb-1.5" />
              <div className="flex gap-2">
                <Skeleton className="flex-1 h-9 rounded-lg" />
                <Skeleton className="w-16 h-9 rounded-lg" />
              </div>
            </div>

            {/* Total */}
            <div className="px-5 py-4 border-t border-zinc-800 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between pt-3 border-t border-zinc-800">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Form (right, 3 cols) ─────────────────────────────── */}
        <div className="lg:col-span-3 order-1 lg:order-2">
          <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900">
            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-64 mt-1" />
            </div>

            {/* Form fields (3 skeleton inputs) */}
            <div className="p-5 space-y-4">
              {/* Field 1 */}
              <div>
                <Skeleton className="h-3 w-24 mb-1.5" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>

              {/* Field 2 */}
              <div>
                <Skeleton className="h-3 w-24 mb-1.5" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>

              {/* Field 3 */}
              <div>
                <Skeleton className="h-3 w-24 mb-1.5" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>

              {/* Location selectors (2 dropdowns) */}
              <div>
                <Skeleton className="h-3 w-24 mb-1.5" />
                <div className="space-y-2">
                  <Skeleton className="h-11 w-full rounded-xl" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              </div>

              {/* Submit button */}
              <Skeleton className="h-14 w-full rounded-xl" />

              {/* Footer text */}
              <Skeleton className="h-3 w-56 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page Skeleton (generic) ────────────────────────────────────────
// General-purpose loading placeholder for any page
export function PageSkeleton({ lines = 6, className = '' } = {}) {
  return (
    <div className={`max-w-7xl mx-auto px-4 py-8 space-y-6 ${className}`}>
      {/* Header line */}
      <Skeleton className="h-8 w-1/2" />

      {/* Content lines */}
      <div className="space-y-3">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton
            key={i}
            className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
          />
        ))}
      </div>
    </div>
  );
}
