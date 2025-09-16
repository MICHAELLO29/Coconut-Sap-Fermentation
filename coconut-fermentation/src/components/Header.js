import React from 'react';

const Header = ({ title, rightContent, onToggleMenu }) => {
	const headerStyles = {
		container: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: 'var(--spacing-4) var(--spacing-5)',
			backgroundColor: 'rgba(255, 255, 255, 0.95)',
			backdropFilter: 'blur(10px)',
			borderBottom: '1px solid var(--color-gray-200)',
			boxShadow: 'var(--shadow-md)',
			position: 'sticky',
			top: 0,
			zIndex: 100,
			transition: 'all var(--transition-normal)'
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
			color: 'var(--color-primary-600)',
			fontSize: window.innerWidth <= 480 ? 'var(--font-size-lg)' : 'var(--font-size-2xl)',
			fontWeight: 700,
			margin: 0,
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			fontFamily: 'var(--font-family-primary)'
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
			padding: 'var(--spacing-2)',
			margin: 'calc(-1 * var(--spacing-2))',
			flexShrink: 0,
			borderRadius: 'var(--radius-md)',
			transition: 'all var(--transition-fast)',
			position: 'relative',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			alignItems: 'center',
			minHeight: '44px',
			minWidth: '44px'
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
				<button 
					aria-label="Toggle navigation menu"
					onClick={onToggleMenu} 
					style={headerStyles.hamburgerMenu}
					onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-100)'}
					onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
					onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-200)'}
					onBlur={(e) => e.currentTarget.style.boxShadow = 'none'}
				>
					<span className="sr-only">Menu</span>
					<div style={headerStyles.hamburgerLine} />
					<div style={headerStyles.hamburgerLine} />
					<div style={headerStyles.hamburgerLineBottom} />
				</button>
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
