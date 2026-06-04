class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() { if (this.state.hasError) return <div>Error</div>; return this.props.children; }
}

function App() {
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const form = e.currentTarget;
    const formData = {
      title: form.title.value,
      price: form.price.value,
      condition: form.condition.value,
      category: form.category.value,
      location: form.location.value,
      description: form.description.value,
      image_url: form.image_url.value,
      seller_name: form.seller_name.value,
      seller_phone: form.seller_phone.value,
    };

    const result = await createListing(formData);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => { window.location.href = 'index.html'; }, 1500);
    } else {
      setError(result.error || 'Failed to create listing');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2 text-green-600">Listing posted!</h2>
            <p className="text-zinc-500">Redirecting to homepage...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" data-name="sell-app">
      <Navbar />
      
      <main className="flex-grow max-w-2xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold mb-2">Post a listing</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-8">No account needed. Just fill the details and post.</p>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-[14px] mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2">Title</label>
            <input required name="title" type="text" placeholder="e.g. iPhone 12 Pro" className="w-full px-4 py-3 rounded-[14px] bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Price (KES)</label>
              <input required name="price" type="number" placeholder="0" className="w-full px-4 py-3 rounded-[14px] bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Condition</label>
              <select required name="condition" className="w-full px-4 py-3 rounded-[14px] bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white appearance-none">
                <option value="New">New</option>
                <option value="Used - Like New">Used - Like New</option>
                <option value="Used - Good">Used - Good</option>
                <option value="Used - Fair">Used - Fair</option>
                <option value="N/A">N/A (Services)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2">Category</label>
              <select required name="category" className="w-full px-4 py-3 rounded-[14px] bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white appearance-none">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Location</label>
              <select required name="location" className="w-full px-4 py-3 rounded-[14px] bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white appearance-none">
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea required name="description" rows="4" placeholder="Describe your item..." className="w-full px-4 py-3 rounded-[14px] bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white resize-none"></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Image URL</label>
            <input name="image_url" type="url" placeholder="https://unsplash.com/..." className="w-full px-4 py-3 rounded-[14px] bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white" />
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-6">
            <label className="block text-sm font-bold mb-2">Your Name</label>
            <input required name="seller_name" type="text" placeholder="e.g. Kiprono" className="w-full px-4 py-3 rounded-[14px] bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Phone (optional)</label>
            <input name="seller_phone" type="tel" placeholder="+254 700 000 000" className="w-full px-4 py-3 rounded-[14px] bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white" />
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-[#ff385c] text-white font-bold py-4 rounded-[14px] hover:bg-[#e03150] mt-8 disabled:opacity-50">
            {submitting ? 'Posting...' : 'Post Listing'}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<ErrorBoundary><App /></ErrorBoundary>);
