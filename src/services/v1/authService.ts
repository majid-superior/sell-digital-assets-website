// src/services/v1/authService.ts
import { apiClient, ApiError, NetworkError, TimeoutError } from "@/services/api.ts";
import {
    AuthenticationError,
    type SignInCredentials,
    type SignUpCredentials,
    type AuthResponse,
} from "@/features/auth/types.ts";
import type { User } from "@/types/user.ts";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";

class AuthService {
    /**
     * Submit login request to backend endpoint /auth/signin.
     * Pure production implementation communicating directly with the backend API.
     */
    async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<AuthResponse>("/auth/signin", credentials);

            if (!response || !response.token || !response.user) {
                throw new AuthenticationError(
                    "The authentication server returned an incomplete response. Missing authentication token or user identity.",
                    { code: "INVALID_SERVER_RESPONSE" }
                );
            }

            this.saveSession(response.token, response.user, credentials.rememberMe, response.refreshToken);
            return response;
        } catch (error: unknown) {
            return this.handleAuthError(error, "signing in");
        }
    }

    /**
     * Submit registration request to backend endpoint /auth/signup.
     */
    async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<AuthResponse>("/auth/signup", credentials);

            if (!response || !response.token || !response.user) {
                throw new AuthenticationError(
                    "The registration server returned an incomplete response. Missing authentication token or user identity.",
                    { code: "INVALID_SERVER_RESPONSE" }
                );
            }

            // Save new user session
            this.saveSession(response.token, response.user, false, response.refreshToken);
            return response;
        } catch (error: unknown) {
            return this.handleAuthError(error, "registering");
        }
    }

    /**
     * Fetch authenticated user identity from backend endpoint /auth/me.
     */
    async getCurrentUser(): Promise<User> {
        const user = await apiClient.get<User>("/auth/me");
        if (user) {
            const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
            storage.setItem(USER_KEY, JSON.stringify(user));
        }
        return user;
    }

    /**
     * Shared error parser for auth endpoints.
     */
    private handleAuthError(error: unknown, action: string): never {
        if (error instanceof TimeoutError) {
            throw new AuthenticationError(
                "The authentication server took too long to respond. Please check your network connection and try again.",
                { code: "TIMEOUT", cause: error }
            );
        }

        if (error instanceof NetworkError) {
            throw new AuthenticationError(
                "Unable to connect to the authentication server. Please check your internet connection or verify the server is running.",
                { code: "NO_RESPONSE", cause: error }
            );
        }

        if (error instanceof ApiError) {
            let message = `Authentication request failed while ${action}.`;
            let code = "AUTH_FAILED";
            let fieldErrors: Record<string, string[]> | undefined;

            if (error.data && typeof error.data === "object") {
                const data = error.data as {
                    message?: string;
                    error?: string;
                    fieldErrors?: Record<string, string[]>;
                };
                if (data.message) {
                    message = data.message;
                } else if (data.error) {
                    message = data.error;
                }

                if (data.fieldErrors) {
                    fieldErrors = data.fieldErrors;
                }
            } else if (typeof error.data === "string" && error.data.trim()) {
                message = error.data;
            }

            if (error.status === 400) {
                code = "VALIDATION_ERROR";
                message = message || "Invalid credentials format.";
            } else if (error.status === 401 || error.status === 403) {
                code = "INVALID_CREDENTIALS";
                message = message || "Incorrect email or password. Please try again.";
            } else if (error.status === 409) {
                code = "USER_EXISTS";
                message = message || "An account with this email address already exists.";
            } else if (error.status === 429) {
                code = "RATE_LIMITED";
                message = message || "Too many attempts. Please wait a few moments before trying again.";
            } else if (error.status >= 500) {
                code = "SERVER_ERROR";
                message = "The authentication service is temporarily unavailable. Please try again in a few moments.";
            }

            throw new AuthenticationError(message, {
                code,
                status: error.status,
                fieldErrors,
                cause: error,
            });
        }

        if (error instanceof AuthenticationError) {
            throw error;
        }

        if (error instanceof Error) {
            throw new AuthenticationError(error.message, {
                code: "UNEXPECTED_ERROR",
                cause: error,
            });
        }

        throw new AuthenticationError(
            `An unexpected error occurred while communicating with the authentication service.`,
            { code: "UNKNOWN_ERROR", cause: error }
        );
    }

    /**
     * Terminate user session and remove tokens from storage.
     */
    signOut(): void {
        this.clearSession();
        window.dispatchEvent(new CustomEvent("auth:logout"));
    }

    /**
     * Save session tokens and user data.
     */
    saveSession(token: string, user: User, rememberMe = false, refreshToken?: string): void {
        const storage = rememberMe ? localStorage : sessionStorage;
        // Clean both before setting to prevent conflicts
        this.clearSession();
        storage.setItem(TOKEN_KEY, token);
        storage.setItem(USER_KEY, JSON.stringify(user));
        if (refreshToken) {
            storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
    }

    /**
     * Clear session tokens from both storages.
     */
    clearSession(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    /**
     * Retrieve current stored token if available.
     */
    getStoredToken(): string | null {
        return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    }

    /**
     * Retrieve current stored refresh token if available.
     */
    getStoredRefreshToken(): string | null {
        return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
    }

    /**
     * Refresh the active session using the stored refresh token.
     */
    async refreshSession(): Promise<AuthResponse | null> {
        const refreshToken = this.getStoredRefreshToken();
        if (!refreshToken) {
            return null;
        }

        try {
            const response = await apiClient.post<AuthResponse>("/auth/refresh", {
                refreshToken,
            });

            if (response?.token && response?.user) {
                const isRemembered = Boolean(
                    localStorage.getItem(TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)
                );
                this.saveSession(
                    response.token,
                    response.user,
                    isRemembered,
                    response.refreshToken || refreshToken
                );
                return response;
            }
            return null;
        } catch {
            this.clearSession();
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("auth:unauthorized"));
            }
            return null;
        }
    }

    /**
     * Retrieve current stored user profile if available.
     */
    getStoredUser(): User | null {
        const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as User;
        } catch {
            return null;
        }
    }
}

export const authService = new AuthService();
export default authService;
