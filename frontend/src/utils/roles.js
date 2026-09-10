export const ROLES = {
  MANUFACTURER: {
    id: 'manufacturer',
    name: 'Manufacturer',
    icon: '🏭',
    color: '#4CAF50',
    description: 'Create and manage products',
    permissions: ['create_product', 'view_all_products', 'transfer_product', 'view_all_history'],
    allowedTransitions: [0, 1] // Can move: Manufactured → Quality Check
  },
  DISTRIBUTOR: {
    id: 'distributor',
    name: 'Distributor',
    icon: '🚚',
    color: '#2196F3',
    description: 'Handle logistics and shipping',
    permissions: ['view_all_products', 'transfer_product', 'view_all_history'],
    allowedTransitions: [2, 3, 4] // Can move: Shipped → In Transit → At Warehouse
  },
  RETAILER: {
    id: 'retailer',
    name: 'Retailer',
    icon: '🏪',
    color: '#FF9800',
    description: 'Receive and sell products',
    permissions: ['view_all_products', 'transfer_product', 'view_all_history'],
    allowedTransitions: [4, 5, 6] // Can move: At Warehouse → At Retailer → Sold
  },
  QUALITY_ASSURANCE: {
    id: 'quality_assurance',
    name: 'Quality Assurance',
    icon: '✅',
    color: '#9C27B0',
    description: 'Inspect and verify products',
    permissions: ['view_all_products', 'transfer_product', 'view_all_history'],
    allowedTransitions: [1, 2] // Can move: Quality Check → Shipped
  },
  SUPPLY_CHAIN_MANAGER: {
    id: 'manager',
    name: 'Supply Chain Manager',
    icon: '👔',
    color: '#F44336',
    description: 'Oversee entire supply chain',
    permissions: ['view_all_products', 'view_analytics', 'manage_users', 'view_all_history', 'transfer_product'],
    allowedTransitions: [0, 1, 2, 3, 4, 5, 6] // Can move: All stages
  },
  CONSUMER: {
    id: 'consumer',
    name: 'Consumer',
    icon: '🛒',
    color: '#00BCD4',
    description: 'Verify product authenticity',
    permissions: ['view_all_history'],
    allowedTransitions: [] // Cannot move products
  }
};

export const DEFAULT_ROLE = ROLES.MANUFACTURER;

export function getRoleById(roleId) {
  return Object.values(ROLES).find(role => role.id === roleId) || DEFAULT_ROLE;
}

export function hasPermission(role, permission) {
  return role.permissions.includes(permission);
}
