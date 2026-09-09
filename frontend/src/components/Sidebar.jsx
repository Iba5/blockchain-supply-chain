import { useRole } from '../contexts/RoleContext';
import { useState } from 'react';

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', permission: null },
  { id: 'products', label: 'Products', icon: '📦', permission: 'view_all_products' },
  { id: 'create', label: 'Create Product', icon: '➕', permission: 'create_product' },
  { id: 'transfer', label: 'Transfer', icon: '🔄', permission: 'transfer_product' },
  { id: 'quality', label: 'Quality Check', icon: '✅', permission: 'approve_quality' },
  { id: 'history', label: 'History', icon: '📜', permission: 'view_all_history' },
  { id: 'analytics', label: 'Analytics', icon: '📈', permission: 'view_analytics' },
  { id: 'verify', label: 'Verify Product', icon: '🔍', permission: 'verify_product' },
  { id: 'roles', label: 'Role Management', icon: '👥', permission: 'manage_users' },
];

export default function Sidebar({ currentPage, onPageChange, account, isConnected, onConnect }) {
  const { currentRole, hasPermission, allRoles, setCurrentRole, isRoleSelectorOpen, setIsRoleSelectorOpen } = useRole();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <>
      <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-icon">📊</div>
            {!isCollapsed && (
              <div className="logo-text">
                <h3>Supply Ledger</h3>
                <p>Supply Chain Platform</p>
              </div>
            )}
          </div>
          <button 
            className="collapse-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>

        <div className="role-section">
          <div className="current-role">
            <span className="role-icon">{currentRole.icon}</span>
            {!isCollapsed && (
              <div className="role-info">
                <span className="role-name">{currentRole.name}</span>
                <span className="role-description">{currentRole.description}</span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button 
              className="change-role-btn"
              onClick={() => setIsRoleSelectorOpen(true)}
            >
              Change Role
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <ul className="nav-list">
            {filteredMenuItems.map(item => (
              <li key={item.id}>
                <button
                  className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                  onClick={() => onPageChange(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {!isCollapsed && <span className="nav-label">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {!isCollapsed && (
          <div className="sidebar-footer">
            <div className="network-status">
              <span className="status-dot online"></span>
              <span className="status-text">Sepolia Testnet</span>
            </div>
            <div className="wallet-section">
              {isConnected ? (
                <div className="wallet-info">
                  <span className="wallet-label">Connected:</span>
                  <span className="wallet-address">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                </div>
              ) : (
                <button onClick={onConnect} className="connect-wallet-btn">
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {isRoleSelectorOpen && (
        <div className="role-selector-overlay" onClick={() => setIsRoleSelectorOpen(false)}>
          <div className="role-selector-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Your Role</h2>
              <button 
                className="close-btn"
                onClick={() => setIsRoleSelectorOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="role-grid">
              {allRoles.map(role => (
                <button
                  key={role.id}
                  className={`role-card ${currentRole.id === role.id ? 'selected' : ''}`}
                  onClick={() => setCurrentRole(role)}
                  style={{ '--role-color': role.color }}
                >
                  <span className="role-card-icon">{role.icon}</span>
                  <h4>{role.name}</h4>
                  <p>{role.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
