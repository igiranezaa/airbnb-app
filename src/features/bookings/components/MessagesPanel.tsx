import { useEffect, useRef, useState } from 'react';
import { FaPaperPlane, FaImage, FaTimes } from 'react-icons/fa';
import { useBookings, type Booking } from '../hooks/useBookings';
import { useMessages, useSendMessage } from '../hooks/useMessages';
import { useAuth } from '../../auth/hooks/useAuth';
import './MessagesPanel.css';

// FR-051: detect phone/email in message content
const CONTACT_RE = /(\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b)|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;

interface Props {
  initialBooking?: Booking | null;
  enquiryListingId?: string;
  enquiryListingTitle?: string;
}

export default function MessagesPanel({ initialBooking, enquiryListingId, enquiryListingTitle }: Props) {
  const { data: bookings = [] } = useBookings();
  const { userId } = useAuth();

  const [selected, setSelected] = useState<Booking | null>(initialBooking ?? null);
  const [isEnquiry, setIsEnquiry] = useState(!initialBooking && !!enquiryListingId);
  const [input, setInput] = useState('');
  const [contactWarning, setContactWarning] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeBookingId = isEnquiry ? undefined : selected?.id;
  const activeListingId = isEnquiry ? enquiryListingId : undefined;

  const { data: messages = [], isLoading } = useMessages(activeBookingId, activeListingId);
  const { mutate: sendMsg, isPending: sending } = useSendMessage(activeBookingId, activeListingId);

  useEffect(() => {
    if (initialBooking) { setSelected(initialBooking); setIsEnquiry(false); }
  }, [initialBooking]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleInputChange(val: string) {
    setInput(val);
    setContactWarning(CONTACT_RE.test(val));
  }

  function handleImageFile(file: File) {
    if (file.size > 10 * 1024 * 1024) { alert('Image must be under 10 MB.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function send() {
    const text = input.trim();
    if ((!text && !imagePreview) || (!activeBookingId && !activeListingId)) return;
    setInput('');
    setContactWarning(false);
    sendMsg({ content: text, imageUrl: imagePreview ?? undefined });
    setImagePreview(null);
  }

  const chatTitle = isEnquiry
    ? (enquiryListingTitle ?? 'Enquiry')
    : selected?.listing.title ?? '';
  const chatSub = isEnquiry ? 'Pre-booking enquiry' : (selected?.listing.location ?? '');
  const chatStatus = isEnquiry ? null : selected?.status;

  const hasActiveChat = isEnquiry ? !!enquiryListingId : !!selected;

  return (
    <section className="db-panel db-messages">
      <div className="db-panel__header"><h2>Messages</h2></div>

      <div className="msg-layout">
        <aside className="msg-sidebar">
          <p className="msg-sidebar__label">Conversations</p>

          {enquiryListingId && (
            <button
              className={`msg-booking-btn${isEnquiry ? ' msg-booking-btn--active' : ''}`}
              onClick={() => { setIsEnquiry(true); setSelected(null); }}
            >
              <span className="msg-booking-name">{enquiryListingTitle ?? 'Enquiry'}</span>
              <span className="msg-booking-date" style={{ color: '#ef4f38', fontWeight: 600 }}>Pre-booking</span>
            </button>
          )}

          {bookings.length === 0 && !enquiryListingId ? (
            <p className="msg-empty-list">No bookings yet.</p>
          ) : (
            <ul className="msg-booking-list">
              {bookings.map((b) => (
                <li key={b.id}>
                  <button
                    className={`msg-booking-btn${!isEnquiry && selected?.id === b.id ? ' msg-booking-btn--active' : ''}`}
                    onClick={() => { setSelected(b); setIsEnquiry(false); }}
                  >
                    <span className="msg-booking-name">{b.listing.title}</span>
                    <span className="msg-booking-date">{new Date(b.checkIn).toLocaleDateString()}</span>
                    <span className={`msg-status-dot msg-status-dot--${b.status.toLowerCase()}`} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="msg-chat">
          {!hasActiveChat ? (
            <div className="msg-placeholder"><p>Select a booking to message the host</p></div>
          ) : (
            <>
              <div className="msg-chat__header">
                <div className="msg-chat__title">
                  <strong>{chatTitle}</strong>
                  <span>{chatSub}</span>
                </div>
                {chatStatus && (
                  <span className={`bk-status bk-status--${chatStatus.toLowerCase()}`} style={{ fontSize: '0.72rem' }}>
                    {chatStatus}
                  </span>
                )}
              </div>

              <div className="msg-chat__body">
                {isLoading ? (
                  <p className="msg-chat__hint">Loading…</p>
                ) : messages.length === 0 ? (
                  <p className="msg-chat__hint">No messages yet — say hello to the host!</p>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === userId;
                    return (
                      <div key={msg.id} className={`msg-bubble msg-bubble--${isMe ? 'guest' : 'host'}`}>
                        <span className="msg-bubble__name">{msg.sender.name}</span>
                        {msg.content && <p>{msg.content}</p>}
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="attachment" className="msg-attachment" />
                        )}
                        <time>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {contactWarning && (
                <div className="msg-warning">
                  ⚠️ Sharing contact info (phone/email) off-platform is against our policy.
                </div>
              )}

              {imagePreview && (
                <div className="msg-image-preview">
                  <img src={imagePreview} alt="preview" />
                  <button type="button" onClick={() => setImagePreview(null)} aria-label="Remove image"><FaTimes /></button>
                </div>
              )}

              <form className="msg-chat__form" onSubmit={(e) => { e.preventDefault(); send(); }}>
                <input type="file" accept="image/jpeg,image/png" hidden ref={fileRef}
                  onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])} />
                <button type="button" className="msg-attach-btn" onClick={() => fileRef.current?.click()} aria-label="Attach image">
                  <FaImage />
                </button>
                <input
                  type="text"
                  placeholder="Type a message…"
                  value={input}
                  onChange={(e) => handleInputChange(e.target.value)}
                  autoComplete="off"
                  disabled={sending}
                />
                <button type="submit" aria-label="Send" disabled={sending || (!input.trim() && !imagePreview)}>
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
