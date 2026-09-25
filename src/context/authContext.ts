// src/context/authContext.ts
import { createContext } from "react";
import type { User } from "@/types/user.ts";

export interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    setSession: (user: User, token: string) => void;
    signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
