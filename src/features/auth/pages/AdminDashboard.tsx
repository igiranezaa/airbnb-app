import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaMapMarkerAlt, FaSignOutAlt, FaTachometerAlt, FaTrashAlt,
  FaUsers, FaHome, FaCalendarAlt, FaExclamationTriangle,
  FaGavel, FaTag, FaHistory, FaBan, FaPause, FaEdit, FaCheck,
  FaChevronLeft, FaChevronRight,
  FaIdCard, FaUpload, FaCamera, FaFacebook, FaTwitter,
  FaInstagram, FaLinkedin, FaLock, FaBuilding, FaMapPin, FaCalendarCheck,
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import {
  useAllUsers, useDeleteUser, useDeleteListing,
  useUserStats, useListingStats, useAdminDashboardStats,
  useSuspendUser, useBanUser, useUpdateAdminUser,
  useIssueRefund, useCoupons, useIssueCoupon,
  useDisputes, useUpdateDisputeStatus, useAddEvidence,
  useAuditLogs,
  type AdminUser, type Dispute, type Coupon, type AuditLog,
} from '../../admin/hooks/useAdminData';
import { useListings } from '../../listings/hooks/useListings';
import { useBookings } from '../../bookings/hooks/useBookings';
import DashboardTopbar from '../components/DashboardTopbar';
import Spinner from '../../../shared/components/Spinner';
import { saveProfileAvatar } from '../../../shared/hooks/useProfileAvatar';
import numeral from 'numeral';
import './DashboardPage.css';

type AdminSection = 'overview' | 'users' | 'listings' | 'bookings' | 'disputes' | 'payouts' | 'audit' | 'edit-profile';

const profileMediaKey = (email: string, kind: 'avatar' | 'cover') =>
  `liston:profile-media:${email || 'guest'}:${kind}`;
const profileDetailsKey = (email: string) => `liston:profile-details:${email || 'guest'}`;
const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024;

interface StoredProfileDetails {
  name: string;
  phone: string;
  email: string;
  description: string;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
}

const EMPTY_PROFILE_DETAILS: StoredProfileDetails = {
  name: '',
  phone: '',
  email: '',
  description: '',
  facebook: '',
  twitter: '',
  instagram: '',
  linkedin: '',
};

function readStoredImage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readStoredProfileDetails(email: string): StoredProfileDetails {
  try {
    const raw = localStorage.getItem(profileDetailsKey(email));
    return raw ? { ...EMPTY_PROFILE_DETAILS, ...JSON.parse(raw) as Partial<StoredProfileDetails> } : EMPTY_PROFILE_DETAILS;
  } catch {
    return EMPTY_PROFILE_DETAILS;
  }
}

function readImageFile(file: File, onLoad: (src: string) => void) {
  const reader = new FileReader();
  reader.onload = () => onLoad(String(reader.result));
  reader.readAsDataURL(file);
}

function saveStoredImage(key: string, src: string): boolean {
  try {
    localStorage.setItem(key, src);
    if (key.endsWith(':avatar')) {
      const email = key.replace('liston:profile-media:', '').replace(':avatar', '');
      saveProfileAvatar(email, src);
    }
    window.dispatchEvent(new CustomEvent('liston:profile-media-updated'));
    return true;
  } catch {
    return false;
  }
}

function validateImageFile(file: File): boolean {
  if (file.size <= MAX_PROFILE_IMAGE_BYTES) return true;
  return false;
}

const ROLE_COLORS: Record<string, string> = { GUEST: '#e3f2fd', HOST: '#e8f5e9', ADMIN: '#fce4ec' };
const ROLE_TEXT: Record<string, string> = { GUEST: '#1565c0', HOST: '#2e7d32', ADMIN: '#c62828' };

const STATUS_BG: Record<string, string> = {
  OPEN: '#fff3e0', UNDER_REVIEW: '#e3f2fd', RESOLVED: '#e8f5e9', CLOSED: '#f5f5f5',
};
const STATUS_COLOR: Record<string, string> = {
  OPEN: '#e65100', UNDER_REVIEW: '#1565c0', RESOLVED: '#2e7d32', CLOSED: '#888',
};

