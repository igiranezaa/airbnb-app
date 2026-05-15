import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  FaUser, FaMapMarkerAlt, FaImages, FaInfoCircle, FaClock,
  FaList, FaPlus, FaChevronDown, FaChevronUp,
  FaCloudUploadAlt, FaSearch, FaTimes, FaBed, FaBath,
  FaToggleOn, FaToggleOff, FaCalendarAlt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { useAuth } from '../../auth/hooks/useAuth';
import { config } from '../../../config/env';
import { useCreateListing } from '../hooks/useHostListings';
import type { CancellationPolicy } from '../types';
import { getPhotoDataUrls, MIN_LISTING_PHOTOS, uploadListingPhotos } from '../utils/photos';
import './AddListingPage.css';

const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
const PHOTO_TYPES = new Set(PHOTO_ACCEPT.split(','));

const CATEGORIES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'CABIN', label: 'Cabin' },
];

const CITIES = [
  // North America
  'New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'Seattle',
  'Boston', 'Austin', 'Denver', 'Las Vegas', 'New Orleans', 'Nashville',
  'Portland', 'Atlanta', 'Washington D.C.', 'Toronto', 'Vancouver', 'Montreal',
  'Mexico City', 'Cancún', 'Tulum', 'Cabo San Lucas',
  // South America
  'Buenos Aires', 'São Paulo', 'Rio de Janeiro', 'Bogotá', 'Lima', 'Santiago',
  'Cartagena', 'Medellín', 'Montevideo', 'Quito',
  // Europe
  'London', 'Paris', 'Rome', 'Barcelona', 'Madrid', 'Amsterdam', 'Berlin',
  'Vienna', 'Prague', 'Budapest', 'Lisbon', 'Athens', 'Dublin', 'Copenhagen',
  'Stockholm', 'Oslo', 'Helsinki', 'Zurich', 'Geneva', 'Brussels',
  'Milan', 'Florence', 'Venice', 'Naples', 'Amalfi', 'Santorini', 'Ibiza',
  'Chamonix', 'Interlaken', 'Grindelwald', 'Innsbruck', 'Salzburg',
  'Dubrovnik', 'Reykjavik', 'Edinburgh', 'Inverness',
  // Middle East & Africa
  'Dubai', 'Abu Dhabi', 'Doha', 'Istanbul', 'Tel Aviv', 'Beirut',
  'Cairo', 'Marrakech', 'Nairobi', 'Cape Town', 'Johannesburg', 'Zanzibar',
  // Asia
  'Tokyo', 'Kyoto', 'Osaka', 'Seoul', 'Beijing', 'Shanghai', 'Hong Kong',
  'Singapore', 'Bangkok', 'Chiang Mai', 'Phuket', 'Koh Samui',
  'Bali', 'Ubud', 'Jakarta', 'Kuala Lumpur', 'Hanoi', 'Ho Chi Minh City',
  'Mumbai', 'Delhi', 'Jaipur', 'Goa', 'Manali', 'Maldives', 'Colombo',
  // Oceania
  'Sydney', 'Melbourne', 'Brisbane', 'Auckland', 'Queenstown', 'Bora Bora',
];

const AMENITIES = [
  'WiFi', 'Pool', 'Kitchen', 'Parking', 'Air conditioning', 'Heating',
  'Washer', 'Dryer', 'TV', 'Gym', 'Hot tub', 'Fireplace',
  'BBQ grill', 'Pet friendly', 'EV charger', 'Garden', 'Security cameras',
  'Jacuzzi', 'Laundry', 'Video surveillance',
];

