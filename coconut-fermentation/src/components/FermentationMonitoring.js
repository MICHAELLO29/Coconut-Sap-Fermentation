import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Header from './Header';
import { commonStyles, useGlobalStyles } from './styles/GlobalStyles';

const API_BASE = `http://${process.env.REACT_APP_API_IP || "127.0.0.1"}:${process.env.REACT_APP_API_PORT || "5000"}`;

// Smoothing Algorithm: Moving Average
const applyMovingAverage = (data, windowSize = 5) => {
	if (!data || data.length < windowSize) return data;
	
	const smoothed = [];
	for (let i = 0; i < data.length; i++) {
		const start = Math.max(0, i - Math.floor(windowSize / 2));
		const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
		const window = data.slice(start, end);
		
		const avgBrix = window.reduce((sum, p) => sum + (p.brix || 0), 0) / window.length;
		const avgGravity = window.reduce((sum, p) => sum + (p.gravity || 0), 0) / window.length;
		const avgTemp = window.reduce((sum, p) => sum + (p.temperature || 0), 0) / window.length;

		smoothed.push({
			...data[i],
			brix: avgBrix,
			gravity: avgGravity,
			temperature: avgTemp
		});
	}
	
	return smoothed;
};

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

// No longer needed - status is now determined by parameter ranges, not batch age
// Keeping function for backward compatibility but it doesn't affect isReady anymore
const computeStatuses = (list) => {
	const sorted = [...list].sort((a, b) => parseDMY(a.startDate) - parseDMY(b.startDate));
	return sorted.map((b, idx) => ({ ...b, status: idx === 0 ? 'Ready' : 'N/A' }));
};

