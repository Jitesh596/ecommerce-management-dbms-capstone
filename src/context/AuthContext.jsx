import { createContext, useState, useEffect } from "react";
import { loginApi, registerApi, getMeApi, logoutApi } from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("fashionista_user");
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem("fashionista_token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const savedToken = localStorage.getItem("fashionista_token");
        if (savedToken) {
            try {
                const res = await getMeApi();
                if (res.user) {
                    setUser(res.user);
                    localStorage.setItem("fashionista_user", JSON.stringify(res.user));
                }
            } catch (err) {
                console.warn("Session expired or invalid, clearing stored auth.");
                logout();
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        const data = await loginApi({ email, password });
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("fashionista_token", data.token);
        localStorage.setItem("fashionista_user", JSON.stringify(data.user));
        return data;
    };

    const register = async (userData) => {
        const data = await registerApi(userData);
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem("fashionista_token", data.token);
        localStorage.setItem("fashionista_user", JSON.stringify(data.user));
        return data;
    };

    const logout = async () => {
        try {
            await logoutApi();
        } catch (e) {
            // Ignore
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem("fashionista_token");
        localStorage.removeItem("fashionista_user");
    };

    const updateUser = (updatedUser) => {
        setUser(updatedUser);
        localStorage.setItem("fashionista_user", JSON.stringify(updatedUser));
    };

    const isAuthenticated = !!user && !!token;
    const isAdmin = isAuthenticated && user?.role === "admin";

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated,
                isAdmin,
                loading,
                login,
                register,
                logout,
                updateUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
