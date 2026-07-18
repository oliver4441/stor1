import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { Users, Search, X, Loader2, Shield, ShieldCheck, User as UserIcon, Trash2, AlertTriangle, Mail, Phone, Calendar } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  let token = session?.access_token;
  if (!token) {
    try {
      const stored = JSON.parse(localStorage.getItem('supabase.auth.token') || '{}');
      token = stored?.currentSession?.access_token || stored?.access_token;
    } catch {}
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiGet(url) {
  const headers = await getAuthHeaders();
  const res = await fetch(url, { headers });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data.data ?? data;
}

async function apiDelete(url) {
  const headers = await getAuthHeaders();
  const res = await fetch(url, { method: 'DELETE', headers });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Request failed');
  return data;
}

const ROLE_META = {
  admin:    { label: 'Admin',    icon: ShieldCheck, cls: 'bg-red-900/30 text-red-400' },
  seller:   { label: 'Seller',   icon: Shield,      cls: 'bg-blue-900/30 text-blue-400' },
  customer: { label: 'Customer', icon: UserIcon,    cls: 'bg-zinc-700/40 text-zinc-400' },
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet(`${API_BASE}/api/admin/users`);
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q) ||
      (u.role || '').includes(q);
  });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiDelete(`${API_BASE}/api/admin/users/${confirmDelete.id}`);
      setUsers(prev => prev.filter(u => u.id !== confirmDelete.id));
      if (selected?.id === confirmDelete.id) setSelected(null);
      setConfirmDelete(null);
    } catch (e) {
      setError(e.message);
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Registered Users</h2>
          <p className="text-sm text-zinc-400">{users.length} accounts · real sign-ups (not just order guests)</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text" placeholder="Search name, email, phone, or role..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:border-primary focus:outline-none"
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-900/20 border border-red-800/40 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3">User</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3 hidden md:table-cell">Contact</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3">Privilege</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3 hidden sm:table-cell">Joined</th>
                  <th className="text-left text-xs font-bold text-zinc-400 uppercase px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const meta = ROLE_META[u.role] || ROLE_META.customer;
                  const RoleIcon = meta.icon;
                  return (
                    <tr key={u.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50">
                      <td className="px-4 py-3">
                        <button onClick={() => setSelected(u)} className="flex items-center gap-3 text-left">
                          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{(u.full_name || u.email || '?').charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{u.full_name || 'Unnamed'}</p>
                            <p className="text-xs text-zinc-500 truncate">{u.email_confirmed ? 'verified' : 'unverified'}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-1">
                          {u.email && <div className="flex items-center gap-1.5 text-xs text-zinc-400"><Mail className="w-3 h-3" />{u.email}</div>}
                          {u.phone && <div className="flex items-center gap-1.5 text-xs text-zinc-400"><Phone className="w-3 h-3" />{u.phone}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase ${meta.cls}`}>
                          <RoleIcon className="w-3 h-3" /> {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-xs text-zinc-400">{u.created_at ? new Date(u.created_at).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setConfirmDelete(u)}
                          className="p-2 rounded-lg text-red-400 hover:bg-red-600/10 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-2xl border-2 border-dashed border-zinc-800 p-12 text-center">
          <Users className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No users found</h3>
          <p className="text-sm text-zinc-400">{search ? 'Try a different search' : 'Registered accounts will appear here'}</p>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-zinc-900 rounded-2xl border border-zinc-800 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">User Details</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-zinc-400">Name</span><span className="text-white font-semibold">{selected.full_name || 'Unnamed'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Email</span><span className="text-white font-semibold">{selected.email || '-'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Phone</span><span className="text-white font-semibold">{selected.phone || '-'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Privilege</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${(ROLE_META[selected.role] || ROLE_META.customer).cls}`}>
                  {(ROLE_META[selected.role] || ROLE_META.customer).label}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-zinc-400">Email verified</span><span className="text-white font-semibold">{selected.email_confirmed ? 'Yes' : 'No'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Joined</span><span className="text-white font-semibold">{selected.created_at ? new Date(selected.created_at).toLocaleDateString('en-KE') : '-'}</span></div>
              <div className="flex justify-between"><span className="text-zinc-400">Last sign in</span><span className="text-white font-semibold">{selected.last_sign_in ? new Date(selected.last_sign_in).toLocaleDateString('en-KE') : 'Never'}</span></div>
            </div>
            <button
              onClick={() => { setConfirmDelete(selected); setSelected(null); }}
              className="mt-6 w-full py-2.5 rounded-xl bg-red-600/20 border border-red-700/50 text-red-400 font-bold text-sm hover:bg-red-600/30 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete This User
            </button>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setConfirmDelete(null)} />
          <div className="relative bg-zinc-900 rounded-2xl border border-red-900/40 p-6 w-full max-w-sm shadow-2xl text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">Delete User?</h3>
            <p className="text-sm text-zinc-400 mb-2">This permanently removes <span className="text-white font-semibold">{confirmDelete.email || confirmDelete.full_name}</span> and their profile.</p>
            <p className="text-xs text-red-400 mb-6">This cannot be undone. Final admin accounts are protected.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 font-bold text-sm hover:bg-zinc-700">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
