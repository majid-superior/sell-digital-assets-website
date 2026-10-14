// src/provider/AuthProvider.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { User } from "@/types/user.ts";
import { AuthContext, type AuthContextType } from "@/context/authContext.ts";
import { authService } from "@/services/v1/authService.ts";
import { toast } from "sonner";

export interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
    const [token, setToken] = useState<string | null>(() => authService.getStoredToken());
    const [isLoading, setIsLoading] = useState<boolean>(() => !!authService.getStoredToken());

    const setSession = useCallback((newUser: User, newToken: string) => {
        setUser(newUser);
        setToken(newToken);
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

    // Verify session integrity against the backend on mount
    useEffect(() => {
        let isMounted = true;

        async function verifySession() {
            const storedToken = authService.getStoredToken();
            if (!storedToken) {
                const refreshToken = authService.getStoredRefreshToken();
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
                        // Refresh failed, proceed to unauthenticated state
                    }
                }
                if (isMounted) setIsLoading(false);
                return;
            }

            try {
                const freshUser = await authService.getCurrentUser();
                if (isMounted) {
                    setUser(freshUser);
                }
            } catch {
                // Attempt token refresh if fetching current user fails
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

                if (isMounted) {
                    authService.clearSession();
                    setUser(null);
                    setToken(null);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void verifySession();

        return () => {
            isMounted = false;
        };
    }, []);

    // Synchronize when other tabs or services dispatch auth events
    useEffect(() => {
        const handleUnauthorized = () => {
            const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
            // Never force redirect away if the user is on an authentication page
            if (currentPath === "/signin" || currentPath === "/signup") {
                authService.clearSession();
                setUser(null);
                setToken(null);
                return;
            }

            if (authService.getStoredToken() || user) {
                signOut("/");
            }
        };

        const handleSignOut = () => {
            authService.clearSession();
            setUser(null);
            setToken(null);
            if (typeof window !== "undefined" && window.location.pathname !== "/") {
                window.location.href = "/";
            }
        };

        window.addEventListener("auth:unauthorized", handleUnauthorized);
        window.addEventListener("auth:signout", handleSignOut);

        return () => {
            window.removeEventListener("auth:unauthorized", handleUnauthorized);
            window.removeEventListener("auth:signout", handleSignOut);
        };
    }, [signOut, user]);

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
