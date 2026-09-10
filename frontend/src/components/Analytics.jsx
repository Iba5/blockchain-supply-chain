export default function Analytics() {
  return (
    <div className="analytics-container">
      <div className="panel">
        <h2>Analytics Dashboard</h2>
        <p>Supply chain analytics and insights will be displayed here.</p>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">📊</div>
              <span className="stat-label">Total Products</span>
            </div>
            <div className="stat-value">0</div>
            <div className="stat-trend">
              <span className="trend-indicator positive">+0%</span>
              <span className="trend-period">from last month</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">🔄</div>
              <span className="stat-label">Transfers</span>
            </div>
            <div className="stat-value">0</div>
            <div className="stat-trend">
              <span className="trend-indicator positive">+0%</span>
              <span className="trend-period">from last month</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">🏭</div>
              <span className="stat-label">Manufacturers</span>
            </div>
            <div className="stat-value">0</div>
            <div className="stat-trend">
              <span className="trend-indicator positive">+0%</span>
              <span className="trend-period">from last month</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon">✅</div>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-value">0</div>
            <div className="stat-trend">
              <span className="trend-indicator positive">+0%</span>
              <span className="trend-period">from last month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}