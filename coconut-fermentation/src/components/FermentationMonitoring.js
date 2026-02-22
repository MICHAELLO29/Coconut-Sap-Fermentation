import React, { useState, useEffect, useMemo, useRef } from 'react';
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
const parseDMY = str => new Date(str.replace(" ", "T"));

const formatDMY = (date) => {
	const dd = String(date.getDate()).padStart(2, '0');
	const mm = String(date.getMonth() + 1).padStart(2, '0');
	const yy = String(date.getFullYear()).slice(-2);
	return `${dd}/${mm}/${yy}`;
};

// No longer needed - status is now determined by parameter ranges, not batch age
const computeStatuses = (list) => {
	const sorted = [...list].sort((a, b) => parseDMY(a.startDate) - parseDMY(b.startDate));
	return sorted.map((b, idx) => ({ ...b, fermentation_status: idx === 1 ? 'Ready' : 'N/A' }));
};

const FermentationMonitoring = ({ onToggleMenu }) => {
	useGlobalStyles(); // Inject global styles
	
	// Hold raw data from API
	const [batchesRaw, setBatchesRaw] = useState([]);

	// Compute enriched batches
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

	// Fermentation completion notification
	const [showCompletionModal, setShowCompletionModal] = useState(false);
	const [emailStatus, setEmailStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
	const completionAlertedRef = useRef(false); // only alert once per live session
	
	// Time tracking for live sessions
	const [sessionStartTime, setSessionStartTime] = useState(null);
	const [sessionEndTime, setSessionEndTime] = useState(null);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [sessionHistory, setSessionHistory] = useState([]);
	
	// Current timestamp for live monitoring
	const [currentTimestamp, setCurrentTimestamp] = useState(new Date());
	
	const [fermentationStatus, setFermentationStatus] = useState({}); 
	useEffect(() => {
		let aborted = false;

		const fetchFermentationStatus = async () => {
			try {
				const res = await fetch(`${API_BASE}/classify`, { method: "POST" });
				if (!res.ok) return;

				const data = await res.json();
				if (!aborted) setFermentationStatus(data);
			} catch (err) {
				console.error("Error fetching fermentation status:", err);
			}
		};

		fetchFermentationStatus();
		const interval = setInterval(fetchFermentationStatus, 30000);

		return () => {
			aborted = true;
			clearInterval(interval);
		};
	}, []);

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
			return;
		}

		const generateData = async () => {
			// Only fetch initial data if we don't have any data yet
			if (monitoringData.length > 0) {
				console.log('Resuming live monitoring with existing data');
				return;
			}

			// Fetch real IoT data from backend
			const iotData = await fetchIoTData();
			
			if (iotData) {
				console.log('IoT Data received:', iotData);
				console.log('First data point:', iotData[0]);
				console.log('Sample timestamp fields:', {
					timestamp: iotData[0]?.timestamp,
					created_at: iotData[0]?.created_at,
					recorded_at: iotData[0]?.recorded_at,
					time: iotData[0]?.time
				});
				
				// Format timestamps from API data
				const dataWithTimestamps = iotData.map((point, index) => {
					// Try to get timestamp from various possible field names
					const timestamp = point.timestamp || point.created_at || point.recorded_at || point.time;
					
					let formattedTime;
					if (timestamp) {
						// Database stores in UTC format (e.g., "2025-11-26T06:50:17.863730")
						const utcDate = new Date(timestamp);
						
						// Convert UTC to Philippine Time (UTC+8) by adding 8 hours
						const philippineDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
						
						// Format the Philippine time
						formattedTime = philippineDate.toLocaleTimeString('en-US', {
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
							hour12: true
						});
						
						if (index < 3) {
							console.log(`Point ${index}: UTC: ${utcDate.toISOString()}, Philippine Time: ${formattedTime}`);
						}
					} else {
						// Fallback: use current time only if no timestamp exists
						formattedTime = new Date().toLocaleTimeString('en-US', {
							hour: '2-digit',
							minute: '2-digit',
							second: '2-digit',
							hour12: true
						});
					}
					
					return {
						...point,
						time: formattedTime
					};
				});
				setMonitoringData(dataWithTimestamps);
			} else {
				// No fallback - device must be connected for live monitoring
				console.log('IoT device not connected - no data available');
				setIsLive(false); // Turn off live mode if device is not available
			}
		};
		
		generateData();
	}, [selectedId, isLive, monitoringData.length]);

	const displayData = monitoringData;
	
	// Live updates
	useEffect(() => {
		if (!isLive || monitoringData.length === 0) return;
		
		const interval = setInterval(async () => {
			// Try to fetch real-time IoT data
			const iotData = await fetchIoTData();
			
			if (iotData && Array.isArray(iotData) && iotData.length > 0) {
				// Get the latest data point from the API
				const latestPoint = iotData[iotData.length - 1];
				
				// Format timestamp from API data
				const timestamp = latestPoint.timestamp || latestPoint.created_at || latestPoint.recorded_at || latestPoint.time;
				let formattedTime;
				
				if (timestamp) {
					// Parse UTC timestamp and convert to Philippine Time (UTC+8)
					const utcDate = new Date(timestamp);
					const philippineDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
					
					formattedTime = philippineDate.toLocaleTimeString('en-US', {
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
						hour12: true
					});
				} else {
					// Fallback: use current time only if no timestamp exists
					formattedTime = new Date().toLocaleTimeString('en-US', {
						hour: '2-digit',
						minute: '2-digit',
						second: '2-digit',
						hour12: true
					});
				}
				
				const newPointWithTimestamp = {
					...latestPoint,
					time: formattedTime
				};
				
				// Append the new point to existing data (keep all historical data)
				setMonitoringData(prev => [...prev, newPointWithTimestamp]);
			} else {
				// No fallback - device must be connected for live monitoring
				console.log('IoT device not connected - no data available');
				setIsLive(false); // Turn off live mode if device is not available
			}
		}, 15000); // Update every 15 seconds
		return () => clearInterval(interval);
	}, [isLive, monitoringData.length, selectedId]);
	
	// Update timestamp every second when live monitoring is active
	useEffect(() => {
		if (!isLive) return;
		const interval = setInterval(() => {
			setCurrentTimestamp(new Date());
		}, 1000); 
		
		return () => clearInterval(interval);
	}, [isLive]);
	
	// Check if current parameters are within optimal ranges
	const checkParametersInRange = () => {
		if (!isLive || monitoringData.length === 0) return false;
		
		const latestData = monitoringData[monitoringData.length - 1];
		const brixInRange = latestData.brix >= 12 && latestData.brix <= 18;
		const gravityInRange = latestData.gravity >= 0 && latestData.gravity <= 12;
		const tempInRange = latestData.temperature >= 28 && latestData.temperature <= 32;
		
		return brixInRange && gravityInRange && tempInRange;
	};
	
	// Check if Brix is approaching ready state (≤ 11)
	const checkBrixApproaching = () => {
		if (!isLive || monitoringData.length === 0) return false;
		const latestData = monitoringData[monitoringData.length - 1];
		return latestData.brix >= 1 && latestData.brix <= 11;
	};
	
	// Check if fermentation is complete/ready (Brix ≤ 1)
	const checkBrixReady = () => {
		if (!isLive || monitoringData.length === 0) return false;
		const latestData = monitoringData[monitoringData.length - 1];
		const brixReady = latestData.brix <= 1;
		const gravityInRange = latestData.gravity >= 0 && latestData.gravity <= 12;
		
		return brixReady && gravityInRange;
	};
	
	const isReady = checkParametersInRange();
	const isApproaching = checkBrixApproaching();
	const isBrixReady = checkBrixReady();
	const analysisText = !isLive 
		? 'Click "Start Live" to begin real-time monitoring from IoT sensors.'
		: isBrixReady 
			? 'Fermentation is ready!'
			: isReady 
				? 'Fermentation is progressing normally. All parameters are within optimal ranges.'
				: isApproaching
					? 'Fermentation is steadily reaching its ready-to-ferment state.'
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
			// Starting live monitoring — reset completion alert for new session
			completionAlertedRef.current = false;
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

			if (sessionStartTime) {
				const duration = Math.floor((endTime - sessionStartTime) / 1000);
				const newSession = {
					id: Date.now(),
					startTime: sessionStartTime,
					endTime: endTime,
					duration: duration,
					batchId: selectedId
				};
				setSessionHistory(prev => [newSession, ...prev].slice(0, 10));
			}
		}
	};

	// Send fermentation completion email via backend (or mock)
	const sendCompletionEmail = async () => {
		setEmailStatus('sending');
		try {
			const res = await fetch(`${API_BASE}/notify_completion`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ batch_id: selectedId })
			});
			setEmailStatus(res.ok ? 'sent' : 'error');
		} catch (err) {
			console.error('Email notification error:', err);
			setEmailStatus('error');
		}
	};

	// Watch for fermentation completion and trigger notification
	useEffect(() => {
		if (!isLive || monitoringData.length === 0) return;
		if (completionAlertedRef.current) return;

		const latestData = monitoringData[monitoringData.length - 1];
		const brixReady = latestData.brix !== undefined && latestData.brix <= 1;
		const gravityInRange = latestData.gravity !== undefined && latestData.gravity >= 0 && latestData.gravity <= 12;

		if (brixReady && gravityInRange) {
			completionAlertedRef.current = true;
			setShowCompletionModal(true);
			sendCompletionEmail();
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [monitoringData, isLive]);

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

			{/* Fermentation Completion Modal */}
			{showCompletionModal && (
				<div style={{
					position: 'fixed', inset: 0, zIndex: 9999,
					background: 'rgba(0,0,0,0.5)',
					display: 'flex', alignItems: 'center', justifyContent: 'center',
					padding: 16
				}}>
					<div style={{
						background: '#fff',
						borderRadius: 20,
						padding: '36px 40px',
						maxWidth: 460,
						width: '100%',
						boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
						textAlign: 'center',
						position: 'relative',
						animation: 'cbSlideDown .35s cubic-bezier(.22,1,.36,1) both'
					}}>
						{/* Close */}
						<button
							onClick={() => setShowCompletionModal(false)}
							style={{
								position: 'absolute', top: 14, right: 16,
								background: 'none', border: 'none', fontSize: 22,
								cursor: 'pointer', color: '#9ca3af', lineHeight: 1
							}}
							aria-label="Close"
						>×</button>

						<div style={{ fontSize: 24, fontWeight: 900, color: '#065f46', marginBottom: 8 }}>
							Fermentation Complete!
						</div>
						<div style={{ fontSize: 14, color: '#374151', marginBottom: 6, lineHeight: 1.6 }}>
							Batch <strong>{selectedId}</strong> has reached the target Brix level (≤ 1°Bx).
							The coconut sap fermentation is ready.
						</div>

						{/* Email status */}
						<div style={{
							margin: '16px 0',
							padding: '10px 16px',
							borderRadius: 10,
							background: emailStatus === 'sent' ? '#f0fdf4' : emailStatus === 'error' ? '#fef2f2' : '#f8fafc',
							border: `1px solid ${emailStatus === 'sent' ? '#bbf7d0' : emailStatus === 'error' ? '#fecaca' : '#e2e8f0'}`,
							fontSize: 13,
							fontWeight: 600,
							color: emailStatus === 'sent' ? '#065f46' : emailStatus === 'error' ? '#991b1b' : '#64748b',
							display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
						}}>
							{emailStatus === 'sending' && <span> Sending email notification…</span>}
							{emailStatus === 'sent' && <span> Email notification sent successfully</span>}
							{emailStatus === 'error' && <span> Email could not be sent — check server logs</span>}
							{!emailStatus && <span> Preparing email notification…</span>}
						</div>

						{/* Final Readings */}
						{monitoringData.length > 0 && (() => {
							const last = monitoringData[monitoringData.length - 1];
							return (
								<div style={{
									background: '#f0fdf4', border: '1px solid #bbf7d0',
									borderRadius: 12, padding: '12px 16px',
									display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
									textAlign: 'center', marginBottom: 24, fontSize: 13
								}}>
									{[
										{ label: 'Brix', value: last.brix != null ? `${last.brix.toFixed(2)}°Bx` : '—' },
										{ label: 'Gravity', value: last.gravity != null ? last.gravity.toFixed(3) : '—' },
										{ label: 'Temperature', value: last.temperature != null ? `${last.temperature.toFixed(1)}°C` : '—' }
									].map(item => (
										<div key={item.label}>
											<div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</div>
											<div style={{ color: '#065f46', fontWeight: 800, fontSize: 15 }}>{item.value}</div>
										</div>
									))}
								</div>
							);
						})()}

						<button
							onClick={() => setShowCompletionModal(false)}
							style={{
								background: '#16a34a', color: '#fff',
								border: 'none', borderRadius: 12,
								padding: '12px 32px', fontWeight: 800,
								fontSize: 15, cursor: 'pointer',
								width: '100%',
								boxShadow: '0 4px 14px rgba(22,163,74,0.3)'
							}}
						>
							Continue
						</button>
					</div>
				</div>
			)}

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
								Status: {selected?.fermentation_status || 'Unknown'}
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
										width: 120,            
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
											width: 18,            
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
								<LineChart data={monitoringData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
									<XAxis 
										dataKey="time" 
										stroke="#666" 
										fontSize={10}
										angle={-45}
										textAnchor="end"
										height={70}
										interval={0}
										tickFormatter={(value) => {
											// Value should already be a formatted time string from the data
											if (value && typeof value === 'string') {
												return value;
											}
											// Fallback: return empty if no value
											return '';
										}}
									/>
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
							{ color: '#2563eb', label: 'Specific Gravity', range: '1.04 - 1.07', key: 'gravity' },
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
						<div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 12 }}>Current Values</div>
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
						background: !isLive ? '#f8f9fa' : isBrixReady ? '#e8f5e8' : isApproaching ? '#dbeafe' : '#fee2e2', 
						padding: 18, 
						borderRadius: 12, 
						boxShadow: '0 2px 8px rgba(0,0,0,0.06)' 
					}}>
						<div style={{ 
							fontSize: 18, 
							fontWeight: 800, 
							color: !isLive ? '#666' : isBrixReady ? '#1b5e20' : isApproaching ? '#1e40af' : '#7f1d1d', 
							marginBottom: 8 
						}}>Analysis</div>
						<div style={{ display: 'flex', gap: 10 }}>
							<div style={{ 
								width: 20, 
								height: 20, 
								background: !isLive ? '#999' : isBrixReady ? '#16a34a' : isApproaching ? '#3b82f6' : '#e11d48', 
								color: '#fff', 
								borderRadius: '50%', 
								display: 'flex', 
								alignItems: 'center', 
								justifyContent: 'center', 
								fontSize: 12, 
								fontWeight: 800 
							}}>
								{!isLive ? '⏸' : isBrixReady ? '✓' : isApproaching ? '◐' : '●'}
							</div>
							<div style={{ 
								color: !isLive ? '#666' : isBrixReady ? '#065f46' : isApproaching ? '#1e40af' : '#7f1d1d', 
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