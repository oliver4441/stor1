import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, Calendar, MapPin, Tag } from 'lucide-react';
import { createEvent, createTicketType } from '../utils/api';

const EVENT_CATEGORIES = ['Music', 'Sports', 'Conference', 'Festival', 'Workshop', 'Party', 'Concert', 'General'];

function CreateEvent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [eventId, setEventId] = useState(null);

  // Event fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');

  // Ticket types
  const [ticketTypes, setTicketTypes] = useState([
    { name: 'Regular', description: '', price: 500, quantity_total: 100, max_per_order: 4 },
  ]);

  const addTicketType = () => {
    if (ticketTypes.length >= 5) return;
    setTicketTypes([...ticketTypes, { name: '', description: '', price: 0, quantity_total: 100, max_per_order: 4 }]);
  };

  const removeTicketType = (i) => {
    setTicketTypes(ticketTypes.filter((_, idx) => idx !== i));
  };

  const updateTicketType = (i, field, value) => {
    const updated = [...ticketTypes];
    updated[i][field] = value;
    setTicketTypes(updated);
  };

  const getCommissionPreview = (price) => {
    const flat = 50;
    const percent = Math.ceil(price * 0.05);
    const commission = Math.max(flat, percent);
    return { flat, percent, commission };
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const dateStr = eventDate && eventTime ? `${eventDate}T${eventTime}:00` : null;
    if (!dateStr) {
      setError('Please set event date and time');
      setSubmitting(false);
      return;
    }

    const result = await createEvent({
      title, description, category, venue,
      event_date: dateStr,
      image_url: imageUrl || null,
      organizer_name: organizerName,
      organizer_phone: organizerPhone,
    });

    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setEventId(result.event.id);

    // Create ticket types
    for (const tt of ticketTypes) {
      if (!tt.name || tt.price <= 0) continue;
      await createTicketType({
        event_id: result.event.id,
        name: tt.name,
        description: tt.description,
        price: tt.price,
        quantity_total: tt.quantity_total,
        max_per_order: tt.max_per_order,
      });
    }

    setSubmitting(false);
    setStep(3);
  };

  // Step 3: Success
  if (step === 3) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="bg-green-50 dark:bg-green-900/20 p-10 rounded-3xl border border-green-100 dark:border-green-900/50">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlusCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-green-700 dark:text-green-400 mb-2">Event Created!</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">Your event has been submitted for review. You'll be notified once it's approved.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/events')} className="bg-[#ff385c] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#e03150] transition-all">View Events</button>
            <button onClick={() => navigate('/dashboard')} className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-6 py-2.5 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" data-name="create-event">
      <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Create Event</h1>
      <p className="text-zinc-500 dark:text-zinc-400 mb-8">Set up your event and start selling tickets.</p>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-colors ${s <= step ? 'bg-[#ff385c]' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
        ))}
      </div>

      {error && <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 dark:border-red-900/50">{error}</div>}

      {/* Step 1: Event Details */}
      {step === 1 && (
        <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Event Title *</label>
            <input required value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="e.g. Kericho Music Festival 2026" className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white" />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" placeholder="Tell people about your event..." className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white appearance-none">
                {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Venue *</label>
              <input required value={venue} onChange={e => setVenue(e.target.value)} type="text" placeholder="e.g. Kericho Green Stadium" className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Date *</label>
              <input required value={eventDate} onChange={e => setEventDate(e.target.value)} type="date" className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Time *</label>
              <input required value={eventTime} onChange={e => setEventTime(e.target.value)} type="time" className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Image URL (optional)</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} type="url" placeholder="https://..." className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Your Name *</label>
              <input required value={organizerName} onChange={e => setOrganizerName(e.target.value)} type="text" placeholder="e.g. Kiprono" className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Phone *</label>
              <input required value={organizerPhone} onChange={e => setOrganizerPhone(e.target.value)} type="tel" placeholder="0712345678" className="w-full px-4 py-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white" />
            </div>
          </div>

          <button type="submit" className="w-full bg-[#ff385c] text-white font-bold py-4 rounded-xl hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20">
            Continue to Tickets →
          </button>
        </form>
      )}

      {/* Step 2: Ticket Types */}
      {step === 2 && (
        <form onSubmit={handleCreateEvent} className="space-y-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-black text-zinc-900 dark:text-white">Ticket Types</h2>
            <button type="button" onClick={addTicketType} disabled={ticketTypes.length >= 5}
              className="text-sm font-bold text-[#ff385c] hover:underline disabled:opacity-40 flex items-center gap-1">
              <PlusCircle className="w-4 h-4" /> Add Type
            </button>
          </div>

          {ticketTypes.map((tt, i) => (
            <div key={i} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase">Ticket Type {i + 1}</span>
                {ticketTypes.length > 1 && (
                  <button type="button" onClick={() => removeTicketType(i)} className="text-red-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Name *</label>
                  <input required value={tt.name} onChange={e => updateTicketType(i, 'name', e.target.value)} type="text" placeholder="e.g. VIP, Early Bird" className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:outline-none text-sm text-zinc-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Price (KES) *</label>
                  <input required value={tt.price} onChange={e => updateTicketType(i, 'price', parseInt(e.target.value) || 0)} type="number" min="0" className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:outline-none text-sm text-zinc-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Description</label>
                <input value={tt.description} onChange={e => updateTicketType(i, 'description', e.target.value)} type="text" placeholder="What's included..." className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:outline-none text-sm text-zinc-900 dark:text-white" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Total Tickets *</label>
                  <input required value={tt.quantity_total} onChange={e => updateTicketType(i, 'quantity_total', parseInt(e.target.value) || 1)} type="number" min="1" className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:outline-none text-sm text-zinc-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Max Per Order</label>
                  <input value={tt.max_per_order} onChange={e => updateTicketType(i, 'max_per_order', parseInt(e.target.value) || 4)} type="number" min="1" max="4" className="w-full px-3 py-2.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:border-[#ff385c] focus:outline-none text-sm text-zinc-900 dark:text-white" />
                </div>
              </div>

              {/* Commission preview */}
              {tt.price > 0 && (() => {
                const comm = getCommissionPreview(tt.price);
                return (
                  <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 text-xs">
                    <span className="text-zinc-500">Commission: </span>
                    <span className="font-bold text-[#ff385c]">KES {comm.commission}</span>
                    <span className="text-zinc-400"> (KES 50 or 5% = KES {comm.percent}, whichever is higher)</span>
                  </div>
                );
              })()}
            </div>
          ))}

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-400">
            <strong>Note:</strong> Your event will be reviewed before going live. You'll receive an email once approved.
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold py-3.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">Back</button>
            <button type="submit" disabled={submitting} className="flex-[2] bg-[#ff385c] text-white font-bold py-3.5 rounded-xl hover:bg-[#e03150] transition-all disabled:opacity-50 shadow-lg shadow-[#ff385c]/20">
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CreateEvent;
