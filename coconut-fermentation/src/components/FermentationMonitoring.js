import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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
	const sorted = [...list].sort((a, b) => parseDMY(a.startDate) - parseDMY(b.startDate));
	return sorted.map((b, idx) => ({ ...b, status: idx === 0 ? 'Ready' : 'N/A' }));
};

const FermentationMonitoring = ({ onToggleMenu }) => {
	useGlobalStyles(); // Inject global styles
	
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
	useEffect(()=>{ if (sortedBatches.length && !sortedBatches.find(b=>b.id===selectedId)) setSelectedId(sortedBatches[0].id); }, [sortedBatches, selectedId]);
	
	const selected = useMemo(() => sortedBatches.find(b => b.id === selectedId) || sortedBatches[0] || {}, [sortedBatches, selectedId]);
	
	// Generate monitoring data
	const [monitoringData, setMonitoringData] = useState([]);
	const [isLive, setIsLive] = useState(false);
	
	useEffect(() => {
		const generateData = () => {
			const data = [];
			const baseTime = new Date();
			baseTime.setHours(baseTime.getHours() - 12);
			
			for (let i = 0; i < 24; i++) {
				const time = new Date(baseTime.getTime() + i * 30 * 60 * 1000); // 30-minute intervals
				const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
				
				// Simulate realistic fermentation curves
				const progress = i / 23;
				const phBase = 4.2 - (progress * 0.8); // pH decreases over time
				const alcoholBase = progress * 8; // Alcohol increases
				const tempBase = 28 + Math.sin(progress * Math.PI) * 4; // Temperature varies
				
				data.push({
					time: timeStr,
					pH: Math.max(3.0, Math.min(5.0, phBase + (Math.random() - 0.5) * 0.3)),
					alcohol: Math.max(0, Math.min(12, alcoholBase + (Math.random() - 0.5) * 1)),
					temperature: Math.max(20, Math.min(35, tempBase + (Math.random() - 0.5) * 2))
				});
			}
			setMonitoringData(data);
		};
		
		generateData();
	}, [selectedId]);
	
	// Live updates
	useEffect(() => {
		if (!isLive) return;
		const interval = setInterval(() => {
			setMonitoringData(prev => prev.map(point => ({
				...point,
				pH: Math.max(3.0, Math.min(5.0, point.pH + (Math.random() - 0.5) * 0.1)),
				alcohol: Math.max(0, Math.min(12, point.alcohol + (Math.random() - 0.5) * 0.2)),
				temperature: Math.max(20, Math.min(35, point.temperature + (Math.random() - 0.5) * 0.5))
			})));
		}, 2000);
		return () => clearInterval(interval);
	}, [isLive]);
	
	const isReady = selected?.status === 'Ready';
	const analysisText = isReady 
		? 'Fermentation is progressing normally. All parameters are within optimal ranges.'
		: 'Monitoring data is simulated. Start fermentation to see real-time data.';

	return (
		<div className="fermentation-monitoring-page" style={commonStyles.pageContainer}>
			<Header title="Fermentation Monitoring" onToggleMenu={onToggleMenu} />
			
			<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, padding: '0 24px 24px' }}>
				{/* Main Chart Area */}
				<div className="ux-card" style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
						<div>
							<div style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>Batch {selected?.id || '—'}</div>
							<div style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
								Started: {selected?.startDate || '—'} • Duration: {selected?.startDate ? Math.ceil((Date.now() - parseDMY(selected.startDate)) / (1000 * 60 * 60 * 24)) : 0} days
							</div>
						</div>
						<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
							<select value={selectedId} onChange={(e)=>setSelectedId(e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0' }}>
								{sortedBatches.map(b => {
									const label = String(parseInt(b.id,10)||0).toString().padStart(3,'0');
									return <option key={b.id} value={b.id}>Batch {label}</option>;
								})}
							</select>
							<button 
								onClick={() => setIsLive(!isLive)} 
								className="ux-pressable"
								style={{ 
									padding: '8px 16px', 
									borderRadius: 8, 
									border: '1px solid #e0e0e0', 
									background: isLive ? '#16a34a' : '#fff', 
									color: isLive ? '#fff' : '#111',
									cursor: 'pointer',
									fontWeight: 700
								}}
							>
								{isLive ? '● Live' : 'Start Live'}
							</button>
						</div>
					</div>
					
					<div style={{ height: 400, width: '100%' }}>
						<ResponsiveContainer>
							<LineChart data={monitoringData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
								<XAxis dataKey="time" stroke="#666" fontSize={12} />
								<YAxis stroke="#666" fontSize={12} />
								<Tooltip 
									contentStyle={{ 
										background: '#fff', 
										border: '1px solid #e0e0e0', 
										borderRadius: 8, 
										boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
									}} 
								/>
								<Legend />
								<Line type="monotone" dataKey="pH" stroke="#e11d48" strokeWidth={2} dot={{ fill: '#e11d48', strokeWidth: 2, r: 3 }} name="pH Level" />
								<Line type="monotone" dataKey="alcohol" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }} name="Alcohol %" />
								<Line type="monotone" dataKey="temperature" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a', strokeWidth: 2, r: 3 }} name="Temperature °C" />
							</LineChart>
						</ResponsiveContainer>
					</div>
				</div>
				
				{/* Side Panel */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					{/* Parameters Legend */}
					<div className="ux-card" style={{ background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 12 }}>Parameters</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							{[
								{ color: '#e11d48', label: 'pH Level', range: '3.5 - 4.5' },
								{ color: '#2563eb', label: 'Alcohol Content', range: '0 - 12%' },
								{ color: '#16a34a', label: 'Temperature', range: '28 - 32°C' }
							].map((param, i) => (
								<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
									<div style={{ width: 16, height: 16, background: param.color, borderRadius: 4 }} />
									<div style={{ flex: 1 }}>
										<div style={{ fontWeight: 700, color: '#111' }}>{param.label}</div>
										<div style={{ fontSize: 12, color: '#666' }}>Optimal: {param.range}</div>
									</div>
								</div>
							))}
						</div>
					</div>
					
					{/* Current Values */}
					<div className="ux-card" style={{ background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 12 }}>Current Values</div>
						{monitoringData.length > 0 && (
							<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
								{[
									{ label: 'pH', value: monitoringData[monitoringData.length - 1]?.pH?.toFixed(2) || '—', color: '#e11d48' },
									{ label: 'Alcohol', value: `${monitoringData[monitoringData.length - 1]?.alcohol?.toFixed(1) || '—'}%`, color: '#2563eb' },
									{ label: 'Temperature', value: `${monitoringData[monitoringData.length - 1]?.temperature?.toFixed(1) || '—'}°C`, color: '#16a34a' }
								].map((item, i) => (
									<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8f9fa', borderRadius: 8 }}>
										<span style={{ color: '#666', fontWeight: 600 }}>{item.label}</span>
										<span style={{ color: item.color, fontWeight: 800, fontSize: 16 }}>{item.value}</span>
									</div>
								))}
							</div>
						)}
					</div>
					
					{/* Analysis */}
					<div className="ux-card" style={{ background: isReady ? '#e8f5e8' : '#fee2e2', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 18, fontWeight: 800, color: isReady ? '#1b5e20' : '#7f1d1d', marginBottom: 8 }}>Analysis</div>
						<div style={{ display: 'flex', gap: 10 }}>
							<div style={{ width: 20, height: 20, background: isReady ? '#16a34a' : '#e11d48', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>
								{isReady ? '✓' : '!'}
							</div>
							<div style={{ color: isReady ? '#065f46' : '#7f1d1d', fontWeight: 600, fontSize: 14 }}>{analysisText}</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default FermentationMonitoring;