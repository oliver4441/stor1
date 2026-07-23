import { useState, useEffect, useRef } from 'react';
import { Package, Search, Import, Loader2, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { isAdmin } from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

export default function AdminDropshipProducts() {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(null);
  const [importDone, setImportDone] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const debounce = useRef(null);

  useEffect(() => {
    isAdmin().catch(() => window.location.href = '/login');
  }, []);

  const search = async (q) => {
    if (!q.trim()) { setProducts([]); return; }
    setLoading(true);
    setError('');
    setNotConfigured(false);
    try {
      const res = await fetch(`${API_URL}/api/admin/dropship/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (json.code === 'CJ_NOT_CONFIGURED') { setNotConfigured(true); setProducts([]); return; }
        throw new Error(json.error || 'Search failed');
      }
      setProducts(json.products?.list || json.products || []);
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(e.target.value), 400);
  };

  const importProduct = async (p) => {
    setImporting(p.pid || p.id);
    setError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/admin/dropship/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({
          pid: p.pid || p.id,
          title: p.productName || p.name || p.title,
          price: p.sellPrice || p.price,
          images: p.productImage ? [p.productImage] : (p.images || []),
          description: p.description || '',
          category: 'Other',
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setImportDone(p.pid || p.id);
      setTimeout(() => setImportDone(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(null);
    }
  };

  if (notConfigured) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-black mb-4">Dropship Products</h1>
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-600" />
          <p className="font-bold text-amber-800">CJdropshipping API not configured</p>
          <p className="text-sm mt-1 text-amber-700">Set CJ_API_TOKEN in server env vars to enable product search and import.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-black mb-4">Dropship Products</h1>
      <p className="text-sm text-zinc-500 mb-6">Search CJdropshipping catalog and import products to your store.</p>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={handleQueryChange}
          placeholder="Search CJdropshipping products..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{ borderColor: '#e4e4e7' }}
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && products.length === 0 && query && (
        <div className="text-center py-12 text-zinc-400">
          <Package className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm">No products found. Try a different search term.</p>
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p) => {
          const id = p.pid || p.id;
          const name = p.productName || p.name || p.title;
          const img = p.productImage || p.images?.[0] || '';
          const price = p.sellPrice || p.price;
          return (
            <div key={id} className="rounded-xl border overflow-hidden hover:shadow-md transition-shadow" style={{ borderColor: '#e4e4e7' }}>
              <div className="h-40 bg-zinc-100 flex items-center justify-center overflow-hidden">
                {img ? (
                  <img src={img} alt={name} className="w-full h-full object-contain" />
                ) : (
                  <Package className="w-8 h-8 text-zinc-300" />
                )}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm truncate">{name}</h3>
                {price && <p className="text-sm font-bold text-primary mt-1">KES {Number(price).toLocaleString()}</p>}
                <button
                  onClick={() => importProduct(p)}
                  disabled={importing === id}
                  className={`mt-2 w-full flex items-center justify-center gap-1.5 text-sm font-bold py-2 rounded-xl transition-all ${
                    importDone === id
                      ? 'bg-green-100 text-green-700'
                      : 'bg-primary text-white hover:opacity-90'
                  }`}
                >
                  {importing === id ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...</>
                  ) : importDone === id ? (
                    <><Check className="w-3.5 h-3.5" /> Imported</>
                  ) : (
                    <><Import className="w-3.5 h-3.5" /> Import</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!query && !loading && (
        <div className="text-center py-16 text-zinc-400">
          <Search className="w-10 h-10 mx-auto mb-4" />
          <p className="text-sm">Type a keyword above to search CJdropshipping products.</p>
          <p className="text-xs mt-1">e.g. &quot;wireless earphones&quot;, &quot;smart watch&quot;, &quot;phone case&quot;</p>
        </div>
      )}
    </div>
  );
}
