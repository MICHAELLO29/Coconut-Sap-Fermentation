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
			zIndex: 1001,
			flexShrink: 0,
			background: 'none',
			border: 'none',
			padding: 0,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			minHeight: '44px',
			minWidth: '44px'
		}
	};

	const iconSize = window.innerWidth <= 480 ? 38 : 44;
	const lineW = window.innerWidth <= 480 ? 18 : 22;
	const lineH = 3;
	const lineGap = 5;

	return (
		<div style={headerStyles.container}>
			<div style={headerStyles.leftSection}>
				<button
					aria-label="Toggle navigation menu"
					onClick={onToggleMenu}
					style={headerStyles.hamburgerMenu}
				>
					{/* Rounded rectangle box with 3 lines inside */}
					<div style={{
						width: iconSize, height: iconSize,
						border: '2px solid #c4c4c4',
						borderRadius: 10,
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: lineGap,
						background: '#fff',
						transition: 'border-color 150ms, box-shadow 150ms'
					}}
					onMouseEnter={e => e.currentTarget.style.borderColor = '#9ca3af'}
					onMouseLeave={e => e.currentTarget.style.borderColor = '#c4c4c4'}
					>
						<div style={{ width: lineW, height: lineH, background: '#bdbdbd', borderRadius: 3 }} />
						<div style={{ width: lineW, height: lineH, background: '#bdbdbd', borderRadius: 3 }} />
						<div style={{ width: lineW, height: lineH, background: '#bdbdbd', borderRadius: 3 }} />
					</div>
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
