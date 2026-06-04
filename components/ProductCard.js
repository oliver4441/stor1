function ProductCard({ listing }) {
  const [imgError, setImgError] = React.useState(false);
  const hasImage = listing.images && listing.images.length > 0 && !imgError;

  return (
    <a href={`listing.html?id=${listing.id}`} className="block group">
      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-[14px] overflow-hidden aspect-square mb-3 relative">
        {hasImage ? (
          <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" loading="lazy" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-400">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
        <div className="absolute top-2 left-2 bg-white/90 dark:bg-black/90 text-zinc-900 dark:text-white px-2 py-1 rounded-[8px] text-xs font-bold shadow-sm">
          {listing.condition}
        </div>
      </div>
      <div>
        <div className="flex justify-between items-start gap-2">
          <h3 className="font-bold text-zinc-900 dark:text-white truncate">{listing.title}</h3>
        </div>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-1">{listing.category}</p>
        <div className="flex items-center gap-2">
          <p className="font-bold text-[#ff385c]">{formatKES(listing.price)}</p>
          {listing.location && (
            <span className="text-zinc-400 text-xs ml-auto flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              {listing.location}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
