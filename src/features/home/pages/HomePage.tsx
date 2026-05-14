import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaHeart, FaMagic, FaStar, FaTimes } from 'react-icons/fa';
import { useListings } from '../../listings/hooks/useListings';
import { useStore } from '../../../store/StoreContext';
import type { Listing } from '../../listings/types';
import numeral from 'numeral';
import ClassicSearchBar, { type ClassicSearchParams, type Destination } from '../components/ClassicSearchBar';
import './HomePage.css';

function extractCity(location: string): string {
  return location.split(',')[0].trim();
}


function filterListings(listings: Listing[], query: string): Listing[] {
  const q = query.toLowerCase();
  return listings.filter((l) => {
    const text = `${l.title} ${l.location} ${l.description ?? ''} ${(l.amenities ?? []).join(' ')} ${l.category ?? ''}`.toLowerCase();

    // Price ceiling
    const priceMatch = q.match(/under\s*\$?(\d+)/);
    if (priceMatch && l.price > Number(priceMatch[1])) return false;
    if (/cheap|budget|affordable/.test(q) && l.price > 80) return false;
    if (/luxury|premium/.test(q) && l.price < 300) return false;

    // Guest count — skip if listing has capacity info and it's too small
    const guestMatch = q.match(/(\d+)\s*(people|guests|persons|person)/);
    if (guestMatch && l.guests !== undefined && l.guests < Number(guestMatch[1])) return false;

    // Keywords that should match title/location/category
    const keywords = [
      'beach', 'mountain', 'cabin', 'city', 'lake', 'forest', 'villa',
      'apartment', 'downtown', 'countryside', 'ocean', 'island',
      'pool', 'wifi', 'kitchen', 'parking', 'cozy', 'modern', 'spacious',
    ];
    const hintedKeywords = keywords.filter((kw) => q.includes(kw));
    if (hintedKeywords.length > 0) {
      return hintedKeywords.some((kw) => text.includes(kw));
    }

    // Fallback: match any word from the query (min 3 chars to skip noise like "a", "in")
    const words = q.split(/\s+/).filter((w) => w.length >= 3);
    return words.length === 0 || words.some((w) => text.includes(w));
  });
}

type SearchMode = 'classic' | 'ai';

interface SearchSectionProps {
  listings: Listing[];
  onAIResults: (query: string, results: Listing[]) => void;
  onClassicSearch: (params: ClassicSearchParams) => void;
}

