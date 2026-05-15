import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt, FaChevronDown, FaChevronUp, FaCloudUploadAlt, FaEdit,
  FaHome, FaInfoCircle, FaImages, FaList, FaMapMarkerAlt, FaPlus, FaPlusSquare,
  FaRegThumbsUp,
  FaSignOutAlt, FaStar, FaTachometerAlt, FaTrashAlt, FaCommentDots, FaTimes, FaUser, FaUserEdit, FaUtensils, FaClock,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { useAuth } from '../hooks/useAuth';
import { useHostListings, useCreateListing, useUpdateListing, useDeleteListing, type HostListing, type CreateListingPayload } from '../../listings/hooks/useHostListings';
import { useBookings, useUpdateBookingStatus } from '../../bookings/hooks/useBookings';
import MessagesPanel from '../../bookings/components/MessagesPanel';
import type { Booking } from '../../bookings/hooks/useBookings';
import { getFallbackPhoto, MIN_LISTING_PHOTOS, uploadListingPhotos } from '../../listings/utils/photos';
import DashboardTopbar from '../components/DashboardTopbar';
import EditProfileSection from '../components/EditProfileSection';
import Spinner from '../../../shared/components/Spinner';
import numeral from 'numeral';
import './DashboardPage.css';
import '../../listings/pages/AddListingPage.css';

type HostSection = 'overview' | 'listings' | 'bookings' | 'reviews' | 'add-listing' | 'messages' | 'edit-profile';

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Apartment', HOUSE: 'House', VILLA: 'Villa', CABIN: 'Cabin',
};

const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp';
const PHOTO_TYPES = new Set(PHOTO_ACCEPT.split(','));

const visitorReviews = [
  { name: 'Carol Guest', avatar: 'https://i.pravatar.cc/96?img=23', date: '25 Oct 2023', rating: 4.5, text: 'Wonderful place, super clean and modern!', helpful: 12 },
  { name: 'David Guest', avatar: 'https://i.pravatar.cc/96?img=11', date: '20 Nov 2023', rating: 4, text: 'Great location and responsive host.', helpful: 8 },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <span className="db-stars">
      {Array.from({ length: 5 }, (_, i) => (
        <FaStar key={i} className={i < Math.round(rating) ? 'db-stars__filled' : ''} />
      ))}
    </span>
  );
}

function HostOverview({ listings, bookings }: { listings: HostListing[]; bookings: Booking[] }) {
  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const pending = bookings.filter((b) => b.status === 'PENDING').length;
  const revenue = bookings.filter((b) => b.status === 'CONFIRMED').reduce((s, b) => s + b.totalPrice, 0);
  const avgRating = listings.length > 0
    ? listings.reduce((s, l) => s + (l.rating ?? 0), 0) / listings.length
    : 0;

  void avgRating;

  return (
    <section className="db-overview-metrics">
      <article className="db-overview-card">
        <p>My Listings</p>
        <strong style={{ fontSize: '2rem', color: '#ef4f38' }}>{listings.length}</strong>
      </article>
      <article className="db-overview-card">
        <p>Confirmed Bookings</p>
        <strong style={{ fontSize: '2rem', color: '#ef4f38' }}>{confirmed}</strong>
      </article>
      <article className="db-overview-card">
        <p>Pending Requests</p>
        <strong style={{ fontSize: '2rem', color: '#ef4f38' }}>{pending}</strong>
      </article>
      <article className="db-overview-card">
        <p>Total Revenue</p>
        <strong style={{ fontSize: '1.4rem', color: '#ef4f38' }}>{numeral(revenue).format('$0,0')}</strong>
      </article>
    </section>
  );
}

