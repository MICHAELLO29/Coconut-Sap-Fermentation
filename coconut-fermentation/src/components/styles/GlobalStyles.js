import { useEffect } from 'react';

// Global CSS styles and animations
const globalCSS = `
  @keyframes fadeIn { 
    from { opacity: 0; transform: translateY(6px) } 
    to { opacity: 1; transform: translateY(0) } 
  }
  
  @keyframes pop { 
    from { opacity: 0; transform: scale(.98) translateY(6px) } 
    to { opacity: 1; transform: scale(1) translateY(0) } 
  }
  
  .card { 
    animation: pop .35s ease both; 
    transition: transform 160ms ease; 
  }
  
  .card:hover { 
    transform: translateY(-2px); 
  }
  
  .chartCard { 
    animation: pop .35s ease .05s both; 
  }
  
  .tableWrap { 
    animation: pop .35s ease .05s both; 
  }
  
  .menu { 
    width: 300px; 
  }
  
  .inputRow { 
    gap: 12px; 
  }
  
  .inputRow input { 
    width: 100%; 
  }
  
  /* Global UX helpers */
  @keyframes uxFadeUp { 
    from { opacity: 0; transform: translateY(8px) } 
    to { opacity: 1; transform: translateY(0) } 
  }
  
  .ux-card { 
    animation: uxFadeUp .32s ease both; 
  }
  
  .ux-pressable { 
    transition: transform 120ms ease, box-shadow 120ms ease; 
  }
  
  .ux-pressable:active { 
    transform: scale(.98); 
  }
  
  .ux-focus { 
    outline: none; 
  }
  
  .ux-focus:focus { 
    box-shadow: 0 0 0 3px rgba(22,163,74,.25); 
  }
  
  .ux-meter { 
    height: 10px; 
    background: #eef6ef; 
    border: 1px solid #d9ead9; 
    border-radius: 999px; 
    overflow: hidden; 
  }
  
  .ux-meter-bar { 
    height: 100%; 
    background: #16a34a; 
    width: 0; 
    transition: width 240ms ease; 
  }
  
  .ux-skeleton { 
    background: linear-gradient(90deg,#eee 25%, #f5f5f5 37%, #eee 63%); 
    background-size: 400% 100%; 
    animation: uxShimmer 1.2s infinite; 
  }
  
  @keyframes uxShimmer { 
    0% { background-position: 100% 0 } 
    100% { background-position: -100% 0 } 
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
  
  .detailsGrid, .summaryGrid, .monitorGrid { 
    grid-template-columns: 1.2fr 1fr; 
  }
  
  @media (max-width: 980px) {
    .grid-3 { 
      grid-template-columns: 1fr !important; 
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
  }
`;

// Common style objects
export const commonStyles = {
  // Layout styles
  pageContainer: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    width: '100%',
    overflow: 'auto'
  },

  // Card styles
  card: {
    background: 'white',
    padding: 25,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },

  cardWithBorder: {
    background: 'white',
    padding: 25,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '2px solid #333',
    textAlign: 'center'
  },

  greenCard: {
    background: '#e8f5e8',
    padding: 25,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '2px solid #4CAF50',
    textAlign: 'center'
  },

  redCard: {
    background: '#ffebee',
    padding: 25,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '2px solid #f44336',
    textAlign: 'center'
  },

  // Grid layouts
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 20,
    margin: 20,
    marginTop: 10,
    marginBottom: 20
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

  // Button styles
  primaryButton: {
    background: '#16a34a',
    color: '#fff',
    fontWeight: 800,
    border: 'none',
    padding: '16px 42px',
    borderRadius: 50,
    fontSize: 18,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 10
  },

  secondaryButton: {
    background: '#ffffff',
    color: '#333',
    fontWeight: 700,
    border: '2px solid #e5e7eb',
    padding: '16px 24px',
    borderRadius: 50,
    fontSize: 16,
    cursor: 'pointer'
  },

  // Input styles
  inputField: {
    flex: 1,
    padding: '18px 16px',
    borderRadius: 12,
    border: '1px solid #eee',
    background: '#f6f7f7',
    textAlign: 'right',
    fontSize: 18,
    color: '#333'
  },

  // Table styles
  tableContainer: {
    border: '3px solid #16a34a',
    borderRadius: 12,
    overflow: 'hidden'
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
