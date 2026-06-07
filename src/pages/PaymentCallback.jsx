import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { fetchOrder, updateOrderPayment, generateTickets, paystackVerify } from '../utils/api';
import { formatKES } from '../utils/constants';

function PaymentCallback() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | failed
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || params.get('trxref');

    if (!reference) {
      setStatus('failed');
      setError('No payment reference found. If you completed payment, contact support.');
      return;
    }

    verifyAndComplete(reference);
  }, [orderId]);

  const verifyAndComplete = async (reference) => {
    try {
      // Verify with Paystack via our backend
      const verifyResult = await paystackVerify(reference);

      if (!verifyResult.success || verifyResult.data?.status !== 'success') {
        setStatus('failed');
        setError('Payment verification failed. If money was deducted, contact support at omixsystems@gmail.com');
        return;
      }

      // Update order payment status
      const updateResult = await updateOrderPayment(orderId, {
        paystackReference: reference,
        paymentStatus: 'completed',
      });

      if (!updateResult.success) {
        setStatus('failed');
        setError('Payment confirmed but order update failed. Contact support.');
        return;
      }

      // Generate tickets
      const ticketResult = await generateTickets(orderId);

      if (!ticketResult.success) {
        setStatus('failed');
        setError('Payment confirmed but ticket generation failed. Contact support.');
        return;
      }

      setOrder(updateResult.order);
      setStatus('success');
    } catch (err) {
      console.error('Callback error:', err);
      setStatus('failed');
      setError('An error occurred. If money was deducted, contact support.');
    }
  };

  if (status === 'verifying') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10">
          <Loader2 className="w-12 h-12 text-[#ff385c] animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Verifying Payment...</h2>
          <p className="text-zinc-500">Please wait while we confirm your payment with Paystack.</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl p-10">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-red-700 dark:text-red-400 mb-2">Payment Failed</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate(-1)} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-6 py-2.5 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">Try Again</button>
            <Link to="/events" className="bg-[#ff385c] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#e03150] transition-all">Browse Events</Link>
          </div>
        </div>
      </div>
    );
  }

  // Success
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center" data-name="order-confirmed">
      <div className="bg-green-50 dark:bg-green-900/20 rounded-3xl p-10 border border-green-100 dark:border-green-900/50">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-green-700 dark:text-green-400 mb-2">Tickets Confirmed!</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">Your payment was successful. Tickets have been generated.</p>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 text-left space-y-3 mb-6">
          <div className="flex justify-between"><span className="text-zinc-500">Order ID</span><span className="font-bold text-zinc-900 dark:text-white">#{order?.id}</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">Reference</span><span className="font-bold text-sm text-zinc-900 dark:text-white">{order?.paystack_reference}</span></div>
          <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3"><span className="text-zinc-500">Total Paid</span><span className="font-black text-[#ff385c]">{formatKES(order?.total_amount)}</span></div>
        </div>
        <p className="text-xs text-zinc-400 mb-6 flex items-center justify-center gap-1"><Shield className="w-3 h-3" /> Secured by Paystack. Show your ticket at the gate.</p>
        <Link to="/events" className="bg-[#ff385c] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e03150] transition-all inline-block">Browse More Events</Link>
      </div>
    </div>
  );
}

export default PaymentCallback;
