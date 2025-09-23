import { useEffect } from 'react';

// Professional CSS Design System
const globalCSS = `
  /* Import Inter font from Google Fonts */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  /* CSS Custom Properties for Design System */
  :root {
    /* Typography */
    --font-family-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-size-xs: 0.75rem;
    --font-size-sm: 0.875rem;
    --font-size-base: 1rem;
    --font-size-lg: 1.125rem;
    --font-size-xl: 1.25rem;
    --font-size-2xl: 1.5rem;
    --font-size-3xl: 1.875rem;
    --font-size-4xl: 2.25rem;
    
    /* Professional Colors */
    --color-primary-50: #ecfdf5;
    --color-primary-100: #d1fae5;
    --color-primary-200: #a7f3d0;
    --color-primary-500: #10b981;
    --color-primary-600: #059669;
    --color-primary-700: #047857;
    --color-primary-800: #065f46;
    
    --color-secondary-500: #06b6d4;
    --color-secondary-600: #0891b2;
    
    --color-accent-500: #f59e0b;
    --color-accent-600: #d97706;
    
    --color-gray-50: #f9fafb;
    --color-gray-100: #f3f4f6;
    --color-gray-200: #e5e7eb;
    --color-gray-300: #d1d5db;
    --color-gray-400: #9ca3af;
    --color-gray-500: #6b7280;
    --color-gray-600: #4b5563;
    --color-gray-700: #374151;
    --color-gray-800: #1f2937;
    --color-gray-900: #111827;
    
    /* Spacing */
    --spacing-1: 0.25rem;
    --spacing-2: 0.5rem;
    --spacing-3: 0.75rem;
    --spacing-4: 1rem;
    --spacing-5: 1.25rem;
    --spacing-6: 1.5rem;
    --spacing-8: 2rem;
    --spacing-10: 2.5rem;
    --spacing-12: 3rem;
    
    /* Border Radius */
    --radius-sm: 0.375rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
    --radius-2xl: 1.5rem;
    --radius-full: 9999px;
    
    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    
    /* Transitions */
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
    --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Enhanced Animations */
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(var(--spacing-4)) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }
  
  @keyframes shimmer {
    0% { background-position: 100% 0; }
    100% { background-position: -100% 0; }
  }
  
  /* Base Styles */
  body {
    font-family: var(--font-family-primary);
    font-size: var(--font-size-base);
    line-height: 1.6;
    color: var(--color-gray-900);
    background-color: var(--color-gray-50);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  .card {
    animation: fadeInUp var(--transition-slow) ease both;
    transition: all var(--transition-normal);
    backdrop-filter: blur(10px);
  }
  
  .card:hover {
    transform: translateY(-2px) scale(1.01);
    box-shadow: var(--shadow-xl);
  }
  
  .chartCard {
    animation: fadeInUp var(--transition-slow) 0.1s ease both;
  }
  
  .tableWrap {
    animation: fadeInUp var(--transition-slow) 0.15s ease both;
  }
  
  .menu {
    width: 320px;
    backdrop-filter: blur(20px);
    background: rgba(255, 255, 255, 0.95);
  }
  
  .inputRow {
    gap: var(--spacing-4);
  }
  
  .inputRow input {
    width: 100%;
  }
  
  /* Enhanced UX Components */
  .ux-card {
    animation: fadeInUp var(--transition-slow) ease both;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border: 1px solid var(--color-gray-200);
  }
  
  .ux-pressable {
    transition: all var(--transition-fast);
    position: relative;
    overflow: hidden;
  }
  
  .ux-pressable::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transition: width var(--transition-fast), height var(--transition-fast);
    transform: translate(-50%, -50%);
  }
  
  .ux-pressable:active::before {
    width: 300px;
    height: 300px;
  }
  
  .ux-pressable:active {
    transform: scale(0.98);
  }
  
  .ux-pressable:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }
  
  .ux-focus {
    outline: none;
    transition: all var(--transition-fast);
  }
  
  .ux-focus:focus {
    box-shadow: 0 0 0 3px var(--color-primary-200);
    border-color: var(--color-primary-500);
  }
  
  .ux-focus:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
  
  .ux-meter {
    height: 12px;
    background: var(--color-gray-200);
    border-radius: var(--radius-full);
    overflow: hidden;
    position: relative;
  }
  
  .ux-meter::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    animation: shimmer 2s infinite;
  }
  
  .ux-meter-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600));
    width: 0;
    transition: width var(--transition-slow) cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: var(--radius-full);
    position: relative;
  }
  
  .ux-skeleton {
    background: linear-gradient(
      90deg,
      var(--color-gray-200) 25%,
      var(--color-gray-300) 37%,
      var(--color-gray-200) 63%
    );
    background-size: 400% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
    border-radius: var(--radius-md);
  }

  @keyframes fadeIn {
    from { opacity: 0 }
    to { opacity: 1 }
  }
  
  .ux-seg { 
    display: inline-flex; 
    gap: 6px; 
    background: #f1f5f3; 
    padding: 4px; 
    border-radius: 999px; 
    border: 1px solid #d6e7d6; 
  }
  
  .ux-seg button { 
    border: none; 
    padding: 6px 10px; 
    border-radius: 999px; 
    background: transparent; 
    font-weight: 800; 
    color: #166534; 
    cursor: pointer; 
  }
  
  .ux-seg button.on { 
    background: #16a34a; 
    color: #fff; 
  }
  
  /* Remove number input spinners when we handle steppers ourselves */
  input.no-spin::-webkit-outer-spin-button,
  input.no-spin::-webkit-inner-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }
  
  input.no-spin[type=number] { 
    -moz-appearance: textfield; 
  }
  
  /* Generic panel animation used on Save New Record and Record Summary */
  .panel { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  
  .panel.enter { 
    opacity: 1; 
    transform: translateY(0); 
    transition: opacity .4s ease, transform .4s ease; 
  }
  
  .pressable { 
    transition: transform 120ms ease; 
  }
  
  .pressable:active { 
    transform: scale(0.98); 
  }
  
  /* Comprehensive Mobile Responsiveness - Facebook-like */
  
  /* Responsive table container for horizontal scrolling */
  .responsive-table-container {
    overflow-x: scroll !important;
    overflow-y: hidden !important;
    -webkit-overflow-scrolling: touch;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    /* Ensure touch scrolling works on all devices */
    touch-action: pan-x;
    /* Force scrollbar to be visible */
    scrollbar-width: auto !important;
    /* Prevent table from collapsing */
    min-width: 100%;
    width: 100%;
    /* Ensure container can scroll */
    max-width: 100%;
    position: relative;
  }
  
  /* Force table to be wider than container for scrolling */
  .responsive-table-container table {
    min-width: 1000px !important;
    width: 1000px !important;
    table-layout: fixed !important;
    /* Force table to be wider than any mobile container */
    display: table !important;
  }
  
  /* Force horizontal scrolling on all screen sizes */
  .responsive-table-container {
    display: block !important;
    overflow-x: scroll !important;
    overflow-y: hidden !important;
    /* Ensure container can't expand to fit table */
    max-width: 100% !important;
  }
  
  /* Add scroll indicator for mobile */
  .responsive-table-container::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 20px;
    height: 100%;
    background: linear-gradient(to left, rgba(255,255,255,0.8), transparent);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  @media (max-width: 768px) {
    .responsive-table-container::after {
      opacity: 1;
    }
  }
  
  /* Enhanced scrollbar styling for better visibility */
  .responsive-table-container::-webkit-scrollbar {
    height: 16px !important;
    width: 16px !important;
    display: block !important;
  }
  
  .responsive-table-container::-webkit-scrollbar-track {
    background: #f1f5f9 !important;
    border-radius: 8px !important;
    border: 1px solid #e2e8f0 !important;
  }
  
  .responsive-table-container::-webkit-scrollbar-thumb {
    background: #16a34a !important;
    border-radius: 8px !important;
    border: 2px solid #f1f5f9 !important;
    min-height: 30px !important;
  }
  
  .responsive-table-container::-webkit-scrollbar-thumb:hover {
    background: #15803d !important;
  }
  
  .responsive-table-container::-webkit-scrollbar-thumb:active {
    background: #14532d !important;
  }
  
  /* Mobile scrollbar visibility and scroll hint */
  @media (max-width: 768px) {
    .responsive-table-container::-webkit-scrollbar {
      height: 12px !important;
      display: block !important;
    }
    
    .responsive-table-container {
      scrollbar-width: auto !important;
      scrollbar-color: #16a34a #f1f5f9 !important;
      /* Force scrollbar to always be visible on mobile */
      overflow-x: scroll !important;
    }
    
    /* Show mobile scroll hint */
    .mobile-scroll-hint {
      display: flex !important;
    }
  }
  
  /* Mobile-first responsive breakpoints */
  
  /* Ultra-small screens (iPhone SE, small Android) */
  @media (max-width: 375px) {
    .grid-3 {
      grid-template-columns: 1fr !important;
      gap: var(--spacing-3) !important;
      margin: var(--spacing-2) !important;
    }
    
    .card, .tableWrap, .chartCard {
      padding: var(--spacing-3) !important;
      margin: var(--spacing-2) !important;
      border-radius: var(--radius-md) !important;
    }
    
    .responsive-table-container table {
      min-width: 800px !important;
      font-size: 10px !important;
    }
    
    .responsive-table-container th,
    .responsive-table-container td {
      padding: 8px 6px !important;
      white-space: nowrap !important;
    }
    
    /* Batch ID column */
    .responsive-table-container th:nth-child(1),
    .responsive-table-container td:nth-child(1) {
      min-width: 50px !important;
      max-width: 50px !important;
    }
    
    /* Date columns */
    .responsive-table-container th:nth-child(2),
    .responsive-table-container td:nth-child(2),
    .responsive-table-container th:nth-child(3),
    .responsive-table-container td:nth-child(3) {
      min-width: 80px !important;
      max-width: 80px !important;
    }
    
    /* Liter column */
    .responsive-table-container th:nth-child(4),
    .responsive-table-container td:nth-child(4) {
      min-width: 60px !important;
      max-width: 60px !important;
    }
    
    /* Status columns */
    .responsive-table-container th:nth-child(5),
    .responsive-table-container td:nth-child(5),
    .responsive-table-container th:nth-child(6),
    .responsive-table-container td:nth-child(6) {
      min-width: 70px !important;
      max-width: 70px !important;
    }
  }
  
  /* Small mobile screens */
  @media (max-width: 480px) {
    .grid-3 {
      grid-template-columns: 1fr !important;
      gap: var(--spacing-3) !important;
      margin: var(--spacing-3) !important;
    }
    
    .card, .tableWrap, .chartCard {
      padding: var(--spacing-4) !important;
      margin: var(--spacing-3) !important;
    }
    
    /* Enhanced mobile table scrolling */
    .responsive-table-container {
      overflow-x: auto !important;
      overflow-y: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      touch-action: pan-x !important;
      scroll-behavior: smooth !important;
      /* Show scrollbar on mobile for better UX */
      scrollbar-width: thin !important;
      /* Ensure container is scrollable */
      max-width: 100vw !important;
    }
    
    .responsive-table-container table {
      min-width: 1000px !important;
      width: 1000px !important;
      font-size: 12px !important;
      table-layout: fixed !important;
      /* Force table to be much wider than mobile viewport */
      display: table !important;
    }
    
    .responsive-table-container th,
    .responsive-table-container td {
      padding: 8px 6px !important;
      white-space: nowrap !important;
      /* Remove text-overflow to show all content */
    }
    
    /* Column width constraints for mobile - ensure all columns are visible */
    .responsive-table-container th:nth-child(1),
    .responsive-table-container td:nth-child(1) {
      min-width: 50px !important;
      width: 50px !important;
    }
    
    .responsive-table-container th:nth-child(2),
    .responsive-table-container td:nth-child(2),
    .responsive-table-container th:nth-child(3),
    .responsive-table-container td:nth-child(3) {
      min-width: 85px !important;
      width: 85px !important;
    }
    
    .responsive-table-container th:nth-child(4),
    .responsive-table-container td:nth-child(4) {
      min-width: 60px !important;
      width: 60px !important;
    }
    
    .responsive-table-container th:nth-child(5),
    .responsive-table-container td:nth-child(5),
    .responsive-table-container th:nth-child(6),
    .responsive-table-container td:nth-child(6) {
      min-width: 75px !important;
      width: 75px !important;
    }
    
    h1, h2, h3 {
      font-size: var(--font-size-lg) !important;
    }
    
    .inputField {
      font-size: 16px !important;
      padding: var(--spacing-3) !important;
    }
    
    .primaryButton, .secondaryButton {
      width: 100% !important;
      justify-content: center !important;
      padding: var(--spacing-4) !important;
      font-size: var(--font-size-base) !important;
    }
  }
  
  /* Medium screens (tablets) */
  @media (max-width: 768px) {
    .grid-3 {
      grid-template-columns: 1fr !important;
      gap: var(--spacing-4) !important;
      margin: var(--spacing-4) !important;
    }
    
    .card, .tableWrap, .chartCard {
      padding: var(--spacing-5) !important;
      margin: var(--spacing-4) !important;
    }
    
    .inputRow {
      flex-direction: column !important;
      align-items: stretch !important;
    }
    
    .inputRow label {
      min-width: auto !important;
      margin-bottom: var(--spacing-2) !important;
      text-align: left !important;
    }
    
    .detailsGrid, .summaryGrid, .monitorGrid {
      grid-template-columns: 1fr !important;
      gap: var(--spacing-4) !important;
      padding: 0 var(--spacing-4) var(--spacing-4) !important;
    }
    
    .responsive-table-container {
      /* Enhanced touch scrolling for tablets */
      -webkit-overflow-scrolling: touch;
      overflow-x: scroll;
      scroll-behavior: smooth;
    }
    
    .responsive-table-container table {
      min-width: 900px !important;
      font-size: 14px !important;
      width: max-content !important;
    }
    
    /* Two-column layouts become single column */
    .confirm-batch-grid {
      grid-template-columns: 1fr !important;
      gap: var(--spacing-6) !important;
    }
    
    .fermentation-main-grid {
      grid-template-columns: 1fr !important;
      gap: var(--spacing-4) !important;
    }
  }
  
  /* Touch-friendly improvements */
  @media (hover: none) and (pointer: coarse) {
    .primaryButton, .secondaryButton {
      min-height: 44px !important;
      padding: var(--spacing-3) var(--spacing-6) !important;
    }
    
    .inputField {
      min-height: 44px !important;
      padding: var(--spacing-3) !important;
    }
    
    .ux-pressable {
      min-height: 44px !important;
      min-width: 44px !important;
    }
  }
  
  /* Accessibility Improvements */
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
  
  @media (prefers-contrast: high) {
    .card, .tableWrap, .chartCard {
      border: 2px solid var(--color-gray-800) !important;
    }
    
    .primaryButton {
      border: 2px solid var(--color-primary-700) !important;
    }
    
    .secondaryButton {
      border: 2px solid var(--color-gray-700) !important;
    }
  }
  
  button:focus-visible, 
  input:focus-visible, 
  select:focus-visible {
    outline: 3px solid var(--color-primary-500) !important;
    outline-offset: 2px !important;
  }
  
  .detailsGrid, .summaryGrid, .monitorGrid { 
    grid-template-columns: 1.2fr 1fr; 
  }
  
  /* Large tablets and small desktops */
  @media (max-width: 1024px) {
    .grid-3 { 
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
      gap: var(--spacing-4) !important;
    }
    
    .grid-2 { 
      grid-template-columns: 1fr !important; 
    }
    
    .menu { 
      width: 85vw !important; 
    }
    
    .detailsGrid, .summaryGrid, .monitorGrid { 
      grid-template-columns: 1fr !important; 
    }
    
    .inputRow { 
      flex-direction: column; 
      align-items: flex-start; 
    }
    
    .confirm-batch-grid {
      grid-template-columns: 1fr !important;
    }
    
    .fermentation-main-grid {
      grid-template-columns: 1fr !important;
    }
  }
  
  /* Desktop and larger screens - enhanced experience */
  @media (min-width: 1025px) {
    .card:hover, .tableWrap:hover, .chartCard:hover {
      transform: translateY(-2px) scale(1.01);
      box-shadow: var(--shadow-xl);
    }
    
    .ux-pressable:hover {
      transform: translateY(-1px) scale(1.02);
    }
    
    .responsive-table-container {
      overflow-x: auto;
    }
    
    .responsive-table-container table {
      min-width: 100% !important;
      width: 100% !important;
      table-layout: fixed !important;
    }
  }
  
  /* Intermediate desktop sizes - prevent table breaking */
  @media (min-width: 769px) and (max-width: 1024px) {
    .responsive-table-container {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .responsive-table-container table {
      min-width: 800px !important;
      width: max-content !important;
      table-layout: auto !important;
    }
  }
  
  /* Landscape mobile optimization */
  @media (max-height: 500px) and (orientation: landscape) {
    .card, .tableWrap, .chartCard {
      padding: var(--spacing-3) !important;
      margin: var(--spacing-2) !important;
    }
    
    .grid-3 {
      margin: var(--spacing-2) !important;
      gap: var(--spacing-2) !important;
    }
  }
`;

