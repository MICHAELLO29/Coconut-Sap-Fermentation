import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

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
						{ key: 'fermentation-monitoring', label: 'Fermentation Monitoring' }
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
				<div style={{ width: 20, height: 30, background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', borderRadius: '50% 50% 0 0', transform: 'rotate(-15deg)' }} />
				<div style={{ width: 20, height: 30, background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)', borderRadius: '50% 50% 0 0', transform: 'rotate(15deg)' }} />
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
			const saved = JSON.parse(localStorage.getItem('batches') || 'null');
			return saved && Array.isArray(saved) && saved.length ? saved : defaultBatches;
		} catch { return defaultBatches; }
	}, [defaultBatches]);
	const batches = useMemo(() => computeStatuses(batchesRaw), [batchesRaw]);

	useEffect(() => {
		const t = setInterval(() => setNow(new Date()), 1000);
		return () => clearInterval(t);
	}, []);

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

	const lambanogData = [
		{ date: 'May-22', liters: 25 },{ date: 'May-25', liters: 16 },{ date: 'May-26', liters: 40 },{ date: 'May-31', liters: 28 },
		{ date: 'Jun-02', liters: 48 },{ date: 'Jun-05', liters: 44 },{ date: 'Jun-07', liters: 45 },{ date: 'Jun-10', liters: 36 },{ date: 'Jun-16', liters: 47 }
	];
	const salesData = [
		{ date: 'May-22', sales: 1400 },{ date: 'May-25', sales: 1500 },{ date: 'May-29', sales: 1700 },{ date: 'May-31', sales: 900 },
		{ date: 'Jun-02', sales: 950 },{ date: 'Jun-05', sales: 1500 },{ date: 'Jun-10', sales: 1650 },{ date: 'Jun-16', sales: 1800 }
	];

	// Day / Month / Year selector for charts
	const [litersRange, setLitersRange] = useState('day');
	const [salesRange, setSalesRange] = useState('day');
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
	const salesChartAgg = useMemo(() => aggregateBy(salesData, 'sales', salesRange), [salesData, salesRange]);

	return (
		<div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<Header title="Dashboard" rightContent={timeEl} onOpenMenu={onOpenMenu} />

			<div className="grid-3" style={{
				display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, margin: 20, marginBottom: 30
			}}>
				<div className="card" style={{ background: 'white', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center', border: '2px solid #333' }}>
					<h3 style={{ color: '#333', fontSize: 16, fontWeight: 600, marginBottom: 15 }}>Total Batches Being Monitored</h3>
					<div style={{ fontSize: 48, fontWeight: 700, color: '#333' }}>{batches.length}</div>
				</div>
				<div className="card" style={{ background: '#e8f5e8', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center', border: '2px solid #4CAF50' }}>
					<h3 style={{ color: '#333', fontSize: 16, fontWeight: 600, marginBottom: 15 }}>Batches Ready</h3>
					<div style={{ fontSize: 48, fontWeight: 700, color: '#4CAF50' }}>{batches.filter(b => b.status === 'Ready').length}</div>
				</div>
				<div className="card" style={{ background: '#ffebee', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', textAlign: 'center', border: '2px solid #f44336' }}>
					<h3 style={{ color: '#333', fontSize: 16, fontWeight: 600, marginBottom: 15 }}>Batches Not Ready</h3>
					<div style={{ fontSize: 48, fontWeight: 700, color: '#f44336' }}>{batches.filter(b => b.status !== 'Ready').length}</div>
				</div>
			</div>

			<div className="tableWrap" style={{ background: 'white', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', margin: 20, marginBottom: 30 }}>
				<h2 style={{ color: '#333', fontSize: 20, fontWeight: 600, marginBottom: 20 }}>Batch List</h2>
				<div style={{ overflowX: 'auto' }}>
					{/* Outer frame */}
					<div style={{ border: '3px solid #16a34a', borderRadius: 12, overflow: 'hidden' }}>
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
								{batches.map((batch) => (
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
					</div>
				</div>
			</div>

			<div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, margin: 20, marginBottom: 30 }}>
				<div className="chartCard" style={{ background: 'white', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
						<h3 style={{ color: '#333', fontSize: 18, fontWeight: 600 }}>Total Liters of Lambanog Made</h3>
						<select value={litersRange} onChange={(e) => setLitersRange(e.target.value)} style={{ fontSize: 12, color: '#333', border: '1px solid #e0e0e0', borderRadius: 6, padding: '4px 8px', background: '#fff' }}>
							<option value="day">Day</option>
							<option value="month">Month</option>
							<option value="year">Year</option>
						</select>
					</div>
					<div style={{ width: '100%', height: 300 }}>
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
				<div className="chartCard" style={{ background: 'white', padding: 25, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
						<h3 style={{ color: '#333', fontSize: 18, fontWeight: 600 }}>Predicted Sales Trends</h3>
						<select value={salesRange} onChange={(e) => setSalesRange(e.target.value)} style={{ fontSize: 12, color: '#333', border: '1px solid #e0e0e0', borderRadius: 6, padding: '4px 8px', background: '#fff' }}>
							<option value="day">Day</option>
							<option value="month">Month</option>
							<option value="year">Year</option>
						</select>
					</div>
					<div style={{ width: '100%', height: 300 }}>
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={salesChartAgg}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<Tooltip />
								<Line type="monotone" dataKey="sales" stroke="#4CAF50" strokeWidth={2} />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	);
};

const SaveNewRecord = ({ onOpenMenu, onNavigate }) => {
	const [formData, setFormData] = useState({ brix: '16.0', alcoholContent: '25.0', temperature: '32.0 C', timeInterval: '56:04:01', logDate: '20/05/25' });
	const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
	const inputBox = (label, name, value) => (
		<div className="inputRow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
			<label style={{ color: '#9e9e9e', fontWeight: 700, minWidth: 140 }}>{label}</label>
			<input name={name} value={value} onChange={handleInputChange} style={{ flex: 1, maxWidth: 350, padding: '18px 16px', borderRadius: 12, border: '1px solid #eee', background: '#f6f7f7', textAlign: 'right', fontSize: 18, color: '#333' }} />
		</div>
	);

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

	const handleSave = () => {
		try {
			const existing = JSON.parse(localStorage.getItem('batches') || '[]');
			const fresh = getNextId();
			const start = formData.logDate || formatDMY(new Date());
			const end = addDays(start, 2);
			const newRec = { id: fresh.str, startDate: start, endDate: end };
			const updated = computeStatuses([...existing, newRec]);
			localStorage.setItem('batches', JSON.stringify(updated));
			alert(`Record saved (Batch ${fresh.str}). It will appear in the batch list.`);
			onNavigate && onNavigate('dashboard');
		} catch (e) {
			console.error(e);
			alert('Failed to save record.');
		}
	};

	const handleReset = () => {
		if (window.confirm('Reset all batches and dashboard?')) {
			localStorage.removeItem('batches');
			alert('Batches reset.');
			onNavigate && onNavigate('dashboard');
		}
	};

	return (
		<div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<Header title="Save New Record" onOpenMenu={onOpenMenu} />
			<div className="detailsGrid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, padding: 24 }}>
				<div style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
					<div style={{ fontSize: 28, fontWeight: 800, color: '#111', marginBottom: 12 }}>Production Details</div>
					<div style={{ background: '#f1f2f4', display: 'inline-block', padding: '8px 14px', borderRadius: 10, marginBottom: 18, color: '#333', fontWeight: 700 }}>Batch Number: {nextId.str}</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
						{inputBox('Brix (sugar)', 'brix', formData.brix)}
						{inputBox('Alcohol Content', 'alcoholContent', formData.alcoholContent)}
						{inputBox('Temperature', 'temperature', formData.temperature)}
						{inputBox('Time Interval:', 'timeInterval', formData.timeInterval)}
						{inputBox('Log Date:', 'logDate', formData.logDate)}
					</div>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					<div style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 20, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Analysis</div>
						<div style={{ color: '#333' }}>
							Based on the input parameters, the{' '}
							<span style={{ color: '#16a34a', fontWeight: 800 }}>tuba is ready for distillation</span>
						</div>
					</div>
					<div style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 20, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Production Forecast</div>
						<div style={{ color: '#333' }}>Estimated Volume: <b style={{ color: '#16a34a' }}>18.6 L</b></div>
						<div style={{ color: '#333' }}>Estimated Profit: <b style={{ color: '#16a34a' }}>₱4, 092.00</b></div>
					</div>
					<div style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 20, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Fermentation Timeline</div>
						<div style={{ color: '#333' }}>Start Date: <b style={{ color: '#16a34a' }}>{formData.logDate}</b></div>
						<div style={{ color: '#333' }}>End Date: <b style={{ color: '#16a34a' }}>{addDays(formData.logDate, 2)}</b></div>
					</div>
				</div>
			</div>
			<div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '24px 0 40px' }}>
				<button onClick={handleSave} style={{ background: '#16a34a', color: '#fff', fontWeight: 800, border: 'none', padding: '16px 42px', borderRadius: 50, fontSize: 18, cursor: 'pointer' }}>
					Save Record
				</button>
				<button onClick={handleReset} style={{ background: '#ffffff', color: '#333', fontWeight: 700, border: '2px solid #e5e7eb', padding: '16px 24px', borderRadius: 50, fontSize: 16, cursor: 'pointer' }}>
					Reset
				</button>
			</div>
		</div>
	);
};

const RecordSummary = ({ onOpenMenu }) => {
	return (
		<div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
			<Header title="Record Summary" onOpenMenu={onOpenMenu} />
			<div className="summaryGrid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, padding: 24 }}>
				<div style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
					<div style={{ fontSize: 36, fontWeight: 800, color: '#111', marginBottom: 12 }}>Batch 001</div>
					{['Brix (sugar):|16.0', 'Alcohol Content:|25.0', 'Temperature:|32.0 C', 'Time Interval|56:04:01', 'Log Date|20/05/25'].map((row, i) => {
						const [label, val] = row.split('|');
						return (
							<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 16px', border: '1px solid #eee', borderRadius: 12, background: '#fff', marginBottom: 14 }}>
								<div style={{ color: '#111', fontWeight: 800 }}>{label}</div>
								<div style={{ color: '#111', fontWeight: 800, fontSize: 18 }}>{val}</div>
							</div>
						);
					})}
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					<div style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 20, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Analysis</div>
						<div style={{ display: 'flex', gap: 12 }}>
							<div style={{ width: 26, height: 26, background: '#16a34a', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>✓</div>
							<div style={{ color: '#333' }}>Based on the input parameters, the tuba is ready for distillation.</div>
						</div>
					</div>
					<div style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 20, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Production Summary</div>
						<div style={{
							display: 'grid', gridTemplateColumns: '1fr 1fr', border: '2px solid #cfe3cf', borderRadius: 12, overflow: 'hidden', background: '#eaf6ea'
						}}>
							<div style={{ padding: 14, background: '#fff', borderRight: '1px solid #cfe3cf', borderBottom: '1px solid #cfe3cf' }}>Batch</div>
							<div style={{ padding: 14, background: '#fff', borderBottom: '1px solid #cfe3cf' }}>001</div>
							<div style={{ padding: 14, background: '#fff', borderRight: '1px solid #cfe3cf', borderBottom: '1px solid #cfe3cf' }}>Total Tuba Produced</div>
							<div style={{ padding: 14, background: '#fff', borderBottom: '1px solid #cfe3cf' }}>18.5 L</div>
							<div style={{ padding: 14, background: '#fff', borderRight: '1px solid #cfe3cf', borderBottom: '1px solid #cfe3cf' }}>Duration</div>
							<div style={{ padding: 14, background: '#fff', borderBottom: '1px solid #cfe3cf' }}>2 days<div style={{ fontSize: 11, color: '#8a8f98', marginTop: 6 }}>Start Date 20/05/25<br/>End Date 20/05/27</div></div>
							<div style={{ padding: 14, background: '#fff', borderRight: '1px solid #cfe3cf' }}>Predicted Income</div>
							<div style={{ padding: 14, background: '#fff', color: '#16a34a', fontWeight: 900 }}>₱2,220.00</div>
						</div>
						<div style={{ marginTop: 8, color: '#9e9e9e', fontSize: 12 }}>
							2% higher than last batch • <button style={{ fontSize: 11, color: '#666', border: '1px solid #cfe3cf', background: '#f7faf7', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' }}>View Analytics</button>
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
				<div style={{ background: '#fff', padding: 24, borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
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
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					<div style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 18, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Parameters</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 14, height: 14, background: '#2E7D32', borderRadius: '50%' }} /> pH Level</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 14, height: 14, background: '#8BC34A', borderRadius: '50%' }} /> Alcohol Content</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 14, height: 14, background: '#00BCD4', borderRadius: '50%' }} /> Temperature</div>
						</div>
					</div>
					<div style={{ background: '#e8f5e8', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 18, fontWeight: 800, color: '#1b5e20', marginBottom: 6 }}>Analysis</div>
						<p style={{ color: '#333', lineHeight: 1.6, fontSize: 14, margin: 0 }}>
							The fermentation process is progressing normally. pH levels are within optimal range, alcohol content is increasing steadily,
							and temperature is maintained at appropriate levels for successful fermentation.
						</p>
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
