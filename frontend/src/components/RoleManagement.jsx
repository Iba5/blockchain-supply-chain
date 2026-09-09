import { useState } from 'react';
import { assignRole, getUserRole } from '../utils/contract';
import { useRole } from '../contexts/RoleContext';

const ROLE_MAPPING = {
  0: 'Consumer',
  1: 'Manufacturer', 
  2: 'Distributor',
  3: 'Retailer',
  4: 'Quality Assurance',
  5: 'Supply Chain Manager',
  6: 'Consumer'
};

export default function RoleManagement() {
  const { currentRole, hasPermission } = useRole();
  const [userAddress, setUserAddress] = useState('');
  const [selectedRole, setSelectedRole] = useState('1');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentRoleDisplay, setCurrentRoleDisplay] = useState('');

  const handleCheckRole = async () => {
    if (!userAddress) return;
    
    try {
      setLoading(true);
      const role = await getUserRole(userAddress);
      setCurrentRoleDisplay(ROLE_MAPPING[role] || 'Unknown');
      setMessage('');
    } catch (error) {
      console.error('Error checking role:', error);
      setMessage('Error checking role. Make sure address is valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!userAddress || !hasPermission('manage_users')) {
      setMessage('You need admin permissions to assign roles.');
      return;
    }

    try {
      setLoading(true);
      await assignRole(userAddress, parseInt(selectedRole));
      setMessage(`Role assigned successfully!`);
      setCurrentRoleDisplay(ROLE_MAPPING[parseInt(selectedRole)]);
    } catch (error) {
      console.error('Error assigning role:', error);
      setMessage('Error assigning role. You may not have admin permissions.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('manage_users')) {
    return (
      <div className="role-management-denied">
        <div className="access-denied-card">
          <span className="denied-icon">🔒</span>
          <h2>Access Restricted</h2>
          <p>Only Supply Chain Managers can manage user roles.</p>
          <p>Your current role: {currentRole.icon} {currentRole.name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="role-management">
      <div className="panel-header">
        <div className="form-title">
          <span className="form-icon">👥</span>
          <div>
            <h2>Role Management</h2>
            <p>Assign and manage user roles in the supply chain</p>
          </div>
        </div>
      </div>

      <div className="role-management-content">
        <div className="role-check-section">
          <h3>Check User Role</h3>
          <div className="role-check-form">
            <input
              type="text"
              placeholder="Enter wallet address (0x...)"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              className="address-input"
            />
            <button 
              onClick={handleCheckRole}
              disabled={loading || !userAddress}
              className="btn-primary"
            >
              {loading ? 'Checking...' : 'Check Role'}
            </button>
          </div>
          {currentRoleDisplay && (
            <div className="role-result">
              <span className="result-label">Current Role:</span>
              <span className="result-value">{currentRoleDisplay}</span>
            </div>
          )}
        </div>

        <div className="role-assign-section">
          <h3>Assign New Role</h3>
          <div className="role-assign-form">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="role-select"
            >
              <option value="0">Consumer</option>
              <option value="1">Manufacturer</option>
              <option value="2">Distributor</option>
              <option value="3">Retailer</option>
              <option value="4">Quality Assurance</option>
              <option value="5">Supply Chain Manager</option>
              <option value="6">Consumer</option>
            </select>
            <button 
              onClick={handleAssignRole}
              disabled={loading || !userAddress}
              className="btn-primary"
            >
              {loading ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="role-info-section">
          <h3>Role Permissions</h3>
          <div className="role-permissions-grid">
            <div className="permission-card">
              <h4>🏭 Manufacturer</h4>
              <p>Create products, transfer items</p>
            </div>
            <div className="permission-card">
              <h4>🚚 Distributor</h4>
              <p>Handle logistics, update locations</p>
            </div>
            <div className="permission-card">
              <h4>🏪 Retailer</h4>
              <p>Receive products, sell to consumers</p>
            </div>
            <div className="permission-card">
              <h4>✅ Quality Assurance</h4>
              <p>Inspect and verify product quality</p>
            </div>
            <div className="permission-card">
              <h4>👔 Supply Chain Manager</h4>
              <p>Full access, manage users and roles</p>
            </div>
            <div className="permission-card">
              <h4>🛒 Consumer</h4>
              <p>Verify product authenticity, view history</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}