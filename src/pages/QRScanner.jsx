import { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

function QRScanner() {
  const [ticketNumber, setTicketNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!ticketNumber.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    // We'll use Supabase RPC or a direct query
    const { supabase } = await import('../utils/supabase');

    // Find the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('*, orders(*, events(*), ticket_types(*))')
      .eq('ticket_number', ticketNumber.trim().toUpperCase())
      .single();

    if (ticketError || !ticket) {
      setError('Ticket not found. Check the ticket number and try again.');
      setLoading(false);
      return;
    }

    if (ticket.status === 'used') {
      setResult({ status: 'already_used', ticket });
      setLoading(false);
      return;
    }

    if (ticket.status !== 'valid') {
      setResult({ status: 'invalid', ticket, reason: ticket.status });
      setLoading(false);
      return;
    }

    // Check in the ticket
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ status: 'used', checked_in_at: new Date().toISOString() })
      .eq('id', ticket.id);

    if (updateError) {
      setError('Failed to check in ticket. Try again.');
      setLoading(false);
      return;
    }

    setResult({ status: 'success', ticket });
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8" data-name="qr-scanner">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Ticket Scanner</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Enter or scan a ticket number to check in attendees.</p>
      </div>

      {/* Scanner area */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-xl p-8 mb-6 text-center">
          <div className="w-20 h-20 bg-zinc-200 dark:bg-zinc-700 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-500">Enter ticket number manually below</p>
        </div>

        <form onSubmit={handleCheckIn} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Ticket Number</label>
            <input
              value={ticketNumber}
              onChange={e => setTicketNumber(e.target.value.toUpperCase())}
              type="text"
              placeholder="e.g. OMX-EVT001-00042"
              className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white font-mono text-sm tracking-wider"
              autoFocus
            />
          </div>
          <button type="submit" disabled={loading || !ticketNumber.trim()}
            className="w-full bg-[#ff385c] text-white font-bold py-3.5 rounded-xl hover:bg-[#e03150] transition-all disabled:opacity-40">
            {loading ? 'Checking...' : 'Check In'}
          </button>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-2xl p-6 border ${result.status === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/50' : result.status === 'already_used' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50'}`}>
          <div className="flex items-start gap-4">
            {result.status === 'success' ? (
              <>
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-black text-green-700 dark:text-green-400 text-lg">Check-In Successful!</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{result.ticket.holder_name} — {result.ticket.orders?.ticket_types?.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{result.ticket.orders?.events?.title}</p>
                  <p className="text-xs text-zinc-400 mt-2 font-mono">{result.ticket.ticket_number}</p>
                </div>
              </>
            ) : result.status === 'already_used' ? (
              <>
                <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
                <div>
                  <h3 className="font-black text-amber-700 dark:text-amber-400 text-lg">Already Checked In</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{result.ticket.holder_name} — {result.ticket.orders?.ticket_types?.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {result.ticket.checked_in_at ? `Checked in at ${new Date(result.ticket.checked_in_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : 'Previously used'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-black text-red-700 dark:text-red-400 text-lg">Invalid Ticket</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">This ticket is {result.reason}.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-4 border border-red-100 dark:border-red-900/50 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}

export default QRScanner;
