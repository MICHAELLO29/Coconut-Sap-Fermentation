import React, { useState, useMemo, useEffect, useRef } from 'react';

const ConfirmBatch = ({ onNavigate, onToggleMenu }) => {
  // Inject scoped styles and animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes cbFadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      @keyframes cbPop { from { transform: scale(.98); opacity: .6 } to { transform: scale(1); opacity: 1 } }
      .cb-card { animation: cbFadeUp .32s ease both; }
      .cb-stagger > * { animation: cbFadeUp .32s ease both; }
      .cb-stagger > *:nth-child(1) { animation-delay: .04s }
      .cb-stagger > *:nth-child(2) { animation-delay: .08s }
      .cb-stagger > *:nth-child(3) { animation-delay: .12s }
      .cb-stagger > *:nth-child(4) { animation-delay: .16s }
      .cb-stagger > *:nth-child(5) { animation-delay: .20s }
      .cb-stagger > *:nth-child(6) { animation-delay: .24s }
      .cb-pressable { transition: transform 120ms ease, box-shadow 120ms ease }
      .cb-pressable:active { transform: scale(.98) }
      .cb-focus { outline: none }
      .cb-focus:focus { box-shadow: 0 0 0 3px rgba(22,163,74,.25) }
      .cb-seg { display:inline-flex; gap:6px; background:#f1f5f3; padding:4px; border-radius:999px; border:1px solid #d6e7d6 }
      .cb-seg button { border:none; padding:6px 10px; border-radius:999px; background:transparent; font-weight:800; color:#166534; cursor:pointer }
      .cb-seg button.cb-on { background:#16a34a; color:#fff }
      .cb-meter { height:10px; background:#eef6ef; border:1px solid #d9ead9; border-radius:999px; overflow:hidden }
      .cb-meter-bar { height:100%; background:#16a34a; width:0; transition: width 240ms ease }
      .cb-skeleton { background: linear-gradient(90deg,#eee 25%, #f5f5f5 37%, #eee 63%); background-size:400% 100%; animation: cbShimmer 1.2s infinite }
      @keyframes cbShimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }
      @media (prefers-reduced-motion: reduce) {
        .cb-card, .cb-stagger > * { animation: none }
        .cb-meter-bar { transition: none }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  
  // Form state
  const [formData, setFormData] = useState({
    angle: '',
    sg: '',
    brix: '',
    temperature: '',
    liter: '',
    battery: '',
    timestamp: ''
  });

  // Server IP address (Flask backend)
const API_BASE = `http://${process.env.REACT_APP_API_IP || "127.0.0.1"}:${process.env.REACT_APP_API_PORT || "5000"}`;

  // Current batch ID
  const [batchId, setBatchId] = useState(null);
  // Fetch preview readings every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${API_BASE}/preview_reading`)
        .then(res => res.json())
        .then(data => {
          if (data.angle) {
            setFormData(prev => ({
              ...prev,
              angle: data.angle != null ? String(data.angle) : "",
              sg: data.gravity != null ? String(data.gravity) : "",
              brix: data.brix != null ? String(data.brix) : "",
              temperature: data.temperature != null ? String(data.temperature) : "",
              battery: data.battery != null ? String(data.battery) : "",
              timestamp: data.timestamp
            }));
          }
        })
        .catch(err => console.error("Preview fetch error:", err));
    }, 3000);

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Fetch next batch ID when page loads
  useEffect(() => {
    fetch(`${API_BASE}/next_batch_id`)
      .then(res => res.json())
      .then(data => setBatchId(data.next_batch_id))
      .catch(err => console.error("Batch ID fetch error:", err));
  }, []);

  // Autosave draft
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('confirmBatchDraft') || 'null');
      if (saved && typeof saved === 'object') {
        setFormData(prev => ({ ...prev, ...saved }));
      }
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem('confirmBatchDraft', JSON.stringify(formData)); } catch {}
  }, [formData]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Check if there's an active batch
  const [activeBatch, setActiveBatch] = useState(null);

  useEffect(() => {
    fetch(`http://${API_BASE}/active_batch`)
      .then(res => res.json())
      .then(data => {
        if (data.active) {
          setActiveBatch(data.batch_id);
        }
      })
      .catch(err => console.error("Error checking active batch:", err));
  }, []);

  // Confirm & Start monitoring the batch
  const handleConfirm = async () => {
    try {
      const res = await fetch(`http://${API_BASE}/create_batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: formattedStart,
          end_date: formattedEnd,
          liter: formData.liter
        })
      });

      const data = await res.json();
      console.log("Batch created:", data);

      if (data.batch_id) {
        alert(`Batch ${data.batch_id} started`);
        onNavigate("fermentation-monitoring");
      }
    } catch (error) {
      console.error("Error creating batch:", error);
      alert("Failed to create batch. Please try again.");
    }

    // clears draft after confirming
    localStorage.removeItem('confirmBatchDraft');
  };

  // Utility to check if a value is non-empty
  const hasValue = (val) => {
  if (val === null || val === undefined) return false;
  if (typeof val === "number") return !isNaN(val);
  if (typeof val === "string") return val.trim() !== "";
  return false;
  };

  // Removes all input on fields and localStorage (prevents loading previous draft)
  const resetConfirm = async () => {
    setFormData({
      angle: '',
      sg: '',
      brix: '',
      temperature: '',
      liter: '',
      battery: '',
    });

    localStorage.removeItem('confirmBatchDraft');
  };

  // Stops batch if active (set is_logging = 0)
  const stopBatch = async () => {
    // formats BatchId to 3 digits (e.g., 1 → 001)
    const activeBatch_formatted = activeBatch.toString().padStart(3, '0');

    try {
      // Checks if batchId is active
      const checkRes = await fetch(`${API_BASE}/check_active/${activeBatch_formatted}`);
      const checkData = await checkRes.json();
      console.log(`batch id: ${activeBatch_formatted}`, checkData);

      if (!checkData.active) {
        alert(`Batch ${activeBatch} is not active or already stopped.`);
        console.log(`Previous active batch: ${activeBatch}`);
        return;
      }

      // Stops the batch if active
      const stopRes = await fetch(`${API_BASE}/stop_batch/${activeBatch_formatted}`, {
        method: "POST"
      });
      const stopData = await stopRes.json();

      if (stopData.status === "batch_stopped") {
        alert(`Batch ${activeBatch} has been stopped.`);
        setActiveBatch(null);
      }
    } catch (err) {
      console.error("Error stopping batch:", err);
      alert("Failed to stop batch. Check server logs.");
    }
  };

  // Dates
  const today = useMemo(() => new Date(), []);
  const [endOffsetDays, setEndOffsetDays] = useState(4); // default within 3–5
  // ISO storage (for sending to Flask / DB)
  const formattedStart = useMemo(() => {
    return today.toISOString().slice(0, 19).replace("T", " ");
  }, [today]);
  // End date
  const formattedEnd = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + endOffsetDays);
    return d.toISOString().slice(0, 19).replace("T", " ");
  }, [today, endOffsetDays]);
  // User-friendly display (e.g., September 17, 2025)
  function formatReadable(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}


  const handleChangeEndDate = () => {
    // Demo cycle 3 → 4 → 5 → 3
    setEndOffsetDays(prev => (prev >= 5 ? 3 : prev + 1));
  };

  // Segmented selector control
  const setOffset = (d) => setEndOffsetDays(d);

  // Completion meter and validation
  const fieldOrder = ['angle','sg','brix','temperature','liter'];
  const completedCount = fieldOrder.reduce((n, key) => n + (hasValue(formData[key]) ? 1 : 0), 0);
  const totalCount = fieldOrder.length;
  const literInvalid = formData.liter !== '' && !/^\d+(?:\.\d+)?$/.test(formData.liter);

  // Keyboard shortcuts
  const firstEmptyRef = useRef(null);
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        if (firstEmptyRef.current) firstEmptyRef.current.focus();
      }
      if (e.key === 'Enter') {
        // submit only if at least one field and no validation errors
        if (!literInvalid) handleConfirm();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [literInvalid, formData]);

  // Simple skeleton while "loading" sensor values
  const [loading, setLoading] = useState(true);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header same pattern as others with hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 30px', backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div onClick={onToggleMenu} title="menu" style={{ cursor: 'pointer', marginRight: 15 }}>
          <div style={{ width: 36, height: 6, background: '#bdbdbd', borderRadius: 6, marginBottom: 6 }} />
          <div style={{ width: 36, height: 6, background: '#bdbdbd', borderRadius: 6, marginBottom: 6 }} />
          <div style={{ width: 36, height: 6, background: '#bdbdbd', borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <img src="/DashboardIcon.png" alt="Logo" style={{ width: 36, height: 36 }} />
          <h1 style={{ color: '#0ba376ff', fontSize: 28, fontWeight: 700, margin: 0 }}>Confirm Batch</h1>
        </div>
      </div>

    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <div className="confirm-batch-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
        {/* Left: Inputs */}
        <div className="cb-card" style={{ background: '#ffffff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', padding: 18, border: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>Confirm Parameters</div>
            <div style={{ color: '#111', fontWeight: 800 }}>Batch ID: <span style={{ color: '#16a34a' }}>{batchId !== null ? batchId : "Loading..."}</span></div>
          </div>

            {/* Completion meter */}
            <div aria-live="polite" style={{ display:'flex', alignItems:'center', gap:10, margin:'10px 0 12px' }}>
              <div className="cb-meter" style={{ flex:1 }}>
                <div className="cb-meter-bar" style={{ width: `${Math.round((completedCount/Math.max(1,totalCount))*100)}%` }} />
              </div>
              <div style={{ fontSize:12, fontWeight:800, color:'#166534' }}>{completedCount}/{totalCount}</div>
            </div>

            <div className="cb-stagger inputRow" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              {[
                { label: 'Battery', name: 'battery', readOnly: true },
                { label: 'Angle', name: 'angle', readOnly: true },
                { label: 'Gravity (SG)', name: 'sg', readOnly: true },
                { label: 'Brix (°Bx)', name: 'brix', readOnly: true },
                { label: 'Temperature (°C)', name: 'temperature', readOnly: true },
                { label: 'Liter (L)', name: 'liter', readOnly: false }
              ].map((field, idx) => (
                <div key={idx} className="inputRow" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  {/* Label text on the left */}
                  <label
                    htmlFor={field.name}
                    style={{
                      minWidth: 120,
                      textAlign: 'right',
                      fontWeight: 700,
                      fontSize: 14,
                      color: '#374151'
                  }}
                >
                  {field.label}:
                </label>
                  {/* Input with checkmark */}
                  {loading && field.readOnly ? (
                    <div className="cb-skeleton" style={{ flex:1, height:48, borderRadius:10, minWidth: '200px' }} />
                  ) : (
                    <input
                      name={field.name}
                      value={formData[field.name] ?? ""}
                      onChange={handleInputChange}
                      readOnly={field.readOnly}
                      ref={!hasValue(formData[field.name]) && !field.readOnly ? firstEmptyRef : undefined}
                      className="cb-focus inputField"
                      style={{
                        flex: 1,
                        padding: '16px 14px',
                        borderRadius: 10,
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                        fontSize: 14,
                        minWidth: '200px'
                      }}
                    />
                  )}
                  <div
                    title={hasValue(formData[field.name]) ? 'Complete' : 'Missing'}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: `2px solid ${hasValue(formData[field.name]) ? '#16a34a' : '#e5e7eb'}`,
                      background: hasValue(formData[field.name]) ? '#e8f5e8' : '#ffffff',
                      color: '#16a34a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      transition: 'transform 150ms ease',
                      transform: hasValue(formData[field.name]) ? 'scale(1)' : 'scale(.9)',
                      flexShrink: 0
                    }}
                  >
                    {hasValue(formData[field.name]) ? '✓' : ''}
                  </div>
                </div>
              ))}
            </div>

            {/* Inline validation */}
            {literInvalid && (
              <div role="status" aria-live="assertive" style={{ color:'#b91c1c', fontSize:12, fontWeight:800, marginTop:4 }}>Enter a valid number for Liter (e.g., 21 or 21.5).</div>
            )}

            <div style={{ textAlign: 'center', color: '#9ca3af', marginTop: 16 }}>Please make sure parameters are complete.</div>
          </div>

          {/* Right: Dates panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="cb-card" style={{ background: '#eaf6ea', padding: 0, borderRadius: 12, border: '2px solid #cfe3cf', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ padding: 14, background: '#ffffff', borderRight: '1px solid #cfe3cf', borderBottom: '1px solid #cfe3cf', color: '#065f46', fontWeight: 800 }}>Start Date</div>
                <div style={{ padding: 14, background: '#ffffff', borderBottom: '1px solid #cfe3cf', textAlign: 'right', color: '#16a34a', fontWeight: 900 }}>{formatReadable(formattedStart)}</div>
                <div style={{ padding: 14, background: '#ffffff', borderRight: '1px solid #cfe3cf', color: '#065f46', fontWeight: 800 }}>End Date</div>
                <div style={{ padding: 14, background: '#ffffff', textAlign: 'right', color: '#16a34a', fontWeight: 900 }}>{formatReadable(formattedEnd)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems:'center' }}>
              <div className="cb-seg" role="tablist" aria-label="Estimated end in days">
                {[3,4,5].map(d => (
                  <button key={d} role="tab" aria-selected={endOffsetDays===d} className={endOffsetDays===d? 'cb-on' : ''} onClick={() => setOffset(d)}>{d}d</button>
                ))}
              </div>
              <button onClick={handleChangeEndDate} className="cb-pressable" style={{ background: '#16a34a', color: '#ffffff', fontWeight: 800, border: 'none', padding: '10px 14px', borderRadius: 999, cursor: 'pointer' }}>Change End Date</button>
            </div>

            {/* Timeline */}
            <div className="cb-card" style={{ background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#16a34a' }} />
                <div style={{ flex:1, height:4, background:'#e5efe6', position:'relative', borderRadius:999 }}>
                  <div style={{ position:'absolute', left:0, top:0, bottom:0, width:`${((endOffsetDays-3)/(5-3))*100}%`, background:'#a7f3d0', borderRadius:999 }} />
                </div>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#16a34a' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:12, color:'#166534', fontWeight:800 }}>
                <div>Start</div>
                <div>{endOffsetDays} days</div>
                <div>End</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: centered CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, flexWrap: 'wrap', gap: 16 }}>
          {activeBatch ? (
            <div className="primaryButton" style={{minWidth: 260, background: '#db2222ff', color: "#ffffff", fontWeight: 900, border: 'none', padding: '14px 28px', borderRadius: 12, boxShadow: '0 6px 16px rgba(219,34,34,0.25)', textAlign: 'center' }}>
              Batch {activeBatch} is currently active
              </div>
          ) : (
          <button onClick={handleConfirm} className="primaryButton" style={{ minWidth: 260, background: '#16a34a', color: '#ffffff', fontWeight: 900, border: 'none', padding: '14px 28px', borderRadius: 12, cursor: 'pointer', boxShadow: '0 6px 16px rgba(22,163,74,0.25)' }}>
            Confirm & Start
          </button>
          )}
          <button onClick={resetConfirm} className="secondaryButton" style={{ minWidth: 260, background: '#a5a5a5ff', color: '#000000', fontWeight: 900, border: 'none', padding: '14px 28px', borderRadius: 12, cursor: 'pointer', boxShadow: '0 6px 16px rgba(22,163,74,0.25)'}}>
            Reset Values
          </button>
          {activeBatch && (<button onClick={stopBatch} className="primaryButton" style={{ minWidth:260, background: '#ff4040ff', color: '#ffffff', fontWeight: 900, border: 'none', padding: '14px 28px', borderRadius: 12, cursor: 'pointer', boxShadow: '0 6px 16px rgba(255,64,64,0.25)' }}>
            Stop Active Batch
          </button>)}
        </div>
      </div>
    </div>
  );
};  

export default ConfirmBatch;
