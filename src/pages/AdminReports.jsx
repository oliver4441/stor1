import { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { isAdmin } from '../utils/api';
import { GooeyLoader } from '@/components/ui/loader-10';

const TABS = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'reviewed', label: 'Reviewed', icon: ShieldAlert },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle },
  { key: 'all', label: 'All', icon: ShieldAlert },
];

const API_URL = import.meta.env.VITE_API_URL || 'https://stor1-api.onrender.com';

export default function AdminReports() {
  const [user, setUser] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const admin = await isAdmin();
        setIsAdminUser(admin);
        if (admin) loadReports();
        else setLoading(false);
      } else {
        setLoading(false);
      }
    })();
  }, []);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*, listings!left(title), profiles!left(full_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setErrorMsg('Failed to load reports. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReportStatus = async (reportId, newStatus) => {
    setActionLoading(reportId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const notes = adminNotes[reportId] || null;
      const { error } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          admin_notes: notes,
          reviewed_at: newStatus !== 'pending' ? new Date().toISOString() : null,
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev =>
        prev.map(r => r.id === reportId ? { ...r, status: newStatus, admin_notes: notes } : r)
      );
      setSuccessMsg(`Report marked as "${newStatus}".`);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update report status.');
    } finally {
      setActionLoading(null);
    }
  };

  const dismissReport = async (reportId) => {
    setActionLoading(reportId);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const notes = adminNotes[reportId] || null;
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed', admin_notes: notes, reviewed_at: new Date().toISOString() })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev =>
        prev.map(r => r.id === reportId ? { ...r, status: 'dismissed', admin_notes: notes } : r)
      );
      setSuccessMsg('Report dismissed.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dismiss report.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredReports = activeTab === 'all'
    ? reports
    : reports.filter(r => r.status === activeTab);

  // Self-clear messages
  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 4000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  // ── Auth guard ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <GooeyLoader />
      </div>
    );
  }

  if (!user || !isAdminUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500/50 mx-auto mb-4" />
        <h1 className="text-2xl font-black mb-2">Access Denied</h1>
        <p className="text-[#4A5771] mb-8">You need admin privileges to view this page.</p>
        <a href="/" className="bg-[#71717a] text-white font-bold px-8 py-3 rounded-xl inline-block">Go Home</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a]">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-2xl bg-[#28303F]">
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black">User Reports</h1>
            <p className="text-sm text-[#4A5771]">Review and manage user reports for listings</p>
          </div>
        </div>

        {/* Flash messages */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-900/20 border border-emerald-800 text-emerald-400 text-sm font-medium">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-800 text-red-400 text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[#1E2A3D] inline-flex">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === key
                  ? 'bg-[#71717a] text-white shadow-sm'
                  : 'text-[#8E9BB5] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className="text-xs opacity-70">
                ({key === 'all' ? reports.length : reports.filter(r => r.status === key).length})
              </span>
            </button>
          ))}
        </div>

        {/* Reports list */}
        {filteredReports.length === 0 ? (
          <div className="text-center py-16">
            <ShieldAlert className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-[#4A5771] font-medium">No {activeTab !== 'all' ? activeTab : ''} reports</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => {
              const isProcessing = actionLoading === report.id;
              return (
                <div
                  key={report.id}
                  className="fusion-recessed-card p-5 hover:border-[#353F54] transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          report.status === 'pending'
                            ? 'bg-amber-900/30 text-amber-400'
                            : report.status === 'reviewed'
                            ? 'bg-blue-900/30 text-blue-400'
                            : report.status === 'resolved'
                            ? 'bg-emerald-900/30 text-emerald-400'
                            : report.status === 'dismissed'
                            ? 'bg-zinc-800 text-zinc-400'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {report.status}
                        </span>
                        <span className="text-xs text-[#4A5771] font-mono">
                          #{report.id?.slice(0, 8)}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-white mb-1">
                        {report.reason || 'No reason provided'}
                      </h3>

                      {report.description && (
                        <p className="text-sm text-[#8E9BB5] mb-3 line-clamp-3">
                          {report.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4A5771]">
                        {report.listings?.title && (
                          <a
                            href={`/listing/${report.listing_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#71717a] hover:text-white transition-colors underline underline-offset-2"
                          >
                            View Listing
                          </a>
                        )}
                        <span>
                          Reporter: {report.profiles?.full_name || report.reporter_id?.slice(0, 8) || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(report.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        {report.listing_id && (
                          <span>Listing ID: {report.listing_id?.slice(0, 8)}</span>
                        )}
                      </div>

                      {/* Admin notes */}
                      <div className="mt-3">
                        <textarea
                          placeholder="Admin notes (optional)..."
                          value={adminNotes[report.id] || report.admin_notes || ''}
                          onChange={(e) => setAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-[#1E2A3D] border border-[#353F54] text-white text-xs focus:outline-none focus:border-[#71717a] placeholder:text-[#4A5771] resize-none"
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex lg:flex-col gap-2 flex-shrink-0">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateReportStatus(report.id, 'reviewed')}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600/20 border border-blue-700 text-blue-400 text-xs font-bold hover:bg-blue-600/30 transition-all disabled:opacity-50"
                          >
                            {isProcessing ? <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => updateReportStatus(report.id, 'resolved')}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-700 text-emerald-400 text-xs font-bold hover:bg-emerald-600/30 transition-all disabled:opacity-50"
                          >
                            {isProcessing ? <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Resolve
                          </button>
                          <button
                            onClick={() => dismissReport(report.id)}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-700/20 border border-zinc-600 text-zinc-400 text-xs font-bold hover:bg-zinc-700/40 transition-all disabled:opacity-50"
                          >
                            {isProcessing ? <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Dismiss
                          </button>
                        </>
                      )}
                      {report.status === 'reviewed' && (
                        <>
                          <button
                            onClick={() => updateReportStatus(report.id, 'resolved')}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600/20 border border-emerald-700 text-emerald-400 text-xs font-bold hover:bg-emerald-600/30 transition-all disabled:opacity-50"
                          >
                            {isProcessing ? <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            Resolve
                          </button>
                          <button
                            onClick={() => dismissReport(report.id)}
                            disabled={isProcessing}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-700/20 border border-zinc-600 text-zinc-400 text-xs font-bold hover:bg-zinc-700/40 transition-all disabled:opacity-50"
                          >
                            {isProcessing ? <div className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                            Dismiss
                          </button>
                        </>
                      )}
                      {report.status === 'resolved' && (
                        <span className="text-xs text-emerald-500/60 font-medium px-2 py-1">
                          <CheckCircle className="w-3.5 h-3.5 inline mr-1" />
                          Resolved
                        </span>
                      )}
                      {report.status === 'dismissed' && (
                        <span className="text-xs text-zinc-500/60 font-medium px-2 py-1">
                          <XCircle className="w-3.5 h-3.5 inline mr-1" />
                          Dismissed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
