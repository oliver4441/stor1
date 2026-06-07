import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Tag, Search, ChevronRight } from 'lucide-react';
import { fetchEvents } from '../utils/api';
import { formatKES } from '../utils/constants';

const EVENT_CATEGORIES = ['All', 'Music', 'Sports', 'Conference', 'Festival', 'Workshop', 'Party', 'Concert', 'General'];

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchEvents('published', activeCategory).then(data => {
      setEvents(data);
      setLoading(false);
    });
  }, [activeCategory]);

  const filtered = events.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.title?.toLowerCase().includes(q) || e.venue?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q);
  });

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  const getLowestPrice = (ticketTypes) => {
    if (!ticketTypes || ticketTypes.length === 0) return null;
    return Math.min(...ticketTypes.map(t => t.price));
  };

  const getTicketsLeft = (ticketTypes) => {
    if (!ticketTypes || ticketTypes.length === 0) return 0;
    return ticketTypes.reduce((sum, t) => sum + (t.quantity_total - t.quantity_sold), 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8" data-name="events-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-[#ff385c]" />
            Events
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Discover and book tickets for events in Kericho and beyond.</p>
        </div>
        <Link to="/events/create" className="bg-[#ff385c] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#e03150] transition-all shadow-lg shadow-[#ff385c]/20 flex items-center gap-2 self-start">
          Create Event
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input type="text" placeholder="Search events, venues..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-transparent focus:border-[#ff385c] focus:outline-none text-zinc-900 dark:text-white transition-all" />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {EVENT_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-[14px] text-sm font-medium whitespace-nowrap border transition-all ${activeCategory === cat ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white' : 'bg-white text-zinc-600 border-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800 hover:border-zinc-300'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl h-80" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(event => {
            const lowestPrice = getLowestPrice(event.ticket_types);
            const ticketsLeft = getTicketsLeft(event.ticket_types);
            return (
              <Link key={event.id} to={`/events/${event.id}`}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-[#ff385c]/30 transition-all group">
                {/* Image */}
                <div className="aspect-[16/9] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                  {event.image_url ? (
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#ff385c]/20 to-[#ff385c]/5">
                      <Calendar className="w-12 h-12 text-[#ff385c]/40" />
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {event.category}
                  </div>
                  {ticketsLeft <= 10 && ticketsLeft > 0 && (
                    <div className="absolute top-3 right-3 bg-[#ff385c] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {ticketsLeft} left
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-3 group-hover:text-[#ff385c] transition-colors line-clamp-2">{event.title}</h3>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <Calendar className="w-4 h-4 text-[#ff385c]" />
                      <span>{formatDate(event.event_date)}</span>
                      <Clock className="w-4 h-4 ml-2" />
                      <span>{formatTime(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <MapPin className="w-4 h-4 text-[#ff385c]" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      {lowestPrice !== null ? (
                        <span className="font-black text-[#ff385c]">{formatKES(lowestPrice)}</span>
                      ) : (
                        <span className="text-sm text-zinc-400">No tickets</span>
                      )}
                      {lowestPrice !== null && <span className="text-xs text-zinc-400 ml-1">from</span>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-[#ff385c] transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Calendar className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 text-lg mb-4">No events found.</p>
          <Link to="/events/create" className="text-[#ff385c] font-bold hover:underline">Create the first event!</Link>
        </div>
      )}
    </div>
  );
}

export default Events;
