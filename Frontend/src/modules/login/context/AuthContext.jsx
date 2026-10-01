import React, { createContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api/authApi.js";

export const AuthContext = createContext(null);

/** True when the device is offline or the request never reached the server. */
const isNetworkError = (error) => {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  // Axios: no response = network / timeout / DNS failure (not a real 401)
  if (!error?.response) return true;
  return false;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const verifySession = useCallback(() => {
    setLoading(true);
    return authApi
      .verifyToken()
      .then((response) => {
        setIsOffline(false);
        if (response.data.user) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      })
      .catch((error) => {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          setIsOffline(false);
          setUser(null);
          return;
        }
        if (isNetworkError(error)) {
          // Don't treat offline as logged out — keep user as-is (null on cold start)
          setIsOffline(true);
          return;
        }
        // Other server errors: stay conservative, don't fake logout
        setIsOffline(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  // Auto-retry when browser reports connectivity restored
  useEffect(() => {
    const onOnline = () => {
      if (isOffline || !user) verifySession();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [isOffline, user, verifySession]);

  const login = async (email, mobileNumber, password) => {
    try {
      const response = await authApi.login(email, mobileNumber, password);
      if (response.data.user) {
        setIsOffline(false);
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
    setIsOffline(false);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isOffline,
    verifySession,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
