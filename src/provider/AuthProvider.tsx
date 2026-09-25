// src/provider/AuthProvider.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { User } from "@/types/user.ts";
import { AuthContext, type AuthContextType } from "@/context/authContext.ts";
import { authService } from "@/services/v1/authService.ts";

export interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => authService.getStoredUser());
    const [token, setToken] = useState<string | null>(() => authService.getStoredToken());
    const [isLoading] = useState(false);

    const setSession = useCallback((newUser: User, newToken: string) => {
        setUser(newUser);
        setToken(newToken);
    }, []);

    const signOut = useCallback(() => {
        authService.signOut();
        setUser(null);
        setToken(null);
    }, []);

    // Synchronize when other tabs or services dispatch auth events
    useEffect(() => {
        const handleUnauthorized = () => {
            signOut();
        };

        const handleLogout = () => {
            setUser(null);
            setToken(null);
        };

        window.addEventListener("auth:unauthorized", handleUnauthorized);
        window.addEventListener("auth:logout", handleLogout);

        return () => {
            window.removeEventListener("auth:unauthorized", handleUnauthorized);
            window.removeEventListener("auth:logout", handleLogout);
        };
    }, [signOut]);

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
