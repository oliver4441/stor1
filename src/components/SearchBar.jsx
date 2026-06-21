import { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, Mic } from 'lucide-react';

const TRENDING_SEARCHES = [
  'iPhone', 'Sofa', 'Laptop', 'TV', 'Shoes',
  'Dining table', 'Mattress', 'Cooker', 'Jacket', 'Watch',
];

const RECENT_SEARCHES_KEY = 'omix_recent_searches';
const MAX_RECENT = 8;

function getRecentSearches() {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query) {
  if (!query.trim()) return;
  let recent = getRecentSearches();
  recent = recent.filter(s => s !== query);
  recent.unshift(query);
  recent = recent.slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
  } catch {}
}

export default function SearchBar({ onSearch, initialValue = '' }) {
  const [query, setQuery] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState([]);
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const recognitionRef = useRef(null);

  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    if (listening) { stopVoiceSearch(); return; }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-KE';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setQuery(transcript);
        setListening(false);
        setTimeout(() => onSearch(transcript), 100);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognition.start();
      recognitionRef.current = recognition;
      setListening(true);
    } catch { setListening(false); }
  };

  const stopVoiceSearch = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  };

  useEffect(() => {
    setRecent(getRecentSearches());
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    saveRecentSearch(query.trim());
    setRecent(getRecentSearches());
    onSearch(query.trim());
    setFocused(false);
    inputRef.current?.blur();
  };

  const handleRecentClick = (term) => {
    setQuery(term);
    saveRecentSearch(term);
    setRecent(getRecentSearches());
    onSearch(term);
    setFocused(false);
  };

  const handleTrendingClick = (term) => {
    setQuery(term);
    saveRecentSearch(term);
    setRecent(getRecentSearches());
    onSearch(term);
    setFocused(false);
  };

  const clearRecent = (e) => {
    e.stopPropagation();
    localStorage.removeItem(RECENT_SEARCHES_KEY);
    setRecent([]);
  };

  const showDropdown = focused && (recent.length > 0 || TRENDING_SEARCHES.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search for anything..."
          className="w-full pl-12 pr-36 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:border-[var(--seasonal-primary,#ff385c)] focus:outline-none text-zinc-900 dark:text-white text-sm shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onSearch(''); inputRef.current?.focus(); }}
            className="absolute right-[8.5rem] top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          onClick={startVoiceSearch}
          className={`absolute right-[5.5rem] top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
            listening ? 'bg-[var(--seasonal-primary,#ff385c)] text-white animate-pulse' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
          title={listening ? 'Listening...' : 'Search by voice'}
        >
          <Mic className="w-4 h-4" />
        </button>
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--seasonal-primary,#ff385c)] text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-[var(--seasonal-secondary,#e03150)] transition-colors"
        >
          Search
        </button>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden z-50 animate-in slide-in-from-top-2 fade-in duration-150">
          {recent.length > 0 && (
            <div className="p-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 dark:text-zinc-400">
                  <Clock className="w-3.5 h-3.5" />
                  Recent Searches
                </div>
                <button onClick={clearRecent} className="text-[10px] text-zinc-400 hover:text-[var(--seasonal-primary,#ff385c)] font-semibold">
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleRecentClick(term)}
                    className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-[var(--seasonal-primary,#ff385c)] hover:text-white transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--seasonal-primary,#ff385c)]" />
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Trending</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TRENDING_SEARCHES.map((term) => (
                <button
                  key={term}
                  onClick={() => handleTrendingClick(term)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--seasonal-primary,#ff385c)]/5 dark:bg-[var(--seasonal-primary,#ff385c)]/10 text-xs text-[var(--seasonal-primary,#ff385c)] font-semibold hover:bg-[var(--seasonal-primary,#ff385c)] hover:text-white transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