function HostListings({ listings, isLoading }: { listings: HostListing[]; isLoading: boolean }) {
  const queryClient = useQueryClient();
  const { mutate: updateListing, mutateAsync: updateListingAsync, isPending: isUpdating } = useUpdateListing();
  const { mutate: deleteListing, isPending: isDeleting } = useDeleteListing();
  const editFileRef = useRef<HTMLInputElement>(null);

  // ── Edit state ──────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<HostListing | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editType, setEditType] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editGuests, setEditGuests] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAmenities, setEditAmenities] = useState<string[]>([]);
  const [editCleaningFee, setEditCleaningFee] = useState('');
  const [editMinNights, setEditMinNights] = useState('');
  const [editInstant, setEditInstant] = useState(false);
  const [editPhotos, setEditPhotos] = useState<string[]>([]);
  const [editPhotoFiles, setEditPhotoFiles] = useState<File[]>([]);
  const [editPhotoPreviews, setEditPhotoPreviews] = useState<string[]>([]);
  const [isUploadingEditPhotos, setIsUploadingEditPhotos] = useState(false);

  // ── Delete confirm state ─────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<HostListing | null>(null);

  function togglePublish(l: HostListing) {
    updateListing(
      { id: l.id, published: !l.published },
      {
        onSuccess: () => toast.success(l.published ? `"${l.title}" unpublished.` : `"${l.title}" is now live!`),
        onError: () => toast.error('Failed to update listing status.'),
      }
    );
  }

  function openEdit(l: HostListing) {
    setEditTarget(l);
    setEditTitle(l.title);
    setEditType(l.type);
    setEditLocation(l.location);
    setEditPrice(String(l.pricePerNight));
    setEditGuests(l.guests != null ? String(l.guests) : '');
    setEditDesc(l.description ?? '');
    setEditAmenities(l.amenities ?? []);
    setEditCleaningFee(String(l.cleaningFee));
    setEditMinNights(String(l.minNights));
    setEditInstant(l.instantBook);
    setEditPhotos(l.photos ?? []);
    setEditPhotoFiles([]);
    setEditPhotoPreviews([]);
  }

  function closeEdit() {
    setEditTarget(null);
    setEditPhotoFiles([]);
    setEditPhotoPreviews((prev) => {
      prev.forEach((src) => URL.revokeObjectURL(src));
      return [];
    });
  }

  function addEditFiles(incoming: FileList | null) {
    if (!incoming) return;
    const MAX_SIZE = 20 * 1024 * 1024;
    const valid: File[] = [];
    const tooLarge: string[] = [];
    const unsupported: string[] = [];
    Array.from(incoming).forEach((file) => {
      if (!PHOTO_TYPES.has(file.type)) unsupported.push(file.name);
      else if (file.size > MAX_SIZE) tooLarge.push(file.name);
      else valid.push(file);
    });
    if (unsupported.length) toast.error('Only JPG, PNG, and WebP photos are supported.');
    if (tooLarge.length) toast.error(`Skipped ${tooLarge.length} file(s) over 20 MB.`);
    setEditPhotoFiles((prev) => [...prev, ...valid]);
    setEditPhotoPreviews((prev) => [...prev, ...valid.map((file) => URL.createObjectURL(file))]);
  }

  function removeExistingPhoto(index: number) {
    setEditPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewPhoto(index: number) {
    setEditPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setEditPhotoPreviews((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadEditPhotos(listingId: string) {
    return uploadListingPhotos(api, listingId, editPhotoFiles);
  }

  function toggleEditAmenity(a: string) {
    setEditAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (!editTitle.trim() || !editPrice || !editLocation.trim()) {
      toast.error('Title, location and price are required.'); return;
    }
    if (editPhotos.length + editPhotoFiles.length < MIN_LISTING_PHOTOS) {
      toast.error(`Please keep or upload at least ${MIN_LISTING_PHOTOS} listing photos.`); return;
    }

    setIsUploadingEditPhotos(true);
    try {
      const uploadedPhotoUrls = editPhotoFiles.length
        ? await uploadEditPhotos(editTarget.id)
        : [];
      const payload: Partial<CreateListingPayload> & { id: string } = {
        id: editTarget.id,
        title: editTitle.trim(),
        type: editType as CreateListingPayload['type'],
        location: editLocation.trim(),
        pricePerNight: Number(editPrice),
        guests: editGuests ? Number(editGuests) : undefined,
        description: editDesc.trim() || undefined,
        amenities: editAmenities,
        cleaningFee: editCleaningFee !== '' ? Number(editCleaningFee) : undefined,
        minNights: editMinNights !== '' ? Number(editMinNights) : undefined,
        instantBook: editInstant,
      };

      if (!editPhotoFiles.length || uploadedPhotoUrls.length) {
        payload.photos = [...new Set([...editPhotos, ...uploadedPhotoUrls])];
      }

      await updateListingAsync(payload);
      await queryClient.invalidateQueries({ queryKey: ['host-listings'] });
      await queryClient.invalidateQueries({ queryKey: ['listings'] });
      await queryClient.invalidateQueries({ queryKey: ['listing', editTarget.id] });
      toast.success('Listing updated!');
      closeEdit();
    } catch {
      toast.error('Failed to save listing photos. Please try again.');
    } finally {
      setIsUploadingEditPhotos(false);
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteListing(deleteTarget.id, {
      onSuccess: () => { toast.success(`"${deleteTarget.title}" deleted.`); setDeleteTarget(null); },
      onError: () => toast.error('Failed to delete listing.'),
    });
  }

  if (isLoading) return <Spinner />;
  return (
    <section className="db-panel">
      <div className="db-panel__header">
        <h2>My Listings</h2>
        <span style={{ fontSize: '0.8rem', color: '#888', background: '#f5f5f5', padding: '2px 10px', borderRadius: 12 }}>{listings.length} total</span>
      </div>
      {listings.length === 0 ? (
        <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No listings yet. Add your first listing!</p>
      ) : (
        <div className="db-listing-stack">
          {listings.map((l) => (
            <article key={l.id} className="db-listing-row">
              <img
                className="db-listing-row__thumb"
                src={l.photos?.[0] ?? getFallbackPhoto()}
                alt={l.title}
                onError={(e) => { (e.target as HTMLImageElement).src = getFallbackPhoto(); }}
              />
              <div className="db-listing-row__content">
                <div className="db-listing-row__meta-row">
                  <span className="db-listing-row__rating">
                    <FaStar /> {l.rating != null ? l.rating.toFixed(1) : '0.0'}
                  </span>
                  <span className="db-listing-row__bookings">{l._count?.bookings ?? 0} bookings</span>
                  <span className={`db-listing-status ${l.published ? 'db-listing-status--published' : 'db-listing-status--draft'}`}>
                    {l.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h3 className="db-listing-row__title">
                  {l.title}
                  <span className="db-listing-row__type-badge">{TYPE_LABELS[l.type] ?? l.type}</span>
                </h3>
                <address className="db-listing-row__location">{l.location}</address>
                <p className="db-listing-row__price">
                  {numeral(l.pricePerNight).format('$0,0')} <span>/ night</span>
                </p>
              </div>
              <div className="db-listing-row__actions">
                <button
                  className={`db-listing-row__publish-btn ${l.published ? 'db-listing-row__publish-btn--unpublish' : 'db-listing-row__publish-btn--publish'}`}
                  onClick={() => togglePublish(l)}
                  disabled={isUpdating}
                  aria-label={l.published ? `Unpublish ${l.title}` : `Publish ${l.title}`}
                >
                  {l.published ? 'Unpublish' : 'Publish'}
                </button>
                <div className="db-listing-row__actions-icons">
                  <button aria-label={`Edit ${l.title}`} onClick={() => openEdit(l)}><FaEdit /></button>
                  <button aria-label={`Delete ${l.title}`} onClick={() => setDeleteTarget(l)} style={{ color: '#e53e3e' }}><FaTrashAlt /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* ── Edit listing modal ─────────────────────────────────────────────── */}
      {editTarget && (
        <div className="rbk-modal-overlay" onClick={closeEdit}>
          <div className="rbk-modal rbk-modal--wide" onClick={(e) => e.stopPropagation()}>
            <button className="rbk-modal__close" onClick={closeEdit} aria-label="Close"><FaTimes /></button>
            <h3 className="rbk-modal__title">Edit Listing</h3>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1.25rem' }}>ID: {editTarget.id}</p>

            <form onSubmit={saveEdit}>
              {/* Row 1: Title + Type */}
              <div className="edit-listing-row">
                <div className="edit-listing-field">
                  <label className="edit-listing-label">Title <span className="al-req">*</span></label>
                  <input
                    className="al-input"
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="edit-listing-field edit-listing-field--sm">
                  <label className="edit-listing-label">Type</label>
                  <select className="al-select" value={editType} onChange={(e) => setEditType(e.target.value)}>
                    {LISTING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2: Location */}
              <div className="edit-listing-field" style={{ marginBottom: '1rem' }}>
                <label className="edit-listing-label">Location <span className="al-req">*</span></label>
                <input
                  className="al-input"
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  required
                />
              </div>

              {/* Row 3: Price / Guests / Cleaning fee / Min nights */}
              <div className="edit-listing-row">
                <div className="edit-listing-field edit-listing-field--sm">
                  <label className="edit-listing-label">Price / night ($) <span className="al-req">*</span></label>
                  <input
                    className="al-input"
                    type="number"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="edit-listing-field edit-listing-field--sm">
                  <label className="edit-listing-label">Max guests</label>
                  <input
                    className="al-input"
                    type="number"
                    min="1"
                    max="20"
                    value={editGuests}
                    onChange={(e) => setEditGuests(e.target.value)}
                  />
                </div>
                <div className="edit-listing-field edit-listing-field--sm">
                  <label className="edit-listing-label">Cleaning fee ($)</label>
                  <input
                    className="al-input"
                    type="number"
                    min="0"
                    value={editCleaningFee}
                    onChange={(e) => setEditCleaningFee(e.target.value)}
                  />
                </div>
                <div className="edit-listing-field edit-listing-field--sm">
                  <label className="edit-listing-label">Min nights</label>
                  <input
                    className="al-input"
                    type="number"
                    min="1"
                    value={editMinNights}
                    onChange={(e) => setEditMinNights(e.target.value)}
                  />
                </div>
              </div>

              {/* Photos */}
              <div className="edit-listing-photos">
                <div className="edit-listing-photos__head">
                  <label className="edit-listing-label">Listing pictures</label>
                  <button type="button" className="edit-listing-photos__add" onClick={() => editFileRef.current?.click()}>
                    <FaCloudUploadAlt /> Upload photos
                  </button>
                  <input
                    ref={editFileRef}
                    type="file"
                    accept={PHOTO_ACCEPT}
                    multiple
                    hidden
                    onChange={(e) => {
                      addEditFiles(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </div>
                <p className="edit-listing-photos__hint">
                  Keep at least {MIN_LISTING_PHOTOS} photos. Existing photos stay in order; remove photos you do not want, then add new ones.
                </p>
                <div className="edit-listing-photos__grid">
                  {editPhotos.map((src, index) => (
                    <div key={`${src}-${index}`} className="edit-listing-photo">
                      <img src={src} alt={`Listing photo ${index + 1}`} onError={(e) => { e.currentTarget.src = getFallbackPhoto(); }} />
                      {index === 0 && <span className="edit-listing-photo__cover">Cover</span>}
                      <button type="button" onClick={() => removeExistingPhoto(index)} aria-label="Remove photo">
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  {editPhotoPreviews.map((src, index) => (
                    <div key={src} className="edit-listing-photo edit-listing-photo--new">
                      <img src={src} alt={`New listing photo ${index + 1}`} />
                      <span className="edit-listing-photo__cover">New</span>
                      <button type="button" onClick={() => removeNewPhoto(index)} aria-label="Remove new photo">
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                  {editPhotos.length + editPhotoPreviews.length === 0 && (
                    <button type="button" className="edit-listing-photos__empty" onClick={() => editFileRef.current?.click()}>
                      <FaImages />
                      Add listing photos
                    </button>
                  )}
                </div>
              </div>

              {/* Instant book toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0.75rem 0 1rem' }}>
                <input
                  type="checkbox"
                  id="edit-instant"
                  checked={editInstant}
                  onChange={(e) => setEditInstant(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: '#ef4f38', cursor: 'pointer' }}
                />
                <label htmlFor="edit-instant" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Instant book</label>
              </div>

              {/* Description */}
              <div className="edit-listing-field" style={{ marginBottom: '1rem' }}>
                <label className="edit-listing-label">Description</label>
                <textarea
                  className="al-textarea"
                  rows={4}
                  maxLength={4000}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>

              {/* Amenities */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="edit-listing-label">Amenities</label>
                <div className="al-amenities" style={{ marginTop: '0.5rem' }}>
                  {AMENITIES_LIST.map((a) => {
                    const on = editAmenities.includes(a);
                    return (
                      <label key={a} className="al-amenity">
                        <span
                          className={`al-amenity__box${on ? ' al-amenity__box--on' : ''}`}
                          role="checkbox"
                          aria-checked={on}
                          tabIndex={0}
                          onClick={() => toggleEditAmenity(a)}
                          onKeyDown={(e) => e.key === 'Enter' && toggleEditAmenity(a)}
                        />
                        <span className="al-amenity__name">{a}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rbk-modal__actions">
                <button type="button" className="rbk-modal__btn rbk-modal__btn--cancel" onClick={closeEdit}>
                  Cancel
                </button>
                <button type="submit" className="rbk-modal__btn rbk-modal__btn--confirm" disabled={isUpdating || isUploadingEditPhotos}>
                  {isUpdating || isUploadingEditPhotos ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation modal ──────────────────────────────────────── */}
      {deleteTarget && (
        <div className="rbk-modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="rbk-modal" onClick={(e) => e.stopPropagation()}>
            <button className="rbk-modal__close" onClick={() => setDeleteTarget(null)} aria-label="Close"><FaTimes /></button>
            <h3 className="rbk-modal__title">Delete Listing</h3>
            <p className="rbk-modal__sub">
              Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>? This action cannot be undone and will also cancel any pending bookings.
            </p>
            <div className="rbk-modal__actions">
              <button className="rbk-modal__btn rbk-modal__btn--cancel" onClick={() => setDeleteTarget(null)}>
                Keep listing
              </button>
              <button
                className="rbk-modal__btn rbk-modal__btn--confirm"
                style={{ background: '#e53e3e' }}
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ReceivedBookings({ bookings, isLoading, isError }: { bookings: Booking[]; isLoading: boolean; isError?: boolean }) {
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateBookingStatus();
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{ id: string; title: string; mode: 'reject' | 'cancel' } | null>(null);
  const [actionReason, setActionReason] = useState('');

  function approve(id: string) {
    setActionId(id);
    updateStatus({ id, status: 'CONFIRMED' }, {
      onSuccess: () => toast.success('Booking approved!'),
      onError: () => toast.error('Failed to approve booking.'),
      onSettled: () => setActionId(null),
    });
  }

  function openModal(b: Booking, mode: 'reject' | 'cancel') {
    setActionReason('');
    setActionModal({ id: b.id, title: b.listing.title, mode });
  }

  function confirmAction() {
    if (!actionModal || !actionReason.trim()) return;
    setActionId(actionModal.id);
    updateStatus({ id: actionModal.id, status: 'CANCELLED', rejectionReason: actionReason.trim() }, {
      onSuccess: () => toast.success(actionModal.mode === 'cancel' ? 'Booking cancelled.' : 'Booking rejected.'),
      onError: () => toast.error('Failed. Please try again.'),
      onSettled: () => { setActionId(null); setActionModal(null); setActionReason(''); },
    });
  }

  if (isLoading) return <Spinner />;
  if (isError) return <p className="rbk-empty">Failed to load bookings. Please refresh or log out and back in.</p>;

  const pending = bookings.filter((b) => b.status === 'PENDING');
  const others  = bookings.filter((b) => b.status !== 'PENDING');

  function BookingCard({ b }: { b: Booking }) {
    const busy    = isUpdating && actionId === b.id;
    const nights  = Math.max(1, Math.round((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / 86400000));
    const initial = b.guest.name.charAt(0).toUpperCase();
    const bookedOn = new Date(b.createdAt).toLocaleDateString();
    return (
      <article className={`rbk-card rbk-card--${b.status.toLowerCase()}`}>
        <div className="rbk-card__avatar">{initial}</div>
        <div className="rbk-card__body">
          <div className="rbk-card__top">
            <h3 className="rbk-card__title">{b.listing.title}</h3>
            <span className={`rbk-card__status rbk-card__status--${b.status.toLowerCase()}`}>{b.status}</span>
          </div>
          <div className="rbk-card__guest-info">
            <span className="rbk-card__guest-name"><FaUser /> {b.guest.name}</span>
            <a href={`mailto:${b.guest.email}`} className="rbk-card__guest-email">{b.guest.email}</a>
          </div>
          <div className="rbk-card__meta">
            <span><FaCalendarAlt /> {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</span>
            <span className="rbk-card__nights">{nights} night{nights !== 1 ? 's' : ''}</span>
            <span className="rbk-card__price">{numeral(b.totalPrice).format('$0,0')}</span>
          </div>
          <p className="rbk-card__booked-on">Requested on {bookedOn}</p>
          {b.status === 'CANCELLED' && b.rejectionReason && (
            <p className="rbk-card__rejection">
              <strong>{b.status === 'CANCELLED' ? 'Cancellation reason:' : 'Rejection reason:'}</strong> {b.rejectionReason}
            </p>
          )}
        </div>
        {b.status === 'PENDING' && (
          <div className="rbk-card__actions">
            <button className="rbk-btn rbk-btn--approve" onClick={() => approve(b.id)} disabled={busy}>
              {busy && actionId === b.id ? '…' : 'Approve'}
            </button>
            <button className="rbk-btn rbk-btn--reject" onClick={() => openModal(b, 'reject')} disabled={busy}>
              Reject
            </button>
          </div>
        )}
        {b.status === 'CONFIRMED' && (
          <div className="rbk-card__actions">
            <button className="rbk-btn rbk-btn--reject" onClick={() => openModal(b, 'cancel')} disabled={busy}>
              Cancel Booking
            </button>
          </div>
        )}
      </article>
    );
  }

  return (
    <>
      <section className="db-panel">
        <div className="db-panel__header">
          <h2>Received Bookings</h2>
          <span className="db-panel__count">{bookings.length} total</span>
        </div>
        {bookings.length === 0 ? (
          <p className="rbk-empty">No bookings yet.</p>
        ) : (
          <div className="rbk-list">
            {pending.length > 0 && (
              <>
                <div className="rbk-section-label rbk-section-label--pending">
                  Awaiting Approval <span>{pending.length}</span>
                </div>
                {pending.map((b) => <BookingCard key={b.id} b={b} />)}
                {others.length > 0 && <div className="rbk-divider" />}
              </>
            )}
            {others.map((b) => <BookingCard key={b.id} b={b} />)}
          </div>
        )}
      </section>

      {actionModal && (
        <div className="rbk-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="rbk-modal" onClick={(e) => e.stopPropagation()}>
            <button className="rbk-modal__close" onClick={() => setActionModal(null)} aria-label="Close">×</button>
            <h3 className="rbk-modal__title">
              {actionModal.mode === 'cancel' ? 'Cancel Booking' : 'Reject Booking'}
            </h3>
            <p className="rbk-modal__sub">
              {actionModal.mode === 'cancel'
                ? <>You are about to cancel the confirmed booking for <strong>{actionModal.title}</strong>. The guest will be notified with your reason.</>
                : <>You are about to reject the booking for <strong>{actionModal.title}</strong>. Please provide a brief explanation for the guest.</>}
            </p>
            <label className="rbk-modal__label">
              {actionModal.mode === 'cancel' ? 'Reason for cancellation' : 'Reason for rejection'}
              {' '}<span className="rbk-modal__req">*</span>
            </label>
            <textarea
              className="rbk-modal__textarea"
              rows={4}
              placeholder={actionModal.mode === 'cancel'
                ? 'e.g. Property damage, emergency maintenance, personal emergency…'
                : 'e.g. The dates are no longer available, property is under maintenance…'}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              autoFocus
            />
            <div className="rbk-modal__actions">
              <button className="rbk-modal__btn rbk-modal__btn--cancel" onClick={() => setActionModal(null)}>
                Go back
              </button>
              <button
                className="rbk-modal__btn rbk-modal__btn--confirm"
                onClick={confirmAction}
                disabled={!actionReason.trim() || isUpdating}
              >
                {isUpdating
                  ? (actionModal.mode === 'cancel' ? 'Cancelling…' : 'Rejecting…')
                  : (actionModal.mode === 'cancel' ? 'Confirm Cancellation' : 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReviewsPanel() {
  return (
    <section className="db-panel db-reviews">
      <div className="db-panel__header"><h2>Visitor Reviews</h2></div>
      <div className="db-review-list">
        {visitorReviews.map((review) => (
          <article className="db-review-item" key={review.name}>
            <img src={review.avatar} alt={review.name} />
            <div className="db-review-item__body">
              <div className="db-review-item__head">
                <div><h3>- {review.name}</h3><time>{review.date}</time></div>
                <div className="db-review-rating"><StarRow rating={review.rating} /><strong>{review.rating}/5</strong></div>
              </div>
              <p>{review.text}</p>
              <button type="button" className="db-helpful-review"><FaRegThumbsUp /> Helpful Review <span>{review.helpful}</span></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const LISTING_TYPES = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'VILLA', label: 'Villa' },
  { value: 'CABIN', label: 'Cabin' },
];
const CITY_SUGGESTIONS = [
  'New York', 'Los Angeles', 'Chicago', 'Miami', 'San Francisco', 'Seattle', 'Boston', 'Austin', 'Dallas', 'San Diego',
  'London', 'Paris', 'Berlin', 'Madrid', 'Rome', 'Amsterdam', 'Barcelona', 'Vienna', 'Prague', 'Lisbon',
  'Tokyo', 'Seoul', 'Beijing', 'Shanghai', 'Bangkok', 'Singapore', 'Hong Kong', 'Mumbai', 'Delhi', 'Dubai',
  'Sydney', 'Melbourne', 'Toronto', 'Vancouver', 'Montreal', 'Mexico City', 'São Paulo', 'Buenos Aires',
  'Cairo', 'Lagos', 'Nairobi', 'Johannesburg', 'Cape Town', 'Casablanca',
  'Kigali', 'Kampala', 'Accra', 'Dakar', 'Addis Ababa', 'Dar es Salaam',
  'Istanbul', 'Athens', 'Zurich', 'Stockholm', 'Oslo', 'Copenhagen', 'Helsinki',
  'Moscow', 'Warsaw', 'Budapest', 'Bucharest', 'Kiev',
];
const AMENITIES_LIST = ['Garden', 'Security cameras', 'Laundry', 'Internet', 'Pool', 'Video surveillance', 'Laundry room', 'Jacuzzi', 'Gym', 'WiFi', 'Kitchen', 'Parking'];

interface ScheduleItem { id: number; date: string; time: string; place: string; address: string }
interface PricingPlan { id: number; title: string; description: string; price: string }

function AlSectionHeader({ num, icon, title, desc }: { num: string; icon: React.ReactNode; title: string; desc: string }) {
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

function AlAccordion({ icon, label, open, onToggle, children }: { icon: React.ReactNode; label: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
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

const WIZARD_STEPS = [
  { label: 'Basics' },
  { label: 'Location' },
  { label: 'Gallery' },
  { label: 'Details' },
  { label: 'Schedule' },
  { label: 'Pricing' },
];

function AddListingForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const { mutate: createListing, isPending } = useCreateListing(userId);
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = WIZARD_STEPS.length;

  function handleNext() {
    if (step === 1 && (!listingTitle.trim() || !category)) {
      toast.error('Please fill in title and category.'); return;
    }
    if (step === 2 && !city.trim()) {
      toast.error('City is required.'); return;
    }
    if (step === 4 && !description.trim()) {
      toast.error('Description is required.'); return;
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  const [listingTitle, setListingTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [country, setCountry] = useState('Rwanda');
  const [address, setAddress] = useState('');
  const [apt, setApt] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [zip, setZip] = useState('');
  const [guests, setGuests] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [amenities, setAmenities] = useState<string[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([{ id: 1, date: '', time: '', place: '', address: '' }]);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([{ id: 1, title: '', description: '', price: '' }]);

  function commitTag() { const t = tagInput.trim(); if (t && !tags.includes(t)) setTags((p) => [...p, t]); setTagInput(''); }
  function handleTagKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTag(); }
    if (e.key === 'Backspace' && tagInput === '' && tags.length) setTags((p) => p.slice(0, -1));
  }
  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((file) => PHOTO_TYPES.has(file.type));
    if (valid.length !== incoming.length) toast.error('Only JPG, PNG, and WebP photos are supported.');
    const toAdd = valid.slice(0, 10 - photoFiles.length);
    setPhotoFiles((p) => [...p, ...toAdd]);
    setPreviews((p) => [...p, ...toAdd.map((f) => URL.createObjectURL(f))]);
  }
  function removeFile(i: number) {
    setPhotoFiles((p) => p.filter((_, j) => j !== i));
    setPreviews((p) => p.filter((_, j) => j !== i));
  }
  async function uploadPhotos(listingId: string) {
    await uploadListingPhotos(api, listingId, photoFiles);
  }
  function toggleAmenity(a: string) { setAmenities((p) => p.includes(a) ? p.filter((x) => x !== a) : [...p, a]); }
  function addSchedule() { setScheduleItems((p) => [...p, { id: Date.now(), date: '', time: '', place: '', address: '' }]); }
  function patchSchedule(id: number, field: keyof ScheduleItem, val: string) { setScheduleItems((p) => p.map((s) => s.id === id ? { ...s, [field]: val } : s)); }
  function addPlan() { setPricingPlans((p) => [...p, { id: Date.now(), title: '', description: '', price: '' }]); }
  function patchPlan(id: number, field: keyof PricingPlan, val: string) { setPricingPlans((p) => p.map((x) => x.id === id ? { ...x, [field]: val } : x)); }
  function removePlan(id: number) { if (pricingPlans.length > 1) setPricingPlans((p) => p.filter((x) => x.id !== id)); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listingTitle.trim() || !category || !city || !description.trim() || !guests) {
      toast.error('Please fill in all required fields.'); return;
    }
    const pricePerNight = pricingPlans[0]?.price ? Number(pricingPlans[0].price) : 0;
    if (!pricePerNight || pricePerNight < 1) {
      toast.error('Please add a price in the Pricing plan section.'); return;
    }
    if (photoFiles.length < MIN_LISTING_PHOTOS) {
      toast.error(`Please upload at least ${MIN_LISTING_PHOTOS} photos for this listing.`); return;
    }
    const location = [address, apt, city, stateVal, zip, country].filter(Boolean).join(', ');
    createListing(
      { title: listingTitle.trim(), description: description.trim(), location, pricePerNight, guests: Number(guests), type: category as CreateListingPayload['type'], amenities, published: true },
      {
        onSuccess: async (response) => {
          const listingId = response.data.id;
          if (photoFiles.length && listingId) {
            setIsUploading(true);
            try {
              await uploadPhotos(listingId);
              await queryClient.invalidateQueries({ queryKey: ['host-listings'] });
              await queryClient.invalidateQueries({ queryKey: ['listings'] });
            } catch {
              toast.error('Listing created but photos failed to upload.');
            } finally {
              setIsUploading(false);
            }
          }
          toast.success('Listing created successfully!');
          onSuccess();
        },
        onError: () => { toast.error('Failed to create listing. Please try again.'); },
      }
    );
  }

  return (
    <form className="al-form al-form--wizard" onSubmit={handleSubmit} noValidate>

      {/* ── Stepper ── */}
      <div className="al-wizard-header">
        {WIZARD_STEPS.map((s, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={s.label} className="al-wizard-step-wrap">
              <div className="al-wizard-step-col">
                <div className={`al-wizard-dot${active ? ' al-wizard-dot--active' : done ? ' al-wizard-dot--done' : ''}`}>
                  {done ? '✓' : n}
                </div>
                <span className={`al-wizard-step-label${active ? ' al-wizard-step-label--active' : ''}`}>{s.label}</span>
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div className={`al-wizard-line${done ? ' al-wizard-line--done' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Basic Info ── */}
      {step === 1 && (
      <div className="al-card">
        <AlSectionHeader num="01/" icon={<FaUser />} title="Basic Informations" desc="Fill in the basic details about your listing." />
        <div className="al-fields">
          <div className="al-row">
            <div className="al-field">
              <label className="al-label">Listing Title <span className="al-req">*</span></label>
              <input className="al-input" type="text" value={listingTitle} onChange={(e) => setListingTitle(e.target.value)} />
            </div>
            <div className="al-field">
              <label className="al-label">Category <span className="al-req">*</span></label>
              <select className="al-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Category</option>
                {LISTING_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="al-field al-field--full">
            <label className="al-label">Tags <span className="al-req">*</span></label>
            <div className="al-tag-wrap">
              {tags.map((t) => (
                <span key={t} className="al-tag">{t}
                  <button type="button" className="al-tag__x" onClick={() => setTags((p) => p.filter((x) => x !== t))}><FaTimes /></button>
                </span>
              ))}
              <input className="al-tag-input" type="text" placeholder={tags.length === 0 ? '+ Add tag' : ''} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKey} onBlur={commitTag} />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── Step 2: Location ── */}
      {step === 2 && (
      <div className="al-card">
        <AlSectionHeader num="02/" icon={<FaMapMarkerAlt />} title="Location" desc="Where is your listing located?" />
        <div className="al-fields">
          <div className="al-addr-stack">
            {/* Country / region */}
            <div className="al-addr-field">
              <label className="al-addr-label">Country / region</label>
              <div className="al-addr-select-wrap">
                <select className="al-addr-select" value={country} onChange={(e) => setCountry(e.target.value)}>
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
              <input className="al-addr-input" type="text" placeholder="Enter your address"
                value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            {/* Apt / floor */}
            <div className="al-addr-field">
              <label className="al-addr-label">Apt, floor, bldg (if applicable)</label>
              <input className="al-addr-input" type="text" placeholder="—"
                value={apt} onChange={(e) => setApt(e.target.value)} />
            </div>

            {/* City */}
            <div className="al-addr-field">
              <label className="al-addr-label">City / town / village <span className="al-req">*</span></label>
              <input className="al-addr-input" type="text" list="db-city-suggestions"
                placeholder="e.g. Kigali, London, Tokyo…"
                value={city} onChange={(e) => setCity(e.target.value)} />
              <datalist id="db-city-suggestions">
                {CITY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>

            {/* State / province */}
            <div className="al-addr-field">
              <label className="al-addr-label">Province / state / territory (if applicable)</label>
              <input className="al-addr-input" type="text" placeholder="—"
                value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
            </div>

            {/* Postal code */}
            <div className="al-addr-field">
              <label className="al-addr-label">Postal code (if applicable)</label>
              <input className="al-addr-input" type="text" placeholder="—"
                value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
          </div>

          {/* Max Guests */}
          <div className="al-row" style={{ marginTop: '4px' }}>
            <div className="al-field">
              <label className="al-label">Max Guests <span className="al-req">*</span></label>
              <input className="al-input" type="number" min="1" max="20" placeholder="4"
                value={guests} onChange={(e) => setGuests(e.target.value)} />
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── Step 3: Gallery ── */}
      {step === 3 && (
      <div className="al-card">
        <AlSectionHeader num="03/" icon={<FaImages />} title="Gallery" desc="Upload photos of your listing." />
        <div className="al-fields">
          <div className="al-field al-field--full">
            <label className="al-label">Gallery <span className="al-req">*</span></label>
            <div className={`al-dropzone${dragging ? ' al-dropzone--over' : ''}`} onClick={() => fileRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}>
              {previews.length === 0 ? <FaCloudUploadAlt className="al-dropzone__icon" /> : (
                <div className="al-previews">
                  {previews.map((src, i) => (
                    <div key={i} className="al-preview-wrap">
                      <img src={src} className="al-preview-img" alt="" />
                      <button type="button" className="al-preview-remove" onClick={(e) => { e.stopPropagation(); removeFile(i); }}><FaTimes /></button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => addFiles(e.target.files)} />
            </div>
            <p className="al-hint">Min {MIN_LISTING_PHOTOS} · Max 10 photos (png, jpg, jpeg). {previews.length}/10</p>
          </div>
        </div>
      </div>
      )}

      {/* ── Step 4: Details ── */}
      {step === 4 && (
      <div className="al-card">
        <AlSectionHeader num="04/" icon={<FaInfoCircle />} title="Details" desc="Provide more details about your listing." />
        <div className="al-fields">
          <div className="al-field al-field--full">
            <label className="al-label">Description <span className="al-req">*</span></label>
            <textarea className="al-textarea" placeholder="Please enter up to 4000 characters." maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="al-row al-row--3">
            <div className="al-field">
              <label className="al-label">Phone <span className="al-req">*</span></label>
              <input className="al-input" type="tel" placeholder="(123) 456 - 789" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="al-field">
              <label className="al-label">Company website <span className="al-req">*</span></label>
              <input className="al-input" type="url" placeholder="https://company.com" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="al-field">
              <label className="al-label">Email Address <span className="al-req">*</span></label>
              <input className="al-input" type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <hr className="al-sep" />
          <div className="al-field al-field--full">
            <label className="al-label">Property amenities <span className="al-opt">(optional)</span></label>
            <div className="al-amenities">
              {AMENITIES_LIST.map((a) => {
                const on = amenities.includes(a);
                return (
                  <label key={a} className="al-amenity">
                    <span className={`al-amenity__box${on ? ' al-amenity__box--on' : ''}`} role="checkbox" aria-checked={on} tabIndex={0} onClick={() => toggleAmenity(a)} onKeyDown={(e) => e.key === 'Enter' && toggleAmenity(a)} />
                    <span className="al-amenity__name">{a}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ── Step 5: Schedule & Hours ── */}
      {step === 5 && (
      <div className="al-card">
        <AlSectionHeader num="05/" icon={<FaClock />} title="Opening Hours" desc="Set your availability schedule." />
        <div className="al-fields al-fields--accordion">
          <AlAccordion icon={<FaCalendarAlt />} label="Add schedule plan (optional)" open={scheduleOpen} onToggle={() => setScheduleOpen((v) => !v)}>
            <div className="al-sched-head"><span>Date</span><span>Time</span><span>Place</span><span>Address</span></div>
            {scheduleItems.map((item) => (
              <div key={item.id} className="al-sched-row">
                <input className="al-input" type="date" value={item.date} onChange={(e) => patchSchedule(item.id, 'date', e.target.value)} />
                <input className="al-input" type="time" value={item.time} onChange={(e) => patchSchedule(item.id, 'time', e.target.value)} />
                <input className="al-input" type="text" placeholder="Place" value={item.place} onChange={(e) => patchSchedule(item.id, 'place', e.target.value)} />
                <input className="al-input" type="text" placeholder="8706 Herrick Ave, Valley." value={item.address} onChange={(e) => patchSchedule(item.id, 'address', e.target.value)} />
              </div>
            ))}
            <button type="button" className="al-add-row-btn" onClick={addSchedule}><FaPlus /> Add another schedule item</button>
          </AlAccordion>
          <AlAccordion icon={<FaUtensils />} label="Add restaurant menu (optional)" open={menuOpen} onToggle={() => setMenuOpen((v) => !v)}>
            <p className="al-accordion__empty">Add your restaurant menu items here.</p>
          </AlAccordion>
          <AlAccordion icon={<FaClock />} label="Add opening hours (optional)" open={hoursOpen} onToggle={() => setHoursOpen((v) => !v)}>
            <p className="al-accordion__empty">Set your opening hours here.</p>
          </AlAccordion>
        </div>
      </div>
      )}

      {/* ── Step 6: Pricing ── */}
      {step === 6 && (
      <div className="al-card">
        <AlSectionHeader num="06/" icon={<FaList />} title="Add Pricing plan" desc="Set your pricing for this listing." />
        <div className="al-fields">
          <div className="al-pricing-head"><span>Title</span><span>Description</span><span>Price</span><span>Status</span></div>
          {pricingPlans.map((plan) => (
            <div key={plan.id} className="al-pricing-row">
              <input className="al-input" type="text" value={plan.title} onChange={(e) => patchPlan(plan.id, 'title', e.target.value)} />
              <input className="al-input" type="text" value={plan.description} onChange={(e) => patchPlan(plan.id, 'description', e.target.value)} />
              <input className="al-input" type="text" placeholder="USD" value={plan.price} onChange={(e) => patchPlan(plan.id, 'price', e.target.value)} />
              <button type="button" className="al-delete-btn" onClick={() => removePlan(plan.id)} aria-label="Remove plan"><FaTrashAlt /></button>
            </div>
          ))}
          <button type="button" className="al-add-row-btn" onClick={addPlan}><FaPlus /> Add New</button>
        </div>
      </div>
      )}

      {/* ── Wizard navigation ── */}
      <div className="al-wizard-footer">
        {step > 1 ? (
          <button type="button" className="al-wizard-btn al-wizard-btn--back" onClick={() => setStep((s) => s - 1)}>
            ← Back
          </button>
        ) : <span />}
        {step < TOTAL_STEPS ? (
          <button type="button" className="al-wizard-btn al-wizard-btn--next" onClick={handleNext}>
            Next →
          </button>
        ) : (
          <button type="submit" className="al-wizard-btn al-wizard-btn--submit" disabled={isPending || isUploading}>
            {isUploading ? 'Uploading…' : isPending ? 'Submitting…' : 'Submit for approval →'}
          </button>
        )}
      </div>

    </form>
  );
}

export default function HostDashboard() {
  const { logout, switchRole, userId } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<HostSection>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [messageBooking] = useState<Booking | null>(null);

  const { data: listings = [], isLoading: listingsLoading } = useHostListings(userId);
  const { data: bookings = [], isLoading: bookingsLoading, isError: bookingsError } = useBookings('host');

  function handleLogout() { logout(); navigate('/'); }

  async function handleSwitchToGuest() {
    const ok = await switchRole('GUEST');
    if (!ok) {
      toast.error('Could not switch to guest mode.');
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ['bookings'], exact: false });
    await queryClient.invalidateQueries({ queryKey: ['host-listings'], exact: false });
    navigate('/dashboard');
  }

  const navBtn = (section: HostSection, icon: React.ReactNode, label: string, badge?: number) => (
    <button
      key={section}
      type="button"
      className={`db-side-nav__item db-side-nav__button${activeSection === section ? ' db-side-nav__item--active' : ''}`}
      onClick={() => setActiveSection(section)}
    >
      {icon}{label}{badge != null && badge > 0 && <span className="db-side-nav__badge">{badge}</span>}
    </button>
  );

  return (
    <div className={`dashboard-page${isSidebarCollapsed ? ' dashboard-page--sidebar-collapsed' : ''}`}>
      <aside className={`db-sidebar${isSidebarCollapsed ? ' db-sidebar--collapsed' : ''}`}>
        <Link to="/" className="db-brand"><FaMapMarkerAlt /><span>List<em>On</em></span></Link>
        <nav className="db-side-nav">
          <p className="db-side-nav__label">HOST MENU</p>
          {navBtn('overview', <FaTachometerAlt />, 'Dashboard')}
          {navBtn('listings', <FaPlusSquare />, 'My Listings', listings.length)}
          {navBtn('bookings', <FaCalendarAlt />, 'Bookings', bookings.filter(b => b.status === 'PENDING').length)}
          {navBtn('reviews', <FaStar />, 'Reviews')}
          {navBtn('add-listing', <FaHome />, 'Add Listing')}
          {navBtn('messages', <FaCommentDots />, 'Messages')}
          <button
            type="button"
            className={`db-side-nav__item db-side-nav__button${activeSection === 'edit-profile' ? ' db-side-nav__item--active' : ''}`}
            onClick={() => setActiveSection('edit-profile')}
          >
            <FaUserEdit />Edit Profile
          </button>
          <button className="db-side-nav__item db-side-nav__button" type="button" onClick={handleLogout}><FaSignOutAlt />Logout</button>
        </nav>
      </aside>

      <main className="db-main">
        <DashboardTopbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((v) => !v)}
          onSwitchToGuest={handleSwitchToGuest}
        />
        <div className="db-content">
          {activeSection === 'overview' && <HostOverview listings={listings} bookings={bookings} />}
          {activeSection === 'listings' && <HostListings listings={listings} isLoading={listingsLoading} />}
          {activeSection === 'bookings' && <ReceivedBookings bookings={bookings} isLoading={bookingsLoading} isError={bookingsError} />}
          {activeSection === 'reviews' && <ReviewsPanel />}
          {activeSection === 'add-listing' && (
            <AddListingForm
              userId={userId}
              onSuccess={() => setActiveSection('listings')}
            />
          )}
          {activeSection === 'messages' && <MessagesPanel initialBooking={messageBooking} />}
          {activeSection === 'edit-profile' && <EditProfileSection />}
          <footer className="db-footer"><p>© 2022 ListOn - All Rights Reserved</p></footer>
        </div>
      </main>
    </div>
  );
}
