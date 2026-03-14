// frontend/src/hooks/useAuth.js
import { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { auth as authApi, setToken, getToken } from "../utils/api.js";

// ── State shape ───────────────────────────────────────────────────────────────
const initialState = {
  user:        null,
  loading:     true,   // true while checking stored token on mount
  error:       null,
};

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case "SET_USER":    return { ...state, user: action.payload, loading: false, error: null };
    case "SET_LOADING": return { ...state, loading: action.payload };
    case "SET_ERROR":   return { ...state, error: action.payload, loading: false };
    case "LOGOUT":      return { ...initialState, loading: false };
    default:            return state;
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // On mount — check if a valid token exists in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("digihr_token");
    if (!storedToken) {
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }

    setToken(storedToken);

    authApi.me()
      .then(user => dispatch({ type: "SET_USER", payload: user }))
      .catch(() => {
        // Token invalid/expired — clear everything
        localStorage.removeItem("digihr_token");
        localStorage.removeItem("digihr_refresh");
        setToken(null);
        dispatch({ type: "LOGOUT" });
      });
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR",   payload: null });
    try {
      const data = await authApi.login(email, password);
      setToken(data.accessToken);
      localStorage.setItem("digihr_token",   data.accessToken);
      localStorage.setItem("digihr_refresh", data.refreshToken);
      dispatch({ type: "SET_USER", payload: data.user });
      return { success: true };
    } catch (err) {
      dispatch({ type: "SET_ERROR", payload: err.message });
      return { success: false, error: err.message };
    }
  }, []);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch (_) {}
    setToken(null);
    localStorage.removeItem("digihr_token");
    localStorage.removeItem("digihr_refresh");
    dispatch({ type: "LOGOUT" });
  }, []);

  // ── Mock login (for demo/dev without backend) ──────────────────────────────
  const mockLogin = useCallback((user) => {
    // user shape: { id, name, role, email }
    dispatch({ type: "SET_USER", payload: user });
  }, []);

  // ── Change password ────────────────────────────────────────────────────────
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await authApi.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  // ── RBAC helpers ───────────────────────────────────────────────────────────
  const hasRole = useCallback((...roles) => {
    return roles.includes(state.user?.role);
  }, [state.user]);

  const isAdmin   = useCallback(() => hasRole("super_admin"),                        [hasRole]);
  const isHR      = useCallback(() => hasRole("super_admin", "hr_manager"),          [hasRole]);
  const isFinance = useCallback(() => hasRole("super_admin", "hr_manager", "finance"),[hasRole]);
  const isManager = useCallback(() => hasRole("super_admin", "hr_manager", "manager"),[hasRole]);

  const value = {
    user:           state.user,
    loading:        state.loading,
    error:          state.error,
    isAuthenticated: !!state.user,
    login,
    logout,
    mockLogin,
    changePassword,
    hasRole,
    isAdmin,
    isHR,
    isFinance,
    isManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default useAuth;
