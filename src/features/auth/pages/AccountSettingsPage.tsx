import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FaUser, FaBell, FaShieldAlt, FaDatabase,
  FaExchangeAlt, FaTrashAlt, FaDownload, FaCheckCircle,
  FaMonitor, FaMobileAlt, FaSignOutAlt, FaArrowLeft,
  FaCamera, FaCreditCard, FaPaypal, FaUniversity, FaPlus, FaStar,
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import api from '../../../lib/axios';
import './AccountSettingsPage.css';

type Section = 'profile' | 'notifications' | 'payments' | 'sessions' | 'gdpr';

// ── API hooks ─────────────────────────────────────────────────────────────────

function useProfile() {
  return useQuery({
    queryKey: ['my-profile'],
    queryFn: async () => {
      const { data } = await api.get('/users/me/profile');
      return data as {
        id: string; name: string; bio: string | null; avatar: string | null;
        profile: { bio?: string; country?: string; website?: string; languages?: string[]; contactPreferences?: Record<string, unknown> } | null;
      };
    },
    enabled: !!import.meta.env.VITE_API_URL,
  });
}

function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.patch('/users/me/profile', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

function useNotifPrefs() {
  return useQuery({
    queryKey: ['my-notif-prefs'],
    queryFn: async () => {
      const { data } = await api.get('/users/me/notifications');
      return data as {
        emailBookings: boolean; emailMessages: boolean; emailMarketing: boolean;
        pushEnabled: boolean; smsEnabled: boolean;
      };
    },
    enabled: !!import.meta.env.VITE_API_URL,
  });
}

function useUpdateNotifPrefs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.patch('/users/me/notifications', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-notif-prefs'] }),
  });
}

function useSessions() {
  return useQuery({
    queryKey: ['my-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/users/me/sessions');
      return data as { id: string; deviceName: string; ipAddress: string | null; createdAt: string; lastActive: string; isCurrent: boolean }[];
    },
    enabled: !!import.meta.env.VITE_API_URL,
  });
}

function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.delete(`/users/me/sessions/${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-sessions'] }),
  });
}

function useRevokeAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/users/me/sessions'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-sessions'] }),
  });
}

function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-profile'] }),
  });
}

type PaymentMethod = {
  id: string; type: 'card' | 'paypal' | 'bank';
  last4?: string; brand?: string; email?: string; bankName?: string;
  expiryMonth?: number; expiryYear?: number; isDefault: boolean;
};

function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const { data } = await api.get('/users/me/payment-methods');
      return data as PaymentMethod[];
    },
    enabled: !!import.meta.env.VITE_API_URL,
  });
}

function useAddPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.post('/users/me/payment-methods', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-methods'] }),
  });
}

function useDeletePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/me/payment-methods/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-methods'] }),
  });
}

function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/users/me/payment-methods/${id}/default`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['payment-methods'] }),
  });
}

// ── Sub-sections ──────────────────────────────────────────────────────────────

