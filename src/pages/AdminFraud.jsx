import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';

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
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.data ?? data;
}

const SEVERITY_COLORS = {
  high: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  info: { bg: 'bg-zinc-500/10', border: 'border-blue-500/20', text: 'text-zinc-500', dot: 'bg-blue-500' },
};

function AlertCard({ alert }) {
  const sc = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.info;
  return (
    <div className={`rounded-xl p-4 border ${sc.border} ${sc.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`w-2.5 h-2.5 rounded-full ${sc.dot} mt-1.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase ${sc.text}`}>{alert.severity}</span>
            <span className="text-sm font-bold text-zinc-100">{alert.title}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">{alert.description}</p>
          {alert.details?.length > 0 && (
            <div className="mt-2 space-y-1">
              {alert.details.map((d, i) => (
                <div key={i} className="text-[11px] text-zinc-500 bg-zinc-900/50 rounded-lg px-2.5 py-1.5 flex items-center gap-2">
                  {d.signup_ip && <span className="font-mono text-zinc-300">{d.signup_ip}</span>}
                  {d.email && <span>{d.email}</span>}
                  {d.account_count && <span className="ml-auto text-zinc-400">{d.account_count} accounts</span>}
                  {d.sample_emails?.length > 0 && (
                    <span className="text-zinc-500 truncate max-w-[200px]">{d.sample_emails.join(', ')}</span>
                  )}
                  {d.created_at && <span className="ml-auto text-zinc-500">{new Date(d.created_at).toLocaleDateString('en-KE')}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminFraud() {
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('alerts');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertData, logData] = await Promise.all([
        apiGet(`${API_BASE}/api/admin/fraud-alerts`),
        apiGet(`${API_BASE}/api/admin/activity-logs?limit=100&days=7`),
      ]);
      setAlerts(Array.isArray(alertData) ? alertData : []);
      setLogs(Array.isArray(logData) ? logData : []);
    } catch (err) {
      console.error('Failed to load fraud data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="min-h-screen bg-[#08080a] text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <div>
            <h1 className="text-xl font-bold text-zinc-100">Fraud Detection</h1>
            <p className="text-sm text-zinc-400">Monitor suspicious activity and affiliate patterns</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-zinc-900/70 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab('alerts')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'alerts' ? 'bg-[#ff385c] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Alerts ({alerts.length})
          </button>
          <button
            onClick={() => setTab('activity')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === 'activity' ? 'bg-[#ff385c] text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Activity Log ({logs.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="animate-pulse bg-zinc-900/50 rounded-xl h-24" />)}
          </div>
        ) : tab === 'alerts' ? (
          alerts.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <p className="text-zinc-500">No fraud alerts detected</p>
              <p className="text-xs text-zinc-600 mt-1">System checks for duplicate IPs, disposable emails, and pending applications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, i) => <AlertCard key={i} alert={alert} />)}
            </div>
          )
        ) : (
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-16">
                <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
                <p className="text-zinc-500">No activity logs yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-zinc-500 text-[11px] uppercase tracking-wider border-b border-zinc-800/50">
                      <th className="pb-2 pr-3">Time</th>
                      <th className="pb-2 pr-3">Action</th>
                      <th className="pb-2 pr-3">Type</th>
                      <th className="pb-2 pr-3">Description</th>
                      <th className="pb-2">Actor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={log.id || i} className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors">
                        <td className="py-2.5 pr-3 text-zinc-400 text-[11px] font-mono whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('en-KE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-200 font-medium">{log.action}</td>
                        <td className="py-2.5 pr-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800/50 text-zinc-400 uppercase">
                            {log.actor_type || 'system'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-400 text-[11px] max-w-[200px] truncate">
                          {log.description || (log.metadata ? JSON.stringify(log.metadata).slice(0, 60) : '--')}
                        </td>
                        <td className="py-2.5 text-zinc-500 text-[11px] font-mono">
                          {log.actor_id ? `${log.actor_id.slice(0, 8)}...` : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 text-xs text-zinc-600 text-center">
          <p>Fraud data refreshes on page load. Suspicious IP thresholds: 3+ accounts from same IP flagged.</p>
        </div>
      </div>
    </div>
  );
}
