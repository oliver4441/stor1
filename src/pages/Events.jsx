import { useState } from 'react';
import { CalendarDays, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const C = {
  bg: '#111318',
  border: '#1E2128',
  text: '#F0F2F5',
  textMuted: '#6B7280',
  accent: '#007AFF',
  bgGray: '#1A1D24',
};

const EVENTS = [
  {
    title: 'Flash Sale Weekend',
    date: 'Every Weekend',
    time: 'Sat 12:00 AM - Mon 11:59 PM',
    location: 'Online',
    desc: 'Massive discounts on selected items every weekend. Up to 70% off on electronics, fashion, and more.',
    link: '/flash-deals',
  },
  {
    title: 'Kericho Market Day',
    date: 'Coming Soon',
    time: 'TBA',
    location: 'Kericho Town',
    desc: 'Meet sellers face-to-face and browse products in person at our monthly market event.',
    link: null,
  },
  {
    title: 'New Arrivals Drop',
    date: 'Every Monday',
    time: '10:00 AM',
    location: 'Online',
    desc: 'Fresh products drop every Monday morning. Be the first to discover new listings from top sellers.',
    link: '/search?sort=newest',
  },
];

export default function Events() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8" data-name="events-page">
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${C.accent}15` }}>
          <CalendarDays className="w-8 h-8" style={{ color: C.accent }} />
        </div>
        <h1 className="text-3xl font-black mb-2" style={{ color: C.text }}>Events & Promotions</h1>
        <p className="text-sm" style={{ color: C.textMuted }}>Never miss a deal or special event on Omix Store</p>
      </div>

      <div className="space-y-4">
        {EVENTS.map((event, i) => (
          <div key={i} className="rounded-2xl border overflow-hidden" style={{ borderColor: C.border, backgroundColor: C.bg }}>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black mb-2" style={{ color: C.text }}>{event.title}</h2>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs" style={{ color: C.textMuted }}>
                      <CalendarDays className="w-3.5 h-3.5" />
                      {event.date}
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: C.textMuted }}>
                      <Clock className="w-3.5 h-3.5" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: C.textMuted }}>
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${C.accent}15` }}>
                  <CalendarDays className="w-6 h-6" style={{ color: C.accent }} />
                </div>
              </div>
              <p className="text-sm mt-3" style={{ color: C.textMuted }}>{event.desc}</p>
              {event.link && (
                <Link
                  to={event.link}
                  className="inline-flex items-center gap-1.5 text-xs font-bold mt-3 hover:opacity-80 transition-opacity"
                  style={{ color: C.accent }}
                >
                  View details <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-10 p-6 rounded-2xl border" style={{ borderColor: C.border, backgroundColor: C.bg }}>
        <h2 className="font-bold text-sm mb-1" style={{ color: C.text }}>Want to stay updated?</h2>
        <p className="text-xs mb-4" style={{ color: C.textMuted }}>Follow us on social media for real-time updates on new events and flash sales.</p>
        <div className="flex gap-3 justify-center">
          <span className="text-xs px-4 py-2 rounded-full font-bold" style={{ backgroundColor: `${C.accent}15`, color: C.accent }}>Instagram</span>
          <span className="text-xs px-4 py-2 rounded-full font-bold" style={{ backgroundColor: `${C.accent}15`, color: C.accent }}>WhatsApp</span>
          <span className="text-xs px-4 py-2 rounded-full font-bold" style={{ backgroundColor: `${C.accent}15`, color: C.accent }}>X (Twitter)</span>
        </div>
      </div>
    </div>
  );
}
