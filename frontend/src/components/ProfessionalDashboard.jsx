import { useRole } from '../contexts/RoleContext';
import { getContract, getTotalProducts, getAllProductIds } from '../utils/contract';
import { addressUrl, CONTRACT_ADDRESS } from '../utils/network';
import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

const truncate = (value) => `${value.slice(0, 6)}...${value.slice(-4)}`;

export default function ProfessionalDashboard() {
  const { currentRole, hasPermission } = useRole();
  const [stats, setStats] = useState({
    totalProducts: 0,
    ownedProducts: 0,
    pendingTransfers: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    loadDashboardData();
    loadAccount();
  }, [currentRole]);

  const loadAccount = async () => {
    try {
      if (window.ethereum) {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error loading account:', error);
    }
  };

  const loadDashboardData = async () => {
    try {
      const contract = await getContract();
      
      // Get real data from contract
      const totalProducts = await getTotalProducts();
      const allProductIds = await getAllProductIds();
      
      let ownedProducts = 0;
      if (account) {
        const ownedIds = await contract.getProductsByOwner(account);
        ownedProducts = ownedIds.length;
      }

      // Get recent activity from some products
      const recentActivity = [];
      const recentProducts = allProductIds.slice(-3);
      
      for (const productId of recentProducts) {
        try {
          const product = await contract.getProduct(productId);
          const history = await contract.getProductHistory(productId);
          if (history.length > 0) {
            const lastEntry = history[history.length - 1];
            recentActivity.push({
              type: 'transfer',
              product: `${product.name} #${productId}`,
              from: lastEntry.actor,
              time: new Date(Number(lastEntry.timestamp) * 1000).toLocaleString()
            });
          }
        } catch (error) {
          console.error('Error getting product details:', error);
        }
      }

      setStats({
        totalProducts: Number(totalProducts),
        ownedProducts,
        pendingTransfers: 0, // Would need additional contract logic
        recentActivity: recentActivity.slice(0, 3)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to mock data if contract call fails
      setStats({
        totalProducts: 0,
        ownedProducts: 0,
        pendingTransfers: 0,
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, label, value, color, trend }) => (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
          {icon}
        </span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {trend && (
        <div className="stat-trend">
          <span className={`trend-indicator ${trend > 0 ? 'positive' : 'negative'}`}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="trend-period">vs last week</span>
        </div>
      )}
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const activityIcons = {
      transfer: '🔄',
      create: '➕',
      quality: '✅'
    };
    
    return (
      <div className="activity-item">
        <span className="activity-icon">{activityIcons[activity.type]}</span>
        <div className="activity-details">
          <span className="activity-product">{activity.product}</span>
          <span className="activity-meta">
            by <a href={addressUrl(activity.from)} target="_blank" rel="noopener noreferrer" className="activity-link">
              {truncate(activity.from)}
            </a>
          </span>
        </div>
        <span className="activity-time">{activity.time}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="professional-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your supply chain operations</p>
        </div>
        <div className="header-actions">
          <button className="action-btn secondary">
            <span>📥</span> Export Report
          </button>
          <button className="action-btn primary">
            <span>🔄</span> Refresh
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard 
          icon="📦" 
          label="Total Products" 
          value={stats.totalProducts} 
          color="#4CAF50"
          trend={12}
        />
        <StatCard 
          icon="👤" 
          label="Owned Products" 
          value={stats.ownedProducts} 
          color="#2196F3"
          trend={8}
        />
        <StatCard 
          icon="⏳" 
          label="Pending Transfers" 
          value={stats.pendingTransfers} 
          color="#FF9800"
          trend={-5}
        />
        <StatCard 
          icon="✅" 
          label="Quality Approved" 
          value="92%" 
          color="#9C27B0"
          trend={3}
        />
      </div>

      <div className="dashboard-content">
        <div className="content-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="activity-list">
            {stats.recentActivity.map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))}
          </div>
        </div>

        <div className="content-section">
          <div className="section-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            {hasPermission('create_product') && (
              <button className="quick-action-btn">
                <span className="action-icon">➕</span>
                <span className="action-label">Create Product</span>
              </button>
            )}
            {hasPermission('transfer_product') && (
              <button className="quick-action-btn">
                <span className="action-icon">🔄</span>
                <span className="action-label">Transfer Product</span>
              </button>
            )}
            {hasPermission('approve_quality') && (
              <button className="quick-action-btn">
                <span className="action-icon">✅</span>
                <span className="action-label">Quality Check</span>
              </button>
            )}
            {hasPermission('verify_product') && (
              <button className="quick-action-btn">
                <span className="action-icon">🔍</span>
                <span className="action-label">Verify Product</span>
              </button>
            )}
          </div>

          <div className="section-header" style={{ marginTop: '24px' }}>
            <h2>Contract Information</h2>
          </div>
          <div className="contract-info">
            <div className="info-row">
              <span className="info-label">Network:</span>
              <span className="info-value">Sepolia Testnet</span>
            </div>
            <div className="info-row">
              <span className="info-label">Contract Address:</span>
              <a 
                href={addressUrl(CONTRACT_ADDRESS)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="info-link"
              >
                {truncate(CONTRACT_ADDRESS)}
              </a>
            </div>
            <div className="info-row">
              <span className="info-label">Current Role:</span>
              <span className="info-value">
                {currentRole.icon} {currentRole.name}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
