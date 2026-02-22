import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import { commonStyles, useGlobalStyles } from './styles/GlobalStyles';

const Toggle = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
    <div
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 999,
        background: checked ? '#16a34a' : '#d1d5db',
        position: 'relative', transition: 'background 200ms', flexShrink: 0,
        cursor: 'pointer'
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: checked ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        transition: 'left 200ms'
      }} />
    </div>
    <span style={{ fontSize: 14, color: 'var(--color-gray-700)', fontWeight: 500, fontFamily: 'var(--font-family-primary)' }}>{label}</span>
  </label>
);

const SettingsPage = ({ onToggleMenu, onNavigate }) => {
  useGlobalStyles();
  const { user, notifPrefs, updateProfile, updateNotifPrefs, logout } = useAuth();

  const [profile, setProfile] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    organization: user?.organization || ''
  });
  const [prefs, setPrefs] = useState(notifPrefs);
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSaved, setProfileSaved] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const validateProfile = () => {
    const e = {};
    if (!profile.fullName.trim()) e.fullName = 'Full name is required.';
    if (!profile.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) e.email = 'Enter a valid email.';
    if (!profile.mobile.trim()) e.mobile = 'Mobile number is required.';
    else if (!/^\+?[\d\s\-]{7,15}$/.test(profile.mobile)) e.mobile = 'Enter a valid mobile number.';
    return e;
  };

  const handleProfileChange = (field) => (e) => {
    setProfile(prev => ({ ...prev, [field]: e.target.value }));
    setProfileSaved(false);
    if (profileErrors[field]) setProfileErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const errs = validateProfile();
    if (Object.keys(errs).length) { setProfileErrors(errs); return; }
    updateProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const togglePref = (alert, channel) => {
    setPrefs(prev => ({
      ...prev,
      [alert]: { ...prev[alert], [channel]: !prev[alert][channel] }
    }));
    setPrefsSaved(false);
  };

  const handleSavePrefs = () => {
    updateNotifPrefs(prefs);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 3000);
  };

  const inputStyle = (field) => ({
    width: '100%', padding: '10px 13px', borderRadius: 10,
    border: `1.5px solid ${profileErrors[field] ? '#ef4444' : '#d1d5db'}`,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    background: '#fafafa', transition: 'border-color 150ms', fontFamily: 'inherit'
  });

  const labelStyle = { fontSize: 13, fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 5, display: 'block', fontFamily: 'var(--font-family-primary)' };
  const errorStyle = { fontSize: 12, color: '#ef4444', marginTop: 4 };

  const tabStyle = (tab) => ({
    padding: '9px 20px', borderRadius: 999, border: 'none',
    fontWeight: 700, fontSize: 13, cursor: 'pointer',
    fontFamily: 'var(--font-family-primary)',
    background: activeTab === tab ? 'var(--color-primary-600)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--color-gray-500)',
    transition: 'all 150ms'
  });

  return (
    <div style={{ ...commonStyles.pageContainer, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Header title="Settings" onToggleMenu={onToggleMenu} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 40px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>

          {/* User greeting */}
          <div className="card ux-card" style={{
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 16, color: '#fff',
            animation: 'fadeInUp 350ms ease both'
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 900, flexShrink: 0
            }}>
              {(user?.fullName || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{user?.fullName || 'User'}</div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>{user?.email}</div>
              {user?.organization && <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{user.organization}</div>}
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, background: 'var(--color-gray-100)',
            borderRadius: 999, padding: 4, marginBottom: 24, width: 'fit-content',
            animation: 'fadeInUp 350ms 0.05s ease both'
          }}>
            <button style={tabStyle('profile')} onClick={() => setActiveTab('profile')}>Profile</button>
            <button style={tabStyle('notifications')} onClick={() => setActiveTab('notifications')}>Notifications</button>
          </div>

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <div className="card" style={{
              background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              padding: '28px 28px', border: '1px solid #e5e7eb',
              animation: 'fadeInUp 350ms 0.1s ease both'
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-gray-900)', marginBottom: 20, fontFamily: 'var(--font-family-primary)' }}>Profile Information</div>

              {profileSaved && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                  padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#15803d', fontWeight: 600
                }}>Profile updated successfully.</div>
              )}

              <form onSubmit={handleSaveProfile} noValidate>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text" value={profile.fullName}
                    onChange={handleProfileChange('fullName')}
                    style={inputStyle('fullName')}
                    onFocus={e => e.target.style.borderColor = '#16a34a'}
                    onBlur={e => e.target.style.borderColor = profileErrors.fullName ? '#ef4444' : '#d1d5db'}
                  />
                  {profileErrors.fullName && <div style={errorStyle}>{profileErrors.fullName}</div>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Email Address</label>
                  <input
                    type="email" value={profile.email}
                    onChange={handleProfileChange('email')}
                    style={inputStyle('email')}
                    onFocus={e => e.target.style.borderColor = '#16a34a'}
                    onBlur={e => e.target.style.borderColor = profileErrors.email ? '#ef4444' : '#d1d5db'}
                  />
                  {profileErrors.email && <div style={errorStyle}>{profileErrors.email}</div>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Mobile Number</label>
                  <input
                    type="tel" value={profile.mobile}
                    onChange={handleProfileChange('mobile')}
                    style={inputStyle('mobile')}
                    onFocus={e => e.target.style.borderColor = '#16a34a'}
                    onBlur={e => e.target.style.borderColor = profileErrors.mobile ? '#ef4444' : '#d1d5db'}
                  />
                  {profileErrors.mobile && <div style={errorStyle}>{profileErrors.mobile}</div>}
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={labelStyle}>
                    Organization{' '}
                    <span style={{ fontWeight: 400, color: 'var(--color-gray-400)' }}>(optional)</span>
                  </label>
                  <input
                    type="text" value={profile.organization}
                    onChange={handleProfileChange('organization')}
                    style={inputStyle('organization')}
                    onFocus={e => e.target.style.borderColor = '#16a34a'}
                    onBlur={e => e.target.style.borderColor = '#d1d5db'}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '11px 28px', borderRadius: 10, border: 'none',
                    background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                    color: '#fff', fontWeight: 800, fontSize: 14,
                    cursor: 'pointer', boxShadow: 'var(--shadow-md)',
                    fontFamily: 'var(--font-family-primary)'
                  }}
                >Save Changes</button>
              </form>
            </div>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {activeTab === 'notifications' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {prefsSaved && (
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10,
                  padding: '10px 14px', fontSize: 13, color: '#15803d', fontWeight: 600
                }}>Preferences saved successfully.</div>
              )}

              {/* IoT Alert Card */}
              <div className="card" style={{
                background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                padding: '24px 28px', border: '1px solid #e5e7eb',
                animation: 'fadeInUp 350ms 0.1s ease both'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-gray-900)', fontFamily: 'var(--font-family-primary)' }}>IoT Device Connection Alert</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 18, fontFamily: 'var(--font-family-primary)' }}>
                  Get notified when the iSpindel hydrometer connects to the system.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Toggle
                    checked={prefs.iot.inApp}
                    onChange={() => togglePref('iot', 'inApp')}
                    label="In-App Notification"
                  />
                  <Toggle
                    checked={prefs.iot.email}
                    onChange={() => togglePref('iot', 'email')}
                    label="Email"
                  />
                  <Toggle
                    checked={prefs.iot.sms}
                    onChange={() => togglePref('iot', 'sms')}
                    label="SMS"
                  />
                </div>
              </div>

              {/* Fermentation Completion Card */}
              <div className="card" style={{
                background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                padding: '24px 28px', border: '1px solid #e5e7eb',
                animation: 'fadeInUp 350ms 0.18s ease both'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-gray-900)', fontFamily: 'var(--font-family-primary)' }}>Fermentation Completion Alert</div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginBottom: 18, fontFamily: 'var(--font-family-primary)' }}>
                  Get notified when Brix drops to ≤ 1°Bx and fermentation is complete.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <Toggle
                    checked={prefs.fermentation.inApp}
                    onChange={() => togglePref('fermentation', 'inApp')}
                    label="In-App Notification"
                  />
                  <Toggle
                    checked={prefs.fermentation.email}
                    onChange={() => togglePref('fermentation', 'email')}
                    label="Email"
                  />
                  <Toggle
                    checked={prefs.fermentation.sms}
                    onChange={() => togglePref('fermentation', 'sms')}
                    label="SMS"
                  />
                </div>
              </div>

              {/* Info note */}
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
                padding: '12px 16px', fontSize: 12, color: '#92400e', lineHeight: 1.6
              }}>
                <strong>Note:</strong> Email and SMS delivery require server-side configuration.
                In-App notifications are always active when enabled.
              </div>

              {/* Save Preferences Button */}
              <button
                onClick={handleSavePrefs}
                style={{
                  padding: '12px 28px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                  color: '#fff', fontWeight: 800, fontSize: 14,
                  cursor: 'pointer', boxShadow: 'var(--shadow-md)',
                  alignSelf: 'flex-start', fontFamily: 'var(--font-family-primary)'
                }}
              >Save Preferences</button>
            </div>
          )}

          {/* Sign Out */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid var(--color-gray-200)` }}>
            <button
              onClick={() => { logout(); onNavigate('login'); }}
              style={{
                padding: '10px 24px', borderRadius: 10,
                border: '1.5px solid #fca5a5', background: '#fff',
                color: '#dc2626', fontWeight: 700, fontSize: 14,
                cursor: 'pointer', transition: 'all 150ms',
                fontFamily: 'var(--font-family-primary)'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
