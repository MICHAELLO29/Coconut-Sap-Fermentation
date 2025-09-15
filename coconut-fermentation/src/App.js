import React, { useState, useMemo, useEffect, useRef } from 'react';
import ConfirmBatch from './components/ConfirmBatch';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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
	const sorted = [...list].sort((a, b) => parseDMY(a.startDate) - parseDMY(b.startDate));
	return sorted.map((b, idx) => ({ ...b, status: idx === 0 ? 'Ready' : 'N/A' }));
};

// Shared UI: Hamburger + Side Menu
const SideMenu = ({ isOpen, onClose, onNavigate, currentPage }) => {
	return (
		<>
			{isOpen && (
				<div
					style={{
						position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
						background: 'rgba(0,0,0,0.25)', zIndex: 999, animation: 'fadeIn 180ms ease'
					}}
					onClick={onClose}
				/>
			)}
			<div
				className="menu"
				style={{
					position: 'fixed', top: 0,
					right: isOpen ? 0 : -300,
					height: '100vh', width: 300,
					background: '#fff', boxShadow: '0 0 18px rgba(0,0,0,0.2)', transition: 'right 200ms ease', zIndex: 1000,
					display: 'flex', flexDirection: 'column'
				}}
			>
				<div style={{ padding: '20px 20px 10px', borderBottom: '1px solid #eee' }}>
					<div style={{ fontSize: 18, fontWeight: 700, color: '#4CAF50' }}>Menu</div>
				</div>
				<div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
					{[
						{ key: 'dashboard', label: 'Dashboard' },
						{ key: 'save-record', label: 'Save New Record' },
						{ key: 'record-summary', label: 'Record Summary' },
						{ key: 'fermentation-monitoring', label: 'Fermentation Monitoring' },
						{ key: 'confirm-batch', label: 'Confirm Batch' }
					].map(item => (
						<button
							key={item.key}
							onClick={() => onNavigate(item.key)}
							style={{
								textAlign: 'left', padding: '12px 14px', border: '1px solid #e0e0e0', borderRadius: 8, cursor: 'pointer',
								background: currentPage === item.key ? '#e8f5e8' : '#fff', fontWeight: 600, color: '#333', transition: 'background 120ms'
							}}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>
		</>
	);
};

const Header = ({ title, rightContent, onOpenMenu }) => (
	<div style={{
		display: 'flex', justifyContent: 'space-between', alignItems: 'center',
		padding: '20px 30px', backgroundColor: 'white', borderBottom: '1px solid #e0e0e0', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
	}}>
		<div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
				<img src="/DashboardIcon.png" alt="Logo" style={{ width: 40, height: 40 }} />
			</div>
			<h1 style={{ color: '#4CAF50', fontSize: 28, fontWeight: 700, margin: 0 }}>{title}</h1>
		</div>
		<div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
			{rightContent}
			<div title="menu" onClick={onOpenMenu} style={{ cursor: 'pointer', transform: 'translateZ(0)' }}>
				<div style={{ width: 36, height: 6, background: '#bdbdbd', borderRadius: 6, marginBottom: 6 }} />
				<div style={{ width: 36, height: 6, background: '#bdbdbd', borderRadius: 6, marginBottom: 6 }} />
				<div style={{ width: 36, height: 6, background: '#bdbdbd', borderRadius: 6 }} />
			</div>
		</div>
	</div>
);

const Dashboard = ({ onOpenMenu }) => {
	const [now, setNow] = useState(new Date());
	// Trigger re-computation from API/localStorage periodically and on storage events
	const [refreshTick, setRefreshTick] = useState(0);
	const [apiBatches, setApiBatches] = useState(null);
	const [dashLoading, setDashLoading] = useState(true);
	useEffect(()=>{ const t=setTimeout(()=>setDashLoading(false), 420); return ()=>clearTimeout(t); },[]);
	// Load batches from localStorage or fallback
	const defaultBatches = useMemo(() => ([
		{ id: '001', startDate: '20/05/25', endDate: '23/05/25', phLevel: 5.6, brix: 16.0, alcohol: 25.0 },
		{ id: '002', startDate: '22/05/25', endDate: '25/05/25' },
		{ id: '003', startDate: '25/05/25', endDate: '28/05/25' },
		{ id: '004', startDate: '27/05/25', endDate: '30/05/25' },
		{ id: '005', startDate: '30/05/25', endDate: '02/06/25' }
	]), []);
	const batchesRaw = useMemo(() => {
		try {
			// Prefer API batches when available
			if (Array.isArray(apiBatches) && apiBatches.length) return apiBatches;
			const saved = JSON.parse(localStorage.getItem('batches') || 'null');
			return saved && Array.isArray(saved) && saved.length ? saved : defaultBatches;
		} catch { return defaultBatches; }
	}, [defaultBatches, refreshTick, apiBatches]);
	const batches = useMemo(() => computeStatuses(batchesRaw), [batchesRaw]);

	// Live update cue
	const [justUpdated, setJustUpdated] = useState(false);
	useEffect(()=>{ setJustUpdated(true); const t=setTimeout(()=>setJustUpdated(false), 900); return ()=>clearTimeout(t); }, [refreshTick, apiBatches]);

	// Filters (chips)
	const [statusFilter, setStatusFilter] = useState('all'); // all | ready | progress
	const filteredBatches = useMemo(()=>{
		if (statusFilter==='ready') return batches.filter(b=>b.status==='Ready');
		if (statusFilter==='progress') return batches.filter(b=>b.status!=='Ready');
		return batches;
	}, [batches, statusFilter]);

	useEffect(() => {
		const t = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(t);
	}, []);

	// Periodically refresh and listen for external updates (e.g., API save, other tabs)
	useEffect(() => {
		const poll = setInterval(() => setRefreshTick((v) => v + 1), 3000);
		const onStorage = (e) => {
			if (!e || !e.key || e.key === 'batches' || e.key.startsWith('chart_')) setRefreshTick((v) => v + 1);
		};
		window.addEventListener('storage', onStorage);
		return () => {
			clearInterval(poll);
			window.removeEventListener('storage', onStorage);
		};
	}, []);

	// Fetch batches from Flask API with graceful fallback
	useEffect(() => {
		let aborted = false;
		const fetchBatches = async () => {
			try {
				const res = await fetch(`${API_BASE}/api/batches`);
				if (!res.ok) throw new Error('Bad response');
				const data = await res.json();
				if (!aborted) setApiBatches(Array.isArray(data) ? data : null);
			} catch {
				if (!aborted) setApiBatches(null);
			}
		};
		fetchBatches();
		const id = setInterval(fetchBatches, 5000);
		return () => { aborted = true; clearInterval(id); };
	}, [refreshTick]);

	useEffect(() => {
		// Inject responsive CSS + animations once
		const style = document.createElement('style');
		style.innerHTML = `
			@keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
			@keyframes pop { from { opacity: 0; transform: scale(.98) translateY(6px) } to { opacity: 1; transform: scale(1) translateY(0) } }
			.card { animation: pop .35s ease both; transition: transform 160ms ease; }
			.card:hover { transform: translateY(-2px); }
			.chartCard { animation: pop .35s ease .05s both; }
			.tableWrap { animation: pop .35s ease .05s both; }
			.menu { width: 300px; }
			.inputRow { gap: 12px; }
			.inputRow input { width: 100%; }
			/* Global UX helpers */
			@keyframes uxFadeUp { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
			.ux-card { animation: uxFadeUp .32s ease both; }
			.ux-pressable { transition: transform 120ms ease, box-shadow 120ms ease; }
			.ux-pressable:active { transform: scale(.98); }
			.ux-focus { outline: none; }
			.ux-focus:focus { box-shadow: 0 0 0 3px rgba(22,163,74,.25); }
			.ux-meter { height: 10px; background:#eef6ef; border:1px solid #d9ead9; border-radius:999px; overflow:hidden; }
			.ux-meter-bar { height:100%; background:#16a34a; width:0; transition: width 240ms ease; }
			.ux-skeleton { background: linear-gradient(90deg,#eee 25%, #f5f5f5 37%, #eee 63%); background-size:400% 100%; animation: uxShimmer 1.2s infinite; }
			@keyframes uxShimmer { 0% { background-position: 100% 0 } 100% { background-position: -100% 0 } }
			.ux-seg { display:inline-flex; gap:6px; background:#f1f5f3; padding:4px; border-radius:999px; border:1px solid #d6e7d6; }
			.ux-seg button { border:none; padding:6px 10px; border-radius:999px; background:transparent; font-weight:800; color:#166534; cursor:pointer; }
			.ux-seg button.on { background:#16a34a; color:#fff; }
			/* Remove number input spinners when we handle steppers ourselves */
			input.no-spin::-webkit-outer-spin-button,
			input.no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
			input.no-spin[type=number] { -moz-appearance: textfield; }
			/* Generic panel animation used on Save New Record and Record Summary */
			.panel { opacity: 0; transform: translateY(10px); }
			.panel.enter { opacity: 1; transform: translateY(0); transition: opacity .4s ease, transform .4s ease; }
			.pressable { transition: transform 120ms ease; }
			.pressable:active { transform: scale(0.98); }
			.detailsGrid, .summaryGrid, .monitorGrid { grid-template-columns: 1.2fr 1fr; }
			@media (max-width: 980px) {
				.grid-3 { grid-template-columns: 1fr !important; }
				.grid-2 { grid-template-columns: 1fr !important; }
				.menu { width: 85vw !important; }
				.detailsGrid, .summaryGrid, .monitorGrid { grid-template-columns: 1fr !important; }
				.inputRow { flex-direction: column; align-items: flex-start; }
			}
		`;
		document.head.appendChild(style);
		return () => { document.head.removeChild(style); };
	}, []);

	const timeEl = (
		<div style={{ textAlign: 'right' }}>
			<div style={{ fontSize: 16, color: '#9e9e9e', fontWeight: 500 }}>{now.toLocaleTimeString('en-US', { hour12: true })}</div>
			<div style={{ fontSize: 14, color: '#9e9e9e' }}>{now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
		</div>
	);

	// Quick insight metrics for an at-a-glance dashboard
	const readyCount = useMemo(() => batches.filter(b => b.status === 'Ready').length, [batches]);
	const notReadyCount = useMemo(() => Math.max(0, (batches?.length || 0) - readyCount), [batches, readyCount]);

	// Animated counters
	const useCountUp = (target, durationMs = 600) => {
		const [value, setValue] = useState(0);
		useEffect(() => {
			let raf = 0; const start = performance.now(); const from = value; const to = Number(target) || 0;
			const tick = (t) => {
				const p = Math.min(1, (t - start) / durationMs);
				const eased = 1 - Math.pow(1 - p, 3);
				setValue(Math.round(from + (to - from) * eased));
				if (p < 1) raf = requestAnimationFrame(tick);
			};
			raf = requestAnimationFrame(tick);
			return () => cancelAnimationFrame(raf);
		// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [target]);
		return value;
	};
	const dispTotal = useCountUp(batches.length);
	const dispReady = useCountUp(readyCount);
	const dispNotReady = useCountUp(notReadyCount);
	const nextCompletion = useMemo(() => {
		const today = new Date();
		const futureDates = (batches || [])
			.map(b => b?.endDate ? parseDMY(b.endDate) : null)
			.filter((d) => d && d >= new Date(today.getFullYear(), today.getMonth(), today.getDate()));
		if (futureDates.length) {
			return new Date(Math.min.apply(null, futureDates));
		}
		// If no future completions, show the most recent past completion if available
		const pastDates = (batches || [])
			.map(b => b?.endDate ? parseDMY(b.endDate) : null)
			.filter((d) => d && d < today);
		if (pastDates.length) {
			return new Date(Math.max.apply(null, pastDates));
		}
		return null;
	}, [batches, now]);
	const lastRecordDate = useMemo(() => {
		const dates = (batches || [])
			.map(b => b?.startDate ? parseDMY(b.startDate) : null)
			.filter(Boolean);
		if (!dates.length) return null;
		const max = new Date(Math.max.apply(null, dates));
		return max;
	}, [batches, refreshTick]);

	// Build chart base data from batches
	const toLabel = (dmy) => {
		if (!dmy) return 'N/A';
		const d = parseDMY(dmy);
		const month = d.toLocaleString('en-US', { month: 'short' }); // May, Jun
		const day = String(d.getDate()).padStart(2, '0');
		return `${month}-${day}`;
	};
	const baseSeries = useMemo(() => {
		// Prefer seeded chart data (used after Reset). If missing, use built-in sample to match reference.
		let seedLiters = null;
		let seedSales = null;
		try {
			seedLiters = JSON.parse(localStorage.getItem('chart_liters') || 'null');
			seedSales = JSON.parse(localStorage.getItem('chart_sales') || 'null');
		} catch {}
		if (!Array.isArray(seedLiters) || !seedLiters.length || !Array.isArray(seedSales) || !seedSales.length) {
			seedLiters = [
				{ date: 'May-22', liters: 26 },
				{ date: 'May-25', liters: 28 },
				{ date: 'May-27', liters: 22 },
				{ date: 'May-29', liters: 39 },
				{ date: 'May-31', liters: 26 },
				{ date: 'Jun-02', liters: 45 },
				{ date: 'Jun-05', liters: 41 },
				{ date: 'Jun-07', liters: 38 },
				{ date: 'Jun-10', liters: 40 },
				{ date: 'Jun-12', liters: 31 },
				{ date: 'Jun-16', liters: 38 }
			];
			seedSales = [
				{ date: 'May-22', sales: 1500 },
				{ date: 'May-25', sales: 1550 },
				{ date: 'May-27', sales: 1600 },
				{ date: 'May-29', sales: 1700 },
				{ date: 'May-31', sales: 900 },
				{ date: 'Jun-02', sales: 950 },
				{ date: 'Jun-05', sales: 1600 },
				{ date: 'Jun-07', sales: 1700 },
				{ date: 'Jun-10', sales: 1800 },
				{ date: 'Jun-12', sales: 1900 },
				{ date: 'Jun-16', sales: 2000 }
			];
		}
		// Merge seed arrays by date
		const byDate = {};
		seedLiters.forEach(r => { byDate[r.date] = { date: r.date, liters: r.liters ?? null, sales: null }; });
		seedSales.forEach(r => { byDate[r.date] = { ...(byDate[r.date] || { date: r.date, liters: null }), sales: r.sales ?? null }; });
		const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
		return Object.values(byDate).sort((a,b)=>{
			const [ma,da] = a.date.split('-');
			const [mb,db] = b.date.split('-');
			if (ma !== mb) return monthOrder.indexOf(ma) - monthOrder.indexOf(mb);
			return parseInt(da,10) - parseInt(db,10);
		});
 
		// NOTE: we only fall back to batches when there are no seeds at all (handled above with sample),
		// so we always return before reaching here.
	}, [batches]);

	const lambanogData = baseSeries.map(r => ({ date: r.date, liters: r.liters }));

	// Day / Month / Year selector for chart
	const [litersRange, setLitersRange] = useState('day');
	const aggregateBy = (rows, valueKey, unit) => {
		if (unit === 'day') return rows;
		// Helper: month aggregation
		const toMonthTotals = () => {
			const totals = {};
			rows.forEach(r => {
				const month = (r.date || '').split('-')[0];
				totals[month] = (totals[month] || 0) + (r[valueKey] || 0);
			});
			const monthOrder = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
			return Object.entries(totals)
				.sort((a,b) => monthOrder.indexOf(a[0]) - monthOrder.indexOf(b[0]))
				.map(([label, total]) => ({ date: label, [valueKey]: total }));
		};
		if (unit === 'month') {
			return toMonthTotals();
		}
		if (unit === 'year') {
			// For this dataset, show monthly points within the year (more readable than a single total point)
			return toMonthTotals();
		}
		return rows;
	};
	const litersChartData = useMemo(() => aggregateBy(lambanogData, 'liters', litersRange), [lambanogData, litersRange]);

	// Action Center: derive issues (simple heuristics)
	const issues = useMemo(()=>{
		return batches.map(b=>{
			const ageDays = Math.max(0, Math.round((new Date() - parseDMY(b.startDate)) / (1000*60*60*24)));
			const late = b?.endDate ? (parseDMY(b.endDate) < new Date() && b.status!=='Ready') : false;
			const lowPH = Number(b.phLevel) && b.phLevel < 5.0;
			const lowBrix = Number(b.brix) && b.brix < 15;
			const needs = (late || lowPH || lowBrix) ? ['Check batch'] : [];
			if (late) needs.push('Past end date');
			if (lowPH) needs.push('pH low');
			if (lowBrix) needs.push('Brix low');
			return { id:b.id, tags: needs, ageDays };
		}).filter(x=>x.tags.length);
	},[batches, refreshTick]);

	return (
		<div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<Header title="Coconut Sap Fermentation Center" rightContent={timeEl} onOpenMenu={onOpenMenu} />

			<div className="grid-3" style={{
				display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, margin: 20, marginTop: 10, marginBottom: 20
			}}>
				<div className="card ux-card" style={{ background: 'white', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center', border: '2px solid #333' }}>
					<h3 style={{ color: '#333', fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Total Batches</h3>
					<div style={{ fontSize: 40, fontWeight: 900, color: '#111', lineHeight: 1 }}>{dispTotal}</div>
					<div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Last record {lastRecordDate ? lastRecordDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'N/A'}</div>
				</div>
				<div className="card ux-card" style={{ background: '#e8f5e8', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center', border: '2px solid #4CAF50' }}>
					<h3 style={{ color: '#1b5e20', fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Batches Ready</h3>
					<div style={{ fontSize: 40, fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>{dispReady}</div>
					<div style={{ fontSize: 12, color: '#1b5e20', marginTop: 8 }}>Next completion {nextCompletion ? nextCompletion.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'N/A'}</div>
				</div>
				<div className="card ux-card" style={{ background: '#ffebee', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center', border: '2px solid #f44336' }}>
					<h3 style={{ color: '#7f1d1d', fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Batches In Progress</h3>
					<div style={{ fontSize: 40, fontWeight: 900, color: '#e11d48', lineHeight: 1 }}>{dispNotReady}</div>
					<div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 8 }}>Monitoring for optimal pH and Brix</div>
				</div>
			</div>

			{/* Quick Insights */}
			<div className="card" style={{ background: '#ffffff', padding: 18, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', margin: '0 20px 10px', border: '1px solid #e5e7eb' }}>
				<div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
					<div style={{ minWidth: 220 }}>
						<div style={{ fontSize: 12, color: '#6b7280', fontWeight: 800 }}>Most Recent Record</div>
						<div style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{lastRecordDate ? lastRecordDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>
					</div>
					<div style={{ minWidth: 220 }}>
						<div style={{ fontSize: 12, color: '#6b7280', fontWeight: 800 }}>Next Estimated Completion</div>
						<div style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{nextCompletion ? nextCompletion.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>
					</div>
					<div style={{ minWidth: 220 }}>
						<div style={{ fontSize: 12, color: '#6b7280', fontWeight: 800 }}>Current Time</div>
						<div style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
					</div>
				</div>
			</div>

			<div className="tableWrap ux-card" style={{ background: 'white', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', margin: 20, marginBottom: 30 }}>
				<h2 style={{ color: '#333', fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Batch List</h2>
				<div style={{ overflowX: 'auto' }}>
					{/* Outer frame */}
					<div style={{ border: '3px solid #16a34a', borderRadius: 12, overflow: 'hidden' }}>
						{dashLoading ? (
							<div style={{ padding:20 }}>
								<div className="ux-skeleton" style={{ height:16, marginBottom:10, borderRadius:6 }} />
								{[...Array(5)].map((_,i)=>(<div key={i} className="ux-skeleton" style={{ height:42, marginBottom:8, borderRadius:8 }} />))}
							</div>
						) : (
						<table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 14 }}>
							<thead>
								<tr style={{ background: '#fff', color: '#111' }}>
									{['Batch ID','Start Date','End Date','pH Level (%)','Brix (%)','Alcohol (%)','Fermentation Status'].map((h) => (
										<th key={h} style={{ padding: '14px 12px', textAlign: 'center', fontWeight: 800, borderRight: '2px solid #16a34a', borderBottom: '2px solid #16a34a' }}>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{filteredBatches.map((batch) => (
									<tr key={batch.id} style={{ backgroundColor: '#fff' }}>
										<td style={{ padding: '14px 12px', textAlign: 'center', borderRight: '2px solid #16a34a', borderBottom: '2px solid #16a34a', wordBreak: 'break-word' }}>{batch.id}</td>
										<td style={{ padding: '14px 12px', textAlign: 'center', borderRight: '2px solid #16a34a', borderBottom: '2px solid #16a34a' }}>{batch.startDate}</td>
										<td style={{ padding: '14px 12px', textAlign: 'center', borderRight: '2px solid #16a34a', borderBottom: '2px solid #16a34a' }}>{batch.endDate}</td>
										<td style={{ padding: '14px 12px', textAlign: 'center', borderRight: '2px solid #16a34a', borderBottom: '2px solid #16a34a' }}>{batch.status === 'Ready' ? batch.phLevel : 'N/A'}</td>
										<td style={{ padding: '14px 12px', textAlign: 'center', borderRight: '2px solid #16a34a', borderBottom: '2px solid #16a34a' }}>{batch.status === 'Ready' ? batch.brix : 'N/A'}</td>
										<td style={{ padding: '14px 12px', textAlign: 'center', borderRight: '2px solid #16a34a', borderBottom: '2px solid #16a34a' }}>{batch.status === 'Ready' ? batch.alcohol : 'N/A'}</td>
										<td style={{ padding: '14px 12px', textAlign: 'center', borderRight: '2px solid #16a34a', borderBottom: '2px solid #16a34a', color: batch.status === 'Ready' ? '#16a34a' : '#e11d48', fontWeight: 800 }}>{batch.status === 'Ready' ? 'Ready' : 'NA'}</td>
									</tr>
								))}
							</tbody>
						</table>
						)}
					</div>
				</div>
			</div>

			<div className="chartCard" style={{ background: 'white', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', margin: 20, marginBottom: 30 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
					<h3 style={{ color: '#333', fontSize: 18, fontWeight: 600 }}>Total Liters of Lambanog Made</h3>
					<select value={litersRange} onChange={(e) => setLitersRange(e.target.value)} style={{ fontSize: 12, color: '#333', border: '1px solid #e0e0e0', borderRadius: 6, padding: '4px 8px', background: '#fff' }}>
						<option value="day">Day</option>
						<option value="month">Month</option>
						<option value="year">Year</option>
					</select>
				</div>
				<div style={{ width: '100%', height: 400 }}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart data={litersChartData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="date" />
							<YAxis />
							<Tooltip />
							<Bar dataKey="liters" fill="#4CAF50" />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
};

	const SaveNewRecord = ({ onOpenMenu, onNavigate }) => {
	const [formData, setFormData] = useState({ brix: '16.0', alcoholContent: '25.0', temperature: '32', producedLiters: '', timeInterval: '56:04:01', logDate: '20/05/25' });
	const [saving, setSaving] = useState(false);
	const [saveError, setSaveError] = useState('');
	const firstInvalidRef = useRef(null);
	// Autosave draft
	useEffect(()=>{ try { const saved = JSON.parse(localStorage.getItem('saveDraft')||'null'); if (saved && typeof saved==='object') setFormData(prev=>({...prev, ...saved})); } catch {} },[]);
	useEffect(()=>{ try { localStorage.setItem('saveDraft', JSON.stringify(formData)); } catch {} }, [formData]);
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
		<div className="inputRow" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<label style={{ color: '#6b7280', fontWeight: 800, minWidth: 140 }}>{label}</label>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 350 }}>
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
						style={{ flex: 1, padding: '18px 16px', borderRadius: 12, border: '1px solid #eee', background: '#f6f7f7', textAlign: 'right', fontSize: 18, color: '#333' }}
					/>
					<button type="button" onClick={() => stepField(name, 1)} className="ux-pressable" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>+</button>
				</div>
			</div>
			{helper && (
				<div style={{ alignSelf: 'flex-end', maxWidth: 350, color: helper.valid===false ? '#b91c1c' : '#6b7280', fontSize: 12 }}>
					{helper.text}
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
	const reqOk = (Number.isFinite(brixNum) && brixNum>=15) && (Number.isFinite(alcNum) && alcNum>=20) && (Number.isFinite(tempNum) && tempNum>=28 && tempNum<=35) && String(formData.logDate||'').trim();
	const helpers = {
		brix: { text: 'Target ≥ 15 °Bx', valid: Number.isFinite(brixNum) ? brixNum>=15 : undefined },
		alcoholContent: { text: 'Target ≥ 20 %', valid: Number.isFinite(alcNum) ? alcNum>=20 : undefined },
		temperature: { text: 'Optimal 28–35 °C', valid: Number.isFinite(tempNum) ? (tempNum>=28 && tempNum<=35) : undefined },
		producedLiters: { text: 'Optional (e.g., 21.5 L)', valid: undefined },
		timeInterval: { text: 'e.g., 56:04:01', valid: String(formData.timeInterval||'').trim()?true:undefined },
		logDate: { text: 'Required', valid: String(formData.logDate||'').trim()?true:false }
	};

	useEffect(()=>{
		const onKey = (e) => { if (e.key==='Enter' && reqOk && !saving) handleSave(); };
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [reqOk, saving]);

	const getNextId = () => {
		try {
			const arr = JSON.parse(localStorage.getItem('batches') || '[]');
			const max = arr.reduce((m, b) => {
				const n = parseInt(b.id, 10);
				return Number.isFinite(n) && n > m ? n : m;
			}, 0);
			const next = max + 1;
			return { num: next, str: String(next).padStart(3, '0') };
		} catch {
			return { num: 1, str: '001' };
		}
	};
	const nextId = getNextId();

	const handleSave = async () => {
		try {
			setSaveError('');
			if (!reqOk) { if (firstInvalidRef.current) firstInvalidRef.current.focus(); return; }
			setSaving(true);
			const existing = JSON.parse(localStorage.getItem('batches') || '[]');
			const fresh = getNextId();
			const start = formData.logDate || formatDMY(new Date());
			// Estimate completion within 3–5 days. Use 4 days as midpoint.
			const end = addDays(start, 4);
			const newRec = {
				id: fresh.str,
				startDate: start,
				endDate: end,
				brix: formData.brix || 'N/A',
				alcohol: formData.alcoholContent || 'N/A',
				temperature: formData.temperature ? `${parseInt(formData.temperature, 10)} C` : 'N/A',
				timeInterval: formData.timeInterval || 'N/A',
				produced: formData.producedLiters ? `${parseFloat(formData.producedLiters)} L` : undefined
			};

			// Attempt to persist through Flask API; fallback to localStorage if offline
			try {
				await fetch(`${API_BASE}/api/batches`, {
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
		if (false) {
			localStorage.removeItem('batches');
			// Seed charts to match the reference (fourth image)
			const seedLiters = [
				{ date: 'May-22', liters: 26 },
				{ date: 'May-25', liters: 28 },
				{ date: 'May-27', liters: 22 },
				{ date: 'May-29', liters: 39 },
				{ date: 'May-31', liters: 26 },
				{ date: 'Jun-02', liters: 45 },
				{ date: 'Jun-05', liters: 41 },
				{ date: 'Jun-07', liters: 38 },
				{ date: 'Jun-10', liters: 40 },
				{ date: 'Jun-12', liters: 31 },
				{ date: 'Jun-16', liters: 38 }
			];
			const seedSales = [
				{ date: 'May-22', sales: 1500 },
				{ date: 'May-25', sales: 1550 },
				{ date: 'May-27', sales: 1600 },
				{ date: 'May-29', sales: 1700 },
				{ date: 'May-31', sales: 900 },
				{ date: 'Jun-02', sales: 950 },
				{ date: 'Jun-05', sales: 1600 },
				{ date: 'Jun-07', sales: 1700 },
				{ date: 'Jun-10', sales: 1800 },
				{ date: 'Jun-12', sales: 1900 },
				{ date: 'Jun-16', sales: 2000 }
			];
			localStorage.setItem('chart_liters', JSON.stringify(seedLiters));
			localStorage.setItem('chart_sales', JSON.stringify(seedSales));
			showToast('Batches reset.', 'success');
			onNavigate && onNavigate('dashboard');
		}
		// open custom confirm
		confirmActionRef.current = () => {
			localStorage.removeItem('batches');
			const seedLiters = [
				{ date: 'May-22', liters: 26 },
				{ date: 'May-25', liters: 28 },
				{ date: 'May-27', liters: 22 },
				{ date: 'May-29', liters: 39 },
				{ date: 'May-31', liters: 26 },
				{ date: 'Jun-02', liters: 45 },
				{ date: 'Jun-05', liters: 41 },
				{ date: 'Jun-07', liters: 38 },
				{ date: 'Jun-10', liters: 40 },
				{ date: 'Jun-12', liters: 31 },
				{ date: 'Jun-16', liters: 38 }
			];
			const seedSales = [
				{ date: 'May-22', sales: 1500 },
				{ date: 'May-25', sales: 1550 },
				{ date: 'May-27', sales: 1600 },
				{ date: 'May-29', sales: 1700 },
				{ date: 'May-31', sales: 900 },
				{ date: 'Jun-02', sales: 950 },
				{ date: 'Jun-05', sales: 1600 },
				{ date: 'Jun-07', sales: 1700 },
				{ date: 'Jun-10', sales: 1800 },
				{ date: 'Jun-12', sales: 1900 },
				{ date: 'Jun-16', sales: 2000 }
			];
			localStorage.setItem('chart_liters', JSON.stringify(seedLiters));
			localStorage.setItem('chart_sales', JSON.stringify(seedSales));
			showToast('Batches reset.', 'success');
			onNavigate && onNavigate('dashboard');
			setConfirmOpen(false);
		};
		setConfirmOpen(true);
	};

	return (
		<div className="save-record" style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<Header title="Save New Record" onOpenMenu={onOpenMenu} />
			<div className="detailsGrid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, padding: 24 }}>
				<div className="panel" style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
					<div style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 12 }}>Production Details</div>
					<div style={{ display:'flex', alignItems:'center', gap:10, margin:'6px 0 16px' }}>
						<div className="ux-meter" style={{ flex:1 }}><div className="ux-meter-bar" style={{ width: `${Math.round((completed/Math.max(1,total))*100)}%` }} /></div>
						<div style={{ fontSize:12, color:'#166534', fontWeight:800 }}>{completed}/{total}</div>
					</div>
					<div style={{ background: '#f1f2f4', display: 'inline-block', padding: '8px 14px', borderRadius: 10, marginBottom: 18, color: '#333', fontWeight: 700 }}>Batch Number: {nextId.str}</div>
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
					{/* Production Forecast panel removed per requirements */}
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
				<button disabled={!reqOk || saving} title={!reqOk? 'Fill required fields to save' : ''} className="pressable" onClick={handleSave} style={{ background: !reqOk ? '#a7f3d0' : '#16a34a', color: '#fff', fontWeight: 800, border: 'none', padding: '16px 42px', borderRadius: 50, fontSize: 18, cursor: !reqOk? 'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:10 }}>
					{saving && <span className="ux-skeleton" style={{ width:18, height:18, borderRadius:'50%' }} />}
					Save Record
				</button>
				<button className="pressable" onClick={handleReset} style={{ background: '#ffffff', color: '#333', fontWeight: 700, border: '2px solid #e5e7eb', padding: '16px 24px', borderRadius: 50, fontSize: 16, cursor: 'pointer' }}>
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
				<div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: toast.tone==='error'?'#fee2e2':'#e8f5e8', color: toast.tone==='error'?'#991b1b':'#065f46', border: `2px solid ${toast.tone==='error'?'#fecaca':'#a7f3d0'}`, padding: '12px 16px', borderRadius: 12, fontWeight: 800, boxShadow: '0 8px 18px rgba(0,0,0,0.08)', zIndex: 2000 }}>
					{toast.message}
				</div>
			)}
			{/* Confirm modal */}
			{confirmOpen && (
				<div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1999 }}>
					<div style={{ background: '#ffffff', border: '2px solid #a7f3d0', borderRadius: 12, padding: 20, width: 360, boxShadow: '0 10px 28px rgba(0,0,0,0.15)' }}>
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

const RecordSummary = ({ onOpenMenu }) => {
	// Load batches similar to Dashboard
	const defaultBatches = useMemo(() => ([
		{ id: '001', startDate: '20/05/25', endDate: '23/05/25', brix: 16.0, alcohol: 25.0, temperature: '32.0 C', timeInterval: '56:04:01' },
		{ id: '002', startDate: '22/05/25', endDate: '25/05/25' },
		{ id: '003', startDate: '25/05/25', endDate: '28/05/25' },
		{ id: '004', startDate: '27/05/25', endDate: '30/05/25' },
		{ id: '005', startDate: '30/05/25', endDate: '02/06/25' }
	]), []);
	const batchesRaw = useMemo(() => {
		try {
			const saved = JSON.parse(localStorage.getItem('batches') || 'null');
			return saved && Array.isArray(saved) && saved.length ? saved : defaultBatches;
		} catch { return defaultBatches; }
	}, [defaultBatches]);
	const batches = useMemo(() => computeStatuses(batchesRaw), [batchesRaw]);
	const sortedBatches = useMemo(() =>
		[...batches].sort((a,b) => (parseInt(a.id,10)||0) - (parseInt(b.id,10)||0)),
		[batches]
	);
	const [selectedId, setSelectedId] = useState(sortedBatches[0]?.id || '');
	useEffect(()=>{ if (sortedBatches.length && !sortedBatches.find(b=>b.id===selectedId)) setSelectedId(sortedBatches[0].id); }, [sortedBatches]);
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
		<div className="record-summary-page" style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<Header title="Record Summary" onOpenMenu={onOpenMenu} />
			<div aria-live="polite" ref={liveRef} style={{ position:'absolute', width:1, height:1, overflow:'hidden', clip:'rect(0 0 0 0)' }}>{`Batch ${selected?.id || ''} ${isReady? 'Ready':'Not Ready'}`}</div>
			<div className="summaryGrid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, padding: 24 }}>
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

const FermentationMonitoring = ({ onOpenMenu }) => {
	const [startDateTime] = useState('2025-05-20 02:26:47');
	const data = [
		{ time: '3:00 PM', temp: 0.40, ph: 0.12, alc: 0.00 },
		{ time: '4:00 PM', temp: 0.42, ph: 0.14, alc: 0.02 },
		{ time: '5:00 PM', temp: 0.43, ph: 0.20, alc: 0.04 },
		{ time: '6:00 PM', temp: 0.42, ph: 0.22, alc: 0.03 },
		{ time: '7:00 PM', temp: 0.38, ph: 0.25, alc: 0.05 },
		{ time: '8:00 PM', temp: 0.36, ph: 0.26, alc: 0.06 },
		{ time: '9:00 PM', temp: 0.34, ph: 0.27, alc: 0.07 },
		{ time: '10:00 PM', temp: 0.30, ph: 0.28, alc: 0.08 },
		{ time: '11:00 PM', temp: 0.28, ph: 0.29, alc: 0.09 },
		{ time: '12:00 PM', temp: 0.26, ph: 0.29, alc: 0.10 },
		{ time: '1:00 AM', temp: 0.22, ph: 0.30, alc: 0.11 }
	];

	return (
		<div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<Header title="Fermentation Monitoring" onOpenMenu={onOpenMenu} />
			<div className="monitorGrid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, padding: 24 }}>
				<div className="ux-card" style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
					<div style={{ width: '100%', height: 420 }}>
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={data}>
								<CartesianGrid stroke="#eee" />
								<XAxis dataKey="time" />
								<YAxis domain={[0, 0.5]} tickFormatter={(v) => v.toFixed(2)} />
								<Tooltip />
								<Line dataKey="ph" type="monotone" stroke="#2E7D32" strokeWidth={2} dot={false} />
								<Line dataKey="alc" type="monotone" stroke="#8BC34A" strokeWidth={2} dot={false} />
								<Line dataKey="temp" type="monotone" stroke="#00BCD4" strokeWidth={2} dot={false} />
							</LineChart>
						</ResponsiveContainer>
					</div>
					<div style={{ marginTop: 10, color: '#666', fontSize: 14 }}>Start: {startDateTime}</div>
				</div>
				<div className="ux-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					<div className="ux-card" style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 18, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Parameters</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 14, height: 14, background: '#2E7D32', borderRadius: '50%' }} /> pH Level</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 14, height: 14, background: '#8BC34A', borderRadius: '50%' }} /> Alcohol Content</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 14, height: 14, background: '#00BCD4', borderRadius: '50%' }} /> Temperature</div>
						</div>
					</div>
					<div className="ux-card" style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 18, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Analysis</div>
						<div style={{ color: '#333', lineHeight: 1.6, fontSize: 14 }}>
							<div style={{ marginBottom: 6 }}>Fermentation is a balance among pH, alcohol, and temperature. Changes in one affect the others:</div>
							<ul style={{ margin: 0, paddingLeft: 18 }}>
								<li><b>pH</b>: As yeast consumes sugars, acids form and pH slowly drops. Too high pH encourages contamination; too low stresses yeast and can stall fermentation.</li>
								<li><b>Alcohol</b>: Rises as sugar converts. Rapid alcohol increase with weak pH control may stress yeast and create off‑flavors.</li>
								<li><b>Temperature</b>: Warmer speeds reactions; too warm risks harsh flavors, too cool slows yeast and extends time to complete.</li>
							</ul>
							<div style={{ marginTop: 8 }}>Keep temperature stable, allow a gradual pH decline, and expect alcohol to rise steadily for a healthy fermentation.</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

function App() {
	const [currentPage, setCurrentPage] = useState('dashboard');
	const [menuOpen, setMenuOpen] = useState(false);

	const navigate = (key) => { setCurrentPage(key); setMenuOpen(false); };

	const pageEl = () => {
		switch (currentPage) {
			case 'dashboard': return <Dashboard onOpenMenu={() => setMenuOpen(true)} />;
			case 'save-record': return <SaveNewRecord onOpenMenu={() => setMenuOpen(true)} onNavigate={navigate} />;
			case 'record-summary': return <RecordSummary onOpenMenu={() => setMenuOpen(true)} />;
			case 'fermentation-monitoring': return <FermentationMonitoring onOpenMenu={() => setMenuOpen(true)} />;
			case 'confirm-batch': return <ConfirmBatch onOpenMenu={() => setMenuOpen(true)} onNavigate={navigate} />;
			default: return <Dashboard onOpenMenu={() => setMenuOpen(true)} />;
		}
	};

  return (
    <div className="App">
			{pageEl()}
			<SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onNavigate={navigate} currentPage={currentPage} />
    </div>
  );
}

export default App;