function SearchSection({ listings, onAIResults, onClassicSearch }: SearchSectionProps) {
  const [mode, setMode] = useState<SearchMode>('classic');
  const [aiQuery, setAiQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const suggestions = useMemo<Destination[]>(() => {
    const cities = [...new Set(listings.map((l) => l.location.split(',')[0].trim()))].slice(0, 7);
    return [
      { name: 'Nearby', subtitle: "Find what's around you", icon: '📍' },
      ...cities.map((city) => ({ name: city, subtitle: city, icon: '🏘️' })),
    ];
  }, [listings]);

  function handleAISearch(q?: string) {
    const query = (q ?? aiQuery).trim();
    if (!query) return;
    setIsThinking(true);
    setTimeout(() => {
      setIsThinking(false);
      const results = filterListings(listings, query);
      onAIResults(query, results);
    }, 800);
  }

  return (
    <div className="hp-search-section">
      <div className="hp-search-tabs">
        <button
          className={`hp-search-tab${mode === 'classic' ? ' hp-search-tab--active' : ''}`}
          onClick={() => setMode('classic')}
        >
          Search
        </button>
        <button
          className={`hp-search-tab${mode === 'ai' ? ' hp-search-tab--active' : ''}`}
          onClick={() => setMode('ai')}
        >
          <FaMagic /> AI Search
        </button>
      </div>

      {mode === 'classic' ? (
        <ClassicSearchBar onSearch={onClassicSearch} suggestions={suggestions} />
      ) : (
        <div className="hp-ai-search">
          <div className="hp-ai-search__glow" />
          <div className="hp-ai-search__inner">
            <div className="hp-ai-search__icon-wrap">
              <FaMagic className="hp-ai-search__icon" />
            </div>
            <div className="hp-ai-search__field-wrap">
              <p className="hp-ai-search__label">Describe your perfect stay</p>
              <input
                className="hp-ai-search__input"
                placeholder="e.g. Cozy beachfront villa for 4 people with a pool under $200…"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
              />
            </div>
            <button
              className={`hp-ai-search__btn${isThinking ? ' hp-ai-search__btn--thinking' : ''}`}
              onClick={() => handleAISearch()}
              disabled={isThinking}
              aria-label="AI Search"
            >
              {isThinking
                ? <span className="hp-ai-dots"><span /><span /><span /></span>
                : <><FaMagic /> Find</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const { state, dispatch } = useStore();
  const isSaved = state.saved.includes(listing.id);

  return (
    <Link to={`/listings/${listing.id}`} className="hp-card">
      <div className="hp-card__img-wrap">
        <img src={listing.img} alt={listing.title} className="hp-card__img" loading="lazy" />
        <span className="hp-card__badge">Guest favorite</span>
        <button
          className={`hp-card__heart${isSaved ? ' hp-card__heart--saved' : ''}`}
          aria-label={isSaved ? 'Unsave' : 'Save'}
          onClick={(e) => {
            e.preventDefault();
            dispatch({ type: 'TOGGLE_FAVORITE', payload: listing.id });
          }}
        >
          <FaHeart />
        </button>
      </div>
      <div className="hp-card__info">
        <div className="hp-card__top-row">
          <span className="hp-card__title">{listing.title}</span>
          <span className="hp-card__rating">
            <FaStar className="hp-card__star" />
            {listing.rating.toFixed(2)}
          </span>
        </div>
        <p className="hp-card__price">
          {numeral(listing.price * 2).format('$0,0')} for 2 nights
        </p>
      </div>
    </Link>
  );
}

function ListingSection({ title, listings }: { title: string; listings: Listing[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scroll(dir: 'left' | 'right') {
    trackRef.current?.scrollBy({ left: dir === 'left' ? -640 : 640, behavior: 'smooth' });
  }

  return (
    <section className="hp-section">
      <div className="hp-section__head">
        <h2 className="hp-section__title">
          {title}
          <span className="hp-section__arrow-icon">→</span>
        </h2>
        <div className="hp-section__nav">
          <button className="hp-section__nav-btn" onClick={() => scroll('left')} aria-label="Scroll left">
            <FaChevronLeft />
          </button>
          <button className="hp-section__nav-btn" onClick={() => scroll('right')} aria-label="Scroll right">
            <FaChevronRight />
          </button>
        </div>
      </div>
      <div className="hp-section__track" ref={trackRef}>
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}

function AIResultsSection({ query, results, onClear }: { query: string; results: Listing[]; onClear: () => void }) {
  return (
    <section className="hp-ai-results">
      <div className="hp-ai-results__head">
        <div className="hp-ai-results__title">
          <FaMagic className="hp-ai-results__icon" />
          <span>AI results for <em>"{query}"</em></span>
          <span className="hp-ai-results__count">{results.length} found</span>
        </div>
        <button className="hp-ai-results__clear" onClick={onClear} aria-label="Clear results">
          <FaTimes /> Clear
        </button>
      </div>
      {results.length === 0 ? (
        <p className="hp-ai-results__empty">No listings matched your description. Try different keywords.</p>
      ) : (
        <div className="hp-ai-results__grid">
          {results.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { data: listings = [] } = useListings();
  const [aiResults, setAiResults] = useState<Listing[] | null>(null);
  const [aiQueryText, setAiQueryText] = useState('');
  const [classicQuery, setClassicQuery] = useState('');

  function handleAIResults(query: string, results: Listing[]) {
    setAiQueryText(query);
    setAiResults(results);
    setTimeout(() => {
      document.getElementById('hp-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  function handleClassicSearch(params: ClassicSearchParams) {
    const q = new URLSearchParams();
    if (params.where) q.set('location', params.where);
    if (params.checkin) q.set('checkIn', params.checkin);
    if (params.checkout) q.set('checkOut', params.checkout);
    if (params.guests) q.set('guests', String(params.guests));
    navigate(`/listings?${q.toString()}`);
  }

  function clearAIResults() {
    setAiResults(null);
    setAiQueryText('');
  }

  const displayedListings = classicQuery
    ? listings.filter((l) =>
        `${l.title} ${l.location}`.toLowerCase().includes(classicQuery)
      )
    : listings;

  const groups = displayedListings.reduce<Record<string, Listing[]>>((acc, l) => {
    const city = extractCity(l.location);
    if (!acc[city]) acc[city] = [];
    acc[city].push(l);
    return acc;
  }, {});

  const sections = Object.entries(groups).filter(([, items]) => items.length >= 2);

  return (
    <div className="hp-page">
      {aiResults === null && (
        <div className="hp-search-wrap">
          <SearchSection
            listings={listings}
            onAIResults={handleAIResults}
            onClassicSearch={handleClassicSearch}
          />
        </div>
      )}
      <div className="hp-content" id="hp-results">
        {aiResults !== null ? (
          <AIResultsSection query={aiQueryText} results={aiResults} onClear={clearAIResults} />
        ) : classicQuery && displayedListings.length === 0 ? (
          <div className="hp-no-results">
            <span className="hp-no-results__icon">🔍</span>
            <h3 className="hp-no-results__title">No listings found for &ldquo;{classicQuery}&rdquo;</h3>
            <p className="hp-no-results__sub">Try a different destination or browse all available stays.</p>
            <button className="hp-no-results__btn" onClick={() => setClassicQuery('')}>Show all listings</button>
          </div>
        ) : (
          <>
            {sections.map(([city, items]) => (
              <ListingSection key={city} title={`Popular homes in ${city}`} listings={items} />
            ))}
            {displayedListings.length > 0 && (
              <ListingSection title={classicQuery ? `Results for "${classicQuery}"` : 'All available stays'} listings={displayedListings} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
