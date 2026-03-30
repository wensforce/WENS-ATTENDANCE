import React, { createContext, useState, useEffect } from "react";
import { authApi } from "../api/authApi.js";
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) return;
    setLoading(true);
    authApi
      .verifyToken()
      .then((response) => {
        if (response.data.user) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      })
      .catch((error) => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  const login = async (email, mobileNumber, password) => {
    try {
      const response = await authApi.login(email, mobileNumber, password);
      if (response.data.user) {
        setUser(response.data.user);
        return response;
      }
    } catch (error) {
      return { success: false, error: error, message: error.message };
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
