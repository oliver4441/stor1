class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() { if (this.state.hasError) return <div>Error loading listing.</div>; return this.props.children; }
}

function App() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const [listing, setListing] = React.useState(null);
  const [related, setRelated] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!id) { setError('No listing ID'); setLoading(false); return; }
    fetchListing(id).then(data => {
      if (!data) { setError('Listing not found'); setLoading(false); return; }
      setListing(data);
      setLoading(false);
      // Fetch related
      fetchListings(data.category, '').then(all => {
        setRelated(all.filter(l => l.id !== data.id).slice(0, 4));
      });
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-zinc-500">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{error || 'Not found'}</h2>
            <a href="index.html" className="text-[#ff385c]">Go back home</a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-name="listing-app">
      <Navbar />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Images Left */}
          <div className="w-full md:w-1/2 lg:w-3/5">
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-[14px] overflow-hidden aspect-[4/3]">
              {listing.images && listing.images.length > 0 ? (
                <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Details Right */}
          <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col">
            <h1 className="text-3xl font-bold mb-2 text-zinc-900 dark:text-white">{listing.title}</h1>
            <p className="text-3xl font-bold text-[#ff385c] mb-6">{formatKES(listing.price)}</p>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                <span>{listing.location}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{listing.condition}</span>
              </div>
            </div>

            {listing.description && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 py-6">
                <h3 className="font-bold mb-2">Description</h3>
                <p className="text-zinc-600 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {listing.seller_name && (
              <div className="border-t border-zinc-200 dark:border-zinc-800 py-6">
                <h3 className="font-bold mb-2">Seller</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center font-bold">
                    {listing.seller_name.charAt(0)}
                  </div>
                  <span>{listing.seller_name}</span>
                </div>
                {listing.seller_phone && <p className="text-sm text-zinc-500 mt-1">{listing.seller_phone}</p>}
              </div>
            )}

            {/* M-Pesa Section */}
            <div className="bg-zinc-100 dark:bg-zinc-900 rounded-[14px] p-6 mt-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-[14px] flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-lg">Pay via M-Pesa</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Secure direct payment</p>
                </div>
              </div>
              <div className="bg-white dark:bg-zinc-950 p-4 rounded-[8px] mb-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Buy Goods Till Number</p>
                <p className="text-2xl font-bold tracking-wider text-green-600 dark:text-green-500">1919000</p>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Contact the seller after payment to arrange delivery or pickup. Do not pay in advance for unseen items.
              </p>
            </div>
          </div>
        </div>

        {/* Related Listings */}
        {related.length > 0 && (
          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-2xl font-bold mb-6">Similar in {listing.category}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {related.map(l => (
                <ProductCard key={l.id} listing={l} />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><App /></ErrorBoundary>);
