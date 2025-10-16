// src/contexts/PermissionContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { authFetch } from '../lib/api';
import { API_BASE_URL } from '../config/environment';

interface TeamPermissions {
  isAdmin: boolean;
  permissions: string[];
}

interface PermissionContextType {
  permissions: TeamPermissions | null;
  loading: boolean;
  lastFetchTime: number;
  refreshPermissions: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: React.ReactNode;
  isAdmin?: boolean;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ 
  children, 
  isAdmin = false 
}) => {
  const [permissions, setPermissions] = useState<TeamPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  // Refresh permissions from server
  const refreshPermissions = useCallback(async () => {
    // If user is admin, set admin permissions directly
    if (isAdmin) {
      setPermissions({ isAdmin: true, permissions: ['*'] });
      setLastFetchTime(Date.now());
      console.log('✅ Admin permissions set');
      return;
    }

    setLoading(true);
    try {
      const data = await authFetch(`${API_BASE_URL}/team/my-permissions`);
      setPermissions(data);
      setLastFetchTime(Date.now());
      console.log('✅ Permissions refreshed:', data);
      
      // Dispatch custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('permissionsRefreshed', { detail: data }));
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions({ 
        isAdmin: false, 
        permissions: [] 
      });
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  // Check if user has a specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!permissions) return false;
    if (permissions.isAdmin) return true;
    return permissions.permissions.includes(permission);
  }, [permissions]);

  // Check if user has any of the given permissions
  const hasAnyPermission = useCallback((permissionList: string[]): boolean => {
    if (!permissions) return false;
    if (permissions.isAdmin) return true;
    return permissionList.some(perm => permissions.permissions.includes(perm));
  }, [permissions]);

  const value: PermissionContextType = {
    permissions,
    loading,
    lastFetchTime,
    refreshPermissions,
    hasPermission,
    hasAnyPermission,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};
