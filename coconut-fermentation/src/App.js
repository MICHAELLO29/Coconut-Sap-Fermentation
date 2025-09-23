import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SaveNewRecord from './components/SaveNewRecord';
import RecordSummary from './components/RecordSummary';
import FermentationMonitoring from './components/FermentationMonitoring';
import ConfirmBatch from './components/ConfirmBatch';
import SideMenu from './components/SideMenu';

function App() {
	const [currentPage, setCurrentPage] = useState('dashboard');
	// Ensure menu always starts closed
	const [menuOpen, setMenuOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	useEffect(() => {
		const handleResize = () => {
			const newIsMobile = window.innerWidth <= 768;
			setIsMobile(newIsMobile);
			// REMOVED: No automatic menu closing/opening on resize
			// Sidebar should ONLY be controlled by user clicks
		};

		// Debounce resize events
		let resizeTimeout;
		const debouncedResize = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(handleResize, 200);
		};

		window.addEventListener('resize', debouncedResize);
		return () => {
			window.removeEventListener('resize', debouncedResize);
			clearTimeout(resizeTimeout);
		};
	}, []); // Empty dependency array - no state dependencies

	const [autoStartLive, setAutoStartLive] = useState(false);

	const handleNavigate = (page, options = {}) => {
	if (page === 'fermentation-monitoring' && options.autoStartLive) {
		setAutoStartLive(true);
	}
	setCurrentPage(page);
	setMenuOpen(false);
	};

	const handleToggleMenu = () => {
		console.log('Menu toggle clicked:', !menuOpen); // Debug log
		setMenuOpen(!menuOpen);
	};
	
	const handleCloseMenu = () => {
		console.log('Menu close triggered'); // Debug log
		setMenuOpen(false);
	};

	const renderCurrentPage = () => {
		switch (currentPage) {
			case 'dashboard':
				return <Dashboard onToggleMenu={handleToggleMenu} />;
			case 'save-record':
				return <SaveNewRecord onToggleMenu={handleToggleMenu} />;
			case 'record-summary':
				return <RecordSummary onToggleMenu={handleToggleMenu} />;
			case 'fermentation-monitoring':
  				return (
					<FermentationMonitoring 
					onToggleMenu={handleToggleMenu}
					onNavigate={handleNavigate}
					/>
				)
			case 'confirm-batch':
  				return <ConfirmBatch onToggleMenu={handleToggleMenu} onNavigate={handleNavigate} />;
			default:
				return <Dashboard onToggleMenu={handleToggleMenu} />;
		}
	};

	return (
		<div className="App" style={{ 
			display: 'flex', 
			minHeight: '100vh', 
			position: 'relative',
			overflow: 'hidden'
		}}>
			{/* Mobile overlay */}
			{isMobile && menuOpen && (
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						width: '100vw',
						height: '100vh',
						background: 'rgba(0,0,0,0.4)',
						zIndex: 999,
						animation: 'fadeIn 200ms ease'
					}}
					onClick={handleCloseMenu}
				/>
			)}
			
			{/* Only render SideMenu when needed */}
			<SideMenu
				isOpen={menuOpen}
				onClose={handleCloseMenu}
				onNavigate={handleNavigate}
				currentPage={currentPage}
				isMobile={isMobile}
			/>
			
			{/* Main content area */}
			<div style={{ 
				flex: 1,
				display: 'flex',
				flexDirection: 'column',
				minWidth: 0,
				// Simplified: Always use overlay approach to prevent layout shifts
				width: '100%',
				height: '100vh',
				overflow: 'hidden',
				position: 'relative'
			}}>
				{renderCurrentPage()}
			</div>
		</div>
	);
}

export default App;