const CANCELLATION_POLICIES: { value: CancellationPolicy; label: string; desc: string }[] = [
  { value: 'FLEXIBLE', label: 'Flexible', desc: 'Full refund 1 day before check-in' },
  { value: 'MODERATE', label: 'Moderate', desc: 'Full refund 5 days before, 50% refund 1 day before' },
  { value: 'STRICT', label: 'Strict', desc: 'Full refund 14 days before, 50% refund 7 days before' },
  { value: 'NON_REFUNDABLE', label: 'Non-refundable', desc: 'No refund on cancellation' },
  { value: 'LONG_TERM', label: 'Long-term', desc: 'Full refund 30 days before, no refund after' },
];

const CHECK_IN_METHODS = ['Self check-in (smart lock)', 'Self check-in (lockbox)', 'Host greets you', 'Building staff', 'Other'];

function SectionHeader({ num, icon, title, desc }: {
  num: string; icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <div className="al-section-hd">
      <span className="al-section-num">{num}</span>
      <div className="al-section-icon">{icon}</div>
      <div className="al-section-meta">
        <h2 className="al-section-title">{title}</h2>
        <p className="al-section-desc">{desc}</p>
      </div>
    </div>
  );
}

function Accordion({
  icon, label, open, onToggle, children,
}: {
  icon: React.ReactNode; label: string; open: boolean;
  onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="al-accordion">
      <button type="button" className="al-accordion__trigger" onClick={onToggle}>
        <span className="al-accordion__icon">{icon}</span>
        <span className="al-accordion__label">{label}</span>
        {open ? <FaChevronUp className="al-accordion__chevron" /> : <FaChevronDown className="al-accordion__chevron" />}
      </button>
      {open && <div className="al-accordion__body">{children}</div>}
    </div>
  );
}

function Counter({ label, value, onChange, min = 1, max = 50 }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="al-counter">
      <span className="al-counter__label">{label}</span>
      <div className="al-counter__controls">
        <button type="button" className="al-counter__btn" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <span className="al-counter__val">{value}</span>
        <button type="button" className="al-counter__btn" onClick={() => onChange(Math.min(max, value + 1))}>+</button>
      </div>
    </div>
  );
}

