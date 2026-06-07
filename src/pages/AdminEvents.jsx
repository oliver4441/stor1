import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Clock, FileText, Eye, AlertTriangle, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { isAdmin } from '../utils/api';

const STATUS_GROUPS = [
  { key: 'pending_review', label: 'Pending Review', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-900/50', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' },
  { key: 'draft', label: 'Drafts', icon: FileText, color: 'text-zinc-500', bg: 'bg-zinc-50 dark:bg-zinc-900/50', border: 'border-zinc-200 dark:border-zinc-800', badge: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
  { key: 'published', label: 'Published', icon: Check, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-900/50', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' },
  { key: 'rejected', label: 'Rejected', icon: X, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-900/50', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' },
];

function AdminEvents() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, eventId: null, eventTitle: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [expandedGroups, setExpandedGroups] = useState({ pending_review: true, draft: false, published: false, rejected: false });
  const [expandedEvent, setExpandedEvent] = useState(null);

  useEffect(() => {
    const init = async () => {
      const admin = await isAdmin();
      if (!admin) {
        navigate('/login');
        return;
      }
      await fetchAllEvents();
    };
    init();
  }, [navigate]);

  const fetchAllEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('events')
        .select('*, ticket_types(*)')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setEvents(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (eventId) => {
    setActionLoading(eventId);
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (updateError) throw updateError;
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: 'published' } : e));
    } catch (err) {
      setError(err.message || 'Failed to approve event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectModal.eventId);
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', rejectModal.eventId);

      if (updateError) throw updateError;
      setEvents(prev => prev.map(e => e.id === rejectModal.eventId ? { ...e, status: 'rejected', rejection_reason: rejectReason.trim() } : e));
      setRejectModal({ open: false, eventId: null, eventTitle: '' });
      setRejectReason('');
    } catch (err) {
      setError(err.message || 'Failed to reject event');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (eventId, newStatus) => {
    setActionLoading(eventId);
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', eventId);

      if (updateError) throw updateError;
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, status: newStatus } : e));
    } catch (err) {
      setError(err.message || 'Failed to update event status');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleGroup = (key) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getEventsByStatus = (status) => events.filter(e => e.status === status);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#ff385c] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-500 dark:text-zinc-400">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full" data-name="admin-events">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-7 h-7 text-[#ff385c]" />
            <h1 className="text-3xl font-black text-zinc-900 dark:text-white">Admin — Events</h1>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">Review and manage event submissions.</p>
        </div>
        <button
          onClick={fetchAllEvents}
          className="text-sm font-bold text-[#ff385c] hover:underline"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {STATUS_GROUPS.map(group => {
          const count = getEventsByStatus(group.key).length;
          const Icon = group.icon;
          return (
            <div key={group.key} className={`${group.bg} border ${group.border} rounded-2xl p-4`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${group.color}`} />
                <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{group.label}</span>
              </div>
              <p className="text-2xl font-black text-zinc-900 dark:text-white">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Event groups */}
      <div className="space-y-6">
        {STATUS_GROUPS.map(group => {
          const groupEvents = getEventsByStatus(group.key);
          const isExpanded = expandedGroups[group.key];
          const Icon = group.icon;

          return (
            <div key={group.key} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${group.color}`} />
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{group.label}</h2>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${group.badge}`}>
                    {groupEvents.length}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                )}
              </button>

              {/* Group content */}
              {isExpanded && (
                <div className="border-t border-zinc-100 dark:border-zinc-800">
                  {groupEvents.length === 0 ? (
                    <div className="p-10 text-center">
                      <Icon className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                      <p className="text-zinc-400 dark:text-zinc-500 text-sm">No events in this category.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {groupEvents.map(event => (
                        <div key={event.id} className="p-5">
                          {/* Event row */}
                          <div className="flex flex-col sm:flex-row gap-4">
                            {/* Event image */}
                            <div className="w-full sm:w-32 h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 overflow-hidden flex-shrink-0">
                              {event.image_url ? (
                                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                  <FileText className="w-8 h-8" />
                                </div>
                              )}
                            </div>

                            {/* Event info */}
                            <div className="flex-grow min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h3 className="font-bold text-zinc-900 dark:text-white truncate">{event.title}</h3>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${group.badge}`}>
                                  {event.status}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                                <span>By {event.organizer_name || 'Unknown'}</span>
                                <span>{event.venue || 'No venue'}</span>
                                <span>{formatDateTime(event.event_date)}</span>
                              </div>
                              {event.ticket_types && event.ticket_types.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                  {event.ticket_types.map(tt => (
                                    <span key={tt.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                      {tt.name}: KES {tt.price.toLocaleString()} ({tt.quantity_total} avail)
                                    </span>
                                  ))}
                                </div>
                              )}
                              {event.rejection_reason && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                                  <strong>Rejection reason:</strong> {event.rejection_reason}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex sm:flex-col gap-2 flex-shrink-0">
                              {event.status === 'pending_review' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(event.id)}
                                    disabled={actionLoading === event.id}
                                    className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => setRejectModal({ open: true, eventId: event.id, eventTitle: event.title })}
                                    disabled={actionLoading === event.id}
                                    className="flex items-center gap-1.5 bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Reject
                                  </button>
                                </>
                              )}
                              {event.status === 'draft' && (
                                <button
                                  onClick={() => handleStatusChange(event.id, 'pending_review')}
                                  disabled={actionLoading === event.id}
                                  className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-600 transition-all disabled:opacity-50"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  Submit for Review
                                </button>
                              )}
                              {event.status === 'published' && (
                                <button
                                  onClick={() => handleStatusChange(event.id, 'paused')}
                                  disabled={actionLoading === event.id}
                                  className="flex items-center gap-1.5 bg-zinc-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-600 transition-all disabled:opacity-50"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  Pause
                                </button>
                              )}
                              {event.status === 'rejected' && (
                                <button
                                  onClick={() => handleStatusChange(event.id, 'pending_review')}
                                  disabled={actionLoading === event.id}
                                  className="flex items-center gap-1.5 bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-600 transition-all disabled:opacity-50"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  Re-review
                                </button>
                              )}
                              <a
                                href={`/events/${event.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View
                              </a>
                            </div>
                          </div>

                          {/* Expandable details */}
                          {event.description && (
                            <button
                              onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                              className="mt-3 text-xs font-bold text-[#ff385c] hover:underline flex items-center gap-1"
                            >
                              {expandedEvent === event.id ? 'Hide' : 'Show'} details
                              {expandedEvent === event.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                          {expandedEvent === event.id && event.description && (
                            <div className="mt-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 text-sm text-zinc-600 dark:text-zinc-400">
                              <p className="whitespace-pre-wrap">{event.description}</p>
                              <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700 grid grid-cols-2 gap-2 text-xs">
                                <div><span className="font-bold text-zinc-500">Category:</span> {event.category || 'General'}</div>
                                <div><span className="font-bold text-zinc-500">Phone:</span> {event.organizer_phone || '—'}</div>
                                <div><span className="font-bold text-zinc-500">Created:</span> {formatDate(event.created_at)}</div>
                                <div><span className="font-bold text-zinc-500">Organizer ID:</span> {event.organizer_id || '—'}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reject Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setRejectModal({ open: false, eventId: null, eventTitle: '' }); setRejectReason(''); }} />
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Reject Event</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[250px]">{rejectModal.eventTitle}</p>
              </div>
            </div>

            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={4}
              required
              placeholder="Explain why this event is being rejected. The organizer will see this reason."
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white resize-none text-sm"
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setRejectModal({ open: false, eventId: null, eventTitle: '' }); setRejectReason(''); }}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-3 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === rejectModal.eventId}
                className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {actionLoading === rejectModal.eventId ? 'Rejecting...' : 'Reject Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEvents;
