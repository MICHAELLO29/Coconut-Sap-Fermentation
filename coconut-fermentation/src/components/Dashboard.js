import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [batches] = useState([
    { id: '001', startDate: '20/05/25', endDate: '23/05/25', phLevel: 5.6, brix: 16.0, alcohol: 25.0, status: 'Ready' },
    { id: '002', startDate: '22/05/25', endDate: '25/05/25', phLevel: 4.2, brix: 16.2, alcohol: 22.1, status: 'N/A' },
    { id: '003', startDate: '25/05/25', endDate: '28/05/25', phLevel: 4.12, brix: 17.0, alcohol: 35.0, status: 'N/A' },
    { id: '004', startDate: '27/05/25', endDate: '30/05/25', phLevel: 5.2, brix: 16.4, alcohol: 25.2, status: 'N/A' },
    { id: '005', startDate: '30/05/25', endDate: '02/06/25', phLevel: 5.3, brix: 17.4, alcohol: 28.0, status: 'N/A' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const totalBatches = batches.length;
  const readyBatches = batches.filter(batch => batch.status === 'Ready').length;
  const notReadyBatches = batches.filter(batch => batch.status === 'N/A').length;

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="header">
        <div className="logo-section">
          <div className="logo">
            <div className="champagne-flutes">
              <div className="flute left"></div>
              <div className="flute right"></div>
            </div>
          </div>
          <h1>Dashboard</h1>
        </div>
        <div className="header-right">
          <div className="hamburger-menu">☰</div>
          <div className="time-date">
            <div className="time">{formatTime(currentTime)}</div>
            <div className="date">{formatDate(currentTime)}</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card total-batches">
          <h3>Total Batches Being Monitored</h3>
          <div className="number">{totalBatches}</div>
        </div>
        <div className="card ready-batches">
          <h3>Batches Ready</h3>
          <div className="number">{readyBatches}</div>
        </div>
        <div className="card not-ready-batches">
          <h3>Batches Not Ready</h3>
          <div className="number">{notReadyBatches}</div>
        </div>
      </div>

      {/* Batch List */}
      <div className="batch-list-section">
        <h2>Batch List</h2>
        <div className="table-container">
          <table className="batch-table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>pH Level (%)</th>
                <th>Brix (%)</th>
                <th>Alcohol (%)</th>
                <th>Fermentation Status</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch, index) => (
                <tr key={batch.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                  <td>{batch.id}</td>
                  <td>{batch.startDate}</td>
                  <td>{batch.endDate}</td>
                  <td>{batch.status === 'Ready' ? batch.phLevel : 'N/A'}</td>
                  <td>{batch.status === 'Ready' ? batch.brix : 'N/A'}</td>
                  <td>{batch.status === 'Ready' ? batch.alcohol : 'N/A'}</td>
                  <td className={`status ${batch.status === 'Ready' ? 'ready' : 'na'}`}>
                    {batch.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts Section - Temporarily Simplified */}
      <div className="charts-section">
        <div className="chart-container">
          <div className="chart-header">
            <h3>Total Liters of Lambanog Made</h3>
            <select className="time-dropdown">
              <option>▼ Day</option>
            </select>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
            <p>Chart will be loaded here</p>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>Predicted Sales Trends</h3>
            <select className="time-dropdown">
              <option>▼ Day</option>
            </select>
          </div>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
            <p>Chart will be loaded here</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="navigation-links">
        <Link to="/save-record" className="nav-link">Add New Record</Link>
        <Link to="/record-summary" className="nav-link">View Record Summary</Link>
        <Link to="/fermentation-monitoring" className="nav-link">Monitor Fermentation</Link>
      </div>
    </div>
  );
};

export default Dashboard; 