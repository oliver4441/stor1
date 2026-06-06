import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Package, MessageSquare, LogOut, ExternalLink } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { fetchUserListings } from '../utils/api';
import { formatKES } from '../utils/constants';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
      } else {
        setUser(user);
        const userListings = await fetchUserListings(user.id);
        setListings(userListings);
        setLoading(false);
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-zinc-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="dashboard-page">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Seller Dashboard</h1>
          <p className="text-zinc-500 dark:text-zinc-400">Welcome back, {user?.user_metadata?.full_name || user?.email}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/sell" className="flex items-center gap-2 bg-[#ff385c] text-white px-6 py-3 rounded-2xl font-bold hover:bg-[#e03150] shadow-lg shadow-[#ff385c]/20">
            <Plus className="w-5 h-5" />
            New Listing
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 px-6 py-3 rounded-2xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800">
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4 mb-2 text-[#ff385c]">
            <Package className="w-6 h-6" />
            <h3 className="font-bold">Active Listings</h3>
          </div>
          <p className="text-4xl font-black text-zinc-900 dark:text-white">{listings.length}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-4 mb-2 text-blue-500">
            <MessageSquare className="w-6 h-6" />
            <h3 className="font-bold">Total Inquiries</h3>
          </div>
          <p className="text-4xl font-black text-zinc-900 dark:text-white">0</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">Your Products</h2>

      {listings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <div key={listing.id} className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex gap-4 group">
              <div className="w-24 h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                {listing.images?.[0] ? (
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-grow min-w-0">
                <h4 className="font-bold text-zinc-900 dark:text-white truncate">{listing.title}</h4>
                <p className="text-[#ff385c] font-bold text-sm mb-1">{formatKES(listing.price)}</p>
                <div className="flex gap-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${listing.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-zinc-100 text-zinc-600'}`}>
                    {listing.status}
                  </span>
                  <Link to={`/listing/${listing.id}`} className="ml-auto text-zinc-400 hover:text-[#ff385c]">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-20 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
          <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">No products yet</h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">Start selling your items to see them here.</p>
          <Link to="/sell" className="text-[#ff385c] font-bold hover:underline">Post your first listing</Link>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
