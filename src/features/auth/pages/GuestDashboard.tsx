import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaCommentDots, FaHeart, FaMapMarkerAlt, FaSignOutAlt, FaTachometerAlt, FaUserEdit } from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../../../store/StoreContext';
import { useBookings } from '../../bookings/hooks/useBookings';
import BookingsPanel from '../../bookings/components/BookingsPanel';
import MessagesPanel from '../../bookings/components/MessagesPanel';
import type { Booking } from '../../bookings/hooks/useBookings';
import { useListings } from '../../listings/hooks/useListings';
import DashboardTopbar from '../components/DashboardTopbar';
import EditProfileSection from '../components/EditProfileSection';
import numeral from 'numeral';
import './DashboardPage.css';

type GuestSection = 'overview' | 'bookings' | 'messages' | 'bookmarks' | 'edit-profile';

export default function GuestDashboard() {
  const { logout } = useAuth();
  const { state } = useStore();
  const navigate = useNavigate();
  const { data: bookings = [] } = useBookings();
  const { data: allListings = [] } = useListings();
  const [activeSection, setActiveSection] = useState<GuestSection>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [messageBooking, setMessageBooking] = useState<Booking | null>(null);

  const upcomingBookings = bookings.filter(
    (b) => b.status !== 'CANCELLED' && new Date(b.checkIn) >= new Date()
  );
  const totalSpent = bookings
    .filter((b) => b.status === 'CONFIRMED')
    .reduce((s, b) => s + b.totalPrice, 0);
  const savedListings = allListings.filter((l) => state.saved.includes(l.id));

  function handleOpenMessages(booking: Booking) {
    setMessageBooking(booking);
    setActiveSection('messages');
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  const nav = (section: GuestSection) => (
    <button
      type="button"
      className={`db-side-nav__item db-side-nav__button${activeSection === section ? ' db-side-nav__item--active' : ''}`}
      onClick={() => setActiveSection(section)}
    >
      {section === 'overview' && <><FaTachometerAlt />Dashboard</>}
      {section === 'bookings' && <><FaCalendarAlt />My Bookings{bookings.length > 0 && <span className="db-side-nav__badge">{bookings.length}</span>}</>}
      {section === 'messages' && <><FaCommentDots />Messages</>}
      {section === 'bookmarks' && <><FaHeart />Saved{state.saved.length > 0 && <span className="db-side-nav__badge">{state.saved.length}</span>}</>}
    </button>
  );

  return (
    <div className={`dashboard-page${isSidebarCollapsed ? ' dashboard-page--sidebar-collapsed' : ''}`}>
      <aside className={`db-sidebar${isSidebarCollapsed ? ' db-sidebar--collapsed' : ''}`}>
        <Link to="/" className="db-brand">
          <FaMapMarkerAlt />
          <span>List<em>On</em></span>
        </Link>
        <nav className="db-side-nav">
          <p className="db-side-nav__label">GUEST MENU</p>
          {nav('overview')}
          {nav('bookings')}
          {nav('messages')}
          {nav('bookmarks')}
          <button
            type="button"
            className={`db-side-nav__item db-side-nav__button${activeSection === 'edit-profile' ? ' db-side-nav__item--active' : ''}`}
            onClick={() => setActiveSection('edit-profile')}
          >
            <FaUserEdit />Edit Profile
          </button>
          <button className="db-side-nav__item db-side-nav__button" type="button" onClick={handleLogout}>
            <FaSignOutAlt />Logout
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
          {activeSection === 'overview' && (
            <div>
              <div className="db-overview-metrics">
                <article className="db-overview-card">
                  <p>Upcoming Trips</p>
                  <strong style={{ fontSize: '2rem', color: '#ef4f38' }}>{upcomingBookings.length}</strong>
                </article>
                <article className="db-overview-card">
                  <p>Total Bookings</p>
                  <strong style={{ fontSize: '2rem', color: '#ef4f38' }}>{bookings.length}</strong>
                </article>
                <article className="db-overview-card">
                  <p>Saved Listings</p>
                  <strong style={{ fontSize: '2rem', color: '#ef4f38' }}>{savedListings.length}</strong>
                </article>
                <article className="db-overview-card">
                  <p>Total Spent</p>
                  <strong style={{ fontSize: '1.4rem', color: '#ef4f38' }}>{numeral(totalSpent).format('$0,0')}</strong>
                </article>
              </div>
              {upcomingBookings.length > 0 && (
                <section className="db-panel" style={{ marginTop: '1.5rem' }}>
                  <div className="db-panel__header"><h2>Upcoming Trips</h2></div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                    {upcomingBookings.slice(0, 3).map((b) => (
                      <li key={b.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{b.listing.title}</strong>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#888' }}>{b.listing.location}</p>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                          <div>{new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</div>
                          <strong style={{ color: '#ef4f38' }}>{numeral(b.totalPrice).format('$0,0')}</strong>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}
          {activeSection === 'bookings' && <BookingsPanel onMessage={handleOpenMessages} />}
          {activeSection === 'messages' && <MessagesPanel initialBooking={messageBooking} />}
          {activeSection === 'edit-profile' && <EditProfileSection />}
          {activeSection === 'bookmarks' && (
            <section className="db-panel">
              <div className="db-panel__header"><h2>Saved Listings</h2></div>
              {savedListings.length === 0 ? (
                <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No saved listings yet. <Link to="/listings" style={{ color: '#ef4f38' }}>Browse listings</Link></p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {savedListings.map((l) => (
                    <li key={l.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img src={l.img} alt={l.title} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <strong>{l.title}</strong>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: '#888' }}>{l.location}</p>
                      </div>
                      <strong style={{ color: '#ef4f38', whiteSpace: 'nowrap' }}>{numeral(l.price).format('$0')} / night</strong>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          <footer className="db-footer">
            <p>© 2022 ListOn - All Rights Reserved</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
