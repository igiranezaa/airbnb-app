import { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaMinus, FaPlus, FaSearch } from 'react-icons/fa';
import './ClassicSearchBar.css';

// ── Data ──────────────────────────────────────────────────────
export interface Destination {
  name: string;
  subtitle: string;
  icon: string;
}

const DEFAULT_DESTINATIONS: Destination[] = [
  { name: 'Nearby', subtitle: "Find what's around you", icon: '📍' },
];

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_ABBR = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// ── Date helpers ──────────────────────────────────────────────
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function inRange(d: Date, s: Date | null, e: Date | null, h: Date | null = null): boolean {
  if (!s) return false;
  const hi = e ?? (h && !sameDay(h, s) ? h : null);
  if (!hi) return false;
  const lo2 = s <= hi ? s : hi;
  const hi2 = s <= hi ? hi : s;
  return d > lo2 && d < hi2;
}

function isPast(date: Date): boolean {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()) < t;
}

function fmt(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function addMonths(base: Date, n: number): Date {
  return new Date(base.getFullYear(), base.getMonth() + n, 1);
}

function monthData(y: number, m: number) {
  return {
    firstDay:    new Date(y, m, 1).getDay(),
    daysInMonth: new Date(y, m + 1, 0).getDate(),
  };
}

// ── MonthCalendar ─────────────────────────────────────────────
function MonthCalendar({
  year, month, startDate, endDate, hoverDate, onDateClick, onDateHover,
}: {
  year: number; month: number;
  startDate: Date | null; endDate: Date | null; hoverDate: Date | null;
  onDateClick: (d: Date) => void; onDateHover: (d: Date) => void;
}) {
  const { firstDay, daysInMonth } = monthData(year, month);

  return (
    <div className="csb-cal">
      <div className="csb-cal__heading">{MONTH_NAMES[month]} {year}</div>
      <div className="csb-cal__grid">
        {DAY_ABBR.map(d => <span key={d} className="csb-cal__dow">{d}</span>)}
        {Array(firstDay).fill(null).map((_, i) => <span key={`b${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const past = isPast(date);
          const isStart = startDate ? sameDay(date, startDate) : false;
          const isEnd   = endDate   ? sameDay(date, endDate)   : false;
          const ranged  = inRange(date, startDate, endDate, hoverDate);

          return (
            <button
              key={day}
              disabled={past}
              className={[
                'csb-cal__day',
                past    ? 'csb-cal__day--past'  : '',
                isStart ? 'csb-cal__day--start' : '',
                isEnd   ? 'csb-cal__day--end'   : '',
                ranged  ? 'csb-cal__day--range'  : '',
              ].filter(Boolean).join(' ')}
              onClick={() => !past && onDateClick(date)}
              onMouseEnter={() => !past && onDateHover(date)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Counter ───────────────────────────────────────────────────
function Counter({
  label, sub, value, min = 0, onChange,
}: {
  label: string; sub: string; value: number; min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="csb-counter">
      <div className="csb-counter__text">
        <span className="csb-counter__label">{label}</span>
        <span className="csb-counter__sub">{sub}</span>
      </div>
      <div className="csb-counter__ctrl">
        <button className="csb-counter__btn" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>
          <FaMinus />
        </button>
        <span className="csb-counter__val">{value}</span>
        <button className="csb-counter__btn" onClick={() => onChange(value + 1)}>
          <FaPlus />
        </button>
      </div>
    </div>
  );
}

// ── Exports ───────────────────────────────────────────────────
export interface ClassicSearchParams {
  where: string;
  checkin?:  string;
  checkout?: string;
  guests?:   number;
}

export default function ClassicSearchBar({
  onSearch,
  suggestions,
}: {
  onSearch: (p: ClassicSearchParams) => void;
  suggestions?: Destination[];
}) {
  const destinations = suggestions ?? DEFAULT_DESTINATIONS;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<'where' | 'when' | 'who' | null>(null);

  // Where
  const [whereText, setWhereText] = useState('');

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate,   setEndDate]   = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [calBase, setCalBase] = useState<Date>(() => {
    const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Who
  const [adults,   setAdults]   = useState(0);
  const [children, setChildren] = useState(0);
  const [infants,  setInfants]  = useState(0);
  const [pets,     setPets]     = useState(0);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setActive(null);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleDateClick(date: Date) {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date); setEndDate(null); setHoverDate(null);
    } else if (sameDay(date, startDate)) {
      setStartDate(null);
    } else if (date < startDate) {
      setEndDate(startDate); setStartDate(date);
    } else {
      setEndDate(date); setHoverDate(null);
      setTimeout(() => setActive('who'), 180);
    }
  }

  const whenDisplay = (() => {
    if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
    if (startDate) return fmt(startDate);
    return 'Anytime';
  })();

  const totalGuests = adults + children;
  const whoDisplay = (() => {
    const parts: string[] = [];
    if (totalGuests) parts.push(`${totalGuests} guest${totalGuests > 1 ? 's' : ''}`);
    if (infants) parts.push(`${infants} infant${infants > 1 ? 's' : ''}`);
    if (pets)    parts.push(`${pets} pet${pets > 1 ? 's' : ''}`);
    return parts.join(', ') || 'Add guests';
  })();

  function handleSearch() {
    onSearch({
      where:   whereText,
      checkin:  startDate ? startDate.toISOString().slice(0, 10) : undefined,
      checkout: endDate   ? endDate.toISOString().slice(0, 10)   : undefined,
      guests:   totalGuests || undefined,
    });
    setActive(null);
  }

  const isOpen = active !== null;

  return (
    <div className={`csb${isOpen ? ' csb--open' : ''}`} ref={wrapRef}>

      {/* ── WHERE ─────────────────────────────────────── */}
      <div
        className={`csb__field${active === 'where' ? ' csb__field--active' : ''}`}
        onClick={() => setActive('where')}
      >
        <span className="csb__label">Where</span>
        {active === 'where' ? (
          <input
            autoFocus
            className="csb__input"
            placeholder="Search destinations"
            value={whereText}
            onChange={e => setWhereText(e.target.value)}
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="csb__value">{whereText || 'Search destinations'}</span>
        )}

        {active === 'where' && (
          <div className="csb__dropdown csb__dropdown--where" onClick={e => e.stopPropagation()}>
            <p className="csb-dest__heading">Suggested destinations</p>
            {destinations.map(dest => (
              <button
                key={dest.name}
                className="csb-dest__item"
                onClick={() => {
                  setWhereText(dest.name === 'Nearby' ? '' : dest.name.split(',')[0].trim());
                  setActive('when');
                }}
              >
                <span className="csb-dest__icon">{dest.icon}</span>
                <span className="csb-dest__text">
                  <span className="csb-dest__name">{dest.name}</span>
                  <span className="csb-dest__sub">{dest.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="csb__sep" />

      {/* ── WHEN ──────────────────────────────────────── */}
      <div
        className={`csb__field${active === 'when' ? ' csb__field--active' : ''}`}
        onClick={() => setActive(active === 'when' ? null : 'when')}
      >
        <span className="csb__label">When</span>
        <span className="csb__value">{whenDisplay}</span>

        {active === 'when' && (
          <div className="csb__dropdown csb__dropdown--when" onClick={e => e.stopPropagation()}>
            <div className="csb-when__cals">
              <button className="csb-when__nav csb-when__nav--left" onClick={() => setCalBase(d => addMonths(d, -1))} aria-label="Previous month">
                <FaChevronLeft />
              </button>
              <MonthCalendar
                year={calBase.getFullYear()} month={calBase.getMonth()}
                startDate={startDate} endDate={endDate} hoverDate={hoverDate}
                onDateClick={handleDateClick} onDateHover={setHoverDate}
              />
              <button className="csb-when__nav csb-when__nav--right" onClick={() => setCalBase(d => addMonths(d, 1))} aria-label="Next month">
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="csb__sep" />

      {/* ── WHO ───────────────────────────────────────── */}
      <div
        className={`csb__field${active === 'who' ? ' csb__field--active' : ''}`}
        onClick={() => setActive(active === 'who' ? null : 'who')}
      >
        <span className="csb__label">Who</span>
        <span className="csb__value">{whoDisplay}</span>

        {active === 'who' && (
          <div className="csb__dropdown csb__dropdown--who" onClick={e => e.stopPropagation()}>
            <Counter label="Adults"   sub="Ages 13 or above"              value={adults}   onChange={setAdults}   />
            <div className="csb-counter__divider" />
            <Counter label="Children" sub="Ages 2 – 12"                   value={children} onChange={setChildren} />
            <div className="csb-counter__divider" />
            <Counter label="Infants"  sub="Under 2"                       value={infants}  onChange={setInfants}  />
            <div className="csb-counter__divider" />
            <Counter label="Pets"     sub="Bringing a service animal?"    value={pets}     onChange={setPets}     />
          </div>
        )}
      </div>

      {/* ── SEARCH BTN ────────────────────────────────── */}
      <button className="csb__btn" onClick={handleSearch} aria-label="Search">
        <FaSearch />
      </button>
    </div>
  );
}
