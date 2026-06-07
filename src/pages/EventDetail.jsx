import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, User, Minus, Plus, Loader2, Shield, Smartphone } from 'lucide-react';
import { fetchEvent, createOrder, paystackInitialize, paystackPollStatus, updateOrderPayment, generateTickets } from '../utils/api';
import { formatKES } from '../utils/constants';

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [step, setStep] = useState('select'); // select | details | payment | processing | confirmed
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [paystackRef, setPaystackRef] = useState('');

  useEffect(() => {
    fetchEvent(id).then(data => {
      setEvent(data);
      if (data?.ticket_types?.length === 1) {
        setSelectedTicket(data.ticket_types[0]);
      }
      setLoading(false);
    });
  }, [id]);

  const getCommission = (price) => {
    const flat = 50;
    const percent = Math.ceil(price * 0.05);
    return Math.max(flat, percent);
  };

  const totalPrice = selectedTicket ? (selectedTicket.price * quantity) + (getCommission(selectedTicket.price) * quantity) : 0;
  const ticketsLeft = selectedTicket ? selectedTicket.quantity_total - selectedTicket.quantity_sold : 0;

  const handleCreateOrder = async () => {
    if (!buyerName || !buyerEmail || !buyerPhone) {
      setError('Please fill in all fields');
      return;
    }
    if (!buyerPhone.match(/^(07|01|\+2547|\+2541)\d{8}$/)) {
      setError('Enter a valid Kenyan phone number (e.g. 0712345678)');
      return;
    }

    setError('');
    setStep('processing');

    const result = await createOrder({
      eventId: event.id,
      ticketTypeId: selectedTicket.id,
      quantity,
      buyerName,
      buyerEmail,
      buyerPhone,
    });

    if (!result.success) {
      setError(result.error);
      setStep('details');
      return;
    }

    setOrder(result.order);

    // Initialize Paystack STK push
    const payResult = await paystackInitialize({
      orderId: result.order.id,
      email: buyerEmail,
      amount: result.order.total_amount,
      phone: buyerPhone,
      callbackUrl: `${window.location.origin}/events/order/${result.order.id}`,
    });

    if (!payResult.success) {
      setError(payResult.error);
      setStep('details');
      return;
    }

    setPaystackRef(payResult.reference);
    setStep('payment');

    // Poll for payment status
    const pollResult = await paystackPollStatus(result.order.id, payResult.reference);

    if (pollResult.success) {
      // Payment confirmed
      await updateOrderPayment(result.order.id, {
        paystackReference: payResult.reference,
        paymentStatus: 'completed',
      });

      // Generate tickets
      const ticketResult = await generateTickets(result.order.id);

      if (ticketResult.success) {
        setOrder({ ...result.order, payment_status: 'completed' });
        setStep('confirmed');
      }
    } else {
      setError(pollResult.error || 'Payment not confirmed');
      setStep('details');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const formatTime = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><p className="text-zinc-500">Loading event...</p></div>;
  if (!event) return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><p className="text-zinc-500">Event not found.</p><Link to="/events" className="text-[#ff385c] font-bold">Back to events</Link></div>;

  // ── Confirmed ──
  if (step === 'confirmed') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center" data-name="order-confirmed">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-3xl p-10 border border-green-100 dark:border-green-900/50">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-black text-green-700 dark:text-green-400 mb-2">Tickets Confirmed!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">Your tickets have been sent to {buyerEmail}</p>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 text-left space-y-3 mb-6">
            <div className="flex justify-between"><span className="text-zinc-500">Event</span><span className="font-bold text-zinc-900 dark:text-white">{event.title}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Date</span><span className="font-bold">{formatDate(event.event_date)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Venue</span><span className="font-bold">{event.venue}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Tickets</span><span className="font-bold">{quantity}x {selectedTicket?.name}</span></div>
            <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3"><span className="text-zinc-500">Total Paid</span><span className="font-black text-[#ff385c]">{formatKES(order?.total_amount)}</span></div>
          </div>
          <p className="text-xs text-zinc-400 mb-6">Show this confirmation or your QR ticket at the gate.</p>
          <Link to="/events" className="bg-[#ff385c] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e03150] transition-all inline-block">Browse More Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-name="event-detail">
      {/* Back */}
      <Link to="/events" className="text-sm text-zinc-500 hover:text-[#ff385c] font-medium mb-6 inline-block">← Back to Events</Link>

      {/* Event Header */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mb-6">
        <div className="aspect-[21/9] bg-zinc-100 dark:bg-zinc-800 relative">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff385c]/20 to-[#ff385c]/5">
              <Calendar className="w-16 h-16 text-[#ff385c]/30" />
            </div>
          )}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-sm font-bold px-3 py-1.5 rounded-full">{event.category}</div>
        </div>

        <div className="p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-black text-zinc-900 dark:text-white mb-4">{event.title}</h1>
          {event.description && <p className="text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">{event.description}</p>}

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
              <Calendar className="w-5 h-5 text-[#ff385c] flex-shrink-0" />
              <div><p className="text-xs text-zinc-400">Date</p><p className="font-bold text-sm text-zinc-900 dark:text-white">{formatDate(event.event_date)}</p></div>
            </div>
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
              <Clock className="w-5 h-5 text-[#ff385c] flex-shrink-0" />
              <div><p className="text-xs text-zinc-400">Time</p><p className="font-bold text-sm text-zinc-900 dark:text-white">{formatTime(event.event_date)}</p></div>
            </div>
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4">
              <MapPin className="w-5 h-5 text-[#ff385c] flex-shrink-0" />
              <div><p className="text-xs text-zinc-400">Venue</p><p className="font-bold text-sm text-zinc-900 dark:text-white">{event.venue}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Selection */}
      {step === 'select' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-6">Select Tickets</h2>

          <div className="space-y-3 mb-6">
            {event.ticket_types?.map(tt => {
              const left = tt.quantity_total - tt.quantity_sold;
              const isSelected = selectedTicket?.id === tt.id;
              return (
                <button key={tt.id} onClick={() => left > 0 && setSelectedTicket(tt)}
                  disabled={left <= 0}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-[#ff385c] bg-[#ff385c]/5' : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'} ${left <= 0 ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white">{tt.name}</p>
                      {tt.description && <p className="text-sm text-zinc-500 mt-0.5">{tt.description}</p>}
                      <p className="text-xs text-zinc-400 mt-1">{left > 0 ? `${left} tickets left` : 'Sold out'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg text-[#ff385c]">{formatKES(tt.price)}</p>
                      <p className="text-xs text-zinc-400">+ {formatKES(getCommission(tt.price))} fee</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedTicket && (
            <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center hover:border-[#ff385c] transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-black text-xl w-8 text-center text-zinc-900 dark:text-white">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(Math.min(4, ticketsLeft), quantity + 1))} className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center hover:border-[#ff385c] transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <span className="text-sm text-zinc-400 ml-2">Max 4 per order</span>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400">Total</p>
                <p className="font-black text-xl text-[#ff385c]">{formatKES(totalPrice)}</p>
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500 font-medium mb-4">{error}</p>}

          <button onClick={() => selectedTicket && setStep('details')} disabled={!selectedTicket}
            className="w-full bg-[#ff385c] text-white font-bold py-4 rounded-xl hover:bg-[#e03150] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Continue
          </button>
        </div>
      )}

      {/* Buyer Details */}
      {step === 'details' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-6">Your Details</h2>

          {/* Order summary */}
          <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-2"><span className="text-zinc-500">{selectedTicket?.name} × {quantity}</span><span className="font-bold">{formatKES(selectedTicket?.price * quantity)}</span></div>
            <div className="flex justify-between text-sm mb-2"><span className="text-zinc-500">Platform fee ({quantity}×)</span><span>{formatKES(getCommission(selectedTicket?.price) * quantity)}</span></div>
            <div className="flex justify-between font-black text-lg border-t border-zinc-200 dark:border-zinc-700 pt-2 mt-2"><span>Total</span><span className="text-[#ff385c]">{formatKES(totalPrice)}</span></div>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Full Name</label>
              <input value={buyerName} onChange={e => setBuyerName(e.target.value)} type="text" placeholder="e.g. Kiprono Yegon" className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
              <input value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} type="email" placeholder="you@example.com" className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">M-Pesa Phone</label>
              <input value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} type="tel" placeholder="0712345678" className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white text-sm" />
            </div>
          </div>

          {error && <p className="text-sm text-red-500 font-medium mb-4">{error}</p>}

          <div className="flex gap-3">
            <button onClick={() => setStep('select')} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-3.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">Back</button>
            <button onClick={handleCreateOrder} className="flex-[2] bg-[#ff385c] text-white font-bold py-3.5 rounded-xl hover:bg-[#e03150] transition-all flex items-center justify-center gap-2">
              <Smartphone className="w-5 h-5" />
              Pay {formatKES(totalPrice)} via M-Pesa
            </button>
          </div>

          <p className="text-xs text-zinc-400 text-center mt-4 flex items-center justify-center gap-1"><Shield className="w-3 h-3" /> Secured by Paystack. Your payment is safe.</p>
        </div>
      )}

      {/* Payment Processing */}
      {step === 'processing' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <Loader2 className="w-12 h-12 text-[#ff385c] animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Initializing Payment...</h2>
          <p className="text-zinc-500">Please wait while we set up your M-Pesa payment.</p>
        </div>
      )}

      {/* STK Push Sent */}
      {step === 'payment' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-2">Check Your Phone</h2>
          <p className="text-zinc-500 mb-2">An M-Pesa STK push has been sent to <strong className="text-zinc-700 dark:text-zinc-300">{buyerPhone}</strong></p>
          <p className="text-zinc-500 mb-6">Enter your M-Pesa PIN to complete payment of <strong className="text-[#ff385c]">{formatKES(totalPrice)}</strong></p>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Waiting for confirmation...
          </div>
        </div>
      )}
    </div>
  );
}

export default EventDetail;
