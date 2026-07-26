import { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { submitReport } from '../utils/api';

const REPORT_REASONS = [
  'Fake or counterfeit',
  'Wrong category',
  'Prohibited item',
  'Spam',
  'Misleading price',
  'Other',
];

export default function ReportListingModal({ listingId, onClose, isOpen }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason for reporting.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const result = await submitReport({
        listing_id: listingId,
        reason,
        description: description.trim() || undefined,
      });

      if (result?.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setReason('');
          setDescription('');
          setError('');
        }, 2000);
      } else {
        setError(result?.error || 'Failed to submit report. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
    // Reset after animation frame
    setTimeout(() => {
      setReason('');
      setDescription('');
      setError('');
      setSuccess(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      {/* Dark backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Centered card */}
      <div
        className="relative w-full max-w-md bg-[#1E2A3D] rounded-2xl shadow-2xl border border-[#353F54] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#353F54]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Report Listing</h2>
              <p className="text-xs text-[#8E9BB5]">Help us keep the marketplace safe</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="w-8 h-8 rounded-full bg-[#08080a]/50 flex items-center justify-center text-[#8E9BB5] hover:bg-[#08080a] hover:text-white transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="px-6 py-10 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-emerald-400" />
            </div>
            <p className="text-white font-bold text-lg mb-1">Report Submitted</p>
            <p className="text-sm text-[#8E9BB5]">
              Thank you for helping keep Omix safe. Our team will review this report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
            {/* Reason dropdown */}
            <div>
              <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                Reason for report *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#08080a] border border-[#353F54] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all appearance-none cursor-pointer"
                required
              >
                <option value="" disabled>Select a reason…</option>
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Description textarea */}
            <div>
              <label className="block text-sm font-medium text-[#8E9BB5] mb-1.5">
                Additional details
                <span className="text-[#8E9BB5]/60 ml-1">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any extra information that might help our review team…"
                rows={4}
                maxLength={2000}
                className="w-full bg-[#08080a] border border-[#353F54] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#8E9BB5]/40 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60 transition-all resize-none"
              />
              <p className="text-xs text-[#8E9BB5]/50 mt-1 text-right">
                {description.length}/2000
              </p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#353F54] text-sm font-bold text-[#8E9BB5] hover:bg-[#353F54]/30 hover:text-white transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reason}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/80 text-sm font-bold text-white hover:bg-red-500 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
