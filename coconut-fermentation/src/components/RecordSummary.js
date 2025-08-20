import React from 'react';
import { Link } from 'react-router-dom';

const RecordSummary = () => {
  return (
    <div className="record-summary">
      {/* Header */}
      <div className="header">
        <div className="logo-section">
          <div className="logo">
            <div className="champagne-flutes">
              <div className="flute left"></div>
              <div className="flute right"></div>
            </div>
          </div>
          <h1>Record Summary</h1>
        </div>
        <div className="header-right">
          <div className="hamburger-menu">☰</div>
        </div>
      </div>

      <div className="main-content">
        {/* Left Column - Batch 001 Details */}
        <div className="left-column">
          <div className="batch-details">
            <h2>Batch 001</h2>
            
            <div className="parameter-fields">
              <div className="parameter-field">
                <label>Brix (sugar):</label>
                <div className="value">16.0</div>
              </div>

              <div className="parameter-field">
                <label>Alcohol Content:</label>
                <div className="value">25.0</div>
              </div>

              <div className="parameter-field">
                <label>Temperature:</label>
                <div className="value">32.0 C</div>
              </div>

              <div className="parameter-field">
                <label>Time Interval:</label>
                <div className="value">56:04:01</div>
              </div>

              <div className="parameter-field">
                <label>Log Date:</label>
                <div className="value">20/05/25</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Analysis and Production Summary */}
        <div className="right-column">
          <div className="analysis-panel">
            <h3>Analysis</h3>
            <div className="analysis-content">
              <div className="checkmark-icon">✓</div>
              <p>Based on the input parameters, the tuba is ready for distillation.</p>
            </div>
          </div>

          <div className="production-summary-panel">
            <h3>Production Summary</h3>
            <div className="summary-table">
              <div className="summary-row">
                <span className="label">Batch:</span>
                <span className="value">001</span>
              </div>
              <div className="summary-row">
                <span className="label">Total Tuba Produced:</span>
                <span className="value">18.5 L</span>
              </div>
              <div className="summary-row">
                <span className="label">Duration:</span>
                <span className="value">2 days</span>
                <div className="sub-text">
                  Start Date 20/05/25<br />
                  End Date 20/05/27
                </div>
              </div>
              <div className="summary-row">
                <span className="label">Predicted Income:</span>
                <span className="value highlight">₱2,220.00</span>
                <div className="sub-text">2% higher than last batch</div>
              </div>
            </div>
            <div className="view-analytics-link">
              <a href="#analytics">View Analytics</a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="navigation-links">
        <Link to="/" className="nav-link">Back to Dashboard</Link>
        <Link to="/save-record" className="nav-link">Add New Record</Link>
        <Link to="/fermentation-monitoring" className="nav-link">Monitor Fermentation</Link>
      </div>
    </div>
  );
};

export default RecordSummary; 