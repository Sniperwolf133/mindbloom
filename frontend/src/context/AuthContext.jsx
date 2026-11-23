import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getStoredToken, setStoredToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshPet = useCallback(async () => {
    try {
      const data = await api.getPet();
      setPet(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    const token = getStoredToken();
    try {
      if (token) {
        const me = await api.me();
        setUser(me);
        await refreshPet();
      } else {
        setUser(null);
        setPet(null);
      }
    } catch {
      setStoredToken("");
      setUser(null);
      setPet(null);
    } finally {
      setLoading(false);
    }
  }, [refreshPet]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    setStoredToken(res.access_token);
    setUser(res.user);
    await refreshPet();
    return res.user;
  };

  const signup = async (payload) => {
    const res = await api.signup(payload);
    setStoredToken(res.access_token);
    setUser(res.user);
    await refreshPet();
    return res.user;
  };

  const demoLogin = async (role = "student") => {
    const res = await api.demoLogin(role);
    setStoredToken(res.access_token);
    setUser(res.user);
    await refreshPet();
    return res.user;
  };

  const logout = () => {
    setStoredToken("");
    setUser(null);
    setPet(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        pet,
        setPet,
        loading,
        isAuthenticated: Boolean(user),
        login,
        signup,
        demoLogin,
        logout,
        refreshPet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}

