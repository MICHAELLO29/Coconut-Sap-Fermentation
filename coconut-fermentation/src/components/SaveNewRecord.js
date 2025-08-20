import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SaveNewRecord = () => {
  const [formData, setFormData] = useState({
    brix: '16.0',
    alcoholContent: '25.0',
    temperature: '32.0',
    timeInterval: '56:04:01',
    logDate: '20/05/25'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Handle save logic here
    console.log('Saving record:', formData);
    // You can add navigation or success message here
  };

  return (
    <div className="save-new-record">
      {/* Header */}
      <div className="header">
        <div className="logo-section">
          <div className="logo">
            <div className="champagne-flutes">
              <div className="flute left"></div>
              <div className="flute right"></div>
            </div>
          </div>
          <h1>Save New Record</h1>
        </div>
        <div className="header-right">
          <div className="hamburger-menu">☰</div>
        </div>
      </div>

      <div className="main-content">
        {/* Left Column - Production Details */}
        <div className="left-column">
          <div className="production-details">
            <h2>Production Details</h2>
            
            <div className="batch-number-tag">
              <span>Batch Number: 001</span>
            </div>

            <div className="input-fields">
              <div className="input-group">
                <label>Brix (sugar):</label>
                <input
                  type="text"
                  name="brix"
                  value={formData.brix}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Alcohol Content:</label>
                <input
                  type="text"
                  name="alcoholContent"
                  value={formData.alcoholContent}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Temperature:</label>
                <input
                  type="text"
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Time Interval:</label>
                <input
                  type="text"
                  name="timeInterval"
                  value={formData.timeInterval}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label>Log Date:</label>
                <input
                  type="text"
                  name="logDate"
                  value={formData.logDate}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Analysis, Forecast, Timeline */}
        <div className="right-column">
          <div className="analysis-panel">
            <h3>Analysis</h3>
            <p>
              Based on the input parameters, the <strong className="highlight">tuba is ready for distillation</strong>
            </p>
          </div>

          <div className="production-forecast-panel">
            <h3>Production Forecast</h3>
            <div className="forecast-item">
              <span>Estimated Volume: <strong className="highlight">18.6 L</strong></span>
            </div>
            <div className="forecast-item">
              <span>Estimated Profit: <strong className="highlight">₱4,092.00</strong></span>
            </div>
          </div>

          <div className="fermentation-timeline-panel">
            <h3>Fermentation Timeline</h3>
            <div className="timeline-item">
              <span>Start Date: <strong className="highlight">20/05/25</strong></span>
            </div>
            <div className="timeline-item">
              <span>End Date: <strong className="highlight">22/05/25</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="save-button-container">
        <button className="save-button" onClick={handleSave}>
          Save Record
        </button>
      </div>

      {/* Navigation Links */}
      <div className="navigation-links">
        <Link to="/" className="nav-link">Back to Dashboard</Link>
        <Link to="/record-summary" className="nav-link">View Record Summary</Link>
        <Link to="/fermentation-monitoring" className="nav-link">Monitor Fermentation</Link>
      </div>
    </div>
  );
};

export default SaveNewRecord; 