// ── FR-073: Enhanced Overview ─────────────────────────────────────────────────
function AdminOverview({ onNavigate }: { onNavigate: (s: AdminSection, filter?: string) => void }) {
  const { data: stats } = useAdminDashboardStats();
  const { data: userStats } = useUserStats();
  const { data: listingStats } = useListingStats();
  const { data: bookings = [] } = useBookings();

  const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const pending = bookings.filter((b) => b.status === 'PENDING').length;

  return (
    <div>
      {/* FR-073 real-time metrics */}
      <div className="db-overview-metrics">
        <article className="db-overview-card">
          <p>GMV (All Time)</p>
          <strong style={{ fontSize: '1.6rem', color: '#ef4f38' }}>{numeral(stats?.gmv ?? 0).format('$0,0')}</strong>
        </article>
        <article className="db-overview-card">
          <p>Active Bookings</p>
          <strong style={{ fontSize: '2rem', color: '#2e7d32' }}>{stats?.activeBookings ?? '—'}</strong>
        </article>
        <article
          className="db-overview-card"
          onClick={() => onNavigate('disputes', 'OPEN')}
          style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
          title="View disputes"
          onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(198,40,40,0.18)')}
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
        >
          <p>Fraud Alerts <span style={{ fontSize: '0.7rem', color: '#ef4f38', fontWeight: 700 }}>↗ View</span></p>
          <strong style={{ fontSize: '2rem', color: stats?.fraudAlerts ? '#c62828' : '#2e7d32' }}>
            {stats?.fraudAlerts ?? '—'}
          </strong>
        </article>
        <article className="db-overview-card">
          <p>Recent Cancellations <span style={{ fontSize: '0.7rem', color: '#888' }}>(24h)</span></p>
          <strong style={{ fontSize: '2rem', color: stats?.recentCancellations ? '#f57f17' : '#2e7d32' }}>
            {stats?.recentCancellations ?? '—'}
          </strong>
        </article>
        <article className="db-overview-card">
          <p>Platform Uptime</p>
          <strong style={{ fontSize: '1.6rem', color: '#2e7d32' }}>{stats?.platformUptime ?? '—'}</strong>
        </article>
        <article className="db-overview-card">
          <p>Total Users</p>
          <strong style={{ fontSize: '2rem', color: '#ef4f38' }}>{stats?.totalUsers ?? userStats?.totalUsers ?? '—'}</strong>
        </article>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <section className="db-panel">
          <div className="db-panel__header"><h2>Users by Role</h2></div>
          <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(userStats?.byRole ?? []).map((r) => (
              <div key={r.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ background: ROLE_COLORS[r.role] ?? '#f5f5f5', color: ROLE_TEXT[r.role] ?? '#333', padding: '2px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>{r.role}</span>
                <strong>{r._count.role}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="db-panel">
          <div className="db-panel__header"><h2>Listings by Type</h2></div>
          <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(listingStats?.byType ?? []).map((t) => (
              <div key={t.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ background: '#f5f5f5', padding: '2px 12px', borderRadius: 12, fontSize: '0.8rem' }}>{t.type}</span>
                <strong>{t._count.type}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="db-panel">
          <div className="db-panel__header"><h2>Booking Status</h2></div>
          <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {([['CONFIRMED', confirmed, '#e6f4ea', '#2e7d32'], ['PENDING', pending, '#fff8e1', '#f57f17'], ['CANCELLED', bookings.length - confirmed - pending, '#fce8e6', '#c62828']] as const).map(([label, count, bg, color]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ background: bg, color, padding: '2px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600 }}>{label}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="db-panel">
          <div className="db-panel__header"><h2>Top Locations</h2></div>
          <div style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(listingStats?.byLocation ?? []).map((loc) => (
              <div key={loc.location} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>{loc.location}</span>
                <strong>{loc._count.location} listing{loc._count.location !== 1 ? 's' : ''}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ── FR-069: Users Management ──────────────────────────────────────────────────
function EditUserModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username);
  const [role, setRole] = useState(user.role);
  const { mutate: updateUser, isPending } = useUpdateAdminUser();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    updateUser({ id: user.id, name, email, username, role }, { onSuccess: onClose });
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form onSubmit={submit} style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 400, display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Edit User</h3>
        {[['Name', name, setName], ['Email', email, setEmail], ['Username', username, setUsername]].map(([label, val, setter]) => (
          <label key={label as string} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', color: '#555' }}>
            {label as string}
            <input value={val as string} onChange={(e) => (setter as (v: string) => void)(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: '0.9rem', outline: 'none' }} />
          </label>
        ))}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', color: '#555' }}>
          Role
          <select value={role} onChange={(e) => setRole(e.target.value as AdminUser['role'])}
            style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: '0.9rem', outline: 'none' }}>
            <option value="GUEST">GUEST</option>
            <option value="HOST">HOST</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>Cancel</button>
          <button type="submit" disabled={isPending} style={{ padding: '0.5rem 1rem', background: '#ef4f38', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            {isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

function UsersTable() {
  const { userId: currentUserId } = useAuth();
  const { data: users = [], isLoading } = useAllUsers();
  const { mutate: deleteUser, isPending: deleting } = useDeleteUser();
  const { mutate: suspendUser, isPending: suspending } = useSuspendUser();
  const { mutate: banUser, isPending: banning } = useBanUser();
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  if (isLoading) return <Spinner />;

  const busy = deleting || suspending || banning;

  return (
    <section className="db-panel">
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
      <div className="db-panel__header">
        <h2>All Users</h2>
        <span style={{ fontSize: '0.8rem', color: '#888', background: '#f5f5f5', padding: '2px 10px', borderRadius: 12 }}>{users.length} total</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
              {['Name', 'Email', 'Username', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5', opacity: u.banned ? 0.5 : 1 }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                  {u.name}
                  {u.id === currentUserId && (
                    <span style={{ marginLeft: 6, fontSize: '0.7rem', background: '#e3f2fd', color: '#1565c0', borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>You</span>
                  )}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#555' }}>{u.email}</td>
                <td style={{ padding: '0.85rem 1rem', color: '#555' }}>@{u.username}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ background: ROLE_COLORS[u.role] ?? '#f5f5f5', color: ROLE_TEXT[u.role] ?? '#333', padding: '2px 10px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700 }}>{u.role}</span>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  {u.banned
                    ? <span style={{ color: '#c62828', fontWeight: 600, fontSize: '0.78rem' }}>BANNED</span>
                    : u.suspended
                    ? <span style={{ color: '#f57f17', fontWeight: 600, fontSize: '0.78rem' }}>SUSPENDED</span>
                    : <span style={{ color: '#2e7d32', fontWeight: 600, fontSize: '0.78rem' }}>ACTIVE</span>}
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#888', fontSize: '0.8rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button title="Edit" disabled={busy} onClick={() => setEditingUser(u)}
                      style={{ background: '#e3f2fd', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#1565c0' }}>
                      <FaEdit />
                    </button>
                    {!u.banned && u.id !== currentUserId && (
                      <button title={u.suspended ? 'Unsuspend' : 'Suspend'} disabled={busy}
                        onClick={() => { if (confirm(`${u.suspended ? 'Unsuspend' : 'Suspend'} ${u.name}?`)) suspendUser(u.id); }}
                        style={{ background: '#fff8e1', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#f57f17' }}>
                        <FaPause />
                      </button>
                    )}
                    {!u.banned && u.id !== currentUserId && (
                      <button title="Permanently ban" disabled={busy}
                        onClick={() => { if (confirm(`Permanently ban ${u.name}? This cannot be undone.`)) banUser(u.id); }}
                        style={{ background: '#fce4ec', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#c62828' }}>
                        <FaBan />
                      </button>
                    )}
                    {u.id !== currentUserId ? (
                      <button title="Delete account" disabled={busy}
                        onClick={() => { if (confirm(`Delete ${u.name}'s account permanently?`)) deleteUser(u.id); }}
                        style={{ background: '#fce8e6', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#c62828' }}>
                        <FaTrashAlt />
                      </button>
                    ) : (
                      <span title="You cannot delete your own account" style={{ padding: '4px 8px', color: '#ccc', fontSize: '0.75rem', cursor: 'not-allowed' }}>
                        —
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ListingsTable() {
  const { data: listings = [], isLoading } = useListings();
  const { mutate: deleteListing, isPending } = useDeleteListing();
  if (isLoading) return <Spinner />;
  return (
    <section className="db-panel">
      <div className="db-panel__header">
        <h2>All Listings</h2>
        <span style={{ fontSize: '0.8rem', color: '#888', background: '#f5f5f5', padding: '2px 10px', borderRadius: 12 }}>{listings.length} total</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
              {['Title', 'Location', 'Type', 'Price/night', 'Rating', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{l.title}</td>
                <td style={{ padding: '0.85rem 1rem', color: '#555' }}>{l.location}</td>
                <td style={{ padding: '0.85rem 1rem' }}><span style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 8, fontSize: '0.78rem' }}>{l.category}</span></td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#ef4f38' }}>{numeral(l.price).format('$0')}</td>
                <td style={{ padding: '0.85rem 1rem', color: '#555' }}>★ {l.rating.toFixed(1)}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <button disabled={isPending}
                    onClick={() => { if (confirm(`Delete "${l.title}"?`)) deleteListing(l.id); }}
                    style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#c62828', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <FaTrashAlt /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function BookingsTable() {
  const { data: bookings = [], isLoading } = useBookings();
  const { mutate: issueRefund, isPending: refunding } = useIssueRefund();
  const [refundBookingId, setRefundBookingId] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  if (isLoading) return <Spinner />;

  const target = bookings.find((b) => b.id === refundBookingId);

  return (
    <section className="db-panel">
      {refundBookingId && target && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 400, display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: 0 }}>Issue Refund</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>Booking: <strong>{target.listing.title}</strong> — Total: <strong>{numeral(target.totalPrice).format('$0,0')}</strong></p>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
              Amount ($)
              <input type="number" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} min={1} max={target.totalPrice}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: 6, outline: 'none' }} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
              Reason (optional)
              <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: 6, outline: 'none' }} />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setRefundBookingId(null); setRefundAmount(''); setRefundReason(''); }}
                style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>Cancel</button>
              <button disabled={refunding || !refundAmount}
                onClick={() => issueRefund({ bookingId: refundBookingId, amount: Number(refundAmount), reason: refundReason || undefined }, {
                  onSuccess: () => { setRefundBookingId(null); setRefundAmount(''); setRefundReason(''); },
                })}
                style={{ padding: '0.5rem 1rem', background: '#ef4f38', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {refunding ? 'Processing…' : 'Issue Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="db-panel__header">
        <h2>All Bookings</h2>
        <span style={{ fontSize: '0.8rem', color: '#888', background: '#f5f5f5', padding: '2px 10px', borderRadius: 12 }}>{bookings.length} total</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
              {['Listing', 'Guest', 'Check-in', 'Check-out', 'Total', 'Refund', 'Status', 'Actions'].map((h) => (
                <th key={h} style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{b.listing.title}</td>
                <td style={{ padding: '0.85rem 1rem', color: '#555' }}>{b.guest.name}</td>
                <td style={{ padding: '0.85rem 1rem', color: '#555' }}>{new Date(b.checkIn).toLocaleDateString()}</td>
                <td style={{ padding: '0.85rem 1rem', color: '#555' }}>{new Date(b.checkOut).toLocaleDateString()}</td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#ef4f38' }}>{numeral(b.totalPrice).format('$0,0')}</td>
                <td style={{ padding: '0.85rem 1rem', color: '#2e7d32', fontSize: '0.85rem' }}>
                  {b.refundAmount ? numeral(b.refundAmount).format('$0,0') : '—'}
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ background: b.status === 'CONFIRMED' ? '#e6f4ea' : b.status === 'PENDING' ? '#fff8e1' : '#fce8e6', color: b.status === 'CONFIRMED' ? '#2e7d32' : b.status === 'PENDING' ? '#f57f17' : '#c62828', padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600 }}>{b.status}</span>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  {b.status !== 'CANCELLED' && (
                    <button onClick={() => setRefundBookingId(b.id)}
                      style={{ background: '#e8f5e9', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', color: '#2e7d32', fontSize: '0.8rem' }}>
                      Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── FR-071: Disputes ──────────────────────────────────────────────────────────
function DisputesSection({ initialFilter = '' }: { initialFilter?: string }) {
  const [filter, setFilter] = useState<string>(initialFilter);
  const { data: disputes = [], isLoading } = useDisputes(filter || undefined);
  const { mutate: updateStatus, isPending: updating } = useUpdateDisputeStatus();
  const { mutate: addEvidence, isPending: addingEvidence } = useAddEvidence();
  const [resolving, setResolving] = useState<Dispute | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <Spinner />;

  return (
    <section className="db-panel">
      {resolving && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 480, display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: 0 }}>Resolve Dispute</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>{resolving.reason}</p>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
              Status
              <select defaultValue={resolving.status}
                onChange={(e) => updateStatus({ id: resolving.id, status: e.target.value })}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: 6, outline: 'none' }}>
                <option value="OPEN">OPEN</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
              Binding Resolution (visible to both parties)
              <textarea value={resolutionText} onChange={(e) => setResolutionText(e.target.value)} rows={3}
                style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: 6, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setResolving(null); setResolutionText(''); }}
                style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>Cancel</button>
              <button disabled={updating}
                onClick={() => updateStatus({ id: resolving.id, status: 'RESOLVED', resolution: resolutionText || undefined }, {
                  onSuccess: () => { setResolving(null); setResolutionText(''); },
                })}
                style={{ padding: '0.5rem 1rem', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {updating ? 'Saving…' : 'Issue Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
      {evidenceId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '2rem', width: 420, display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 8px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: 0 }}>Add Evidence URL</h3>
            <input value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="https://..."
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: 6, outline: 'none' }} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setEvidenceId(null); setEvidenceUrl(''); }}
                style={{ padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#fff' }}>Cancel</button>
              <button disabled={addingEvidence || !evidenceUrl}
                onClick={() => addEvidence({ id: evidenceId, evidenceUrl }, {
                  onSuccess: () => { setEvidenceId(null); setEvidenceUrl(''); },
                })}
                style={{ padding: '0.5rem 1rem', background: '#ef4f38', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                {addingEvidence ? 'Adding…' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="db-panel__header">
        <h2>Disputes</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          {['', 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '3px 12px', borderRadius: 12, border: '1px solid #e0e0e0', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, background: filter === s ? '#ef4f38' : '#fff', color: filter === s ? '#fff' : '#555' }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {disputes.length === 0 ? (
        <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <p style={{ color: '#2e7d32', fontWeight: 700, fontSize: '1rem', margin: '0 0 8px' }}>✓ No {filter || 'open'} disputes</p>
          <p style={{ color: '#888', fontSize: '0.85rem', margin: 0 }}>
            {filter
              ? `There are no disputes with status "${filter.replace('_', ' ')}". Try a different filter.`
              : 'No disputes have been filed yet. Fraud Alerts on the overview include recent cancellations (last 24h) which are tracked separately.'}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
                {['Raised By', 'Listing', 'Reason', 'Status', 'Evidence', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {disputes.map((d) => {
                const isExpanded = expandedId === d.id;
                return (
                  <>
                    <tr
                      key={d.id}
                      onClick={() => setExpandedId(isExpanded ? null : d.id)}
                      style={{ borderBottom: isExpanded ? 'none' : '1px solid #f5f5f5', cursor: 'pointer', background: isExpanded ? '#fafbff' : undefined, transition: 'background 0.15s' }}
                    >
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                        <span style={{ marginRight: 6, color: '#aaa', fontSize: '0.75rem' }}>{isExpanded ? '▲' : '▼'}</span>
                        {d.raisedBy.name}
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#555' }}>{d.booking.listing.title}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#555', maxWidth: 200 }}>
                        <span title={d.reason} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.reason}</span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ background: STATUS_BG[d.status] ?? '#f5f5f5', color: STATUS_COLOR[d.status] ?? '#555', padding: '2px 8px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 600 }}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#888', fontSize: '0.8rem' }}>{d.evidence.length} file{d.evidence.length !== 1 ? 's' : ''}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                          <button title="Add evidence" onClick={() => setEvidenceId(d.id)}
                            style={{ background: '#e3f2fd', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#1565c0', fontSize: '0.78rem' }}>
                            + Evidence
                          </button>
                          {d.status !== 'RESOLVED' && d.status !== 'CLOSED' && (
                            <button title="Resolve" onClick={() => { setResolving(d); setResolutionText(d.resolution ?? ''); }}
                              style={{ background: '#e8f5e9', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#2e7d32', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FaGavel /> Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${d.id}-detail`} style={{ borderBottom: '1px solid #f5f5f5', background: '#fafbff' }}>
                        <td colSpan={6} style={{ padding: '0 1.5rem 1.25rem' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                            <div style={{ background: '#fff', borderRadius: 8, padding: '1rem', border: '1px solid #f0f0f0' }}>
                              <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#333' }}>Dispute Details</p>
                              <p style={{ margin: '0 0 4px', color: '#555' }}><strong>Raised by:</strong> {d.raisedBy.name} ({d.raisedBy.email})</p>
                              <p style={{ margin: '0 0 4px', color: '#555' }}><strong>Booking ID:</strong> {d.bookingId.slice(0, 8).toUpperCase()}</p>
                              <p style={{ margin: '0 0 4px', color: '#555' }}><strong>Listing:</strong> {d.booking.listing.title} — {d.booking.listing.location}</p>
                              <p style={{ margin: '0 0 4px', color: '#555' }}><strong>Guest:</strong> {d.booking.guest.name}</p>
                              <p style={{ margin: '0 0 4px', color: '#555' }}><strong>Booking value:</strong> ${d.booking.totalPrice.toLocaleString()}</p>
                              <p style={{ margin: '0 0 4px', color: '#555' }}><strong>Opened:</strong> {new Date(d.createdAt).toLocaleString()}</p>
                              <p style={{ margin: '0 0 4px', color: '#555' }}><strong>Last updated:</strong> {new Date(d.updatedAt).toLocaleString()}</p>
                            </div>
                            <div style={{ background: '#fff', borderRadius: 8, padding: '1rem', border: '1px solid #f0f0f0' }}>
                              <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#333' }}>Reason</p>
                              <p style={{ margin: '0 0 10px', color: '#555', lineHeight: 1.6 }}>{d.reason}</p>
                              {d.resolution && (
                                <>
                                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#2e7d32' }}>Resolution</p>
                                  <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>{d.resolution}</p>
                                </>
                              )}
                              {d.evidence.length > 0 && (
                                <>
                                  <p style={{ margin: '10px 0 4px', fontWeight: 700, color: '#333' }}>Evidence</p>
                                  <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {d.evidence.map((url, i) => (
                                      <li key={i}><a href={url} target="_blank" rel="noreferrer" style={{ color: '#1565c0', fontSize: '0.8rem', wordBreak: 'break-all' }}>{url}</a></li>
                                    ))}
                                  </ul>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ── FR-070: Payouts & Coupons ─────────────────────────────────────────────────
function PayoutsSection() {
  const { data: coupons = [], isLoading } = useCoupons();
  const { mutate: issueCoupon, isPending } = useIssueCoupon();
  const [code, setCode] = useState('');
  const [amount, setAmount] = useState('');
  const [userId, setUserId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code || !amount) return;
    issueCoupon({ code, amount: Number(amount), ...(userId && { userId }), ...(expiresAt && { expiresAt }) }, {
      onSuccess: () => { setCode(''); setAmount(''); setUserId(''); setExpiresAt(''); },
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <section className="db-panel">
        <div className="db-panel__header"><h2>Issue Coupon Credit</h2></div>
        <form onSubmit={submit} style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
            Coupon Code *
            <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="SUMMER25"
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: 6, outline: 'none', textTransform: 'uppercase' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
            Amount ($) *
            <input required type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: 6, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
            User ID (optional — leave blank for global)
            <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="uuid..."
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: 6, outline: 'none' }} />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem' }}>
            Expires At (optional)
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              style={{ padding: '0.5rem 0.75rem', border: '1px solid #e0e0e0', borderRadius: 6, outline: 'none' }} />
          </label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={isPending}
              style={{ padding: '0.6rem 1.5rem', background: '#ef4f38', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FaTag /> {isPending ? 'Issuing…' : 'Issue Coupon'}
            </button>
          </div>
        </form>
      </section>

      <section className="db-panel">
        <div className="db-panel__header">
          <h2>Issued Coupons</h2>
          <span style={{ fontSize: '0.8rem', color: '#888', background: '#f5f5f5', padding: '2px 10px', borderRadius: 12 }}>{coupons.length} total</span>
        </div>
        {isLoading ? <Spinner /> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
                  {['Code', 'Amount', 'Assigned To', 'Issued By', 'Expires', 'Used'].map((h) => (
                    <th key={h} style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map((c: Coupon) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f5f5f5', opacity: c.usedAt ? 0.6 : 1 }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, fontFamily: 'monospace', color: '#ef4f38' }}>{c.code}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{numeral(c.amount).format('$0')}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#555' }}>{c.user?.name ?? <em style={{ color: '#aaa' }}>Global</em>}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#555' }}>{c.issuedBy.name}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#888', fontSize: '0.8rem' }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      {c.usedAt
                        ? <span style={{ color: '#2e7d32', fontWeight: 600, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaCheck /> {new Date(c.usedAt).toLocaleDateString()}</span>
                        : <span style={{ color: '#aaa', fontSize: '0.78rem' }}>Unused</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ── FR-072: Audit Logs ────────────────────────────────────────────────────────
function AuditSection() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAuditLogs(page);

  const ACTION_COLORS: Record<string, string> = {
    DELETE_USER: '#c62828', BAN_USER: '#c62828', SUSPEND_USER: '#f57f17', UNSUSPEND_USER: '#2e7d32',
    UPDATE_USER: '#1565c0', ISSUE_REFUND: '#2e7d32', ISSUE_COUPON: '#7b1fa2',
    UPDATE_DISPUTE: '#1565c0', ADD_EVIDENCE: '#1565c0',
  };

  if (isLoading) return <Spinner />;

  return (
    <section className="db-panel">
      <div className="db-panel__header">
        <h2>Audit Log</h2>
        {data?.meta && <span style={{ fontSize: '0.8rem', color: '#888' }}>{data.meta.total} entries</span>}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0', textAlign: 'left' }}>
              {['Timestamp', 'Admin', 'Action', 'Target', 'Before → After'].map((h) => (
                <th key={h} style={{ padding: '0.75rem 1rem', color: '#888', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.data ?? []).map((log: AuditLog) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '0.85rem 1rem', color: '#888', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>{log.admin.name}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ background: '#f5f5f5', color: ACTION_COLORS[log.action] ?? '#333', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#555', fontSize: '0.78rem' }}>
                  <span style={{ background: '#e3f2fd', padding: '2px 6px', borderRadius: 4 }}>{log.targetType}</span>
                  <span style={{ color: '#aaa', marginLeft: 4 }}>{log.targetId.slice(0, 8)}…</span>
                </td>
                <td style={{ padding: '0.85rem 1rem', maxWidth: 280 }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                    {Boolean(log.before) && (
                      <pre style={{ margin: 0, fontSize: '0.7rem', background: '#fce8e6', padding: '2px 6px', borderRadius: 4, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {JSON.stringify(log.before, null, 0).slice(0, 80)}
                      </pre>
                    )}
                    {Boolean(log.before) && Boolean(log.after) && <span style={{ color: '#aaa' }}>→</span>}
                    {Boolean(log.after) && (
                      <pre style={{ margin: 0, fontSize: '0.7rem', background: '#e8f5e9', padding: '2px 6px', borderRadius: 4, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {JSON.stringify(log.after, null, 0).slice(0, 80)}
                      </pre>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data?.meta && data.meta.totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '1rem' }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
            <FaChevronLeft />
          </button>
          <span style={{ fontSize: '0.85rem', color: '#555' }}>Page {page} of {data.meta.totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))} disabled={page === data.meta.totalPages}
            style={{ background: 'none', border: '1px solid #e0e0e0', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>
            <FaChevronRight />
          </button>
        </div>
      )}
    </section>
  );
}

// ── Edit Profile Panel ────────────────────────────────────────────────────────
function EditProfilePanel({ userName, userEmail }: { userName: string; userEmail: string }) {
  const { updateLocalName } = useAuth();
  const storedProfile = readStoredProfileDetails(userEmail);
  const coverRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [coverSrc, setCoverSrc] = useState(
    () => readStoredImage(profileMediaKey(userEmail, 'cover')) ?? 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80'
  );
  const [avatarSrc, setAvatarSrc] = useState<string | null>(() => readStoredImage(profileMediaKey(userEmail, 'avatar')));
  const [name, setName] = useState(storedProfile.name || userName);
  const [phone, setPhone] = useState(storedProfile.phone);
  const [email, setEmail] = useState(storedProfile.email || userEmail);
  const [description, setDescription] = useState(storedProfile.description);
  const [facebook, setFacebook] = useState(storedProfile.facebook);
  const [twitter, setTwitter] = useState(storedProfile.twitter);
  const [instagram, setInstagram] = useState(storedProfile.instagram);
  const [linkedin, setLinkedin] = useState(storedProfile.linkedin);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [saved, setSaved] = useState(false);

  function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!validateImageFile(f)) {
      alert('That picture is too large. Please choose an image under 2 MB.');
      return;
    }
    readImageFile(f, (src) => {
      setCoverSrc(src);
      saveStoredImage(profileMediaKey(userEmail, 'cover'), src);
    });
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!validateImageFile(f)) {
      alert('That picture is too large. Please choose an image under 2 MB.');
      return;
    }
    readImageFile(f, (src) => {
      setAvatarSrc(src);
      saveStoredImage(profileMediaKey(userEmail, 'avatar'), src);
    });
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPw && newPw !== confirmPw) {
      setPwError('Passwords do not match');
      return;
    }
    setPwError('');
    const profile: StoredProfileDetails = {
      name: name.trim(),
      phone,
      email,
      description,
      facebook,
      twitter,
      instagram,
      linkedin,
    };
    localStorage.setItem(profileDetailsKey(userEmail), JSON.stringify(profile));
    if (profile.name) updateLocalName(profile.name);
    saveStoredImage(profileMediaKey(userEmail, 'cover'), coverSrc);
    if (avatarSrc) saveStoredImage(profileMediaKey(userEmail, 'avatar'), avatarSrc);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const initials = name ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '?';
  const joinedDate = 'Oct 2023';

  return (
    <form onSubmit={handleSave} className="ep-page">
      {/* Cover */}
      <div className="ep-cover" style={{ backgroundImage: `url(${coverSrc})` }}>
        <button type="button" className="ep-cover__upload" onClick={() => coverRef.current?.click()}>
          <FaUpload /> Upload header
        </button>
        <input ref={coverRef} type="file" accept="image/*" hidden onChange={handleCover} />
        {/* Avatar */}
        <div className="ep-avatar-wrap">
          <div className="ep-avatar" onClick={() => avatarRef.current?.click()}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" className="ep-avatar__img" />
              : <span className="ep-avatar__initials">{initials}</span>}
            <div className="ep-avatar__overlay"><FaCamera /></div>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
        </div>
      </div>

      {/* User info */}
      <div className="ep-userinfo">
        <h2 className="ep-userinfo__name">
          {name || userName}
          <span className="ep-userinfo__verified">✓</span>
        </h2>
        <div className="ep-userinfo__meta">
          <span><FaBuilding /> ListOn</span>
          <span className="ep-userinfo__sep">/</span>
          <span className="ep-userinfo__location"><FaMapPin /> Admin, Platform</span>
          <span className="ep-userinfo__sep">/</span>
          <span><FaCalendarCheck /> Joined {joinedDate}</span>
        </div>
      </div>

      {/* Details */}
      <div className="ep-card">
        <div className="ep-card__heading">Details</div>
        <div className="ep-grid ep-grid--3">
          <div className="ep-field">
            <label className="ep-label">Name <span className="ep-req">*</span></label>
            <input className="ep-input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="ep-field">
            <label className="ep-label">Phone <span className="ep-req">*</span></label>
            <input className="ep-input" placeholder="(123) 456 - 789" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="ep-field">
            <label className="ep-label">Email Address <span className="ep-req">*</span></label>
            <input className="ep-input" type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="ep-field ep-field--full">
            <label className="ep-label">Description <span className="ep-req">*</span></label>
            <textarea className="ep-textarea" placeholder="Please enter up to 4000 characters." maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <hr className="ep-divider" />
        <div className="ep-grid ep-grid--2">
          <div className="ep-field">
            <label className="ep-label"><FaFacebook className="ep-social-icon" /> Facebook Page <span className="ep-opt">(optional)</span></label>
            <input className="ep-input" placeholder="https://facebook.com" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
          </div>
          <div className="ep-field">
            <label className="ep-label"><FaTwitter className="ep-social-icon" /> Twitter profile <span className="ep-opt">(optional)</span></label>
            <input className="ep-input" placeholder="https://twitter.com" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
          </div>
          <div className="ep-field">
            <label className="ep-label"><FaInstagram className="ep-social-icon" /> Instagram profile <span className="ep-opt">(optional)</span></label>
            <input className="ep-input" placeholder="https://instagram.com" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </div>
          <div className="ep-field">
            <label className="ep-label"><FaLinkedin className="ep-social-icon" /> Linkedin page <span className="ep-opt">(optional)</span></label>
            <input className="ep-input" placeholder="https://linkedin.com" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="ep-card">
        <div className="ep-card__heading">Change Password</div>
        <div className="ep-grid ep-grid--3">
          <div className="ep-field">
            <label className="ep-label"><FaLock className="ep-social-icon" /> Current Password <span className="ep-req">*</span></label>
            <input className="ep-input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </div>
          <div className="ep-field">
            <label className="ep-label"><FaLock className="ep-social-icon" /> New Password <span className="ep-req">*</span></label>
            <input className="ep-input" type="password" value={newPw} onChange={(e) => { setNewPw(e.target.value); setPwError(''); }} />
          </div>
          <div className="ep-field">
            <label className="ep-label"><FaLock className="ep-social-icon" /> Confirm Password <span className="ep-req">*</span></label>
            <input className={`ep-input${pwError ? ' ep-input--error' : ''}`} type="password" value={confirmPw} onChange={(e) => { setConfirmPw(e.target.value); setPwError(''); }} />
            {pwError && <span className="ep-field-error">{pwError}</span>}
          </div>
        </div>
      </div>

      <div className="ep-actions">
        <button type="submit" className="ep-save-btn">
          {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { logout, userName, userEmail } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [disputeInitialFilter, setDisputeInitialFilter] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  function handleLogout() { logout(); navigate('/'); }

  const navItems: { section: AdminSection; icon: React.ReactNode; label: string }[] = [
    { section: 'overview',  icon: <FaTachometerAlt />,       label: 'Overview' },
    { section: 'users',     icon: <FaUsers />,               label: 'Users' },
    { section: 'listings',  icon: <FaHome />,                label: 'Listings' },
    { section: 'bookings',  icon: <FaCalendarAlt />,         label: 'Bookings' },
    { section: 'disputes',  icon: <FaExclamationTriangle />, label: 'Disputes' },
    { section: 'payouts',   icon: <FaTag />,                 label: 'Payouts' },
    { section: 'audit',     icon: <FaHistory />,             label: 'Audit Log' },
  ];

  return (
    <div className={`dashboard-page${isSidebarCollapsed ? ' dashboard-page--sidebar-collapsed' : ''}`}>
      <aside className={`db-sidebar${isSidebarCollapsed ? ' db-sidebar--collapsed' : ''}`}>
        <Link to="/" className="db-brand"><FaMapMarkerAlt /><span>List<em>On</em></span></Link>
        <nav className="db-side-nav">
          <p className="db-side-nav__label">ADMIN MENU</p>
          {navItems.map(({ section, icon, label }) => (
            <button
              key={section}
              type="button"
              className={`db-side-nav__item db-side-nav__button${activeSection === section ? ' db-side-nav__item--active' : ''}`}
              onClick={() => setActiveSection(section)}
            >
              {icon}{label}
            </button>
          ))}
          <button className="db-side-nav__item db-side-nav__button" type="button" onClick={handleLogout}>
            <FaSignOutAlt />Logout
          </button>

          <p className="db-side-nav__label" style={{ marginTop: '1.5rem' }}>ACCOUNT</p>
          <button
            type="button"
            className={`db-side-nav__item db-side-nav__button${activeSection === 'edit-profile' ? ' db-side-nav__item--active' : ''}`}
            onClick={() => setActiveSection('edit-profile')}
          >
            <FaIdCard />Edit Profile
          </button>
        </nav>
      </aside>

      <main className="db-main">
        <DashboardTopbar
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((v) => !v)}
          onSwitchToGuest={() => navigate('/')}
        />
        <div className="db-content">
          {activeSection === 'overview'  && <AdminOverview onNavigate={(s, f) => { setDisputeInitialFilter(f ?? ''); setActiveSection(s); }} />}
          {activeSection === 'users'     && <UsersTable />}
          {activeSection === 'listings'  && <ListingsTable />}
          {activeSection === 'bookings'  && <BookingsTable />}
          {activeSection === 'disputes'  && <DisputesSection initialFilter={disputeInitialFilter} />}
          {activeSection === 'payouts'   && <PayoutsSection />}
          {activeSection === 'audit'        && <AuditSection />}
          {activeSection === 'edit-profile' && <EditProfilePanel userName={userName ?? ''} userEmail={userEmail ?? ''} />}
          <footer className="db-footer"><p>© 2022 ListOn - All Rights Reserved</p></footer>
        </div>
      </main>
    </div>
  );
}
