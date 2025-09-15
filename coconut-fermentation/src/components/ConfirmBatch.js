import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ConfirmBatch = () => {
  const [formData, setFormData] = useState({
    angle: '',
    sg: '',
    brix: '',
    temperature: '',
    ph: '',
    liter: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirm = () => {
    console.log("Confirming batch with:", formData);
    // TODO: send data to backend / start batch
  };

  // Helper to check if field has value
  const hasValue = (val) => val && val.trim() !== "";

  return (
    <div className="confirm-batch">
      {/* Header */}
      <div className="header">
        <div className="logo-section">
          <div className="logo">
            <div className="champagne-flutes">
              <div className="flute left"></div>
              <div className="flute right"></div>
            </div>
          </div>
          <h1>LambaTech Dashboard</h1>
        </div>
      </div>

      <div className="main-content">
        {/* Start/End Date section (replacing left panel) */}
        <div className="date-section">
          <div className="date-box start-date">
            <p>Start Date:</p>
            <h3>March 20, 2025</h3>
          </div>
          <div className="date-box end-date">
            <p>End Date:</p>
            <h3>March 22, 2025</h3>
          </div>
          <button className="change-end-date">Change End Date</button>
        </div>

        {/* Parameter fields */}
        <div className="input-fields">
          {[
            { label: "Angle", name: "angle", readOnly: true },
            { label: "Specific Gravity (SG)", name: "sg", readOnly: true },
            { label: "Brix (°Bx)", name: "brix", readOnly: true },
            { label: "Temperature (°C)", name: "temperature", readOnly: true },
            { label: "pH Level", name: "ph", readOnly: true },
            { label: "Liter (L)", name: "liter", readOnly: false }
          ].map((field, idx) => (
            <div key={idx} className="input-group">
              <label>{field.label}</label>
              <input
                type="text"
                name={field.name}
                value={formData[field.name]}
                onChange={handleInputChange}
                readOnly={field.readOnly}
                className="input-field"
              />
              <input
                type="checkbox"
                checked={hasValue(formData[field.name])}
                readOnly
                className="green-check"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="disclaimer">Please make sure parameters are complete.</p>

      {/* Confirm Button */}
      <div className="button-container">
        <button className="confirm-button" onClick={handleConfirm}>
          Confirm & Start
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

export default ConfirmBatch;
