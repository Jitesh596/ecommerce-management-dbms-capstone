import { createContext, useState, useEffect } from "react";
import { loginUser, registerUser, getMe } from "../services/api";

export const AuthContext = createContext();

const TOKEN_KEY = "fashionista_token";
const USER_KEY = "fashionista_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync with backend /customers/me on startup if token exists
  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const profile = await getMe();
          if (profile && profile.customer_id) {
            setUser(profile);
            localStorage.setItem(USER_KEY, JSON.stringify(profile));
          } else {
            logout();
          }
        } catch (err) {
          console.warn("Session expired or invalid token:", err.message);
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error || "Login failed" };
  };

  const register = async (formData) => {
    const data = await registerUser(formData);
    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error || "Registration failed" };
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  const isAdmin = Boolean(user && user.role === "admin");
  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAdmin,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
