import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

const Dashboard = ({ onToggleMenu }) => {
	useGlobalStyles(); // Inject global styles
	
	const [now, setNow] = useState(new Date());
	// Trigger re-computation from API/localStorage periodically and on storage events
	const [refreshTick, setRefreshTick] = useState(0);
	const [apiBatches, setApiBatches] = useState(null);
	const [chartData, setChartData] = useState([]);
	const [loading, setLoading] = useState(false);
	const [chartLoading, setChartLoading] = useState(true);
	const [hoveredPoint, setHoveredPoint] = useState(null);
	
	useEffect(()=>{ const t=setTimeout(()=>setChartLoading(false), 420); return ()=>clearTimeout(t); },[]);
	
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
				const res = await fetch(`${API_BASE}/get_batches_list`);
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
		// Only show data from saved records - no hardcoded fallback data
		let seedLiters = [];
		let seedSales = [];
		try {
			seedLiters = JSON.parse(localStorage.getItem('chart_liters') || '[]');
			seedSales = JSON.parse(localStorage.getItem('chart_sales') || '[]');
		} catch {
			seedLiters = [];
			seedSales = [];
		}
		
		// Only use data if it exists from saved records
		if (!Array.isArray(seedLiters)) seedLiters = [];
		if (!Array.isArray(seedSales)) seedSales = [];
		
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
	}, [refreshTick]);

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
	
	// old way (no longer used since we fetch from API)
	//const litersChartData = useMemo(() => aggregateBy(lambanogData, 'liters', litersRange), [lambanogData, litersRange]);
	//console.log('Liters chart data:', litersChartData);

	const [litersChartData, setLitersChartData] = useState([]);
	useEffect(() => {
		fetch(`${API_BASE}/get_liter_chart`)
		.then(res => res.json())
		.then(data => setLitersChartData(data))
		.catch(err => console.error("Error fetching liter chart: ", err));
	}, []);

	// convert iso format date to user-friendly date display
	function formatReadable(dateString) {
	const d = new Date(dateString);
	return d.toLocaleDateString('en-US', { 
		month: 'long', 
		day: 'numeric', 
		year: 'numeric' 
	});
	}

	// render
	return (
		<div style={commonStyles.pageContainer}>
			<Header title="Coconut Sap Fermentation Center" rightContent={timeEl} onToggleMenu={onToggleMenu} />

			<div className="grid-3" style={commonStyles.grid3}>
				<div className="card ux-card" style={commonStyles.cardWithBorder}>
					<h3 style={commonStyles.cardTitle}>Total Batches</h3>
					<div style={commonStyles.largeNumber}>{dispTotal}</div>
					<div style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>Last record {lastRecordDate ? lastRecordDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'N/A'}</div>
				</div>
				<div className="card ux-card" style={commonStyles.greenCard}>
					<h3 style={{ color: '#1b5e20', fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Batches Ready</h3>
					<div style={commonStyles.greenNumber}>{dispReady}</div>
					<div style={{ fontSize: 12, color: '#1b5e20', marginTop: 8 }}>Next completion {nextCompletion ? nextCompletion.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) : 'N/A'}</div>
				</div>
				<div className="card ux-card" style={commonStyles.redCard}>
					<h3 style={{ color: '#7f1d1d', fontSize: 16, fontWeight: 900, marginBottom: 6 }}>Batches In Progress</h3>
					<div style={commonStyles.redNumber}>{dispNotReady}</div>
					<div style={{ fontSize: 12, color: '#7f1d1d', marginTop: 8 }}>Monitoring for optimal pH and Brix</div>
				</div>
			</div>

			{/* Quick Insights */}
			<div className="card" style={{ background: '#ffffff', padding: 18, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', margin: '0 20px 10px', border: '1px solid #e5e7eb' }}>
				<div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
					<div style={{ minWidth: 220, textAlign: 'center' }}>
						<div style={{ fontSize: 12, color: '#6b7280', fontWeight: 800 }}>Most Recent Record</div>
						<div style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{lastRecordDate ? lastRecordDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>
					</div>
					<div style={{ minWidth: 220, textAlign: 'center' }}>
						<div style={{ fontSize: 12, color: '#6b7280', fontWeight: 800 }}>Next Estimated Completion</div>
						<div style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{nextCompletion ? nextCompletion.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</div>
					</div>
					<div style={{ minWidth: 220, textAlign: 'center' }}>
						<div style={{ fontSize: 12, color: '#6b7280', fontWeight: 800 }}>Current Time</div>
						<div style={{ fontSize: 16, fontWeight: 900, color: '#111' }}>{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
					</div>
				</div>
			</div>

			<div className="tableWrap ux-card" style={{ background: 'white', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', margin: 20, marginBottom: 30 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
					<h2 style={{ color: '#333', fontSize: 20, fontWeight: 600, margin: 0 }}>Batch List</h2>
					{/* Mobile scroll hint - CSS media query controlled */}
					<div className="mobile-scroll-hint" style={{ 
						display: 'none',
						alignItems: 'center',
						gap: 6,
						fontSize: 11,
						color: '#16a34a',
						fontWeight: 600,
						background: '#f0fdf4',
						padding: '4px 8px',
						borderRadius: 12,
						border: '1px solid #bbf7d0'
					}}>
						<span>Swipe to scroll</span>
						<span style={{ fontSize: 14 }}>→</span>
					</div>
				</div>
				{/* Responsive table container with enhanced scrolling */}
				<div 
					className="responsive-table-container"
					style={{
						// Force horizontal scrolling
						overflowX: 'scroll',
						overflowY: 'hidden',
						WebkitOverflowScrolling: 'touch',
						touchAction: 'pan-x',
						scrollBehavior: 'smooth',
						position: 'relative',
						// Ensure scrollbar is visible
						scrollbarWidth: 'auto',
						// Constrain container to force scrolling
						maxWidth: '100%',
						width: '100%',
						// Ensure container is smaller than table
						height: 'auto'
					}}
				>
					{loading ? (
						<div style={{ padding:20, border: '3px solid #16a34a', borderRadius: 12 }}>
							<div className="ux-skeleton" style={{ height:16, marginBottom:10, borderRadius:6 }} />
							{[...Array(5)].map((_,i)=>(<div key={i} className="ux-skeleton" style={{ height:42, marginBottom:8, borderRadius:8 }} />))}
						</div>
					) : (
					<table style={{ 
							// Force table to be wider than mobile screens to enable scrolling
							width: '1000px', // Fixed width larger than mobile screens
							minWidth: '1000px',
							borderCollapse: 'collapse', 
							tableLayout: 'fixed', // Fixed layout for consistent scrolling
							fontSize: 14,
							// Add border styling since we removed tableContainer
							border: '3px solid #16a34a',
							borderRadius: 12
						}}>
							<thead>
								<tr style={{ background: '#fff', color: '#111' }}>
									{['Batch ID','Start Date','End Date','Liter (L)','Logging Status', 'Fermentation Status'].map((h) => (
										<th key={h} style={{
											...commonStyles.tableHeader,
											whiteSpace: 'nowrap',
											padding: '12px 16px',
											// Fixed widths that add up to 1000px
											width: h === 'Batch ID' ? '100px' : 
												   h === 'Start Date' ? '150px' :
												   h === 'End Date' ? '150px' :
												   h === 'Liter (L)' ? '120px' :
												   h === 'Logging Status' ? '190px' : '190px'
										}}>
										{h}
									</th>
									))}
								</tr>
								</thead>
								<tbody>
								{filteredBatches.map((batch) => (
									<tr key={batch.id} style={{ backgroundColor: '#fff' }}>
									<td style={{ 
										...commonStyles.tableCell, 
										whiteSpace: 'nowrap',
										padding: '12px 16px',
										minWidth: '80px'
									}}>{batch.id}</td>
									<td style={{
										...commonStyles.tableCell,
										whiteSpace: 'nowrap',
										padding: '12px 16px',
										minWidth: '120px'
									}}>{formatReadable(batch.startDate)}</td>
									<td style={{
										...commonStyles.tableCell,
										whiteSpace: 'nowrap',
										padding: '12px 16px',
										minWidth: '120px'
									}}>{formatReadable(batch.endDate)}</td>
									<td style={{
										...commonStyles.tableCell,
										whiteSpace: 'nowrap',
										padding: '12px 16px',
										minWidth: '100px'
									}}>{batch.liter || 'N/A'}</td>
									<td style={{ 
										...commonStyles.tableCell, 
										color: batch.is_logging === 1 ? 'rgba(72, 173, 255, 1)' : '#e11d48', 
										fontWeight: 800,
										whiteSpace: 'nowrap',
										padding: '12px 16px',
										minWidth: '120px'
									}}>{batch.is_logging === 1 ? 'Ongoing' : 'Stopped'}</td>
									<td style={{ 
										...commonStyles.tableCell, 
										color: batch.status === 'Ready' ? '#16a34a' : '#e11d48', 
										fontWeight: 800,
										whiteSpace: 'nowrap',
										padding: '12px 16px',
										minWidth: '140px'
									}}>{batch.status === 'Ready' ? 'Ready' : 'NA'}</td>
									</tr>
								))}
								</tbody>
						</table>
					)}
				</div>
			</div>

			<div className="chartCard" style={{ background: 'white', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', margin: 20, marginBottom: 30 }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
					<h3 style={{ color: '#333', fontSize: 18, fontWeight: 600 }}>Total Liters of Tuba Made</h3>
					<select value={litersRange} onChange={(e) => setLitersRange(e.target.value)} style={{ fontSize: 12, color: '#333', border: '1px solid #e0e0e0', borderRadius: 6, padding: '4px 8px', background: '#fff' }}>
						<option value="day">Day</option>
						<option value="month">Month</option>
						<option value="year">Year</option>
					</select>
				</div>
				<div style={{ width: '100%', height: 400 }}>
					{litersChartData.length > 0 ? (
						<ResponsiveContainer width="100%" height={300}>
							<BarChart data={litersChartData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<Tooltip />
								<Legend />
								<Bar dataKey="total_liters" fill="#4CAF50" name="Liters (L)" />
							</BarChart>
							</ResponsiveContainer>
					) : (
						<div style={{ 
							height: '100%', 
							display: 'flex', 
							alignItems: 'center', 
							justifyContent: 'center',
							background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
							borderRadius: 16,
							border: '2px dashed #cbd5e1',
							position: 'relative',
							overflow: 'hidden'
						}}>
							<div style={{ 
								display: 'flex', 
								flexDirection: 'column', 
								alignItems: 'center', 
								justifyContent: 'center',
								padding: 20
							}}>
								<div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
								<div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#64748b' }}>No Production Data</div>
								<div style={{ fontSize: 14, color: '#94a3b8' }}>Save your first fermentation record to see production trends</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Dashboard;