import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGlobalStyles } from './styles/GlobalStyles';

const LoginPage = ({ onNavigate }) => {
  useGlobalStyles();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) { setError('Please enter your email or mobile number.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setSubmitting(true);
    const result = login(identifier.trim(), password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error);
    } else {
      onNavigate('dashboard');
    }
  };

  const inputBase = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    border: '1.5px solid var(--color-gray-300)', fontSize: 14, outline: 'none',
    boxSizing: 'border-box', background: 'var(--color-gray-50)',
    transition: 'border-color 150ms', fontFamily: 'var(--font-family-primary)'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--color-primary-50) 0%, #dcfce7 50%, var(--color-primary-200) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      fontFamily: 'var(--font-family-primary)'
    }}>
      <div className="card" style={{
        background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        padding: '44px 36px', width: '100%', maxWidth: 420,
        animation: 'fadeInUp 400ms cubic-bezier(0.22,1,0.36,1) both'
      }}>
        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/DashboardIcon.png" alt="Logo" style={{ width: 64, height: 64, marginBottom: 12 }} />
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--color-primary-700)', fontFamily: 'var(--font-family-primary)' }}>Coconut Sap Fermentation System</div>
          <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 4, fontFamily: 'var(--font-family-primary)' }}>Welcome Back</div>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#991b1b', fontWeight: 600,
            fontFamily: 'var(--font-family-primary)'
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 5, display: 'block', fontFamily: 'var(--font-family-primary)' }}>
              Email or Mobile Number
            </label>
            <input
              type="text"
              placeholder="Email or mobile number"
              value={identifier}
              onChange={e => { setIdentifier(e.target.value); setError(''); }}
              style={inputBase}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 5, display: 'block', fontFamily: 'var(--font-family-primary)' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                style={{ ...inputBase, paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = '#d1d5db'}
              />
              <button
                type="button"
                onClick={() => setShowPass(p => !p)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-gray-500)', fontSize: 16, padding: 0
                }}
              >
                <img src={showPass ? '/visible.png' : '/nonvisible.png'} alt={showPass ? 'Hide' : 'Show'} style={{ width: 18, height: 18, opacity: 0.5 }} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              background: submitting ? 'var(--color-primary-200)' : 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
              color: '#fff', fontWeight: 800, fontSize: 15,
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-md)', transition: 'opacity 150ms',
              fontFamily: 'var(--font-family-primary)'
            }}
          >
            {submitting ? 'Signing In…' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--color-gray-500)', fontFamily: 'var(--font-family-primary)' }}>
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('signup')}
            style={{
              background: 'none', border: 'none', color: 'var(--color-primary-600)',
              fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0,
              fontFamily: 'var(--font-family-primary)'
            }}
          >Sign Up</button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