const FermentationMonitoring = ({ onToggleMenu }) => {
	useGlobalStyles(); // Inject global styles
	
	// Hold raw data from API
	const [batchesRaw, setBatchesRaw] = useState([]);

	// Compute enriched batches (if you want to keep computeStatuses logic)
	const batches = useMemo(() => computeStatuses(batchesRaw), [batchesRaw]);

	// Keep them sorted (smallest → largest, or flip if you want newest first)
	const sortedBatches = useMemo(
	() =>
		[...batches].sort(
		(a, b) => (parseInt(a.id, 10) || 0) - (parseInt(b.id, 10) || 0)
		),
	[batches]
	);

	// Track selected batch ID
	const [selectedId, setSelectedId] = useState("");

	// Fetch active batches from Flask
	useEffect(() => {
	const fetchActiveBatches = async () => {
		try {
		const res = await fetch(`${API_BASE}/active_batches_list`);
		if (res.ok) {
			const data = await res.json();
			setBatchesRaw(data);

			// default to first if none selected
			if (data.length > 0 && !selectedId) {
			setSelectedId(data[0].id);
			}
		}
		} catch (err) {
		console.error("Error fetching active batches:", err);
		}
	};
	fetchActiveBatches();
	}, [selectedId]);

	// Keep selection in sync if sorted list changes
	useEffect(() => {
	if (
		sortedBatches.length &&
		!sortedBatches.find((b) => b.id === selectedId)
	) {
		setSelectedId(sortedBatches[0].id);
	}
	}, [sortedBatches, selectedId]);


	const selected = useMemo(() => sortedBatches.find(b => b.id === selectedId) || sortedBatches[0] || {}, [sortedBatches, selectedId]);
	
	// Generate monitoring data
	const [monitoringData, setMonitoringData] = useState([]);
	const [isLive, setIsLive] = useState(false);
	const [visibleParameters, setVisibleParameters] = useState({
		gravity: true,
		temperature: true,
		brix: true
	});
	
	// Add state for controlling data points visibility
	const [showDataPoints, setShowDataPoints] = useState(true);
	
	// Add state for smooth mode toggle
	const [smoothMode, setSmoothMode] = useState(false);
	const [smoothingWindow, setSmoothingWindow] = useState(5); // Default window size
	
	// Time tracking for live sessions
	const [sessionStartTime, setSessionStartTime] = useState(null);
	const [sessionEndTime, setSessionEndTime] = useState(null);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [sessionHistory, setSessionHistory] = useState([]);
	
	// API function to fetch real IoT data
	const fetchIoTData = async () => {
		try {
			const response = await fetch(`${API_BASE}/readings/${selectedId}`);
			if (response.ok) {
				const data = await response.json();
				return data;
			}
		} catch (error) {
			console.log('API not available, using simulated data');
		}
		return null;
	};

	const [abvData, setAbvData] = useState({current_abv: 0});
	const [abvLoading, setAbvLoading] = useState(false);
	const [abvError, setAbvError] = useState(null);

	const handleUpdateABV = async () => {
    if (!selectedId) return;
    setAbvLoading(true);
    setAbvError(null);

    try {
        const response = await fetch(`${API_BASE}/update_abv/${selectedId}`, {
            method: 'POST',
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to update ABV');
        }

        const data = await response.json();
        setAbvData(data);

        // Optionally, you can update monitoringData's latest point with current_abv
        setMonitoringData(prev => prev.map((point, idx) =>
            idx === prev.length - 1 ? { ...point, current_abv: data.current_abv } : point
        ));
    } catch (err) {
        setAbvError(err.message);
    } finally {
        setAbvLoading(false);
    }
	};

	// Generate monitoring data only when live monitoring starts
	useEffect(() => {
		if (!isLive) {
			setMonitoringData([]);
			return;
		}

		const generateData = async () => {
			// Try to fetch real IoT data first
			const iotData = await fetchIoTData();
			
			if (iotData) {
				setMonitoringData(iotData);
			} else {
				// No fallback - device must be connected for live monitoring
				console.log('IoT device not connected - no data available');
				setIsLive(false); // Turn off live mode if device is not available
				setMonitoringData([]);
			}
		};
		
		generateData();
	}, [selectedId, isLive]);
	
	// Apply smoothing to monitoring data when smooth mode is enabled
	const displayData = useMemo(() => {
		if (!smoothMode || monitoringData.length === 0) {
			return monitoringData;
		}
		return applyMovingAverage(monitoringData, smoothingWindow);
	}, [monitoringData, smoothMode, smoothingWindow]);
	
	// Live updates
	useEffect(() => {
		if (!isLive || monitoringData.length === 0) return;
		
		const interval = setInterval(async () => {
			// Try to fetch real-time IoT data
			const iotData = await fetchIoTData();
			
			if (iotData) {
				setMonitoringData(iotData);
			} else {
				// Fallback to simulated updates
				setMonitoringData(prev => prev.map(point => ({
					...point,
					brix: Math.max(8, Math.min(18, point.brix + (Math.random() - 0.5) * 0.1)),
					gravity: Math.max(0, Math.min(12, point.gravity + (Math.random() - 0.5) * 0.2)),
					temperature: Math.max(20, Math.min(35, point.temperature + (Math.random() - 0.5) * 0.5))
				})));
			}
		}, 3000); // Update every 3 seconds
		return () => clearInterval(interval);
	}, [isLive, monitoringData.length, selectedId]);
	
	// Check if current parameters are within optimal ranges
	const checkParametersInRange = () => {
		if (!isLive || monitoringData.length === 0) return false;
		
		const latestData = monitoringData[monitoringData.length - 1];
		const brixInRange = latestData.brix >= 12 && latestData.brix <= 18;
		const gravityInRange = latestData.gravity >= 0 && latestData.gravity <= 12;
		const tempInRange = latestData.temperature >= 28 && latestData.temperature <= 32;
		
		return brixInRange && gravityInRange && tempInRange;
	};
	
	const isReady = checkParametersInRange();
	const analysisText = !isLive 
		? 'Click "Start Live" to begin real-time monitoring from IoT sensors.'
		: isReady 
			? 'Fermentation is progressing normally. All parameters are within optimal ranges.'
			: 'Live monitoring active. Data updates every 15 seconds from IoT devices.';

	const toggleParameter = (param) => {
		setVisibleParameters(prev => ({
			...prev,
			[param]: !prev[param]
		}));
	};

	// Handle live monitoring toggle with time tracking
	const handleLiveToggle = () => {
		if (!isLive) {
			// Starting live monitoring
			const startTime = new Date();
			setSessionStartTime(startTime);
			setSessionEndTime(null);
			setElapsedTime(0);
			setIsLive(true);
		} else {
			// Stopping live monitoring
			const endTime = new Date();
			setSessionEndTime(endTime);
			setIsLive(false);
			
			// Save session to history
			if (sessionStartTime) {
				const duration = Math.floor((endTime - sessionStartTime) / 1000);
				const newSession = {
					id: Date.now(),
					startTime: sessionStartTime,
					endTime: endTime,
					duration: duration,
					batchId: selectedId
				};
				setSessionHistory(prev => [newSession, ...prev].slice(0, 10)); // Keep last 10 sessions
			}
		}
	};

	// Update elapsed time every second when live
	useEffect(() => {
		if (!isLive || !sessionStartTime) return;
		
		const interval = setInterval(() => {
			const now = new Date();
			const elapsed = Math.floor((now - sessionStartTime) / 1000);
			setElapsedTime(elapsed);
		}, 1000);
		
		return () => clearInterval(interval);
	}, [isLive, sessionStartTime]);

	// Format time duration in HH:MM:SS format
	const formatDuration = (seconds) => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;
		
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	return (
		<div className="fermentation-monitoring-page" style={commonStyles.pageContainer}>
			<Header title="Fermentation Monitoring" onToggleMenu={onToggleMenu} />
			
			<div className="fermentation-main-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, padding: '0 24px 24px' }}>
				{/* Main Chart Area */}
				<div className="ux-card" style={{ background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
						<div style={{ flex: 1 }}>
							{/* Batch Selection Dropdown */}
							<div style={{ marginBottom: 12 }}>
								<label style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 6, display: 'block' }}>
									Select Batch to Monitor:
								</label>
								<select
									value={selectedId}
									onChange={(e) => setSelectedId(e.target.value)}
									style={{
										padding: '8px 12px',
										borderRadius: 8,
										border: '2px solid #e2e8f0',
										background: '#fff',
										fontSize: 14,
										fontWeight: 600,
										color: '#111',
										cursor: 'pointer',
										minWidth: 200,
										outline: 'none'
									}}
									>
									{batches.length > 0 ? (
										batches.map(batch => (
										<option key={batch.id} value={batch.id}>
											Batch {batch.id}
										</option>
										))
									) : (
										<option value="">No active batches</option>
									)}
								</select>
							</div>
							
							<div style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>Batch {selected?.id || '—'}</div>
							<div style={{ fontSize: 14, color: '#666' }}>Started: {selected?.startDate || '—'} • Duration: {selected?.duration || '—'} days</div>
							<div style={{ fontSize: 13, color: '#10b981', fontWeight: 600, marginTop: 4 }}>
								Status: {selected?.status || 'Unknown'}
							</div>
							
							{isLive && (
								<div style={{ 
									fontSize: 16, 
									fontWeight: 700, 
									color: '#0f766e', 
									marginTop: 12,
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									padding: '8px 12px',
									background: '#f0fdf4',
									borderRadius: 8,
									border: '1px solid #bbf7d0'
								}}>
									<span style={{ 
										width: 8,
										height: 8,
										borderRadius: '50%',
										background: '#10b981',
										animation: 'pulse 2s infinite'
									}} />
									Live Session: {formatDuration(elapsedTime)}
								</div>
							)}
						</div>
						<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
							<button
								onClick={handleLiveToggle}
								style={{
									padding: '12px 20px',
									borderRadius: 8,
									border: 'none',
									background: isLive ? '#e11d48' : '#16a34a',
									color: '#fff',
									cursor: 'pointer',
									fontWeight: 700,
									minWidth: 120
								}}
							>
								{isLive ? '⏹ Stop Live' : '▶ Start Live'}
							</button>
							<button
								onClick={handleUpdateABV}
								disabled={abvLoading}
								style={{
									padding: '12px 20px',
									borderRadius: 8,
									border: 'none',
									background: '#0b70f3ff',
									color: '#fff',
									cursor: 'pointer',
									fontWeight: 700,
									minWidth: 120
								}}
							>
								{abvLoading ? 'Updating...' : 'Update ABV'}
							</button>

							{abvError && <div style={{ color: 'red', marginTop: 6 }}>{abvError}</div>}
							{abvData && !abvLoading && (
								<div style={{ marginTop: 6, fontSize: 12, color: '#111' }}>
									Current ABV updated: {abvData.current_abv.toFixed(2) ?? "N/A"}% (Original Gravity: {abvData.original_gravity})
								</div>
							)}
							{sessionEndTime && !isLive && (
								<div style={{ 
									fontSize: 12, 
									color: '#666',
									textAlign: 'right'
								}}>
									Last session: {formatDuration(Math.floor((sessionEndTime - sessionStartTime) / 1000))}
								</div>
							)}
						</div>
					</div>
					
					{/* Parameter Filter Buttons - Only show when live */}
					{isLive && (
						<div style={{ marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
							<div style={{ fontSize: 14, fontWeight: 700, color: '#0f766e', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span>🎛️</span> Parameter Filters
								</div>
								{/* Toggle Buttons Container */}
								<div style={{ display: 'flex', gap: 8 }}>
									{/* Smooth Mode Toggle Button */}
									<button
										onClick={() => setSmoothMode(!smoothMode)}
										style={{
											padding: '6px 12px',
											borderRadius: 8,
											border: smoothMode ? 'none' : '2px solid #8b5cf6',
											background: smoothMode ? 'linear-gradient(135deg, #8b5cf6, #a78bfa)' : '#ffffff',
											color: smoothMode ? '#ffffff' : '#8b5cf6',
											cursor: 'pointer',
											fontSize: 11,
											fontWeight: 700,
											transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
											display: 'flex',
											alignItems: 'center',
											gap: 6,
											boxShadow: smoothMode
												? '0 4px 12px rgba(139, 92, 246, 0.3), 0 2px 6px rgba(167, 139, 250, 0.2)'
												: '0 2px 8px rgba(0,0,0,0.08)',
											transform: smoothMode ? 'translateY(-1px)' : 'translateY(0)'
										}}
									>
										<span style={{ fontSize: 12 }}>{smoothMode ? '🌊' : '📊'}</span>
										{smoothMode ? 'Smooth ON' : 'Smooth OFF'}
									</button>
									{/* Data Points Toggle Button */}
									<button
										onClick={() => setShowDataPoints(!showDataPoints)}
										style={{
											padding: '6px 12px',
											borderRadius: 8,
											border: showDataPoints ? 'none' : '2px solid #16a34a',
											background: showDataPoints ? 'linear-gradient(135deg, #16a34a, #34d399)' : '#ffffff',
											color: showDataPoints ? '#ffffff' : '#16a34a',
											cursor: 'pointer',
											fontSize: 11,
											fontWeight: 700,
											transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
											display: 'flex',
											alignItems: 'center',
											gap: 6,
											boxShadow: showDataPoints 
												? '0 4px 12px rgba(22, 163, 74, 0.3), 0 2px 6px rgba(52, 211, 153, 0.2)'
												: '0 2px 8px rgba(0,0,0,0.08)',
											transform: showDataPoints ? 'translateY(-1px)' : 'translateY(0)'
										}}
									>
										<span style={{ fontSize: 12 }}>{showDataPoints ? '●' : '○'}</span>
										{showDataPoints ? 'Hide Points' : 'Show Points'}
									</button>
							</div>
						</div>
							{smoothMode && (
								<div style={{ 
									marginBottom: 12, 
									padding: '12px 16px', 
									background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(167, 139, 250, 0.05))', 
									borderRadius: 8,
									border: '1px solid rgba(139, 92, 246, 0.2)'
								}}>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
										<label style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6' }}>Smoothing Strength:</label>
										<span style={{ fontSize: 12, fontWeight: 800, color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '2px 8px', borderRadius: 4 }}>
											{smoothingWindow === 3 ? 'Light' : smoothingWindow === 5 ? 'Medium' : smoothingWindow === 7 ? 'Strong' : 'Very Strong'}
										</span>
									</div>
									<input
										type="range"
										min="3"
										max="9"
										step="2"
										value={smoothingWindow}
										onChange={(e) => setSmoothingWindow(Number(e.target.value))}
										style={{
											width: '100%',
											height: 6,
											borderRadius: 3,
											outline: 'none',
											cursor: 'pointer',
											appearance: 'none',
											background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
											WebkitAppearance: 'none'
										}}
									/>
									<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
										<span style={{ fontSize: 9, color: '#8b5cf6', opacity: 0.7 }}>Less</span>
										<span style={{ fontSize: 9, color: '#8b5cf6', opacity: 0.7 }}>More</span>
									</div>
								</div>
							)}
							<div style={{ fontSize: 10, color: '#666', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
								<span style={{ fontSize: 12 }}>💡</span>
								<span>{smoothMode ? 'Smoothing reduces noise and highlights trends' : 'Toggle smooth mode for cleaner graph visualization'}</span>
							</div>
						<div className="inputRow" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
								{[
									{ key: 'brix', label: 'Brix', unit: '°Bx', color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)', icon: '◆' },
									{ key: 'gravity', label: 'gravity', unit: 'SG', color: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)', icon: '◈' },
									{ key: 'temperature', label: 'Temperature', unit: '°C', color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)', icon: '◐' }
								].map(param => (
									<button
										key={param.key}
										onClick={() => toggleParameter(param.key)}
										style={{
											padding: '12px 16px',
											borderRadius: 12,
											border: visibleParameters[param.key] ? 'none' : `2px solid ${param.color}20`,
											background: visibleParameters[param.key] ? param.gradient : '#ffffff',
											color: visibleParameters[param.key] ? '#ffffff' : param.color,
											cursor: 'pointer',
											fontSize: 12,
											fontWeight: 700,
											transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'center',
											gap: 6,
											boxShadow: visibleParameters[param.key] 
												? `0 8px 25px ${param.color}30, 0 3px 10px ${param.color}20` 
												: '0 2px 8px rgba(0,0,0,0.08)',
											transform: visibleParameters[param.key] ? 'translateY(-2px)' : 'translateY(0)',
											position: 'relative',
											overflow: 'hidden'
										}}
									>
										<div style={{ fontSize: 16, fontWeight: 900, opacity: visibleParameters[param.key] ? 1 : 0.7 }}>
											{param.icon}
										</div>
										<div style={{ textAlign: 'center', lineHeight: 1.2 }}>
											<div style={{ fontSize: 11, fontWeight: 800 }}>{param.label}</div>
											<div style={{ fontSize: 9, opacity: 0.8, marginTop: 2 }}>{param.unit}</div>
										</div>
										{visibleParameters[param.key] && (
											<div style={{
												position: 'absolute',
												top: 4,
												right: 4,
												width: 8,
												height: 8,
												borderRadius: '50%',
												background: 'rgba(255,255,255,0.9)',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontSize: 6,
												color: param.color
											}}>
												✓
											</div>
										)}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Chart Display */}
					<div style={{ height: 400, width: '100%' }}>
						{!isLive ? (
							<div style={{ 
								height: '100%', 
								display: 'flex', 
								alignItems: 'center', 
								justifyContent: 'center',
								background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
								borderRadius: 16,
								border: '2px dashed #0f766e',
								position: 'relative',
								overflow: 'hidden'
							}}>
								<div style={{ 
									position: 'absolute',
									top: 0,
									left: 0,
									right: 0,
									bottom: 0,
									background: 'radial-gradient(circle at 30% 70%, rgba(15, 118, 110, 0.05) 0%, transparent 50%)',
									pointerEvents: 'none'
								}} />
								<div style={{ textAlign: 'center', color: '#0f766e', zIndex: 1 }}>
									<img 
									src="/Monitoring.png"  
									alt="Monitoring Icon"
									style={{ 
										width: 120,            // adjust size as needed
										height: 120, 
										marginBottom: 16,
										filter: 'drop-shadow(0 4px 8px rgba(15, 118, 110, 0.2))'
									}}
									/>
									<div style={{ fontSize: 24, fontWeight: 800, color: '#0f766e', marginBottom: 8 }}>IoT Monitoring Offline</div>
									<div style={{ fontSize: 16, color: '#475569', marginBottom: 16 }}>Activate live monitoring to view real-time fermentation data</div>
									<div style={{ 
										display: 'inline-flex', 
										alignItems: 'center', 
										gap: 8, 
										padding: '8px 16px', 
										background: 'rgba(15, 118, 110, 0.1)', 
										borderRadius: 8,
										border: '1px solid rgba(15, 118, 110, 0.2)'
									}}>
										<img 
										src="Cursor.png" 
										alt="Cursor Icon"
										style={{ 
											width: 18,            // adjust size as needed
											height: 24, 
											marginRight: 6,
											verticalAlign: 'middle',
											filter: 'drop-shadow(0 4px 8px rgba(15, 118, 110, 0.2))'
										}}
										/>
										<span style={{ fontSize: 12 }}></span>
										<span style={{ fontSize: 14, fontWeight: 600, color: '#0f766e' }}>Click "Start Live" above</span>
									</div>
								</div>
							</div>
						) : (
							<ResponsiveContainer>
								<LineChart data={monitoringData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
									<XAxis dataKey="time" stroke="#666" fontSize={12} />
									<YAxis stroke="#666" fontSize={12} />
									{showDataPoints && (
										<Tooltip 
											contentStyle={{ 
												background: '#fff', 
												border: '1px solid #e0e0e0', 
												borderRadius: 8, 
												boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
											}} 
										/>
									)}
									<Legend />
									{visibleParameters.brix && (
										<Line
											type="monotone"
											dataKey="brix"
											stroke="#f59e0b"
											strokeWidth={3}
											dot={showDataPoints ? { fill: '#f59e0b', strokeWidth: 2, r: 4 } : false}
											activeDot={showDataPoints ? { r: 5 } : false}
											name="◆ Brix (°Bx)"
										/>
									)}
									{visibleParameters.gravity && (
										<Line
											type="monotone"
											dataKey="gravity"
											stroke="#3b82f6"
											strokeWidth={3}
											dot={showDataPoints ? { fill: '#3b82f6', strokeWidth: 2, r: 4 } : false}
											activeDot={showDataPoints ? { r: 5 } : false}
											name="◈ gravity (SG)"
										/>
									)}
									{visibleParameters.temperature && (
										<Line
											type="monotone"
											dataKey="temperature"
											stroke="#10b981"
											strokeWidth={3}
											dot={showDataPoints ? { fill: '#10b981', strokeWidth: 2, r: 4 } : false}
											activeDot={showDataPoints ? { r: 5 } : false}
											name="◐ Temperature °C"
										/>
									)}
								</LineChart>
							</ResponsiveContainer>
						)}
					</div>
				</div>
				
				<div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					{/* Session History */}
					{sessionHistory.length > 0 && (
						<div className="ux-card" style={{ background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
							<div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
								<span>⏱️</span> Session History
							</div>
							<div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
								{sessionHistory.map((session, index) => (
									<div key={session.id} style={{ 
										padding: '10px 12px', 
										background: index === 0 ? '#f0fdf4' : '#f8f9fa', 
										borderRadius: 8,
										border: index === 0 ? '1px solid #bbf7d0' : '1px solid #e5e7eb'
									}}>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
											<div style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>
												{session.startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
											</div>
											<div style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>
												{formatDuration(session.duration)}
											</div>
										</div>
										<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
											<div style={{ fontSize: 10, color: '#666' }}>
												{session.startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
											</div>
											<div style={{ fontSize: 10, fontWeight: 600, color: '#0f766e' }}>
												Batch {session.batchId}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Parameters Legend */}
					<div className="ux-card" style={{ background: '#fff', padding: 18, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
						<div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 12 }}>Parameters</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						{[
							{ color: '#f59e0b', label: 'Brix (Sugar)', range: '12 - 18°Bx', key: 'brix' },
							{ color: '#2563eb', label: 'Specific Gravity', range: '0 - 12%', key: 'gravity' },
							{ color: '#16a34a', label: 'Temperature', range: '28 - 32°C', key: 'temperature' }
						].map((param, i) => (
							<div key={i} style={{ 
								display: 'flex', 
								alignItems: 'center', 
								gap: 10,
								opacity: visibleParameters[param.key] ? 1 : 0.4,
								transition: 'opacity 150ms ease'
							}}>
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
						<div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
						Current Values
						{smoothMode && <span style={{ fontSize: 10, background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>SMOOTHED</span>}
					</div>
						{displayData.length > 0 ? (
						<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							{[
								{ label: 'Brix', value: `${displayData[displayData.length - 1]?.brix?.toFixed(1) || '—'}°Bx`, color: '#f59e0b' },
								{ label: 'gravity', value: `${displayData[displayData.length - 1]?.gravity?.toFixed(1) || '—'}`, color: '#2563eb' },
								{ label: 'Temperature', value: `${displayData[displayData.length - 1]?.temperature?.toFixed(1) || '—'}°C`, color: '#16a34a' },
								{ label: 'Current Alcohol by Volume', value: `${abvData.current_abv.toFixed(2) ?? '-'}%`, color: '#d85d5dff'}
							].map((item, i) => (
								<div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8f9fa', borderRadius: 8 }}>
									<span style={{ color: '#666', fontWeight: 600 }}>{item.label}</span>
									<span style={{ color: item.color, fontWeight: 800, fontSize: 16 }}>{item.value}</span>
								</div>
							))}
						</div>
					) : (
						<div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
							<div style={{ fontSize: 14 }}>No data available</div>
							<div style={{ fontSize: 12, marginTop: 4 }}>Start live monitoring to see values</div>
						</div>
					)}
					</div>
					
					{/* Analysis */}
					<div className="ux-card" style={{ 
						background: !isLive ? '#f8f9fa' : isReady ? '#e8f5e8' : '#fee2e2', 
						padding: 18, 
						borderRadius: 12, 
						boxShadow: '0 2px 8px rgba(0,0,0,0.06)' 
					}}>
						<div style={{ 
							fontSize: 18, 
							fontWeight: 800, 
							color: !isLive ? '#666' : isReady ? '#1b5e20' : '#7f1d1d', 
							marginBottom: 8 
						}}>Analysis</div>
						<div style={{ display: 'flex', gap: 10 }}>
							<div style={{ 
								width: 20, 
								height: 20, 
								background: !isLive ? '#999' : isReady ? '#16a34a' : '#e11d48', 
								color: '#fff', 
								borderRadius: '50%', 
								display: 'flex', 
								alignItems: 'center', 
								justifyContent: 'center', 
								fontSize: 12, 
								fontWeight: 800 
							}}>
								{!isLive ? '⏸' : isReady ? '✓' : '●'}
							</div>
							<div style={{ 
								color: !isLive ? '#666' : isReady ? '#065f46' : '#7f1d1d', 
								fontWeight: 600, 
								fontSize: 14 
							}}>{analysisText}</div>
						</div>
					</div>
				</div> 
			</div>
		</div>
	);
};

export default FermentationMonitoring;
