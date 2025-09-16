import React from 'react';

const Header = ({ title, rightContent, onToggleMenu }) => {
	const headerStyles = {
		container: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: '15px 20px',
			backgroundColor: 'white',
			borderBottom: '1px solid #e0e0e0',
			boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
			position: 'relative',
			zIndex: 100
		},
		leftSection: {
			display: 'flex',
			alignItems: 'center',
			gap: window.innerWidth <= 480 ? 8 : 15,
			flex: 1,
			minWidth: 0
		},
		logoContainer: {
			display: 'flex',
			alignItems: 'center',
			gap: 2
		},
		logo: {
			width: window.innerWidth <= 480 ? 32 : 40,
			height: window.innerWidth <= 480 ? 32 : 40
		},
		title: {
			color: '#4CAF50',
			fontSize: window.innerWidth <= 480 ? 18 : 28,
			fontWeight: 700,
			margin: 0,
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			textOverflow: 'ellipsis'
		},
		rightSection: {
			display: 'flex',
			alignItems: 'flex-end',
			gap: 14,
			flexShrink: 0
		},
		hamburgerMenu: {
			cursor: 'pointer',
			transform: 'translateZ(0)',
			zIndex: 1001,
			padding: '8px',
			margin: '-8px',
			flexShrink: 0,
			borderRadius: '4px',
			transition: 'background-color 150ms ease',
			position: 'relative'
		},
		hamburgerLine: {
			width: window.innerWidth <= 480 ? 28 : 36,
			height: window.innerWidth <= 480 ? 4 : 6,
			background: '#bdbdbd',
			borderRadius: 6,
			marginBottom: window.innerWidth <= 480 ? 4 : 6
		},
		hamburgerLineBottom: {
			width: window.innerWidth <= 480 ? 28 : 36,
			height: window.innerWidth <= 480 ? 4 : 6,
			background: '#bdbdbd',
			borderRadius: 6
		}
	};

	return (
		<div style={headerStyles.container}>
			<div style={headerStyles.leftSection}>
				<div 
					title="menu" 
					onClick={onToggleMenu} 
					style={headerStyles.hamburgerMenu}
					onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
					onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
				>
					<div style={headerStyles.hamburgerLine} />
					<div style={headerStyles.hamburgerLine} />
					<div style={headerStyles.hamburgerLineBottom} />
				</div>
				<div style={headerStyles.logoContainer}>
					<img src="/DashboardIcon.png" alt="Logo" style={headerStyles.logo} />
				</div>
				<h1 style={headerStyles.title}>{title}</h1>
			</div>
			<div style={headerStyles.rightSection}>
				{rightContent}
			</div>
		</div>
	);
};

export default Header;