function ProfileSection({ userName, updateLocalName }: { userName: string; updateLocalName: (n: string) => void }) {
  const { data: profileData } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { mutate: uploadAvatar, isPending: uploadingAvatar } = useUploadAvatar();

  const [name, setName]         = useState('');
  const [bio, setBio]           = useState('');
  const [country, setCountry]   = useState('');
  const [website, setWebsite]   = useState('');
  const [langInput, setLangInput] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [contactPrefs, setContactPrefs]   = useState({ showEmail: false, showPhone: false, preferredContact: 'message' as 'email' | 'phone' | 'message' });
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profileData) {
      setName(profileData.name || userName);
      setBio(profileData.profile?.bio ?? profileData.bio ?? '');
      setCountry(profileData.profile?.country ?? '');
      setWebsite(profileData.profile?.website ?? '');
      setLanguages(profileData.profile?.languages ?? []);
      if (profileData.avatar) setAvatarPreview(profileData.avatar);
      const cp = profileData.profile?.contactPreferences as typeof contactPrefs | undefined;
      if (cp) setContactPrefs({ showEmail: !!cp.showEmail, showPhone: !!cp.showPhone, preferredContact: cp.preferredContact ?? 'message' });
    }
  }, [profileData, userName]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function addLanguage() {
    const lang = langInput.trim();
    if (lang && !languages.includes(lang)) setLanguages((l) => [...l, lang]);
    setLangInput('');
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const doUpdate = () => {
      updateProfile({ name, bio, country, website, languages, contactPreferences: contactPrefs }, {
        onSuccess: () => { updateLocalName(name); setSaved(true); setTimeout(() => setSaved(false), 2500); },
      });
    };
    if (avatarFile) {
      uploadAvatar(avatarFile, { onSuccess: () => { setAvatarFile(null); doUpdate(); }, onError: doUpdate });
    } else {
      doUpdate();
    }
  }

  const initials = name ? name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) : '?';

  return (
    <form onSubmit={submit} className="as-section-form">
      <h2 className="as-section-title">Profile</h2>

      {/* Avatar upload */}
      <div className="as-avatar-wrap">
        <div className="as-avatar" onClick={() => fileInputRef.current?.click()}>
          {avatarPreview
            ? <img src={avatarPreview} alt="avatar" className="as-avatar__img" />
            : <span className="as-avatar__initials">{initials}</span>}
          <div className="as-avatar__overlay"><FaCamera /></div>
        </div>
        <div>
          <p className="as-label-text" style={{ margin: 0 }}>Profile Photo</p>
          <p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 8px' }}>JPG or PNG, max 5 MB</p>
          <button type="button" className="as-btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploadingAvatar}>
            {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleAvatarChange} />
      </div>

      <div className="as-field-grid">
        <label className="as-label">
          Display Name
          <input className="as-input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="as-label">
          Country
          <input className="as-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. Rwanda" />
        </label>
        <label className="as-label" style={{ gridColumn: '1 / -1' }}>
          Bio
          <textarea className="as-input as-textarea" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell guests about yourself…" />
        </label>
        <label className="as-label">
          Website
          <input className="as-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
        </label>
      </div>

      <div className="as-lang-section">
        <p className="as-label-text">Languages Spoken</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {languages.map((l) => (
            <span key={l} className="as-lang-chip">
              {l}
              <button type="button" onClick={() => setLanguages((ls) => ls.filter((x) => x !== l))} className="as-lang-remove">×</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="as-input" style={{ flex: 1 }} value={langInput} onChange={(e) => setLangInput(e.target.value)}
            placeholder="e.g. English" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())} />
          <button type="button" className="as-btn-secondary" onClick={addLanguage}>Add</button>
        </div>
      </div>

      {/* Contact Preferences */}
      <div className="as-notif-group" style={{ marginTop: 24 }}>
        <p className="as-notif-group-title">Contact Preferences</p>
        <div className="as-notif-row">
          <div>
            <p className="as-notif-label">Show email on profile</p>
            <p className="as-notif-desc">Other users can see your email address</p>
          </div>
          <button type="button" className={`as-toggle${contactPrefs.showEmail ? ' as-toggle--on' : ''}`}
            onClick={() => setContactPrefs((p) => ({ ...p, showEmail: !p.showEmail }))}>
            <span className="as-toggle__knob" />
          </button>
        </div>
        <div className="as-notif-row">
          <div>
            <p className="as-notif-label">Show phone on profile</p>
            <p className="as-notif-desc">Other users can see your phone number</p>
          </div>
          <button type="button" className={`as-toggle${contactPrefs.showPhone ? ' as-toggle--on' : ''}`}
            onClick={() => setContactPrefs((p) => ({ ...p, showPhone: !p.showPhone }))}>
            <span className="as-toggle__knob" />
          </button>
        </div>
        <div className="as-notif-row" style={{ borderBottom: 'none' }}>
          <div>
            <p className="as-notif-label">Preferred contact method</p>
            <p className="as-notif-desc">How guests/hosts should reach you first</p>
          </div>
          <select className="as-input" style={{ width: 'auto' }} value={contactPrefs.preferredContact}
            onChange={(e) => setContactPrefs((p) => ({ ...p, preferredContact: e.target.value as typeof contactPrefs.preferredContact }))}>
            <option value="message">In-app message</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
        <button type="submit" className="as-btn-primary" disabled={isPending || uploadingAvatar}>
          {isPending ? 'Saving…' : 'Save Profile'}
        </button>
        {saved && <span style={{ color: '#2e7d32', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}><FaCheckCircle /> Saved!</span>}
      </div>
    </form>
  );
}

// FR-012: Notification preferences
function NotificationsSection() {
  const { data: prefs } = useNotifPrefs();
  const { mutate: updatePrefs, isPending } = useUpdateNotifPrefs();
  const [local, setLocal] = useState({
    emailBookings: true, emailMessages: true, emailMarketing: false, pushEnabled: true, smsEnabled: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prefs) setLocal(prefs);
  }, [prefs]);

  function toggle(key: keyof typeof local) {
    setLocal((p) => ({ ...p, [key]: !p[key] }));
  }

  const GROUPS = [
    {
      heading: 'Email Notifications',
      items: [
        { key: 'emailBookings' as const, label: 'Booking confirmations & updates', desc: 'Get notified when bookings are created, confirmed, or cancelled' },
        { key: 'emailMessages' as const, label: 'New messages', desc: 'Receive email alerts when someone messages you' },
        { key: 'emailMarketing' as const, label: 'Promotions & offers', desc: 'Special deals, discounts, and platform news' },
      ],
    },
    {
      heading: 'Push & SMS',
      items: [
        { key: 'pushEnabled' as const, label: 'Push notifications', desc: 'Browser or app push notifications for key activity' },
        { key: 'smsEnabled' as const, label: 'SMS notifications', desc: 'Text messages for critical account alerts' },
      ],
    },
  ];

  return (
    <div className="as-section-form">
      <h2 className="as-section-title">Notifications</h2>
      {GROUPS.map((group) => (
        <div key={group.heading} className="as-notif-group">
          <p className="as-notif-group-title">{group.heading}</p>
          {group.items.map(({ key, label, desc }) => (
            <div key={key} className="as-notif-row">
              <div>
                <p className="as-notif-label">{label}</p>
                <p className="as-notif-desc">{desc}</p>
              </div>
              <button type="button" className={`as-toggle${local[key] ? ' as-toggle--on' : ''}`} onClick={() => toggle(key)}>
                <span className="as-toggle__knob" />
              </button>
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <button type="button" className="as-btn-primary" disabled={isPending}
          onClick={() => updatePrefs(local, { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); } })}>
          {isPending ? 'Saving…' : 'Save Preferences'}
        </button>
        {saved && <span style={{ color: '#2e7d32', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4 }}><FaCheckCircle /> Saved!</span>}
      </div>
    </div>
  );
}

// FR-008: Sessions
function SessionsSection() {
  const { data: sessions = [], isLoading } = useSessions();
  const { mutate: revokeSession, isPending: revoking } = useRevokeSession();
  const { mutate: revokeAll, isPending: revokingAll } = useRevokeAll();

  return (
    <div className="as-section-form">
      <h2 className="as-section-title">Active Sessions</h2>
      <p style={{ color: '#888', fontSize: 14, marginBottom: 16 }}>Devices currently signed in to your account. Revoke any session you don't recognise.</p>

      {isLoading ? <p style={{ color: '#aaa' }}>Loading…</p> : sessions.length === 0 ? (
        <p style={{ color: '#aaa' }}>No active sessions found.</p>
      ) : (
        <div className="as-session-list">
          {sessions.map((s) => (
            <div key={s.id} className={`as-session-row${s.isCurrent ? ' as-session-row--current' : ''}`}>
              <div className="as-session-icon">
                {s.deviceName.toLowerCase().includes('mobile') ? <FaMobileAlt /> : <FaMonitor />}
              </div>
              <div style={{ flex: 1 }}>
                <p className="as-session-device">{s.deviceName} {s.isCurrent && <span className="as-session-current-badge">Current</span>}</p>
                <p className="as-session-meta">
                  {s.ipAddress ?? 'Unknown IP'} · Last active {new Date(s.lastActive).toLocaleString()}
                </p>
              </div>
              {!s.isCurrent && (
                <button className="as-btn-danger-sm" disabled={revoking}
                  onClick={() => { if (confirm('Revoke this session?')) revokeSession(s.id); }}>
                  <FaSignOutAlt /> Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {sessions.filter((s) => !s.isCurrent).length > 0 && (
        <button className="as-btn-danger" style={{ marginTop: 16 }} disabled={revokingAll}
          onClick={() => { if (confirm('Sign out of all other devices?')) revokeAll(); }}>
          {revokingAll ? 'Revoking…' : 'Sign out all other devices'}
        </button>
      )}
    </div>
  );
}

// FR-011: GDPR + FR-013: Switch Role
function DataAndPrivacySection({ userRole, switchRole, logout }: { userRole: string; switchRole: (r: 'GUEST' | 'HOST') => Promise<boolean>; logout: () => void }) {
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [switchSuccess, setSwitchSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');

  async function handleExport() {
    const { data } = await api.get('/users/me/data-export', { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSwitch() {
    setSwitching(true);
    const targetRole = userRole === 'HOST' ? 'GUEST' : 'HOST';
    const ok = await switchRole(targetRole);
    setSwitching(false);
    if (ok) {
      setSwitchSuccess(`Switched to ${targetRole} mode.`);
      setTimeout(() => { setSwitchSuccess(''); navigate('/dashboard'); }, 1500);
    }
  }

  async function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDeleteError('');
    setDeleting(true);
    try {
      await api.delete('/users/me/account', { data: { confirmText: deleteText } });
      logout();
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setDeleteError(msg ?? 'Deletion failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="as-section-form">
      <h2 className="as-section-title">Data & Privacy</h2>

      {/* FR-013: Switch mode */}
      {userRole !== 'ADMIN' && (
        <div className="as-card-block">
          <div>
            <p className="as-card-block__title"><FaExchangeAlt /> {userRole === 'HOST' ? 'Switch to Guest mode' : 'Switch to Host mode'}</p>
            <p className="as-card-block__desc">
              {userRole === 'HOST'
                ? 'Switch back to guest mode to browse and book listings without hosting.'
                : 'Become a host to create and manage your own listings.'}
            </p>
          </div>
          <button className="as-btn-secondary" disabled={switching} onClick={handleSwitch}>
            {switching ? 'Switching…' : userRole === 'HOST' ? 'Switch to Guest' : 'Become a Host'}
          </button>
          {switchSuccess && <p style={{ color: '#2e7d32', fontSize: 13 }}>{switchSuccess}</p>}
        </div>
      )}

      {/* FR-011: Data export */}
      <div className="as-card-block">
        <div>
          <p className="as-card-block__title"><FaDownload /> Download your data</p>
          <p className="as-card-block__desc">Download a JSON export of all your account data, bookings, and reviews (GDPR Article 20).</p>
        </div>
        <button className="as-btn-secondary" onClick={handleExport}>
          <FaDownload /> Export Data
        </button>
      </div>

      {/* FR-011: Account deletion */}
      <div className="as-card-block as-card-block--danger">
        <div>
          <p className="as-card-block__title"><FaTrashAlt /> Delete account</p>
          <p className="as-card-block__desc">Permanently delete your account and all associated data (GDPR Article 17). This cannot be undone.</p>
        </div>
        <form onSubmit={handleDelete} className="as-delete-form">
          <input
            className="as-input as-input--danger"
            placeholder='Type "DELETE MY ACCOUNT" to confirm'
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
          />
          {deleteError && <p style={{ color: '#c62828', fontSize: 13 }}>{deleteError}</p>}
          <button type="submit" className="as-btn-danger" disabled={deleting || deleteText !== 'DELETE MY ACCOUNT'}>
            {deleting ? 'Deleting…' : 'Permanently Delete Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── FR-010: Payment Methods ───────────────────────────────────────────────────
function PaymentsSection() {
  const { data: methods = [], isLoading } = usePaymentMethods();
  const { mutate: addMethod, isPending: adding } = useAddPaymentMethod();
  const { mutate: deleteMethod, isPending: deleting } = useDeletePaymentMethod();
  const { mutate: setDefault } = useSetDefaultPaymentMethod();

  const [tab, setTab] = useState<'card' | 'paypal' | 'bank'>('card');
  const [showForm, setShowForm] = useState(false);
  const [saved, setSaved] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName]     = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvc, setCvc]               = useState('');
  // PayPal
  const [ppEmail, setPpEmail] = useState('');
  // Bank
  const [bankName, setBankName]     = useState('');
  const [accountNum, setAccountNum] = useState('');
  const [routingNum, setRoutingNum] = useState('');

  function formatCard(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    let payload: object;
    if (tab === 'card') {
      const [mm, yy] = expiry.split('/');
      payload = { type: 'card', last4: cardNumber.replace(/\s/g, '').slice(-4), brand: 'Visa', expiryMonth: Number(mm), expiryYear: 2000 + Number(yy), cardholderName: cardName };
    } else if (tab === 'paypal') {
      payload = { type: 'paypal', email: ppEmail };
    } else {
      payload = { type: 'bank', bankName, accountNumber: accountNum, routingNumber: routingNum };
    }
    addMethod(payload, {
      onSuccess: () => {
        setShowForm(false); setSaved(true); setTimeout(() => setSaved(false), 2500);
        setCardNumber(''); setCardName(''); setExpiry(''); setCvc('');
        setPpEmail(''); setBankName(''); setAccountNum(''); setRoutingNum('');
      },
    });
  }

  const BRAND_ICON: Record<string, React.ReactNode> = {
    card: <FaCreditCard />, paypal: <FaPaypal />, bank: <FaUniversity />,
  };

  return (
    <div className="as-section-form">
      <h2 className="as-section-title">Payment Methods</h2>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>
        Manage your saved payment methods. Card data is tokenised and never stored on our servers (PCI-DSS compliant).
      </p>

      {isLoading ? <p style={{ color: '#aaa' }}>Loading…</p> : methods.length === 0 ? (
        <p style={{ color: '#aaa', fontSize: 14, marginBottom: 20 }}>No payment methods saved yet.</p>
      ) : (
        <div className="as-session-list" style={{ marginBottom: 20 }}>
          {methods.map((m) => (
            <div key={m.id} className={`as-session-row${m.isDefault ? ' as-session-row--current' : ''}`}>
              <div className="as-session-icon">{BRAND_ICON[m.type]}</div>
              <div style={{ flex: 1 }}>
                {m.type === 'card' && <p className="as-session-device">{m.brand ?? 'Card'} •••• {m.last4} {m.isDefault && <span className="as-session-current-badge">Default</span>}</p>}
                {m.type === 'paypal' && <p className="as-session-device">PayPal — {m.email} {m.isDefault && <span className="as-session-current-badge">Default</span>}</p>}
                {m.type === 'bank' && <p className="as-session-device">{m.bankName} •••• {m.last4} {m.isDefault && <span className="as-session-current-badge">Default</span>}</p>}
                {m.type === 'card' && m.expiryMonth && <p className="as-session-meta">Expires {String(m.expiryMonth).padStart(2, '0')}/{m.expiryYear}</p>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {!m.isDefault && (
                  <button className="as-btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => setDefault(m.id)}>
                    <FaStar /> Set default
                  </button>
                )}
                <button className="as-btn-danger-sm" disabled={deleting} onClick={() => { if (confirm('Remove this payment method?')) deleteMethod(m.id); }}>
                  <FaTrashAlt />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {saved && <p style={{ color: '#2e7d32', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}><FaCheckCircle /> Payment method added!</p>}

      {!showForm ? (
        <button className="as-btn-secondary" onClick={() => setShowForm(true)}>
          <FaPlus /> Add payment method
        </button>
      ) : (
        <div className="as-payment-form-wrap">
          <div className="as-payment-tabs">
            {(['card', 'paypal', 'bank'] as const).map((t) => (
              <button key={t} type="button" className={`as-payment-tab${tab === t ? ' as-payment-tab--active' : ''}`} onClick={() => setTab(t)}>
                {t === 'card' && <><FaCreditCard /> Credit / Debit Card</>}
                {t === 'paypal' && <><FaPaypal /> PayPal</>}
                {t === 'bank' && <><FaUniversity /> Bank Account</>}
              </button>
            ))}
          </div>

          <form onSubmit={handleAdd} className="as-payment-form">
            {tab === 'card' && (<>
              <label className="as-label" style={{ gridColumn: '1 / -1' }}>
                Cardholder Name
                <input className="as-input" placeholder="Jane Doe" value={cardName} onChange={(e) => setCardName(e.target.value)} required />
              </label>
              <label className="as-label" style={{ gridColumn: '1 / -1' }}>
                Card Number
                <input className="as-input" placeholder="1234 5678 9012 3456" value={cardNumber}
                  onChange={(e) => setCardNumber(formatCard(e.target.value))} required maxLength={19} />
              </label>
              <label className="as-label">
                Expiry (MM/YY)
                <input className="as-input" placeholder="MM/YY" value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))} required maxLength={5} />
              </label>
              <label className="as-label">
                CVC
                <input className="as-input" placeholder="•••" value={cvc} type="password"
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} required />
              </label>
            </>)}

            {tab === 'paypal' && (
              <label className="as-label" style={{ gridColumn: '1 / -1' }}>
                PayPal Email
                <input className="as-input" type="email" placeholder="you@paypal.com" value={ppEmail} onChange={(e) => setPpEmail(e.target.value)} required />
              </label>
            )}

            {tab === 'bank' && (<>
              <label className="as-label" style={{ gridColumn: '1 / -1' }}>
                Bank Name
                <input className="as-input" placeholder="e.g. Bank of Kigali" value={bankName} onChange={(e) => setBankName(e.target.value)} required />
              </label>
              <label className="as-label">
                Account Number
                <input className="as-input" placeholder="Account number" value={accountNum} onChange={(e) => setAccountNum(e.target.value)} required />
              </label>
              <label className="as-label">
                Routing Number
                <input className="as-input" placeholder="Routing / sort code" value={routingNum} onChange={(e) => setRoutingNum(e.target.value)} required />
              </label>
            </>)}

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, marginTop: 4 }}>
              <button type="submit" className="as-btn-primary" disabled={adding}>{adding ? 'Adding…' : 'Add Method'}</button>
              <button type="button" className="as-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AccountSettingsPage() {
  const { userName, userRole, switchRole, logout, updateLocalName } = useAuth() as {
    userName: string; userRole: string;
    switchRole: (r: 'GUEST' | 'HOST') => Promise<boolean>;
    logout: () => void;
    updateLocalName: (n: string) => void;
  };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sectionParam = (searchParams.get('section') as Section) || 'profile';
  const [active, setActive] = useState<Section>(sectionParam);

  useEffect(() => {
    setActive(sectionParam);
  }, [sectionParam]);

  const NAV_ITEMS: { section: Section; icon: React.ReactNode; label: string }[] = [
    { section: 'profile',       icon: <FaUser />,        label: 'Profile' },
    { section: 'notifications', icon: <FaBell />,        label: 'Notifications' },
    { section: 'payments',      icon: <FaCreditCard />,  label: 'Payments' },
    { section: 'sessions',      icon: <FaShieldAlt />,   label: 'Sessions' },
    { section: 'gdpr',          icon: <FaDatabase />,    label: 'Data & Privacy' },
  ];

  return (
    <div className="as-page">
      <div className="as-header">
        <button className="as-back-btn" onClick={() => navigate(-1)}><FaArrowLeft /> Back</button>
        <h1 className="as-heading">Account Settings</h1>
      </div>

      <div className="as-layout">
        <nav className="as-nav">
          {NAV_ITEMS.map(({ section, icon, label }) => (
            <button key={section} className={`as-nav-item${active === section ? ' as-nav-item--active' : ''}`}
              onClick={() => setActive(section)}>
              {icon} {label}
            </button>
          ))}
        </nav>

        <div className="as-content">
          {active === 'profile'       && <ProfileSection userName={userName} updateLocalName={updateLocalName} />}
          {active === 'notifications' && <NotificationsSection />}
          {active === 'payments'      && <PaymentsSection />}
          {active === 'sessions'      && <SessionsSection />}
          {active === 'gdpr'          && <DataAndPrivacySection userRole={userRole} switchRole={switchRole} logout={logout} />}
        </div>
      </div>
    </div>
  );
}
