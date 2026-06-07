import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Shield } from 'lucide-react';
import { paystackVerify, updateOrderPayment, generateTickets } from '../utils/api';

function OrderCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference') || searchParams.get('trxref');

      if (!reference) {
        setStatus('failed');
        setError('No payment reference found. Please contact support.');
        return;
      }

      try {
        // Verify transaction with Paystack
        const result = await paystackVerify(reference);

        if (!result.success) {
          setStatus('failed');
          setError(result.error || 'Payment verification failed.');
          return;
        }

        if (result.data?.status !== 'success') {
          setStatus('failed');
          setError('Payment was not completed. Please try again.');
          return;
        }

        // Get order_id from metadata
        const oid = result.data.metadata?.order_id;
        if (!oid) {
          setStatus('failed');
          setError('Order reference not found. Please contact support.');
          return;
        }

        setOrderId(oid);

        // Update order payment status
        const updateResult = await updateOrderPayment(oid, {
          paystackReference: reference,
          paymentStatus: 'completed',
        });

        if (!updateResult.success) {
          console.error('Failed to update order:', updateResult.error);
          // Continue anyway — payment is confirmed on Paystack's side
        }

        // Generate tickets
        const ticketResult = await generateTickets(oid);

        if (ticketResult.success) {
          setStatus('success');
        } else {
          // Tickets may have already been generated
          console.error('Ticket generation:', ticketResult.error);
          setStatus('success');
        }
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('failed');
        setError('An unexpected error occurred. Please contact support.');
      }
    };

    verifyPayment();
  }, [searchParams]);

  // ── Verifying ──
  if (status === 'verifying') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10">
          <Loader2 className="w-12 h-12 text-[#ff385c] animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Verifying Payment...</h2>
          <p className="text-zinc-500">Please wait while we confirm your payment with Paystack.</p>
          <p className="text-xs text-zinc-400 mt-4 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> Secured by Paystack
          </p>
        </div>
      </div>
    );
  }

  // ── Success ──
  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-3xl p-10 border border-green-100 dark:border-green-900/50">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-black text-green-700 dark:text-green-400 mb-2">Payment Successful!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            Your tickets have been confirmed and sent to your email.
          </p>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 text-left space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-zinc-500">Order ID</span>
              <span className="font-bold text-zinc-900 dark:text-white">#{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <span className="font-bold text-green-600">Confirmed</span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mb-6">Show your QR ticket at the gate.</p>
          <Link
            to="/events"
            className="bg-[#ff385c] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e03150] transition-all inline-block"
          >
            Browse More Events
          </Link>
        </div>
      </div>
    );
  }

  // ── Failed ──
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      <div className="bg-red-50 dark:bg-red-900/20 rounded-3xl p-10 border border-red-100 dark:border-red-900/50">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-2xl font-black text-red-700 dark:text-red-400 mb-2">Payment Verification Failed</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/events"
            className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-6 py-3 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
          >
            Back to Events
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#ff385c] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e03150] transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderCallback;
