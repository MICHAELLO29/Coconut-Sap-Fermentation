import React from 'react';

const SideMenu = ({ isOpen, onClose, onNavigate, currentPage, isMobile }) => {
	const menuStyles = {
		menu: {
			position: 'fixed',
			top: 0,
			left: isOpen ? 0 : (isMobile ? '-100%' : '-300px'),
			height: '100vh',
			width: isMobile ? 'min(280px, 75vw)' : '300px',
			background: '#fff',
			boxShadow: isMobile ? '2px 0 8px rgba(0,0,0,0.15)' : '0 0 18px rgba(0,0,0,0.2)',
			transition: 'left 200ms cubic-bezier(0.4, 0, 0.2, 1), width 200ms ease',
			zIndex: 1000,
			display: 'flex',
			flexDirection: 'column',
			overflowY: 'auto',
			pointerEvents: isOpen ? 'auto' : 'none'
		},
		header: {
			padding: '20px 20px 10px',
			borderBottom: '1px solid #eee',
			position: 'relative'
		},
		title: {
			fontSize: 18,
			fontWeight: 700,
			color: '#4CAF50'
		},
		menuItems: {
			padding: 10,
			display: 'flex',
			flexDirection: 'column',
			gap: 8
		},
		menuItem: {
			textAlign: 'left',
			padding: '12px 14px',
			border: '1px solid #e0e0e0',
			borderRadius: 8,
			cursor: 'pointer',
			fontWeight: 600,
			color: '#333',
			transition: 'background 120ms'
		},
		activeMenuItem: {
			background: '#e8f5e8'
		},
		inactiveMenuItem: {
			background: '#fff'
		}
	};

	const menuItems = [
		{ key: 'dashboard', label: 'Dashboard' },
		{ key: 'record-summary', label: 'Record Summary' },
		{ key: 'fermentation-monitoring', label: 'Fermentation Monitoring' },
		{ key: 'confirm-batch', label: 'Confirm Batch' }
	];

	return (
		<div
			className="menu"
			style={menuStyles.menu}
		>
			<div style={menuStyles.header}>
				<div style={menuStyles.title}>Menu</div>
				<button 
					onClick={onClose}
					style={{
						position: 'absolute',
						top: '15px',
						right: '15px',
						background: 'none',
						border: 'none',
						fontSize: '24px',
						cursor: 'pointer',
						color: '#666',
						width: '32px',
						height: '32px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: '4px',
						transition: 'background-color 150ms ease'
					}}
					onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
					onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
				>
					×
				</button>
			</div>
			<div style={menuStyles.menuItems}>
				{menuItems.map(item => (
					<button
						key={item.key}
						onClick={() => onNavigate(item.key)}
						style={{
							...menuStyles.menuItem,
							...(currentPage === item.key ? menuStyles.activeMenuItem : menuStyles.inactiveMenuItem)
						}}
					>
						{item.label}
					</button>
				))}
			</div>
		</div>
	);
};

export default SideMenu;
