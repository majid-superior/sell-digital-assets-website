import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { User } from "@/types/user.ts";
import { AuthContext, type AuthContextType } from "@/context/authContext.ts";
import { authService } from "@/services/v1/authService.ts";
import { organizationService } from "@/services/v1/organizationService.ts";
import { queryClient } from "@/services/queryClient.ts";
import { toast } from "sonner";

export interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
    const [token, setToken] = useState<string | null>(() => authService.getStoredToken());
    // When stored credentials exist, keep isLoading = true until backend verification completes
    const [isLoading, setIsLoading] = useState<boolean>(() =>
        Boolean(authService.getStoredToken() || authService.getStoredRefreshToken())
    );

    const userRef = React.useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Prevent re-verifying when user just signed in or already verified on mount
    const hasVerifiedOnMount = React.useRef(false);

    const setSession = useCallback((newUser: User, newToken: string) => {
        hasVerifiedOnMount.current = true;
        authService.updateLastActivity();
        setUser(newUser);
        setToken(newToken);
        setIsLoading(false);
    }, []);

    const signOut = useCallback((redirectTo: string = "/") => {
        authService.signOut();
        setUser(null);
        setToken(null);
        setIsLoading(false);
        queryClient.clear();
        toast.success("Signed out successfully", {
            description: "You have returned to the marketplace.",
        });
        void navigate(redirectTo, { replace: true });
    }, [navigate]);

    const handleSessionExpired = useCallback((customMessage?: string) => {
        const hadSession = Boolean(authService.getStoredToken() || authService.getStoredRefreshToken() || userRef.current);
        authService.clearSession();
        setUser(null);
        setToken(null);
        setIsLoading(false);
        queryClient.clear();

        const currentPath = location.pathname;
        const isAuthPage = currentPath === "/signin" || currentPath === "/signup";

        if (hadSession && !isAuthPage) {
            toast.error("Session Expired", {
                description: customMessage || "Your session has ended. Please sign in again.",
            });
            const search = location.search || "";
            const redirectParam = encodeURIComponent(`${currentPath}${search}`);
            void navigate(`/signin?redirect=${redirectParam}`, { replace: true });
        }
    }, [location.pathname, location.search, navigate]);

    // Verify session integrity against the backend ONLY once on initial mount
    useEffect(() => {
        if (hasVerifiedOnMount.current) return;
        hasVerifiedOnMount.current = true;

        let isMounted = true;

        async function verifySession() {
            const storedToken = authService.getStoredToken();
            const refreshToken = authService.getStoredRefreshToken();

            if (!storedToken && !refreshToken) {
                if (isMounted) setIsLoading(false);
                return;
            }

            // 1. Enforce persisted idle timeout across browser/PC restarts before restoring session
            const systemSettings = organizationService.getSystemSettings();
            const timeoutMinutes = systemSettings.sessionIdleTimeoutMinutes || 30;
            const timeoutMs = timeoutMinutes * 60 * 1000;
            const lastActivity = authService.getLastActivity();
            if (lastActivity && Date.now() - lastActivity >= timeoutMs) {
                if (isMounted) {
                    handleSessionExpired("Your session has ended due to inactivity. Please sign in again.");
                }
                return;
            }

            // 2. Attempt to verify with current access token (apiClient automatically attempts silent refresh on 401)
            if (storedToken) {
                try {
                    const freshUser = await authService.getCurrentUser();
                    if (isMounted) {
                        authService.updateLastActivity();
                        setUser(freshUser);
                        setToken(authService.getStoredToken());
                        setIsLoading(false);
                        return;
                    }
                } catch {
                    // Verification failed; fall through to explicit refresh or session termination
                }
            }

            // 3. Attempt silent token refresh if refresh token is available
            if (refreshToken) {
                try {
                    const refreshed = await authService.refreshSession();
                    if (refreshed && isMounted) {
                        authService.updateLastActivity();
                        setUser(refreshed.user);
                        setToken(refreshed.token);
                        setIsLoading(false);
                        return;
                    }
                } catch {
                    // Refresh failed
                }
            }

            // 4. Both access token and refresh token failed (or server rejected/unreachable): terminate unverified session
            if (isMounted) {
                handleSessionExpired("Your session has ended. Please sign in again.");
            }
        }

        void verifySession();

        return () => {
            isMounted = false;
        };
    }, [handleSessionExpired]);

    // Idle Activity Monitor: Automatically terminate session when user is inactive beyond sessionIdleTimeoutMinutes
    useEffect(() => {
        if (!user || !token || isLoading) return;

        const systemSettings = organizationService.getSystemSettings();
        const timeoutMinutes = systemSettings.sessionIdleTimeoutMinutes || 30;
        const timeoutMs = timeoutMinutes * 60 * 1000;

        let lastRecorded = authService.getLastActivity() || Date.now();
        authService.updateLastActivity(lastRecorded);

        const updateActivity = () => {
            const now = Date.now();
            if (now - lastRecorded > 10000) {
                lastRecorded = now;
                authService.updateLastActivity(now);
            }
        };

        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
        events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

        const checkInterval = setInterval(() => {
            const persistedLastActivity = authService.getLastActivity() || lastRecorded;
            const idleTime = Date.now() - persistedLastActivity;
            if (idleTime >= timeoutMs) {
                clearInterval(checkInterval);
                handleSessionExpired("Your session has ended due to inactivity. Please sign in again.");
            }
        }, 15000);

        return () => {
            clearInterval(checkInterval);
            events.forEach((evt) => window.removeEventListener(evt, updateActivity));
        };
    }, [user, token, isLoading, handleSessionExpired]);

    // Synchronize when other tabs or services dispatch auth events
    useEffect(() => {
        const onSessionExpired = () => {
            handleSessionExpired("Your session has ended. Please sign in again.");
        };

        const handleTokenRefreshed = (e: Event) => {
            const custom = e as CustomEvent<{ token: string; user?: User }>;
            if (custom.detail) {
                if (custom.detail.token) setToken(custom.detail.token);
                if (custom.detail.user) setUser(custom.detail.user);
            }
        };

        const handleSignOut = () => {
            authService.clearSession();
            setUser(null);
            setToken(null);
            setIsLoading(false);
            queryClient.clear();
            if (location.pathname.startsWith("/dashboard")) {
                void navigate("/", { replace: true });
            }
        };

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "auth_token" && !e.newValue) {
                handleSignOut();
            } else if (e.key === "auth_user" && e.newValue) {
                try {
                    setUser(JSON.parse(e.newValue) as User);
                } catch {
                    // Ignore malformed JSON
                }
            }
        };

        window.addEventListener("auth:session-expired", onSessionExpired);
        window.addEventListener("auth:unauthorized", onSessionExpired);
        window.addEventListener("auth:signout", handleSignOut);
        window.addEventListener("auth:token-refreshed", handleTokenRefreshed);
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("auth:session-expired", onSessionExpired);
            window.removeEventListener("auth:unauthorized", onSessionExpired);
            window.removeEventListener("auth:signout", handleSignOut);
            window.removeEventListener("auth:token-refreshed", handleTokenRefreshed);
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [handleSessionExpired, location.pathname, navigate]);

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            token,
            isAuthenticated: !isLoading && Boolean(token && user),
            isLoading,
            setSession,
            signOut,
        }),
        [user, token, isLoading, setSession, signOut]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