// Enhanced Common Style Objects with Professional Design System
export const commonStyles = {
  // Layout styles
  pageContainer: {
    fontFamily: 'var(--font-family-primary)',
    backgroundColor: 'var(--color-gray-50)',
    minHeight: '100vh',
    width: '100%',
    overflow: 'auto',
    position: 'relative'
  },

  // Enhanced Card styles
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: 'var(--spacing-8)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--color-gray-200)',
    transition: 'all var(--transition-normal)'
  },

  cardWithBorder: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    padding: 'var(--spacing-8)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    border: '2px solid var(--color-gray-800)',
    textAlign: 'center',
    transition: 'all var(--transition-normal)'
  },

  greenCard: {
    background: 'var(--color-primary-50)',
    backdropFilter: 'blur(10px)',
    padding: 'var(--spacing-8)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    border: '2px solid var(--color-primary-500)',
    textAlign: 'center',
    transition: 'all var(--transition-normal)'
  },

  redCard: {
    background: '#fef2f2',
    backdropFilter: 'blur(10px)',
    padding: 'var(--spacing-8)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    border: '2px solid #ef4444',
    textAlign: 'center',
    transition: 'all var(--transition-normal)'
  },

  // Responsive Grid layouts
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 'var(--spacing-5)',
    margin: 'var(--spacing-5)',
    marginTop: 'var(--spacing-3)',
    marginBottom: 'var(--spacing-5)',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: 'var(--spacing-4)',
      margin: 'var(--spacing-4)'
    },
    '@media (max-width: 480px)': {
      margin: 'var(--spacing-3)',
      gap: 'var(--spacing-3)'
    }
  },

  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 24,
    padding: '0 24px 24px'
  },

  // Text styles
  cardTitle: {
    color: '#333',
    fontSize: 16,
    fontWeight: 800,
    marginBottom: 6
  },

  largeNumber: {
    fontSize: 40,
    fontWeight: 900,
    color: '#111',
    lineHeight: 1
  },

  greenNumber: {
    fontSize: 40,
    fontWeight: 900,
    color: '#16a34a',
    lineHeight: 1
  },

  redNumber: {
    fontSize: 40,
    fontWeight: 900,
    color: '#e11d48',
    lineHeight: 1
  },

  // Enhanced Button styles
  primaryButton: {
    background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
    color: 'white',
    fontWeight: 700,
    border: 'none',
    padding: 'var(--spacing-4) var(--spacing-10)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-lg)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--spacing-3)',
    transition: 'all var(--transition-normal)',
    boxShadow: 'var(--shadow-md)',
    position: 'relative',
    overflow: 'hidden'
  },

  secondaryButton: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    color: 'var(--color-gray-700)',
    fontWeight: 600,
    border: '2px solid var(--color-gray-300)',
    padding: 'var(--spacing-4) var(--spacing-6)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-size-base)',
    cursor: 'pointer',
    transition: 'all var(--transition-normal)',
    boxShadow: 'var(--shadow-sm)'
  },

  // Enhanced Input styles
  inputField: {
    flex: 1,
    padding: 'var(--spacing-5) var(--spacing-4)',
    borderRadius: 'var(--radius-lg)',
    border: '2px solid var(--color-gray-200)',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(5px)',
    textAlign: 'right',
    fontSize: 'var(--font-size-lg)',
    color: 'var(--color-gray-900)',
    transition: 'all var(--transition-fast)',
    fontWeight: 500
  },

  // Table styles
  tableContainer: {
    border: '3px solid #16a34a',
    borderRadius: 12,
    overflow: 'visible' // Allow horizontal scrolling
  },

  tableHeader: {
    padding: '14px 12px',
    textAlign: 'center',
    fontWeight: 800,
    borderRight: '2px solid #16a34a',
    borderBottom: '2px solid #16a34a'
  },

  tableCell: {
    padding: '14px 12px',
    textAlign: 'center',
    borderRight: '2px solid #16a34a',
    borderBottom: '2px solid #16a34a'
  },

  // Toast styles
  toast: {
    position: 'fixed',
    top: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '12px 16px',
    borderRadius: 12,
    fontWeight: 800,
    boxShadow: '0 8px 18px rgba(0,0,0,0.08)',
    zIndex: 2000
  },

  successToast: {
    background: '#e8f5e8',
    color: '#065f46',
    border: '2px solid #a7f3d0'
  },

  errorToast: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '2px solid #fecaca'
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1999
  },

  modalContent: {
    background: '#ffffff',
    border: '2px solid #a7f3d0',
    borderRadius: 12,
    padding: 20,
    width: 360,
    boxShadow: '0 10px 28px rgba(0,0,0,0.15)'
  }
};

// Hook to inject global styles
export const useGlobalStyles = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = globalCSS;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);
};

export default { commonStyles, useGlobalStyles };
