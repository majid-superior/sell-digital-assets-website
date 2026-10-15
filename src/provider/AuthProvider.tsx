// src/provider/AuthProvider.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { User } from "@/types/user.ts";
import { AuthContext, type AuthContextType } from "@/context/authContext.ts";
import { authService } from "@/services/v1/authService.ts";
import { organizationService } from "@/services/v1/organizationService.ts";
import { ApiError } from "@/services/api.ts";
import { toast } from "sonner";

export interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
    const [token, setToken] = useState<string | null>(() => authService.getStoredToken());
    const [isLoading, setIsLoading] = useState<boolean>(() => !authService.getStoredToken());

    const userRef = React.useRef(user);
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Prevent re-verifying when user just signed in or already verified on mount
    const hasVerifiedOnMount = React.useRef(false);

    const setSession = useCallback((newUser: User, newToken: string) => {
        hasVerifiedOnMount.current = true;
        setUser(newUser);
        setToken(newToken);
        setIsLoading(false);
    }, []);

    const signOut = useCallback((redirectTo: string = "/") => {
        authService.signOut();
        setUser(null);
        setToken(null);
        toast.success("Signed out successfully", {
            description: "You have returned to the marketplace.",
        });
        if (typeof window !== "undefined" && window.location.pathname !== redirectTo) {
            window.location.href = redirectTo;
        }
    }, []);

    const handleSessionExpired = useCallback((customMessage?: string) => {
        const hadSession = Boolean(authService.getStoredToken() || authService.getStoredRefreshToken() || userRef.current);
        authService.clearSession();
        setUser(null);
        setToken(null);

        const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
        const isAuthPage = currentPath === "/signin" || currentPath === "/signup";

        if (hadSession && !isAuthPage) {
            toast.error("Session Expired", {
                description: customMessage || "Your session has ended. Please sign in again.",
            });
            if (typeof window !== "undefined") {
                const search = window.location.search || "";
                const redirectParam = encodeURIComponent(`${currentPath}${search}`);
                window.location.href = `/signin?redirect=${redirectParam}`;
            }
        }
    }, []);

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

            // Attempt to verify with current access token
            if (storedToken) {
                try {
                    const freshUser = await authService.getCurrentUser();
                    if (isMounted) {
                        setUser(freshUser);
                        setIsLoading(false);
                        return;
                    }
                } catch (err: unknown) {
                    // Only drop through to refresh/expiry if it's an explicit 401/403 auth error
                    const isAuthError = err instanceof ApiError && (err.status === 401 || err.status === 403);
                    if (!isAuthError && !refreshToken) {
                        // Transient network or server error: retain stored session
                        if (isMounted) setIsLoading(false);
                        return;
                    }
                }
            }

            // Attempt silent token refresh if token expired
            if (refreshToken) {
                try {
                    const refreshed = await authService.refreshSession();
                    if (refreshed && isMounted) {
                        setUser(refreshed.user);
                        setToken(refreshed.token);
                        setIsLoading(false);
                        return;
                    }
                } catch {
                    // Refresh failed
                }
            }

            // Both access token and refresh token failed: session has ended
            if (isMounted) {
                setIsLoading(false);
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
        if (!user || !token) return;

        const systemSettings = organizationService.getSystemSettings();
        const timeoutMinutes = systemSettings.sessionIdleTimeoutMinutes || 30;
        const timeoutMs = timeoutMinutes * 60 * 1000;

        let lastActivity = Date.now();

        const updateActivity = () => {
            lastActivity = Date.now();
        };

        const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
        events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

        const checkInterval = setInterval(() => {
            const idleTime = Date.now() - lastActivity;
            if (idleTime >= timeoutMs) {
                clearInterval(checkInterval);
                handleSessionExpired("Your session has ended due to inactivity. Please sign in again.");
            }
        }, 30000);

        return () => {
            clearInterval(checkInterval);
            events.forEach((evt) => window.removeEventListener(evt, updateActivity));
        };
    }, [user, token, handleSessionExpired]);

    // Synchronize when other tabs or services dispatch auth events
    useEffect(() => {
        const onSessionExpired = () => {
            handleSessionExpired("Your session has ended. Please sign in again.");
        };

        const handleSignOut = () => {
            authService.clearSession();
            setUser(null);
            setToken(null);
            if (typeof window !== "undefined" && window.location.pathname !== "/") {
                window.location.href = "/";
            }
        };

        window.addEventListener("auth:session-expired", onSessionExpired);
        window.addEventListener("auth:unauthorized", onSessionExpired);
        window.addEventListener("auth:signout", handleSignOut);

        return () => {
            window.removeEventListener("auth:session-expired", onSessionExpired);
            window.removeEventListener("auth:unauthorized", onSessionExpired);
            window.removeEventListener("auth:signout", handleSignOut);
        };
    }, [handleSessionExpired]);

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            token,
            isAuthenticated: !!token && !!user,
            isLoading,
            setSession,
            signOut,
        }),
        [user, token, isLoading, setSession, signOut]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
