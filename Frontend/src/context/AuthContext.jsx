import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';
import { APP_CONFIG } from '../config/appConfig';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.success && res.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  const googleLogin = async (credential) => {
    const res = await authApi.googleAuth(credential);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const isSuperAdmin = user?.role === APP_CONFIG.roles.SUPER_ADMIN;
  const isAdmin =
    user?.role === APP_CONFIG.roles.SUPER_ADMIN ||
    user?.role === APP_CONFIG.roles.ADMIN_L2 ||
    user?.role === APP_CONFIG.roles.ADMIN_L3;

  const hasPermission = (permission) => {
    if (!user) return false;
    if (isSuperAdmin) return true;
    return Boolean(user.permissions && user.permissions.includes(permission));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
        hasPermission,
        isSuperAdmin,
        isAdmin,
        refreshUser: fetchCurrentUser,
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
