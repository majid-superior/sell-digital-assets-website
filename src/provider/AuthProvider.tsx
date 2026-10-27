import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { User } from "@/types/user.ts";
import { AuthContext, type AuthContextType } from "@/context/authContext.ts";
import { authService } from "@/services/v1/authService.ts";
import { ApiError, NetworkError, TimeoutError } from "@/services/api.ts";
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
    // Only block initial render while restoring session if stored credentials exist
    const [isLoading, setIsLoading] = useState<boolean>(() =>
        Boolean(authService.getStoredToken() || authService.getStoredRefreshToken())
    );

    const userRef = useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Failsafe watchdog: ensure isLoading is never stuck true for more than 5 seconds
    useEffect(() => {
        if (!isLoading) return;
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 5000);
        return () => clearTimeout(timer);
    }, [isLoading]);

    const setSession = useCallback((newUser: User, newToken: string) => {
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

    const isExpiringRef = useRef(false);

    const handleSessionExpired = useCallback((customMessage?: string) => {
        if (isExpiringRef.current) return;
        isExpiringRef.current = true;
        setTimeout(() => {
            isExpiringRef.current = false;
        }, 1500);

        const hadSession = Boolean(
            authService.getStoredToken() ||
            authService.getStoredRefreshToken() ||
            userRef.current
        );

        const currentPath = window.location.pathname;
        const currentSearch = window.location.search || "";
        const isAuthPage = currentPath === "/signin" || currentPath === "/signup";
        const isPublicHome = currentPath === "/";

        if (hadSession && !isAuthPage && !isPublicHome) {
            const target = `${currentPath}${currentSearch}`;
            try {
                sessionStorage.setItem("auth_redirect_url", target);
            } catch {
                // Storage quota/access restrictions
            }
        }

        authService.clearSession();
        setUser(null);
        setToken(null);
        setIsLoading(false);
        queryClient.clear();

        if (hadSession && !isAuthPage) {
            const description = customMessage || "Your session has expired. Please sign in again.";
            toast.error("Session Expired", {
                description,
            });

            const target = `${currentPath}${currentSearch}`;
            const redirectParam = encodeURIComponent(target);
            void navigate(`/?redirect=${redirectParam}`, { replace: true });
        }
    }, [navigate]);

    // Verify session integrity against the backend on mount
    useEffect(() => {
        const controller = new AbortController();

        async function restoreSession() {
            const storedToken = authService.getStoredToken();
            const refreshToken = authService.getStoredRefreshToken();

            if (!storedToken && !refreshToken) {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
                return;
            }

            // 1. Enforce persisted idle timeout across browser/PC restarts before restoring session
            const systemSettings = organizationService.getSystemSettings();
            const timeoutMinutes = systemSettings.sessionIdleTimeoutMinutes || 30;
            const timeoutMs = timeoutMinutes * 60 * 1000;
            const lastActivity = authService.getLastActivity();
            if (lastActivity && Date.now() - lastActivity >= timeoutMs) {
                if (!controller.signal.aborted) {
                    handleSessionExpired("Your session has expired due to inactivity. Please sign in again.");
                }
                return;
            }

            let isPermanentAuthFailure = false;

            // 2. Attempt to verify with current access token
            if (storedToken) {
                try {
                    const freshUser = await authService.getCurrentUser({ signal: controller.signal });
                    if (!controller.signal.aborted) {
                        authService.updateLastActivity();
                        setUser(freshUser);
                        setToken(authService.getStoredToken());
                        setIsLoading(false);
                        return;
                    }
                } catch (err: unknown) {
                    if (controller.signal.aborted) return;
                    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
                        isPermanentAuthFailure = true;
                    } else if (
                        err instanceof NetworkError ||
                        err instanceof TimeoutError ||
                        (err instanceof ApiError && err.status >= 500)
                    ) {
                        // Infrastructure or network unavailable: preserve session per GEMINI.md standards
                        setIsLoading(false);
                        return;
                    }
                }
            }

            // 3. Attempt silent token refresh if refresh token is available and token expired
            if (refreshToken && (!storedToken || isPermanentAuthFailure)) {
                try {
                    const refreshed = await authService.refreshSession({ signal: controller.signal });
                    if (refreshed && !controller.signal.aborted) {
                        authService.updateLastActivity();
                        setUser(refreshed.user);
                        setToken(refreshed.token);
                        setIsLoading(false);
                        isPermanentAuthFailure = false;
                        return;
                    }
                } catch (err: unknown) {
                    if (controller.signal.aborted) return;
                    if (
                        err instanceof NetworkError ||
                        err instanceof TimeoutError ||
                        (err instanceof ApiError && err.status >= 500)
                    ) {
                        // Network error during refresh: do not terminate session
                        setIsLoading(false);
                        return;
                    }
                }
            }

            // 4. Terminate unverified session ONLY upon definitive 401/403 authorization rejection
            if (!controller.signal.aborted) {
                if (isPermanentAuthFailure) {
                    handleSessionExpired("Your session has expired. Please sign in again.");
                } else {
                    setIsLoading(false);
                }
            }
        }

        restoreSession()
            .catch(() => {})
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            });

        return () => {
            controller.abort();
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
                handleSessionExpired("Your session has expired due to inactivity. Please sign in again.");
            }
        }, 15000);

        return () => {
            clearInterval(checkInterval);
            events.forEach((evt) => window.removeEventListener(evt, updateActivity));
        };
    }, [user, token, isLoading, handleSessionExpired]);

    // Tab revisit listener: validate session or refresh expired tokens when switching back to tab
    useEffect(() => {
        if (!token || !user) return;

        const handleTabRevisit = () => {
            void (async () => {
                if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

                const systemSettings = organizationService.getSystemSettings();
                const timeoutMinutes = systemSettings.sessionIdleTimeoutMinutes || 30;
                const timeoutMs = timeoutMinutes * 60 * 1000;
                const lastActivity = authService.getLastActivity();
                if (lastActivity && Date.now() - lastActivity >= timeoutMs) {
                    handleSessionExpired("Your session has expired due to inactivity. Please sign in again.");
                    return;
                }

                authService.updateLastActivity();

                try {
                    await authService.getCurrentUser();
                } catch (err: unknown) {
                    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
                        const refreshed = await authService.refreshSession();
                        if (refreshed) {
                            setToken(refreshed.token);
                            setUser(refreshed.user);
                        } else {
                            handleSessionExpired("Your session has expired. Please sign in again.");
                        }
                    }
                }
            })();
        };

        document.addEventListener("visibilitychange", handleTabRevisit);
        window.addEventListener("focus", handleTabRevisit);

        return () => {
            document.removeEventListener("visibilitychange", handleTabRevisit);
            window.removeEventListener("focus", handleTabRevisit);
        };
    }, [token, user, handleSessionExpired]);

    // Synchronize when other tabs or services dispatch auth events
    useEffect(() => {
        const onSessionExpired = () => {
            handleSessionExpired("Your session has expired. Please sign in again.");
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
