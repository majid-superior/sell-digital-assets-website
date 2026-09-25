// src/features/auth/types.ts
import type { User } from "@/types/user.ts";

export interface SignInCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    refreshToken?: string;
    user: User;
    message?: string;
}

export interface AuthError {
    message: string;
    code?: string;
    status?: number;
    fieldErrors?: Record<string, string[]>;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}

/**
 * Standardized typed error for authentication operations.
 */
export class AuthenticationError extends Error {
    readonly code: string;
    readonly status?: number;
    readonly fieldErrors?: Record<string, string[]>;

    constructor(
        message: string,
        options?: {
            code?: string;
            status?: number;
            fieldErrors?: Record<string, string[]>;
            cause?: unknown;
        }
    ) {
        super(message, { cause: options?.cause });
        this.name = "AuthenticationError";
        this.code = options?.code || "AUTH_FAILED";
        this.status = options?.status;
        this.fieldErrors = options?.fieldErrors;
    }
}
