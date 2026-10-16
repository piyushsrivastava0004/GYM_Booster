import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleType, Branch } from '../types';
import { authApi, branchAndSettingsApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  selectedBranchId: number | null;
  branches: Branch[];
  currentBranch?: Branch;
  loading: boolean;
  isAuthenticated: boolean;
  setSelectedBranchId: (id: number | null) => void;
  login: (data: any) => Promise<User>;
  logout: () => void;
  isOwner: boolean;
  isAdmin: boolean;
  isReceptionist: boolean;
  isTrainer: boolean;
  isNutritionist: boolean;
  isAccountant: boolean;
  isInventoryManager: boolean;
  isMember: boolean;
  canManageBusiness: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(() => {
    const saved = localStorage.getItem('selectedBranchId');
    return saved ? Number(saved) : null;
  });

  useEffect(() => {
    if (token) {
      branchAndSettingsApi.getBranches()
        .then((res) => {
          setBranches(res.data);
          if (user?.branchId && !selectedBranchId) {
            setSelectedBranchId(user.branchId);
          }
        })
        .catch(console.error);
    }
  }, [token]);

  const handleSelectBranch = (id: number | null) => {
    setSelectedBranchId(id);
    if (id) {
      localStorage.setItem('selectedBranchId', id.toString());
    } else {
      localStorage.removeItem('selectedBranchId');
    }
  };

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const res = await authApi.login(credentials);
      const data = res.data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      setToken(data.token);
      if (data.branchId) {
        handleSelectBranch(data.branchId);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedBranchId');
    setUser(null);
    setToken(null);
    setSelectedBranchId(null);
    window.location.href = '/login';
  };

  const role = user?.role;
  const isOwner = role === 'ROLE_GYM_OWNER';
  const isAdmin = role === 'ROLE_ADMINISTRATOR';
  const isReceptionist = role === 'ROLE_RECEPTIONIST';
  const isTrainer = role === 'ROLE_TRAINER';
  const isNutritionist = role === 'ROLE_NUTRITIONIST';
  const isAccountant = role === 'ROLE_ACCOUNTANT';
  const isInventoryManager = role === 'ROLE_INVENTORY_MANAGER';
  const isMember = role === 'ROLE_MEMBER';
  const canManageBusiness = isOwner || isAdmin;
  const isAuthenticated = !!token && !!user;
  const currentBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        selectedBranchId,
        branches,
        currentBranch,
        loading,
        isAuthenticated,
        setSelectedBranchId: handleSelectBranch,
        login,
        logout,
        isOwner,
        isAdmin,
        isReceptionist,
        isTrainer,
        isNutritionist,
        isAccountant,
        isInventoryManager,
        isMember,
        canManageBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
