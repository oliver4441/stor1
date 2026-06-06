import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { CATEGORIES, LOCATIONS } from '../utils/constants'
import { createListing } from '../utils/api'

function Sell() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      setTimeout(() => { navigate('/'); }, 1500);
    } else {
      setError(result.error || 'Failed to create listing');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-8 rounded-3xl inline-block mb-4">
          <h2 className="text-3xl font-black mb-2">Listing posted!</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Redirecting to homepage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 w-full" data-name="sell-page">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">Post a listing</h1>
        <p className="text-zinc-500 dark:text-zinc-400">No account needed. Just fill the details and post.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Title</label>
            <input required name="title" type="text" placeholder="e.g. iPhone 12 Pro" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Price (KES)</label>
              <input required name="price" type="number" placeholder="0" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Condition</label>
              <select required name="condition" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm appearance-none">
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
              <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Category</label>
              <select required name="category" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm appearance-none">
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Location</label>
              <select required name="location" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm appearance-none">
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Description</label>
            <textarea required name="description" rows="4" placeholder="Describe your item..." className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm resize-none"></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Image URL</label>
            <input name="image_url" type="url" placeholder="https://unsplash.com/..." className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
            <p className="text-xs text-zinc-500 mt-2 italic">Tip: Use Unsplash or an image link for now. Storage coming soon!</p>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Seller Information</h3>
          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Your Name</label>
            <input required name="seller_name" type="text" placeholder="e.g. Kiprono" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Phone (optional)</label>
            <input name="seller_phone" type="tel" placeholder="+254 700 000 000" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
          </div>
        </div>

        <button type="submit" disabled={submitting} className="w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20">
          {submitting ? 'Posting...' : 'Post Listing'}
        </button>
      </form>
    </div>
  );
}

export default Sell;
