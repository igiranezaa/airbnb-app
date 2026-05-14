import { useRef, useState } from 'react';
import {
  FaCheckCircle, FaCamera, FaCloudUploadAlt,
  FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaLock,
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import './EditProfileSection.css';

export default function EditProfileSection() {
  const { userName, userEmail, userRole, updateLocalName } = useAuth();

  const [name, setName]           = useState(userName || '');
  const [phone, setPhone]         = useState('');
  const [description, setDesc]    = useState('');
  const [facebook, setFacebook]   = useState('');
  const [twitter, setTwitter]     = useState('');
  const [instagram, setInstagram] = useState('');
  const [linkedin, setLinkedin]   = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [coverSrc, setCoverSrc]   = useState<string | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  const coverRef  = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLInputElement>(null);

  const initials = name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const roleLabel = userRole ? userRole.charAt(0) + userRole.slice(1).toLowerCase() : 'User';

  function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setCoverSrc(URL.createObjectURL(f));
  }

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setAvatarSrc(URL.createObjectURL(f));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required'); return; }
    updateLocalName(name.trim());
    toast.success('Profile saved!');
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) { toast.error('Fill in all password fields'); return; }
    if (newPw !== confirmPw) { toast.error('New passwords do not match'); return; }
    toast.success('Password updated!');
    setCurrentPw(''); setNewPw(''); setConfirmPw('');
  }

  return (
    <div className="ep">

      {/* ── Hero: cover + avatar ── */}
      <div className="ep__hero">
        <div
          className="ep__cover"
          style={coverSrc ? { backgroundImage: `url(${coverSrc})` } : undefined}
        >
          <button type="button" className="ep__upload-btn" onClick={() => coverRef.current?.click()}>
            <FaCloudUploadAlt /> Upload header
          </button>
          <input ref={coverRef} type="file" accept="image/*" hidden onChange={handleCover} />
        </div>

        <div className="ep__avatar-slot">
          <div className="ep__avatar" onClick={() => avatarRef.current?.click()}>
            {avatarSrc
              ? <img src={avatarSrc} alt="avatar" className="ep__avatar-img" />
              : <span className="ep__avatar-initials">{initials}</span>}
            <div className="ep__avatar-overlay"><FaCamera /></div>
          </div>
          <input ref={avatarRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
        </div>
      </div>

      {/* ── User identity ── */}
      <div className="ep__identity">
        <h2 className="ep__name">
          {name || 'Your Name'}
          <FaCheckCircle className="ep__verified" />
        </h2>
        <p className="ep__meta">
          <span>ListOn</span>
          <span className="ep__sep">/</span>
          <span className="ep__role">{roleLabel}</span>
          <span className="ep__sep">/</span>
          <span>Joined 2024</span>
        </p>
      </div>

      {/* ── Details card ── */}
      <form className="ep__card" onSubmit={handleSave}>
        <div className="ep__card-head">
          <h3 className="ep__card-title">Details</h3>
        </div>
        <div className="ep__card-body">

          <div className="ep__row ep__row--3">
            <div className="ep__field">
              <label className="ep__label">Name <span className="ep__req">*</span></label>
              <input className="ep__input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="ep__field">
              <label className="ep__label">Phone <span className="ep__req">*</span></label>
              <input className="ep__input" type="tel" placeholder="(123) 456 - 789" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="ep__field">
              <label className="ep__label">Email Address <span className="ep__req">*</span></label>
              <input className="ep__input ep__input--readonly" type="email" value={userEmail} readOnly />
            </div>
          </div>

          <div className="ep__field ep__field--full">
            <label className="ep__label">Description <span className="ep__req">*</span></label>
            <textarea
              className="ep__textarea"
              placeholder="Please enter up to 4000 characters."
              maxLength={4000}
              rows={5}
              value={description}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className="ep__row ep__row--2">
            <div className="ep__field">
              <label className="ep__label">
                <span className="ep__soc ep__soc--fb"><FaFacebookF /></span>
                Facebook Page <span className="ep__opt">(optional)</span>
              </label>
              <input className="ep__input" placeholder="https://facebook.com" value={facebook} onChange={(e) => setFacebook(e.target.value)} />
            </div>
            <div className="ep__field">
              <label className="ep__label">
                <span className="ep__soc ep__soc--tw"><FaTwitter /></span>
                Twitter profile <span className="ep__opt">(optional)</span>
              </label>
              <input className="ep__input" placeholder="https://twitter.com" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
            </div>
            <div className="ep__field">
              <label className="ep__label">
                <span className="ep__soc ep__soc--ig"><FaInstagram /></span>
                Instagram profile <span className="ep__opt">(optional)</span>
              </label>
              <input className="ep__input" placeholder="https://instagram.com" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </div>
            <div className="ep__field">
              <label className="ep__label">
                <span className="ep__soc ep__soc--li"><FaLinkedinIn /></span>
                Linkedin page <span className="ep__opt">(optional)</span>
              </label>
              <input className="ep__input" placeholder="https://linkedin.com" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
            </div>
          </div>

        </div>
        <div className="ep__card-foot">
          <button type="submit" className="ep__save-btn">Save Changes</button>
        </div>
      </form>

      {/* ── Change Password card ── */}
      <form className="ep__card" onSubmit={handlePasswordChange}>
        <div className="ep__card-head">
          <h3 className="ep__card-title">Change Password</h3>
        </div>
        <div className="ep__card-body">
          <div className="ep__row ep__row--3">
            <div className="ep__field">
              <label className="ep__label"><FaLock className="ep__lock-icon" /> Current Password <span className="ep__req">*</span></label>
              <input className="ep__input" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div className="ep__field">
              <label className="ep__label"><FaLock className="ep__lock-icon" /> New Password <span className="ep__req">*</span></label>
              <input className="ep__input" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <div className="ep__field">
              <label className="ep__label"><FaLock className="ep__lock-icon" /> Confirm Password <span className="ep__req">*</span></label>
              <input className="ep__input" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="ep__card-foot">
          <button type="submit" className="ep__save-btn">Update Password</button>
        </div>
      </form>

    </div>
  );
}
