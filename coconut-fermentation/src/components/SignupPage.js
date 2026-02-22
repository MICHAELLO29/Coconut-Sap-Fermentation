import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGlobalStyles } from './styles/GlobalStyles';

const SignupPage = ({ onNavigate }) => {
  useGlobalStyles();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    fullName: '', email: '', mobile: '', organization: '', password: '', confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.mobile.trim()) e.mobile = 'Mobile number is required.';
    else if (!/^\+?[\d\s\-]{7,15}$/.test(form.mobile)) e.mobile = 'Enter a valid mobile number.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    const result = signup(form);
    setSubmitting(false);
    if (!result.success) {
      setErrors({ general: result.error });
    } else {
      onNavigate('dashboard');
    }
  };

  const inputStyle = (field) => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: 10,
    border: `1.5px solid ${errors[field] ? '#ef4444' : 'var(--color-gray-300)'}`,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    background: 'var(--color-gray-50)',
    transition: 'border-color 150ms',
    fontFamily: 'var(--font-family-primary)'
  });

  const labelStyle = { fontSize: 13, fontWeight: 700, color: 'var(--color-gray-700)', marginBottom: 5, display: 'block', fontFamily: 'var(--font-family-primary)' };
  const errorStyle = { fontSize: 12, color: '#ef4444', marginTop: 4, fontFamily: 'var(--font-family-primary)' };

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, var(--color-primary-50) 0%, #dcfce7 50%, var(--color-primary-200) 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      fontFamily: 'var(--font-family-primary)'
    }}>
      <div className="card" style={{
        background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        padding: '40px 36px', width: '100%', maxWidth: 460,
        animation: 'fadeInUp 400ms cubic-bezier(0.22,1,0.36,1) both'
      }}>
        {/* Logo + Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/DashboardIcon.png" alt="Logo" style={{ width: 56, height: 56, marginBottom: 10 }} />
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-primary-700)', fontFamily: 'var(--font-family-primary)' }}>Create Account</div>
          <div style={{ fontSize: 13, color: 'var(--color-gray-500)', marginTop: 4, fontFamily: 'var(--font-family-primary)' }}>Coconut Sap Fermentation System</div>
        </div>

        {errors.general && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10,
            padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#991b1b', fontWeight: 600,
            fontFamily: 'var(--font-family-primary)'
          }}>{errors.general}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text" placeholder="Full name"
              value={form.fullName} onChange={handleChange('fullName')}
              style={inputStyle('fullName')}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = errors.fullName ? '#ef4444' : '#d1d5db'}
            />
            {errors.fullName && <div style={errorStyle}>{errors.fullName}</div>}
          </div>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email" placeholder="Email address"
              value={form.email} onChange={handleChange('email')}
              style={inputStyle('email')}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = errors.email ? '#ef4444' : '#d1d5db'}
            />
            {errors.email && <div style={errorStyle}>{errors.email}</div>}
          </div>

          {/* Mobile */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Mobile Number</label>
            <input
              type="tel" placeholder="Mobile number"
              value={form.mobile} onChange={handleChange('mobile')}
              style={inputStyle('mobile')}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = errors.mobile ? '#ef4444' : '#d1d5db'}
            />
            {errors.mobile && <div style={errorStyle}>{errors.mobile}</div>}
          </div>

          {/* Organization (optional) */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Organization / Production Site <span style={{ fontWeight: 400, color: 'var(--color-gray-400)' }}>(optional)</span></label>
            <input
              type="text" placeholder="Organization (optional)"
              value={form.organization} onChange={handleChange('organization')}
              style={inputStyle('organization')}
              onFocus={e => e.target.style.borderColor = '#16a34a'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} placeholder="Password"
                value={form.password} onChange={handleChange('password')}
                style={{ ...inputStyle('password'), paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = errors.password ? '#ef4444' : '#d1d5db'}
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0
              }}><img src={showPass ? '/visible.png' : '/nonvisible.png'} alt={showPass ? 'Hide' : 'Show'} style={{ width: 18, height: 18, opacity: 0.5 }} /></button>
            </div>
            {errors.password && <div style={errorStyle}>{errors.password}</div>}
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'} placeholder="Confirm password"
                value={form.confirmPassword} onChange={handleChange('confirmPassword')}
                style={{ ...inputStyle('confirmPassword'), paddingRight: 44 }}
                onFocus={e => e.target.style.borderColor = '#16a34a'}
                onBlur={e => e.target.style.borderColor = errors.confirmPassword ? '#ef4444' : '#d1d5db'}
              />
              <button type="button" onClick={() => setShowConfirm(p => !p)} style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0
              }}><img src={showConfirm ? '/visible.png' : '/nonvisible.png'} alt={showConfirm ? 'Hide' : 'Show'} style={{ width: 18, height: 18, opacity: 0.5 }} /></button>
            </div>
            {errors.confirmPassword && <div style={errorStyle}>{errors.confirmPassword}</div>}
          </div>

          <button
            type="submit" disabled={submitting}
            style={{
              width: '100%', padding: '13px', borderRadius: 12, border: 'none',
              background: submitting ? 'var(--color-primary-200)' : 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
              color: '#fff', fontWeight: 800, fontSize: 15, cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: 'var(--shadow-md)', transition: 'opacity 150ms',
              fontFamily: 'var(--font-family-primary)'
            }}
          >
            {submitting ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--color-gray-500)', fontFamily: 'var(--font-family-primary)' }}>
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} style={{
            background: 'none', border: 'none', color: 'var(--color-primary-600)', fontWeight: 700,
            cursor: 'pointer', fontSize: 13, padding: 0, fontFamily: 'var(--font-family-primary)'
          }}>Sign In</button>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
