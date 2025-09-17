import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from './Header';
import { commonStyles, useGlobalStyles } from './styles/GlobalStyles';

// Backend API base URL: override via REACT_APP_API_BASE, defaults to Flask on :5000
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

// Helpers
const parseDMY = (d) => {
	if (!d) return new Date(0);
	const [dd, mm, yy] = d.split('/');
	const year = Number(yy) + 2000; // '25' -> 2025
	return new Date(year, Number(mm) - 1, Number(dd));
};

const formatDMY = (date) => {
	const dd = String(date.getDate()).padStart(2, '0');
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const yy = String(date.getFullYear()).slice(-2);
	return `${dd}/${mm}/${yy}`;
};

const addDays = (dateStr, days) => {
	const dt = parseDMY(dateStr);
	dt.setDate(dt.getDate() + days);
	return formatDMY(dt);
};

const computeStatuses = (list) => {
	return list.map((b) => {
		const brixNum = parseFloat(b.brix);
		const alcoholNum = parseFloat(b.alcohol);
		const tempStr = String(b.temperature || '');
		const tempNum = parseFloat(tempStr.replace(/[^\d.]/g, ''));
		
		const isReady = Number.isFinite(brixNum) && brixNum >= 15 && 
						Number.isFinite(alcoholNum) && alcoholNum >= 20 && 
						Number.isFinite(tempNum) && tempNum >= 28 && tempNum <= 35;
		
		return { ...b, status: isReady ? 'Ready' : 'N/A' };
	});
};

