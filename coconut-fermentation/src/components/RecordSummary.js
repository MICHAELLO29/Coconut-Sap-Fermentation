import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from './Header';
import { commonStyles, useGlobalStyles } from './styles/GlobalStyles';

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

const RecordSummary = ({ onToggleMenu }) => {
	useGlobalStyles(); // Inject global styles
	
	// Load batches similar to Dashboard
	const defaultBatches = useMemo(() => ([
		{ id: '001', startDate: '20/05/25', endDate: '23/05/25', brix: '16.0', alcohol: '25.0', temperature: '32 C', timeInterval: '56:04:01' },
		{ id: '002', startDate: '22/05/25', endDate: '25/05/25', brix: 'N/A', alcohol: 'N/A', temperature: 'N/A', timeInterval: 'N/A' },
		{ id: '003', startDate: '25/05/25', endDate: '28/05/25', brix: 'N/A', alcohol: 'N/A', temperature: 'N/A', timeInterval: 'N/A' },
		{ id: '004', startDate: '27/05/25', endDate: '30/05/25', brix: 'N/A', alcohol: 'N/A', temperature: 'N/A', timeInterval: 'N/A' },
		{ id: '005', startDate: '30/05/25', endDate: '02/06/25', brix: 'N/A', alcohol: 'N/A', temperature: 'N/A', timeInterval: 'N/A' }
	]), []);
	
	const [refreshTick, setRefreshTick] = useState(0);
	
	const batchesRaw = useMemo(() => {
		try {
			const saved = JSON.parse(localStorage.getItem('batches') || 'null');
			return saved && Array.isArray(saved) && saved.length ? saved : defaultBatches;
		} catch { return defaultBatches; }
	}, [defaultBatches, refreshTick]);
	
	const batches = useMemo(() => computeStatuses(batchesRaw), [batchesRaw]);
	const sortedBatches = useMemo(() =>
		[...batches].sort((a,b) => (parseInt(a.id,10)||0) - (parseInt(b.id,10)||0)),
		[batches]
	);
	
	const [selectedId, setSelectedId] = useState(sortedBatches[0]?.id || '');
	useEffect(()=>{ if (sortedBatches.length && !sortedBatches.find(b=>b.id===selectedId)) setSelectedId(sortedBatches[0].id); }, [sortedBatches, selectedId]);
	
	// Listen for localStorage changes and refresh data
	useEffect(() => {
		const onStorage = (e) => {
			if (!e || !e.key || e.key === 'batches') {
				setRefreshTick(prev => prev + 1);
			}
		};
		
		// Also refresh periodically to catch any missed updates
		const interval = setInterval(() => {
			setRefreshTick(prev => prev + 1);
		}, 2000);
		
		window.addEventListener('storage', onStorage);
		
		return () => {
			clearInterval(interval);
			window.removeEventListener('storage', onStorage);
		};
	}, []);
	
	const selected = useMemo(() => sortedBatches.find(b => b.id === selectedId) || sortedBatches[0] || {}, [sortedBatches, selectedId]);
	const [summaryLoading, setSummaryLoading] = useState(false);
	useEffect(()=>{ setSummaryLoading(true); const t=setTimeout(()=>setSummaryLoading(false), 300); return ()=>clearTimeout(t); }, [selectedId]);

	// RecordSummary: keyboard prev/next and ARIA live announcements
	const liveRef = useRef(null);
	useEffect(()=>{
		const onKey = (e) => {
			if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
				e.preventDefault();
				const idx = sortedBatches.findIndex(b => b.id === selectedId);
				if (idx >= 0) {
					const nextIdx = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(sortedBatches.length - 1, idx + 1);
					setSelectedId(sortedBatches[nextIdx]?.id || selectedId);
				}
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [selectedId, sortedBatches]);

	// Animate panels on mount
	useEffect(() => {
		const root = document.querySelector('.record-summary-page');
		if (!root) return;
		const panels = root.querySelectorAll('.panel');
		panels.forEach((el, idx) => {
			setTimeout(() => el.classList.add('enter'), idx * 70);
		});
	}, [selectedId]);

	const displayEndDate = useMemo(() => {
		if (!selected?.startDate) return selected?.endDate || null;
		const start = parseDMY(selected.startDate);
		const providedEnd = selected?.endDate ? parseDMY(selected.endDate) : null;
		if (!providedEnd) return addDays(selected.startDate, 4);
		const days = Math.round((providedEnd - start) / (1000 * 60 * 60 * 24));
		if (days < 3 || days > 5) return addDays(selected.startDate, 4);
		return selected.endDate;
	}, [selected]);
	
	const durationDays = useMemo(() => {
		if (!selected?.startDate || !displayEndDate) return 'N/A';
		const ms = parseDMY(displayEndDate) - parseDMY(selected.startDate);
		const d = Math.round(ms / (1000 * 60 * 60 * 24));
		return `${d} day${d === 1 ? '' : 's'}`;
	}, [selected, displayEndDate]);
	
	const isReady = selected?.status === 'Ready';
	const analysisText = isReady ? 'Based on the input parameters, the tuba is ready for distillation.' : 'Batch is queued; more data is needed before distillation.';

	// Completion meter across displayed fields
	const summaryFields = [selected?.brix, selected?.alcohol, selected?.temperature, selected?.timeInterval, selected?.startDate];
	const summaryCompleted = summaryFields.reduce((n,v)=>n+(v?1:0),0);
	const summaryTotal = summaryFields.length;

	return (
		<div className="record-summary-page" style={commonStyles.pageContainer}>
			<Header title="Record Summary" onToggleMenu={onToggleMenu} />
			<div aria-live="polite" ref={liveRef} style={{ position:'absolute', width:1, height:1, overflow:'hidden', clip:'rect(0 0 0 0)' }}>{`Batch ${selected?.id || ''} ${isReady? 'Ready':'Not Ready'}`}</div>
			<div className="summaryGrid" style={commonStyles.detailsGrid}>
				<div className="panel ux-card" style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position:'relative' }}>
					<div style={{ position:'sticky', top:0, background:'#fff', paddingBottom:12, zIndex:1 }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
						<div style={{ fontSize: 28, fontWeight: 800, color: '#111' }}>Batch {selected?.id || '—'}</div>
						<select value={selectedId} onChange={(e)=>setSelectedId(e.target.value)} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e0e0e0' }}>
							{sortedBatches.map(b => {
								const label = String(parseInt(b.id,10)||0).toString().padStart(3,'0');
								return <option key={b.id} value={b.id}>{label}</option>;
							})}
						</select>
					</div>
					<div style={{ display:'flex', alignItems:'center', gap:8, marginTop:8 }}>
						<button onClick={()=>{ const i=sortedBatches.findIndex(b=>b.id===selectedId); if(i>0) setSelectedId(sortedBatches[i-1].id); }} className="ux-pressable" style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:8, padding:'6px 10px', cursor:'pointer' }}>Prev</button>
						<button onClick={()=>{ const i=sortedBatches.findIndex(b=>b.id===selectedId); if(i<sortedBatches.length-1 && i>=0) setSelectedId(sortedBatches[i+1].id); }} className="ux-pressable" style={{ border:'1px solid #e5e7eb', background:'#fff', borderRadius:8, padding:'6px 10px', cursor:'pointer' }}>Next</button>
						<span style={{ fontSize:12, fontWeight:800, color:isReady?'#16a34a':'#7f1d1d', background:isReady?'#e8f5e8':'#fee2e2', border:'1px solid', borderColor:isReady?'#a7f3d0':'#fecaca', borderRadius:999, padding:'4px 8px' }}>{isReady? 'Ready':'Not Ready'}</span>
					</div>
					</div>
					<div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
						<div className="ux-meter" style={{ flex:1 }}><div className="ux-meter-bar" style={{ width: `${Math.round((summaryCompleted/Math.max(1,summaryTotal))*100)}%` }} /></div>
						<div style={{ fontSize:12, color:'#166534', fontWeight:800 }}>{summaryCompleted}/{summaryTotal}</div>
					</div>
					{summaryLoading ? (
						<div>
							{[...Array(6)].map((_,i)=>(<div key={i} className="ux-skeleton" style={{ height:52, borderRadius:12, marginBottom:12 }} />))}
						</div>
					) : (
					<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
						{[
							{ label: 'Brix (sugar):', value: selected?.brix ?? 'N/A', hint:'Target ≥ 15 °Bx' },
							{ label: 'Alcohol Content:', value: selected?.alcohol ?? 'N/A', hint:'Target ≥ 20 %' },
							{ label: 'Temperature:', value: selected?.temperature ?? 'N/A', hint:'Optimal 28–35 °C' },
							{ label: 'Time Interval', value: selected?.timeInterval ?? 'N/A' },
							{ label: 'Log Date', value: selected?.startDate ?? 'N/A' },
						].map((row, i) => (
							<div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', border:'1px solid #eee', borderRadius:12, background:'#fff' }}>
								<div style={{ color:'#111', fontWeight:800 }}>{row.label}{row.hint && <div style={{ fontSize:11, color:'#8a8f98', fontWeight:600 }}>{row.hint}</div>}</div>
								<div style={{ color:'#111', fontWeight:800, fontSize:18 }}>{row.value}</div>
							</div>
						))}
					</div>
					)}
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					<div className="panel ux-card" style={{ background: isReady ? '#e8f5e8' : '#fee2e2', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 20, fontWeight: 800, color: isReady ? '#1b5e20' : '#7f1d1d', marginBottom: 6 }}>Analysis</div>
						<div style={{ display: 'flex', gap: 12 }}>
							<div style={{ width: 26, height: 26, background: isReady ? '#16a34a' : '#e11d48', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{isReady ? '✓' : '✕'}</div>
							<div style={{ color: isReady ? '#065f46' : '#7f1d1d', fontWeight: 700 }}>{analysisText}</div>
						</div>
					</div>
					<div className="panel ux-card" style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 20, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Production Summary</div>
						<div style={{
							display: 'grid', gridTemplateColumns: '1fr 1fr', border: '2px solid #cfe3cf', borderRadius: 12, overflow: 'hidden', background: '#eaf6ea'
						}}>
							<div style={{ padding: 14, background: '#fff', borderRight: '1px solid #cfe3cf', borderBottom: '1px solid #cfe3cf' }}>Batch</div>
							<div style={{ padding: 14, background: '#fff', borderBottom: '1px solid #cfe3cf' }}>{selected?.id || '—'}</div>
							<div style={{ padding: 14, background: '#fff', borderRight: '1px solid #cfe3cf', borderBottom: '1px solid #cfe3cf' }}>Total Tuba Produced</div>
							<div style={{ padding: 14, background: '#fff', borderBottom: '1px solid #cfe3cf' }}>{selected?.produced ?? 'N/A'}</div>
							<div style={{ padding: 14, background: '#fff', borderRight: '1px solid #cfe3cf', borderBottom: '1px solid #cfe3cf' }}>Duration</div>
							<div style={{ padding: 14, background: '#fff', borderBottom: '1px solid #cfe3cf' }}>
								{durationDays}
								<div style={{ fontSize: 11, color: '#8a8f98', marginTop: 6 }}>Start Date {selected?.startDate || '—'}<br/>End Date {displayEndDate || '—'}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RecordSummary;