import { createContext, useContext, useState, useEffect } from 'react';
import { ROLES, DEFAULT_ROLE, getRoleById } from '../utils/roles';

const RoleContext = createContext();

export function RoleProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(DEFAULT_ROLE);
  const [isRoleSelectorOpen, setIsRoleSelectorOpen] = useState(false);

  useEffect(() => {
    // Load saved role from localStorage
    const savedRoleId = localStorage.getItem('supply_chain_role');
    if (savedRoleId) {
      const savedRole = getRoleById(savedRoleId);
      if (savedRole) {
        setCurrentRole(savedRole);
      }
    }
  }, []);

  const changeRole = (role) => {
    setCurrentRole(role);
    localStorage.setItem('supply_chain_role', role.id);
    setIsRoleSelectorOpen(false);
  };

  const hasPermission = (permission) => {
    return currentRole.permissions.includes(permission);
  };

  return (
    <RoleContext.Provider value={{
      currentRole,
      setCurrentRole: changeRole,
      hasPermission,
      isRoleSelectorOpen,
      setIsRoleSelectorOpen,
      allRoles: Object.values(ROLES)
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