export default function AddListingPage() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { mutate: createListing, isPending } = useCreateListing(userId);
  const queryClient = useQueryClient();

  /* ── Basic info ── */
  const [listingTitle, setListingTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  /* ── Location ── */
  const [country, setCountry] = useState('Rwanda');
  const [address, setAddress] = useState('');
  const [apt, setApt] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  /* ── Room details ── */
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [beds, setBeds] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);

  /* ── Gallery ── */
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  /* ── Details ── */
  const [description, setDescription] = useState('');
  const [houseRules, setHouseRules] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);

  /* ── Check-in / check-out ── */
  const [checkInMethod, setCheckInMethod] = useState('');
  const [checkOutMethod, setCheckOutMethod] = useState('');

  /* ── Pricing ── */
  const [pricePerNight, setPricePerNight] = useState('');
  const [weekendPrice, setWeekendPrice] = useState('');
  const [cleaningFee, setCleaningFee] = useState('');
  const [weeklyDiscount, setWeeklyDiscount] = useState('');
  const [monthlyDiscount, setMonthlyDiscount] = useState('');
  const [extraGuestFee, setExtraGuestFee] = useState('');

  /* ── Availability ── */
  const [minNights, setMinNights] = useState('1');
  const [maxNights, setMaxNights] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>('FLEXIBLE');

  /* ── Behavior ── */
  const [instantBook, setInstantBook] = useState(false);
  const [published, setPublished] = useState(false);

  /* ── FR-018: Blocked dates ── */
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [dateInput, setDateInput] = useState('');

  /* ── FR-019: AI description ── */
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTone, setAiTone] = useState<'professional' | 'casual' | 'luxury'>('professional');

  /* ── Accordion state ── */
  const [pricingOpen, setPricingOpen] = useState(true);
  const [availOpen, setAvailOpen] = useState(true);

  /* ── Tag helpers ── */
  function commitTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput('');
  }
  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTag(); }
    if (e.key === 'Backspace' && tagInput === '' && tags.length) setTags((p) => p.slice(0, -1));
  }

  /* ── Gallery helpers (FR-015: 100 photos, 20 MB/file, batch upload) ── */
  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const MAX_SIZE = 20 * 1024 * 1024; // 20 MB
    const valid: File[] = [];
    const tooLarge: string[] = [];
    const unsupported: string[] = [];
    Array.from(incoming).forEach((f) => {
      if (!PHOTO_TYPES.has(f.type)) unsupported.push(f.name);
      else if (f.size > MAX_SIZE) tooLarge.push(f.name);
      else valid.push(f);
    });
    if (unsupported.length) toast.error('Only JPG, PNG, and WebP photos are supported.');
    if (tooLarge.length) toast.error(`Skipped ${tooLarge.length} file(s) over 20 MB: ${tooLarge.join(', ')}`);
    const toAdd = valid.slice(0, 100 - files.length);
    setFiles((p) => [...p, ...toAdd]);
    setPreviews((p) => [...p, ...toAdd.map((f) => URL.createObjectURL(f))]);
  }

  function removeFile(index: number) {
    setFiles((p) => p.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  }

  async function uploadPhotos(listingId: string) {
    if (!files.length || !config.apiUrl) return;
    await uploadListingPhotos(api, listingId, files);
  }

  /* ── Amenity toggle ── */
  function toggleAmenity(a: string) {
    setAmenities((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]);
  }

  /* ── FR-018: Blocked dates ── */
  function addBlockedDate() {
    if (!dateInput || blockedDates.includes(dateInput)) return;
    setBlockedDates((p) => [...p, dateInput].sort());
    setDateInput('');
  }

  async function saveBlockedDates(listingId: string) {
    if (!blockedDates.length || !config.apiUrl) return;
    await api.post(`/listings/${listingId}/blocked-dates`, { dates: blockedDates });
  }

  /* ── FR-019: AI description ── */
  async function generateDescription() {
    if (!listingTitle.trim() || !category || !city) {
      toast.error('Fill in title, category, and city before generating a description.');
      return;
    }
    if (!config.apiUrl) {
      toast.error('AI generation requires a live API connection.');
      return;
    }
    setIsGenerating(true);
    try {
      // Create a draft listing first to get an ID for the AI endpoint
      const location = [address, apt, city, stateVal, postalCode, country].filter(Boolean).join(', ');
      const draft = await api.post('/listings', {
        title: listingTitle.trim(),
        description: description || 'Draft',
        location,
        pricePerNight: Number(pricePerNight) || 1,
        guests,
        type: category as 'APARTMENT' | 'HOUSE' | 'VILLA' | 'CABIN',
        amenities,
        rooms, beds, bathrooms,
        published: false,
      });
      const listingId = draft.data.id;
      const { data } = await api.post(`/ai/listings/${listingId}/generate-description`, { tone: aiTone });
      setDescription(data.description);
      toast.success('Description generated!');
    } catch {
      toast.error('AI generation failed. Try again later.');
    } finally {
      setIsGenerating(false);
    }
  }

  /* ── Submit ── */
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listingTitle.trim() || !category || !city || !description || !pricePerNight) {
      toast.error('Please fill in all required fields.');
      return;
    }
    const price = Number(pricePerNight);
    if (!price || price < 1) {
      toast.error('Please enter a valid nightly price.');
      return;
    }
    if (files.length < MIN_LISTING_PHOTOS) {
      toast.error(`Please upload at least ${MIN_LISTING_PHOTOS} photos for this listing.`);
      return;
    }
    const location = [city, stateVal, address].filter(Boolean).join(', ');
    getPhotoDataUrls(files)
      .then((photoUrls) => {
        createListing(
          {
            title: listingTitle.trim(),
            description: description.trim(),
            location,
            pricePerNight: price,
            guests,
            type: category as 'APARTMENT' | 'HOUSE' | 'VILLA' | 'CABIN',
            amenities,
            rooms,
            beds,
            bathrooms,
            photos: photoUrls,
            houseRules: houseRules.trim() || undefined,
            checkInMethod: checkInMethod || undefined,
            checkOutMethod: checkOutMethod || undefined,
            instantBook,
            cancellationPolicy,
            weekendPrice: weekendPrice ? Number(weekendPrice) : undefined,
            weeklyDiscount: weeklyDiscount ? Number(weeklyDiscount) : 0,
            monthlyDiscount: monthlyDiscount ? Number(monthlyDiscount) : 0,
            extraGuestFee: extraGuestFee ? Number(extraGuestFee) : 0,
            cleaningFee: cleaningFee ? Number(cleaningFee) : 0,
            minNights: Number(minNights) || 1,
            maxNights: maxNights ? Number(maxNights) : undefined,
            published,
            latitude: latitude ? Number(latitude) : undefined,
            longitude: longitude ? Number(longitude) : undefined,
          },
          {
            onSuccess: async (response) => {
              const listingId = response.data.id;
              setIsUploading(true);
              try {
                const [uploadedUrls] = await Promise.all([
                  uploadPhotos(listingId),
                  saveBlockedDates(listingId),
                ]);
                if (uploadedUrls.length) {
                  await api.patch(`/listings/${listingId}`, { photos: uploadedUrls });
                }
                await queryClient.invalidateQueries({ queryKey: ['host-listings'] });
                await queryClient.invalidateQueries({ queryKey: ['listings'] });
              } catch {
                // The listing already has compressed photo data URLs from create.
              } finally {
                setIsUploading(false);
              }
              toast.success(published ? 'Listing published!' : 'Listing saved as draft!');
              navigate('/dashboard');
            },
            onError: () => {
              toast.error('Failed to create listing. Please try again.');
            },
          }
        );
      })
      .catch(() => {
        toast.error('Failed to prepare listing photos.');
      });
  }

  return (
    <div className="al-page">
      {/* ── Hero ── */}
      <section className="al-hero">
        <div className="al-hero__overlay" />
        <div className="al-hero__content">
          <h1 className="al-hero__title">
            Find Your <em className="al-hero__dream">Dream</em> Place
          </h1>
          <p className="al-hero__subtitle">
            Create an exceptional listing for guests to discover and book your property.
          </p>
          <div className="al-hero__bar">
            <label className="al-hero__bar-section al-hero__bar-section--main">
              <FaSearch className="al-hero__bar-icon" />
              <input className="al-hero__bar-input" type="text" placeholder="What are you looking for?" />
            </label>
            <div className="al-hero__bar-sep" />
            <div className="al-hero__bar-section al-hero__bar-section--loc">
              <FaMapMarkerAlt className="al-hero__bar-icon" />
              <span className="al-hero__bar-placeholder">Location</span>
              <FaChevronDown className="al-hero__bar-chevron" />
            </div>
            <button type="button" className="al-hero__bar-btn">Search places</button>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <div className="al-body">
        <div className="al-intro">
          <p className="al-intro__label">Listing</p>
          <h2 className="al-intro__heading">Add Listing</h2>
        </div>

        <form className="al-form" onSubmit={handleSubmit} noValidate>

          {/* ─ 01 Basic Info ─ */}
          <div className="al-card">
            <SectionHeader num="01/" icon={<FaUser />} title="Basic Information"
              desc="Set the listing title, type, and keyword tags." />
            <div className="al-fields">
              <div className="al-row">
                <div className="al-field">
                  <label className="al-label">Listing Title <span className="al-req">*</span></label>
                  <input className="al-input" type="text" placeholder="Cozy beachfront villa…"
                    value={listingTitle} onChange={(e) => setListingTitle(e.target.value)} />
                </div>
                <div className="al-field">
                  <label className="al-label">Category <span className="al-req">*</span></label>
                  <select className="al-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select type</option>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="al-field al-field--full">
                <label className="al-label">Tags</label>
                <div className="al-tag-wrap">
                  {tags.map((t) => (
                    <span key={t} className="al-tag">
                      {t}
                      <button type="button" className="al-tag__x" onClick={() => setTags((p) => p.filter((x) => x !== t))}>
                        <FaTimes />
                      </button>
                    </span>
                  ))}
                  <input className="al-tag-input" type="text"
                    placeholder={tags.length === 0 ? '+ Add tag' : ''}
                    value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKey} onBlur={commitTag} />
                </div>
              </div>
            </div>
          </div>

          {/* ─ 02 Location ─ */}
          <div className="al-card">
            <SectionHeader num="02/" icon={<FaMapMarkerAlt />} title="Location"
              desc="Where is your property located?" />
            <div className="al-fields">
              <div className="al-addr-stack">
                {/* Country / region */}
                <div className="al-addr-field">
                  <label className="al-addr-label">Country / region</label>
                  <div className="al-addr-select-wrap">
                    <select
                      className="al-addr-select"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      {['Rwanda','Uganda','Kenya','Tanzania','Burundi','DRC','USA','France','Italy','Spain','Japan','Thailand','Australia','Canada','Germany','UK','Netherlands','Switzerland','Norway','New Zealand','India','Brazil','Mexico','UAE','Singapore'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <FaChevronDown className="al-addr-chevron" />
                  </div>
                </div>

                {/* Street address */}
                <div className="al-addr-field">
                  <label className="al-addr-label">Street address <span className="al-req">*</span></label>
                  <input
                    className="al-addr-input"
                    type="text"
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                {/* Apt / floor */}
                <div className="al-addr-field">
                  <label className="al-addr-label">Apt, floor, bldg (if applicable)</label>
                  <input
                    className="al-addr-input"
                    type="text"
                    placeholder="—"
                    value={apt}
                    onChange={(e) => setApt(e.target.value)}
                  />
                </div>

                {/* City */}
                <div className="al-addr-field">
                  <label className="al-addr-label">City / town / village <span className="al-req">*</span></label>
                  <input
                    className="al-addr-input"
                    type="text"
                    list="city-suggestions"
                    placeholder="e.g. Kigali, Paris, Tokyo…"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                  <datalist id="city-suggestions">
                    {CITIES.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>

                {/* State / province */}
                <div className="al-addr-field">
                  <label className="al-addr-label">Province / state / territory (if applicable)</label>
                  <input
                    className="al-addr-input"
                    type="text"
                    placeholder="—"
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                  />
                </div>

                {/* Postal code */}
                <div className="al-addr-field">
                  <label className="al-addr-label">Postal code (if applicable)</label>
                  <input
                    className="al-addr-input"
                    type="text"
                    placeholder="—"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Coordinates */}
              <div className="al-row" style={{ marginTop: '1rem' }}>
                <div className="al-field">
                  <label className="al-label">Latitude</label>
                  <input className="al-input" type="number" step="any" placeholder="e.g. -1.9441"
                    value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                </div>
                <div className="al-field">
                  <label className="al-label">Longitude</label>
                  <input className="al-input" type="number" step="any" placeholder="e.g. 30.0619"
                    value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* ─ 03 Room Details ─ */}
          <div className="al-card">
            <SectionHeader num="03/" icon={<FaBed />} title="Room Details"
              desc="How many rooms, beds, and bathrooms does your property have?" />
            <div className="al-fields">
              <div className="al-counters-grid">
                <Counter label="Max Guests" value={guests} onChange={setGuests} min={1} max={20} />
                <Counter label="Bedrooms" value={rooms} onChange={setRooms} min={1} max={30} />
                <Counter label="Beds" value={beds} onChange={setBeds} min={1} max={50} />
                <Counter label="Bathrooms" value={bathrooms} onChange={setBathrooms} min={1} max={20} />
              </div>
            </div>
          </div>

          {/* ─ 04 Gallery (FR-015) ─ */}
          <div className="al-card">
            <SectionHeader num="04/" icon={<FaImages />} title="Gallery"
              desc={`Add at least ${MIN_LISTING_PHOTOS} photos, up to 100 total (JPG/PNG/WebP). Max 20 MB per image. First photo is the cover.`} />
            <div className="al-fields">
              <div className="al-field al-field--full">
                <div
                  className={`al-dropzone${dragging ? ' al-dropzone--over' : ''}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
                >
                  {previews.length === 0 ? (
                    <FaCloudUploadAlt className="al-dropzone__icon" />
                  ) : (
                    <div className="al-previews">
                      {previews.map((src, i) => (
                        <div key={i} className="al-preview-wrap">
                          <img src={src} className="al-preview-img" alt="" />
                          <button
                            type="button" className="al-preview-remove"
                            onClick={(ev) => { ev.stopPropagation(); removeFile(i); }}
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept={PHOTO_ACCEPT} multiple hidden
                    onChange={(e) => addFiles(e.target.files)} />
                </div>
                <p className="al-hint">Drag & drop or click to upload · Min {MIN_LISTING_PHOTOS} · Max 100 photos · Max 20 MB each · {previews.length}/100</p>
              </div>
            </div>
          </div>

          {/* ─ 05 Description & Amenities (FR-019) ─ */}
          <div className="al-card">
            <SectionHeader num="05/" icon={<FaInfoCircle />} title="Details"
              desc="Describe your property and list the amenities available." />
            <div className="al-fields">
              <div className="al-field al-field--full">
                <div className="al-label-row">
                  <label className="al-label">Description <span className="al-req">*</span></label>
                  <div className="al-ai-controls">
                    <select className="al-select al-select--sm" value={aiTone} onChange={(e) => setAiTone(e.target.value as typeof aiTone)}>
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="luxury">Luxury</option>
                    </select>
                    <button type="button" className="al-ai-btn" onClick={generateDescription} disabled={isGenerating}>
                      {isGenerating ? '✨ Generating…' : '✨ Generate with AI'}
                    </button>
                  </div>
                </div>
                <textarea className="al-textarea" placeholder="Describe your space in detail…"
                  maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="al-field al-field--full">
                <label className="al-label">House Rules <span className="al-opt">(optional)</span></label>
                <textarea className="al-textarea al-textarea--sm" placeholder="No smoking, no parties…"
                  maxLength={2000} value={houseRules} onChange={(e) => setHouseRules(e.target.value)} />
              </div>
              <div className="al-field al-field--full">
                <label className="al-label">Amenities</label>
                <div className="al-amenities">
                  {AMENITIES.map((a) => {
                    const on = amenities.includes(a);
                    return (
                      <label key={a} className="al-amenity">
                        <span
                          className={`al-amenity__box${on ? ' al-amenity__box--on' : ''}`}
                          role="checkbox" aria-checked={on} tabIndex={0}
                          onClick={() => toggleAmenity(a)}
                          onKeyDown={(e) => e.key === 'Enter' && toggleAmenity(a)}
                        />
                        <span className="al-amenity__name">{a}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ─ 06 Check-in / Check-out ─ */}
          <div className="al-card">
            <SectionHeader num="06/" icon={<FaClock />} title="Check-in & Check-out"
              desc="How do guests access and leave the property?" />
            <div className="al-fields">
              <div className="al-row">
                <div className="al-field">
                  <label className="al-label">Check-in Method</label>
                  <select className="al-select" value={checkInMethod} onChange={(e) => setCheckInMethod(e.target.value)}>
                    <option value="">Select method</option>
                    {CHECK_IN_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="al-field">
                  <label className="al-label">Check-out Instructions</label>
                  <input className="al-input" type="text" placeholder="Leave key on table, checkout by 11am"
                    value={checkOutMethod} onChange={(e) => setCheckOutMethod(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* ─ 07 Pricing ─ */}
          <div className="al-card">
            <SectionHeader num="07/" icon={<FaList />} title="Pricing"
              desc="Set your nightly rate, fees, and discounts." />
            <div className="al-fields al-fields--accordion">
              <Accordion icon={<FaList />} label="Pricing details" open={pricingOpen} onToggle={() => setPricingOpen((v) => !v)}>
                <div className="al-pricing-grid">
                  <div className="al-field">
                    <label className="al-label">Nightly Price (USD) <span className="al-req">*</span></label>
                    <input className="al-input" type="number" min="1" placeholder="120"
                      value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} />
                  </div>
                  <div className="al-field">
                    <label className="al-label">Weekend Price <span className="al-opt">(optional)</span></label>
                    <input className="al-input" type="number" min="0" placeholder="150"
                      value={weekendPrice} onChange={(e) => setWeekendPrice(e.target.value)} />
                  </div>
                  <div className="al-field">
                    <label className="al-label">Cleaning Fee</label>
                    <input className="al-input" type="number" min="0" placeholder="50"
                      value={cleaningFee} onChange={(e) => setCleaningFee(e.target.value)} />
                  </div>
                  <div className="al-field">
                    <label className="al-label">Extra Guest Fee / night</label>
                    <input className="al-input" type="number" min="0" placeholder="20"
                      value={extraGuestFee} onChange={(e) => setExtraGuestFee(e.target.value)} />
                  </div>
                  <div className="al-field">
                    <label className="al-label">Weekly Discount (%)</label>
                    <input className="al-input" type="number" min="0" max="100" placeholder="10"
                      value={weeklyDiscount} onChange={(e) => setWeeklyDiscount(e.target.value)} />
                  </div>
                  <div className="al-field">
                    <label className="al-label">Monthly Discount (%)</label>
                    <input className="al-input" type="number" min="0" max="100" placeholder="20"
                      value={monthlyDiscount} onChange={(e) => setMonthlyDiscount(e.target.value)} />
                  </div>
                </div>
              </Accordion>
            </div>
          </div>

          {/* ─ 08 Availability & Cancellation (FR-018) ─ */}
          <div className="al-card">
            <SectionHeader num="08/" icon={<FaCalendarAlt />} title="Availability & Cancellation"
              desc="Block dates, set min/max nights, and choose a cancellation policy." />
            <div className="al-fields al-fields--accordion">
              <Accordion icon={<FaCalendarAlt />} label="Stay length & cancellation" open={availOpen} onToggle={() => setAvailOpen((v) => !v)}>
                <div className="al-row">
                  <div className="al-field">
                    <label className="al-label">Minimum Nights</label>
                    <input className="al-input" type="number" min="1" placeholder="1"
                      value={minNights} onChange={(e) => setMinNights(e.target.value)} />
                  </div>
                  <div className="al-field">
                    <label className="al-label">Maximum Nights <span className="al-opt">(optional)</span></label>
                    <input className="al-input" type="number" min="1" placeholder="365"
                      value={maxNights} onChange={(e) => setMaxNights(e.target.value)} />
                  </div>
                </div>
                <div className="al-field al-field--full">
                  <label className="al-label">Blocked Dates</label>
                  <div className="al-blocked-row">
                    <input
                      className="al-input"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={dateInput}
                      onChange={(e) => setDateInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBlockedDate())}
                    />
                    <button type="button" className="al-add-date-btn" onClick={addBlockedDate}>
                      <FaPlus /> Block date
                    </button>
                  </div>
                  {blockedDates.length > 0 && (
                    <div className="al-blocked-chips">
                      {blockedDates.map((d) => (
                        <span key={d} className="al-blocked-chip">
                          {d}
                          <button type="button" onClick={() => setBlockedDates((p) => p.filter((x) => x !== d))}>
                            <FaTimes />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="al-hint">{blockedDates.length} date{blockedDates.length !== 1 ? 's' : ''} blocked</p>
                </div>
                <div className="al-field al-field--full">
                  <label className="al-label">Cancellation Policy</label>
                  <div className="al-policy-grid">
                    {CANCELLATION_POLICIES.map((p) => (
                      <label key={p.value} className={`al-policy-card${cancellationPolicy === p.value ? ' al-policy-card--active' : ''}`}>
                        <input type="radio" name="cancellation" value={p.value}
                          checked={cancellationPolicy === p.value}
                          onChange={() => setCancellationPolicy(p.value)} />
                        <strong>{p.label}</strong>
                        <span>{p.desc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </Accordion>
            </div>
          </div>

          {/* ─ 09 Booking Settings ─ */}
          <div className="al-card">
            <SectionHeader num="09/" icon={<FaBath />} title="Booking Settings"
              desc="Configure instant booking and listing visibility." />
            <div className="al-fields">
              <div className="al-toggle-row">
                <div>
                  <p className="al-toggle-label">Instant Book</p>
                  <p className="al-toggle-desc">Guests can book without host approval (FR-033)</p>
                </div>
                <button type="button" className="al-toggle-btn" onClick={() => setInstantBook((v) => !v)}>
                  {instantBook ? <FaToggleOn className="al-toggle-icon al-toggle-icon--on" /> : <FaToggleOff className="al-toggle-icon" />}
                </button>
              </div>
              <div className="al-toggle-row">
                <div>
                  <p className="al-toggle-label">Publish Listing</p>
                  <p className="al-toggle-desc">Make this listing visible and bookable by guests (FR-021)</p>
                </div>
                <button type="button" className="al-toggle-btn" onClick={() => setPublished((v) => !v)}>
                  {published ? <FaToggleOn className="al-toggle-icon al-toggle-icon--on" /> : <FaToggleOff className="al-toggle-icon" />}
                </button>
              </div>
              {!published && (
                <p className="al-draft-notice">⚠️ Listing will be saved as a draft and won't be visible to guests. Toggle "Publish Listing" above to make it live, or publish it later from your dashboard.</p>
              )}
            </div>
          </div>

          {/* ─ 10 Calendar Sync (FR-020) ─ */}
          <div className="al-card">
            <SectionHeader num="10/" icon={<FaCalendarAlt />} title="Calendar Sync"
              desc="Sync your availability with external calendars via iCal." />
            <div className="al-fields">
              <div className="al-ical-info">
                <p className="al-ical-note">
                  After creating your listing, you can import availability from Google Calendar,
                  Booking.com, or VRBO by pasting an iCal URL in your listing settings.
                </p>
                <div className="al-row">
                  <div className="al-field">
                    <label className="al-label">Import iCal URL <span className="al-opt">(optional)</span></label>
                    <input className="al-input" type="url" placeholder="https://calendar.google.com/calendar/ical/…"
                      disabled title="Available after listing is created" />
                  </div>
                </div>
                <div className="al-ical-badges">
                  <span className="al-ical-badge">Google Calendar</span>
                  <span className="al-ical-badge">Booking.com</span>
                  <span className="al-ical-badge">VRBO</span>
                  <span className="al-ical-badge">Airbnb</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="al-submit-wrap">
            <button
              className="al-submit-btn al-submit-btn--secondary"
              type="button"
              disabled={isPending || isUploading}
              onClick={() => { setPublished(false); handleSubmit({ preventDefault: () => {} } as React.FormEvent); }}
            >
              Save as Draft
            </button>
            <button className="al-submit-btn" type="submit" disabled={isPending || isUploading}
              onClick={() => setPublished(true)}>
              {isUploading ? 'Uploading photos…' : isPending ? 'Submitting…' : 'Publish Listing →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
