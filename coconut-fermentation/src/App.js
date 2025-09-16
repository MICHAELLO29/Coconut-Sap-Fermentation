import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SaveNewRecord from './components/SaveNewRecord';
import RecordSummary from './components/RecordSummary';
import FermentationMonitoring from './components/FermentationMonitoring';
import ConfirmBatch from './components/ConfirmBatch';
import SideMenu from './components/SideMenu';

function App() {
	const [currentPage, setCurrentPage] = useState('dashboard');
	const [menuOpen, setMenuOpen] = useState(false);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

	useEffect(() => {
		const handleResize = () => {
			const newIsMobile = window.innerWidth <= 768;
			setIsMobile(newIsMobile);
			// Auto-close menu when switching to desktop
			if (!newIsMobile && menuOpen) {
				setMenuOpen(false);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const handleNavigate = (page) => {
		setCurrentPage(page);
		setMenuOpen(false);
	};

	const handleToggleMenu = () => {
		setMenuOpen(!menuOpen);
	};

	const handleCloseMenu = () => {
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
				return <FermentationMonitoring onToggleMenu={handleToggleMenu} />;
			case 'confirm-batch':
				return <ConfirmBatch onToggleMenu={handleToggleMenu} />;
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
				transition: 'transform 200ms ease',
				transform: isMobile ? 'translateX(0)' : (menuOpen ? 'translateX(300px)' : 'translateX(0)'),
				width: '100%',
				overflow: 'hidden'
			}}>
				{renderCurrentPage()}
			</div>
		</div>
	);
}

export default App;