const SaveNewRecord = ({ onToggleMenu, onNavigate }) => {
	useGlobalStyles(); // Inject global styles
	
	const [formData, setFormData] = useState({ 
		brix: '', 
		alcoholContent: '', 
		temperature: '', 
		producedLiters: '', 
		timeInterval: '', 
		logDate: formatDMY(new Date()) 
	});
	
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState('');
	const firstInvalidRef = useRef(null);
	
	// Autosave draft
	useEffect(()=>{ 
		try { 
			const saved = JSON.parse(localStorage.getItem('saveDraft')||'null'); 
			if (saved && typeof saved==='object') setFormData(prev=>({...prev, ...saved})); 
		} catch {} 
	},[]);
	
	useEffect(()=>{ 
		try { 
			localStorage.setItem('saveDraft', JSON.stringify(formData)); 
		} catch {} 
	}, [formData]);
	
	const [toast, setToast] = useState({ open: false, message: '', tone: 'success' });
	const [confirmOpen, setConfirmOpen] = useState(false);
	const confirmActionRef = useRef(null);
	
	const showToast = (message, tone = 'success') => {
		setToast({ open: true, message, tone });
		setTimeout(() => setToast(prev => ({ ...prev, open: false })), 2500);
	};
	
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		if (name === 'temperature') {
			const digits = String(value).replace(/[^0-9]/g, '');
			setFormData(prev => ({ ...prev, temperature: digits }));
			return;
		}
		if (name === 'producedLiters') {
			// allow decimals; sanitize to digits and one dot
			const cleaned = String(value).replace(/[^0-9.]/g, '').replace(/(\..*)\./, '$1');
			setFormData(prev => ({ ...prev, producedLiters: cleaned }));
			return;
		}
		setFormData(prev => ({ ...prev, [name]: value }));
	};
	
	const stepField = (key, delta) => {
		setFormData(prev => {
			const raw = String(prev[key] || '0').replace(/[^0-9.]/g, '');
			const num = parseFloat(raw);
			const next = Number.isFinite(num) ? num + delta : delta;
			const fixed = key === 'temperature' ? String(Math.max(0, Math.round(next))) : String(Math.max(0, parseFloat(next.toFixed(1))));
			return { ...prev, [key]: fixed };
		});
	};
	
	const inputBox = (label, name, value, helper) => (
		<div className="inputRow" style={{ 
			display: 'flex', 
			flexDirection: 'column', 
			gap: 'var(--spacing-3)',
			padding: 'var(--spacing-4)',
			background: helper?.valid === false ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255, 255, 255, 0.5)',
			borderRadius: 'var(--radius-lg)',
			border: `2px solid ${helper?.valid === false ? '#ef4444' : 'var(--color-gray-200)'}`,
			transition: 'all var(--transition-fast)'
		}}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<label style={{ 
					color: helper?.valid === false ? '#dc2626' : 'var(--color-gray-700)', 
					fontWeight: 700, 
					minWidth: 140,
					fontSize: 'var(--font-size-sm)',
					textTransform: 'uppercase',
					letterSpacing: '0.05em'
				}}>{label}</label>
				<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', flex: 1, maxWidth: 350 }}>
					{name === 'logDate' ? (
						<input
							name="logDate"
							type="date"
							value={(function(){
								try {
									const d = parseDMY(value || formatDMY(new Date()));
									const y = d.getFullYear();
									const m = String(d.getMonth()+1).padStart(2,'0');
									const dd = String(d.getDate()).padStart(2,'0');
									return `${y}-${m}-${dd}`;
								} catch { return ''; }
							})()}
							onChange={(e)=>{
								const iso = e.target.value; // YYYY-MM-DD
								if (!iso) return;
								const [Y,M,D] = iso.split('-');
								const yy = String(Y).slice(-2);
								const dmy = `${D}/${M}/${yy}`;
								setFormData(prev=>({ ...prev, logDate: dmy }));
							}}
							className="ux-focus"
							style={{ flex: 1, padding: '14px 12px', borderRadius: 12, border: '1px solid #e5e7eb', background: '#f6f7f7', textAlign: 'right', fontSize: 16, color: '#333' }}
						/>
					) : name === 'timeInterval' ? (
						<input
							name={name}
							type="text"
							value={value}
							onChange={e => setFormData(prev => ({ ...prev, [name]: e.target.value }))}
							style={{
								...commonStyles.inputField,
								borderColor: helper?.valid === false ? '#ef4444' : 'var(--color-gray-200)',
								background: helper?.valid === false ? 'rgba(254, 242, 242, 0.8)' : 'rgba(255, 255, 255, 0.8)',
								boxShadow: helper?.valid === false ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'var(--shadow-sm)'
							}}
							ref={helper?.valid === false ? firstInvalidRef : null}
							aria-invalid={helper?.valid === false}
							aria-describedby={helper?.message ? `${name}-error` : undefined}
						/>
					) : (
						<>
							<button type="button" onClick={() => stepField(name, -1)} className="ux-pressable" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>-</button>
							<input
								name={name}
								value={value}
								onChange={handleInputChange}
								type={'text'}
								step={name === 'temperature' ? '1' : undefined}
								min={name === 'temperature' ? '0' : undefined}
								ref={helper && helper.valid===false && !firstInvalidRef.current ? firstInvalidRef : undefined}
								aria-invalid={helper ? helper.valid===false : undefined}
								className={name === 'temperature' ? 'ux-focus no-spin' : 'ux-focus'}
								style={commonStyles.inputField}
							/>
							<button type="button" onClick={() => stepField(name, 1)} className="ux-pressable" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>+</button>
						</>
					)}
				</div>
			</div>
			{helper && helper.message && (
				<div 
					id={`${name}-error`}
					role={helper.valid === false ? 'alert' : 'status'}
					aria-live={helper.valid === false ? 'assertive' : 'polite'}
					style={{ 
						fontSize: 'var(--font-size-sm)', 
						color: helper.valid === false ? '#dc2626' : 'var(--color-primary-600)', 
						fontWeight: 600, 
						marginTop: 'var(--spacing-2)',
						padding: 'var(--spacing-2) var(--spacing-3)',
						background: helper.valid === false ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
						borderRadius: 'var(--radius-md)',
						border: `1px solid ${helper.valid === false ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)'}`,
						display: 'flex',
						alignItems: 'center',
						gap: 'var(--spacing-2)'
					}}>
					<span aria-hidden="true">{helper.valid === false ? '⚠️' : '✅'}</span>
					{helper.message}
				</div>
			)}
		</div>
	);

	// Real-time analysis based on current inputs (simple rule-of-thumb)
	const analysis = useMemo(() => {
		const brix = parseFloat(formData.brix);
		const alcohol = parseFloat(formData.alcoholContent);
		const temp = parseFloat(formData.temperature);
		const okBrix = Number.isFinite(brix) && brix >= 15; // target >= 15
		const okAlcohol = Number.isFinite(alcohol) && alcohol >= 20; // target >= 20
		const okTemp = Number.isFinite(temp) && temp >= 28 && temp <= 35; // optimal window
		const ready = okBrix && okAlcohol && okTemp;
		const reasons = [];
		if (!okBrix) reasons.push('Brix below target');
		if (!okAlcohol) reasons.push('Alcohol below target');
		if (!okTemp) reasons.push('Temperature out of range');
		return {
			ready,
			statusText: ready ? 'tuba is ready for distillation' : 'tuba is not yet ready for distillation',
			reasons
		};
	}, [formData]);

	// Animate panels on mount
	useEffect(() => {
		const root = document.querySelector('.save-record');
		if (!root) return;
		const panels = root.querySelectorAll('.panel');
		panels.forEach((el, idx) => {
			setTimeout(() => el.classList.add('enter'), idx * 70);
		});
	}, []);

	// Completion meter and validation
	const completed = ['brix','alcoholContent','temperature','timeInterval','logDate'].reduce((n,k)=>n + (String(formData[k]||'').trim()?1:0), 0);
	const total = 5;
	const brixNum = parseFloat(formData.brix);
	const alcNum = parseFloat(formData.alcoholContent);
	const tempNum = parseFloat(formData.temperature);
	const reqOk = Number.isFinite(brixNum) && Number.isFinite(alcNum) && Number.isFinite(tempNum) && String(formData.logDate||'').trim();
	
	const helpers = {
		brix: { 
			text: 'Target ≥ 15 °Bx', 
			valid: Number.isFinite(brixNum) ? brixNum>=15 : undefined,
			message: Number.isFinite(brixNum) ? (brixNum>=15 ? 'Optimal for fermentation' : 'Below optimal range - batch may not be ready') : undefined
		},
		alcoholContent: { 
			text: 'Target ≥ 20 %', 
			valid: Number.isFinite(alcNum) ? alcNum>=20 : undefined,
			message: Number.isFinite(alcNum) ? (alcNum>=20 ? 'Good alcohol content' : 'Low alcohol content - needs more fermentation') : undefined
		},
		temperature: { 
			text: 'Optimal 28–35 °C', 
			valid: Number.isFinite(tempNum) ? (tempNum>=28 && tempNum<=35) : undefined,
			message: Number.isFinite(tempNum) ? (tempNum>=28 && tempNum<=35 ? 'Optimal temperature range' : 'Temperature outside optimal range') : undefined
		},
		producedLiters: { text: 'Optional (e.g., 21.5 L)', valid: undefined },
		timeInterval: { text: 'e.g., 56:04:01', valid: String(formData.timeInterval||'').trim()?true:undefined },
		logDate: { text: 'Required', valid: String(formData.logDate||'').trim()?true:false }
	};

	// Shortcut key for saving (Enter)
	useEffect(()=>{
		const onKey = (e) => { if (e.key==='Enter' && reqOk && !saving) handleSave(); };
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [reqOk, saving]);

	const [nextId, setNextId] = useState(null);
	  // Fetch next batch ID when page loads
	useEffect(() => {
	fetch("http://localhost:5000/next_batch_id")
		.then(res => res.json())
		.then(data => setNextId(data.next_batch_id))
		.catch(err => console.error("Batch ID fetch error:", err));
	}, []);

	const handleSave = async () => {
		try {
			setSaveError('');
			if (!reqOk) { if (firstInvalidRef.current) firstInvalidRef.current.focus(); return; }
			setSaving(true);
			const existing = JSON.parse(localStorage.getItem('batches') || '[]');
			const fresh = setNextId();
			const start = formData.logDate || formatDMY(new Date());
			// Estimate completion within 3–5 days. Use 4 days as midpoint.
			const end = addDays(start, 4);
			const newRec = {
				id: fresh,
				startDate: start,
				endDate: end,
				brix: formData.brix || 'N/A',
				alcohol: formData.alcoholContent || 'N/A',
				temperature: formData.temperature ? `${parseFloat(formData.temperature)} C` : 'N/A',
				timeInterval: formData.timeInterval || 'N/A',
				produced: formData.producedLiters ? `${parseFloat(formData.producedLiters)} L` : 'N/A'
			};
			console.log(fresh, newRec);

			// Attempt to persist through Flask API; fallback to localStorage if offline
			try {
				await fetch(`${API_BASE}/batches`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(newRec)
				});
			} catch {}
			const updated = computeStatuses([...existing, newRec]);
			localStorage.setItem('batches', JSON.stringify(updated));

			// update liters chart based on manual Produced Liters (fallback to brix-based estimate)
			const label = (()=>{ const d = parseDMY(start); const m = d.toLocaleString('en-US',{month:'short'}); const day = String(d.getDate()).padStart(2,'0'); return `${m}-${day}`; })();
			let liters = parseFloat(formData.producedLiters);
			if (!Number.isFinite(liters)) {
				const brixNum = parseFloat(formData.brix);
				if (Number.isFinite(brixNum)) liters = Math.max(0, Math.round(brixNum*3));
			}
			if (Number.isFinite(liters)) {
				const seedL = JSON.parse(localStorage.getItem('chart_liters')||'[]');
				const upL = Array.isArray(seedL)? seedL.filter(r=>r.date!==label).concat([{date:label, liters}]):[{date:label, liters}];
				localStorage.setItem('chart_liters', JSON.stringify(upL));
			}
			showToast(`Record saved (Batch ${fresh.str}). It will appear in the batch list.`, 'success');
			if (onNavigate) {
				setTimeout(() => onNavigate('dashboard'), 1200);
			}
		} catch (e) {
			console.error(e);
			setSaveError('Network error. Please try again.');
			showToast('Failed to save record.', 'error');
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => {
		// open custom confirm
		confirmActionRef.current = () => {
			localStorage.removeItem('batches');
			localStorage.removeItem('chart_liters');
			localStorage.removeItem('chart_sales');
			showToast('All data cleared. Chart will only show new saved records.', 'success');
			onNavigate && onNavigate('dashboard');
			setConfirmOpen(false);
		};
		setConfirmOpen(true);
	};

	return (
		<div className="save-record" style={commonStyles.pageContainer}>
			<Header title="Save New Record" onToggleMenu={onToggleMenu} />
			<div className="detailsGrid" style={commonStyles.detailsGrid}>
				<div className="panel" style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
					<div style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 12 }}>Production Details</div>
					<div style={{ display:'flex', alignItems:'center', gap:10, margin:'6px 0 16px' }}>
						<div className="ux-meter" style={{ flex:1 }}><div className="ux-meter-bar" style={{ width: `${Math.round((completed/Math.max(1,total))*100)}%` }} /></div>
						<div style={{ fontSize:12, color:'#166534', fontWeight:800 }}>{completed}/{total}</div>
					</div>
					<div style={{ background: '#f1f2f4', display: 'inline-block', padding: '8px 14px', borderRadius: 10, marginBottom: 18, color: '#333', fontWeight: 700 }}>Batch Number: {nextId}</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
						{inputBox('Brix (sugar)', 'brix', formData.brix, helpers.brix)}
						{inputBox('Alcohol Content', 'alcoholContent', formData.alcoholContent, helpers.alcoholContent)}
						{inputBox('Temperature', 'temperature', formData.temperature, helpers.temperature)}
						{inputBox('Time Interval:', 'timeInterval', formData.timeInterval, helpers.timeInterval)}
						{inputBox('Produced Liters', 'producedLiters', formData.producedLiters, helpers.producedLiters)}
						{inputBox('Log Date:', 'logDate', formData.logDate, helpers.logDate)}
					</div>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					<div className="panel" style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 20, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Real-time Analysis</div>
						<div style={{ color: analysis.ready ? '#065f46' : '#7f1d1d', fontWeight: 800 }}>
							Based on the input parameters, the <span style={{ color: analysis.ready ? '#16a34a' : '#e11d48' }}>{analysis.statusText}</span>
						</div>
						{!analysis.ready && analysis.reasons.length > 0 && (
							<ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18, color: '#333' }}>
								{analysis.reasons.map((r, i) => (<li key={i}>{r}</li>))}
							</ul>
						)}
					</div>
					<div className="panel" style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 20, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Fermentation Timeline</div>
						<div style={{ background: '#eaf6ea', border: '2px solid #cfe3cf', borderRadius: 12, overflow: 'hidden' }}>
							<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
								<div style={{ padding: 14, background: '#ffffff', borderRight: '1px solid #cfe3cf', borderBottom: '1px solid #cfe3cf', color: '#065f46', fontWeight: 800 }}>Start Date</div>
								<div style={{ padding: 14, background: '#ffffff', borderBottom: '1px solid #cfe3cf', textAlign: 'right', color: '#16a34a', fontWeight: 900 }}>{formData.logDate}</div>
								<div style={{ padding: 14, background: '#ffffff', borderRight: '1px solid #cfe3cf', color: '#065f46', fontWeight: 800 }}>End Date</div>
								<div style={{ padding: 14, background: '#ffffff', textAlign: 'right', color: '#16a34a', fontWeight: 900 }}>{addDays(formData.logDate, 4)}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '24px 0 40px' }}>
				<button disabled={!reqOk || saving} title={!reqOk? 'Fill required fields to save' : ''} className="pressable" onClick={handleSave} style={{ ...commonStyles.primaryButton, background: !reqOk ? '#a7f3d0' : '#16a34a', cursor: !reqOk? 'not-allowed':'pointer' }}>
					{saving && <span className="ux-skeleton" style={{ width:18, height:18, borderRadius:'50%' }} />}
					Save Record
				</button>
				<button className="pressable" onClick={handleReset} style={commonStyles.secondaryButton}>
					Reset
				</button>
			</div>
			{saveError && (
				<div style={{ textAlign:'center', color:'#b91c1c', fontWeight:800, marginTop:-24, marginBottom:24 }}>
					{saveError} <button onClick={handleSave} style={{ background:'transparent', border:'none', color:'#16a34a', cursor:'pointer' }}>Retry</button>
				</div>
			)}
			{/* Toast notification */}
			{toast.open && (
				<div style={{ ...commonStyles.toast, ...(toast.tone==='error'?commonStyles.errorToast:commonStyles.successToast) }}>
					{toast.message}
				</div>
			)}
			{/* Confirm modal */}
			{confirmOpen && (
				<div style={commonStyles.modalOverlay}>
					<div style={commonStyles.modalContent}>
						<div style={{ fontWeight: 900, color: '#065f46', marginBottom: 8 }}>Confirm</div>
						<div style={{ color: '#111', marginBottom: 16 }}>Reset all batches and dashboard?</div>
						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
							<button onClick={() => setConfirmOpen(false)} style={{ background: '#ffffff', border: '2px solid #e5e7eb', color: '#374151', padding: '10px 16px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
							<button onClick={() => { if (confirmActionRef.current) confirmActionRef.current(); }} style={{ background: '#16a34a', border: 'none', color: '#ffffff', padding: '10px 18px', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>OK</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SaveNewRecord;