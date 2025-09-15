import React, { useState, useMemo } from 'react';

const ConfirmBatch = ({ onNavigate, onOpenMenu }) => {
  const [formData, setFormData] = useState({
    angle: '',
    sg: '',
    brix: '',
    temperature: '',
    ph: '',
    liter: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirm = () => {
    console.log("Confirming batch with:", formData);
  };

  const hasValue = (val) => val && val.trim() !== "";

  // Dates
  const today = useMemo(() => new Date(), []);
  const [endOffsetDays, setEndOffsetDays] = useState(4); // default within 3–5
  const formattedStart = useMemo(() => today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), [today]);
  const formattedEnd = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + endOffsetDays);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [today, endOffsetDays]);

  const handleChangeEndDate = () => {
    // Demo cycle 3 → 4 → 5 → 3
    setEndOffsetDays(prev => (prev >= 5 ? 3 : prev + 1));
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header same pattern as others with hamburger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 30px', backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <img src="/DashboardIcon.png" alt="Logo" style={{ width: 36, height: 36 }} />
          <h1 style={{ color: '#4CAF50', fontSize: 28, fontWeight: 700, margin: 0 }}>Confirm Batch</h1>
        </div>
        <div onClick={onOpenMenu} title="menu" style={{ cursor: 'pointer' }}>
          <div style={{ width: 36, height: 6, background: '#bdbdbd', borderRadius: 6, marginBottom: 6 }} />
          <div style={{ width: 36, height: 6, background: '#bdbdbd', borderRadius: 6, marginBottom: 6 }} />
          <div style={{ width: 36, height: 6, background: '#bdbdbd', borderRadius: 6 }} />
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
          {/* Left: Inputs */}
          <div style={{ background: '#ffffff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', padding: 18, border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>Confirm Parameters</div>
              <div style={{ color: '#111', fontWeight: 800 }}>Batch ID: <span style={{ color: '#16a34a' }}>001</span></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              {[
                { label: 'Angle', name: 'angle', readOnly: true },
                { label: 'Gravity (SG)', name: 'sg', readOnly: true },
                { label: 'Brix (°Bx)', name: 'brix', readOnly: true },
                { label: 'Temperature (°C)', name: 'temperature', readOnly: true },
                { label: 'pH Level', name: 'ph', readOnly: true },
                { label: 'Liter (L)', name: 'liter', readOnly: false }
              ].map((field, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    placeholder={field.label}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    readOnly={field.readOnly}
                    style={{ flex: 1, padding: '16px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 14 }}
                  />
                  <div title={hasValue(formData[field.name]) ? 'Complete' : 'Missing'} style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${hasValue(formData[field.name]) ? '#16a34a' : '#e5e7eb'}`, background: hasValue(formData[field.name]) ? '#e8f5e8' : '#ffffff', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                    {hasValue(formData[field.name]) ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: 16 }}>Please make sure parameters are complete.</div>
          </div>

          {/* Right: Dates panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#eaf6ea', padding: 0, borderRadius: 12, border: '2px solid #cfe3cf', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ padding: 14, background: '#ffffff', borderRight: '1px solid #cfe3cf', borderBottom: '1px solid #cfe3cf', color: '#065f46', fontWeight: 800 }}>Start Date</div>
                <div style={{ padding: 14, background: '#ffffff', borderBottom: '1px solid #cfe3cf', textAlign: 'right', color: '#16a34a', fontWeight: 900 }}>{formattedStart}</div>
                <div style={{ padding: 14, background: '#ffffff', borderRight: '1px solid #cfe3cf', color: '#065f46', fontWeight: 800 }}>End Date</div>
                <div style={{ padding: 14, background: '#ffffff', textAlign: 'right', color: '#16a34a', fontWeight: 900 }}>{formattedEnd}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleChangeEndDate} style={{ background: '#16a34a', color: '#ffffff', fontWeight: 800, border: 'none', padding: '10px 14px', borderRadius: 999, cursor: 'pointer' }}>Change End Date</button>
            </div>
          </div>
        </div>

        {/* Bottom: centered CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <button onClick={handleConfirm} style={{ minWidth: 260, background: '#16a34a', color: '#ffffff', fontWeight: 900, border: 'none', padding: '14px 28px', borderRadius: 12, cursor: 'pointer', boxShadow: '0 6px 16px rgba(22,163,74,0.25)' }}>
            Confirm & Start
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmBatch;
