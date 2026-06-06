import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Send } from 'lucide-react';
import { createWish } from '../utils/api';
import { CATEGORIES } from '../utils/constants';

function WishForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const form = e.target.elements;
    const result = await createWish({
      title: form.title.value,
      category: form.category.value,
      description: form.description.value,
      budget_min: form.budget_min.value,
      budget_max: form.budget_max.value,
      urgency: form.urgency.value,
      requester_name: form.requester_name.value,
      requester_phone: form.requester_phone.value,
    });

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 p-10 rounded-3xl border border-green-100 dark:border-green-900/50">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-black mb-2 text-green-700 dark:text-green-400">Wish posted!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">Sellers can now see your request and reach out if they have what you need.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/wishes')} className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-all">
              Browse Wishes
            </button>
            <button onClick={() => { setSuccess(false); setLoading(false); }} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-6 py-2.5 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
              Post Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10 w-full" data-name="wish-form-page">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-[#ff385c]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Heart className="w-7 h-7 text-[#ff385c]" />
        </div>
        <h1 className="text-3xl font-black mb-2 text-zinc-900 dark:text-white">Request an Item</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Can't find what you need? Post a wish and let sellers come to you.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">What are you looking for? *</label>
          <input required name="title" type="text" placeholder="e.g. iPhone 13 Pro, Office chair, PS5..." className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Category *</label>
          <select required name="category" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm appearance-none">
            <option value="">Select a category</option>
            {CATEGORIES.filter(c => c !== 'All').map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Describe what you need</label>
          <textarea name="description" rows="3" placeholder="Be specific — brand, model, condition, color, size..." className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Min Budget (KES)</label>
            <input name="budget_min" type="number" min="0" placeholder="0" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Max Budget (KES)</label>
            <input name="budget_max" type="number" min="0" placeholder="50000" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Urgency</label>
          <select name="urgency" defaultValue="normal" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm appearance-none">
            <option value="low">Low — Just browsing</option>
            <option value="normal">Normal — Needed within a month</option>
            <option value="high">High — Needed within a week</option>
            <option value="urgent">Urgent — Needed ASAP</option>
          </select>
        </div>

        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 mt-2">
          <p className="text-xs font-bold text-zinc-400 uppercase mb-3">Your Contact Info (so sellers can reach you)</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Your Name *</label>
              <input required name="requester_name" type="text" placeholder="e.g. Kiprono" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 text-zinc-700 dark:text-zinc-300">Phone (optional)</label>
              <input name="requester_phone" type="tel" placeholder="07XXXXXXXX" className="w-full px-4 py-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:bg-white dark:focus:bg-zinc-950 focus:outline-none text-zinc-900 dark:text-white transition-all shadow-sm" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#ff385c] text-white font-black py-4 rounded-2xl hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20 flex items-center justify-center gap-2">
          <Send className="w-5 h-5" />
          {loading ? 'Posting...' : 'Post My Wish'}
        </button>
      </form>
    </div>
  );
}

export default WishForm;
