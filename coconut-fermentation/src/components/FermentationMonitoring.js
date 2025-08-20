import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FermentationMonitoring = () => {
  const [monitoringData, setMonitoringData] = useState([]);
  const [startDateTime] = useState('2025-05-20 02:26:47');

  useEffect(() => {
    // Generate initial data
    const generateData = () => {
      const data = [];
      const startTime = new Date('2025-05-20T15:00:00');
      
      for (let i = 0; i <= 22; i++) {
        const time = new Date(startTime.getTime() + i * 60 * 60 * 1000); // Add 1 hour each iteration
        const timeLabel = time.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        // Generate realistic fermentation data
        const phLevel = 0.12 + (i * 0.007) + (Math.random() - 0.5) * 0.02;
        const alcoholContent = Math.max(0, 0.001 + (i * 0.004) + (Math.random() - 0.5) * 0.01);
        const temperature = 0.40 - (i * 0.005) + (Math.random() - 0.5) * 0.03;
        
        data.push({
          time: timeLabel,
          phLevel: Math.max(0, Math.min(0.5, phLevel)),
          alcoholContent: Math.max(0, Math.min(0.5, alcoholContent)),
          temperature: Math.max(0, Math.min(0.5, temperature))
        });
      }
      
      setMonitoringData(data);
    };

    generateData();

    // Update data every 5 seconds for real-time effect
    const interval = setInterval(() => {
      setMonitoringData(prevData => {
        return prevData.map(point => ({
          ...point,
          phLevel: Math.max(0, Math.min(0.5, point.phLevel + (Math.random() - 0.5) * 0.01)),
          alcoholContent: Math.max(0, Math.min(0.5, point.alcoholContent + (Math.random() - 0.5) * 0.005)),
          temperature: Math.max(0, Math.min(0.5, point.temperature + (Math.random() - 0.5) * 0.008))
        }));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fermentation-monitoring">
      {/* Header */}
      <div className="header">
        <div className="logo-section">
          <div className="logo">
            <div className="champagne-flutes">
              <div className="flute left"></div>
              <div className="flute right"></div>
            </div>
          </div>
          <h1>Fermentation Monitoring</h1>
        </div>
        <div className="header-right">
          <div className="hamburger-menu">☰</div>
        </div>
      </div>

      <div className="main-content">
        {/* Left Side - Monitoring Graph */}
        <div className="monitoring-graph">
          <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
            <p>Real-time monitoring chart will be loaded here</p>
          </div>
          
          <div className="start-date-time">
            Start: {startDateTime}
          </div>
        </div>

        {/* Right Side - Parameters and Analysis */}
        <div className="side-panel">
          <div className="parameters-section">
            <h3>Parameters</h3>
            <div className="parameter-list">
              <div className="parameter-item">
                <div className="parameter-color ph-level"></div>
                <span>pH Level</span>
              </div>
              <div className="parameter-item">
                <div className="parameter-color alcohol-content"></div>
                <span>Alcohol Content</span>
              </div>
              <div className="parameter-item">
                <div className="parameter-color temperature"></div>
                <span>Temperature</span>
              </div>
            </div>
          </div>

          <div className="analysis-section">
            <h3>Analysis</h3>
            <div className="analysis-content">
              <p>The fermentation process is progressing normally. pH levels are within optimal range, alcohol content is increasing steadily, and temperature is being maintained at appropriate levels for successful fermentation.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="navigation-links">
        <Link to="/" className="nav-link">Back to Dashboard</Link>
        <Link to="/save-record" className="nav-link">Add New Record</Link>
        <Link to="/record-summary" className="nav-link">View Record Summary</Link>
      </div>
    </div>
  );
};

export default FermentationMonitoring; 