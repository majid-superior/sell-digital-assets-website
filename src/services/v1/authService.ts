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

interface ApiUser {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at?: string;
}

interface ApiTokens {
    accessToken: string;
    refreshToken: string;
}

interface ApiAuthResponse {
    success: boolean;
    message?: string;
    user: ApiUser;
    tokens: ApiTokens;
}

interface ApiRefreshResponse {
    success: boolean;
    tokens: ApiTokens;
}

interface ApiCurrentUserResponse {
    success: boolean;
    data: ApiUser;
}

function toAppUser(user: ApiUser): User {
    if (!user || !user.id || !user.email || !user.name || !user.role) {
        throw new AuthenticationError(
            "The authentication server returned an incomplete user profile.",
            { code: "INVALID_SERVER_RESPONSE" }
        );
    }

    const role = user.role === "customer" || user.role === "buyer" || user.role === "user"
        ? "buyer"
        : user.role === "seller" || user.role === "creator"
            ? "seller"
            : user.role === "admin"
                ? "admin"
                : null;

    if (!role) {
        throw new AuthenticationError(
            `The authentication server returned an unsupported user role: ${user.role}.`,
            { code: "INVALID_SERVER_RESPONSE" }
        );
    }

    return {
        id: user.id,
        email: user.email,
        displayName: user.name,
        role,
        ...(user.created_at ? { createdAt: user.created_at } : {}),
    };
}

function toAuthResponse(response: ApiAuthResponse): AuthResponse {
    if (!response?.tokens?.accessToken || !response.user) {
        throw new AuthenticationError(
            "The authentication server returned an incomplete response. Missing authentication token or user identity.",
            { code: "INVALID_SERVER_RESPONSE" }
        );
    }

    return {
        success: response.success,
        message: response.message,
        token: response.tokens.accessToken,
        refreshToken: response.tokens.refreshToken,
        user: toAppUser(response.user),
    };
}

class AuthService {
    /**
     * Submit login request to backend endpoint /auth/login.
     * Pure production implementation communicating directly with the backend API.
     */
    async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
        try {
            const apiResponse = await apiClient.post<ApiAuthResponse>("/auth/login", {
                email: credentials.email,
                password: credentials.password,
            });
            const response = toAuthResponse(apiResponse);

            this.saveSession(response.token, response.user, credentials.rememberMe, response.refreshToken);
            return response;
        } catch (error: unknown) {
            return this.handleAuthError(error, "signing in");
        }
    }

    /**
     * Submit registration request to backend endpoint /auth/register.
     */
    async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
        try {
            if (credentials.role === "seller") {
                throw new AuthenticationError(
                    "The live backend currently creates buyer accounts only. Seller registration is not supported yet.",
                    { code: "ROLE_NOT_SUPPORTED" }
                );
            }

            const apiResponse = await apiClient.post<ApiAuthResponse>("/auth/register", {
                name: credentials.fullName,
                email: credentials.email,
                password: credentials.password,
            });
            const response = toAuthResponse(apiResponse);

            // Save new user session
            this.saveSession(response.token, response.user, false, response.refreshToken);
            return response;
        } catch (error: unknown) {
            return this.handleAuthError(error, "registering");
        }
    }

    /**
     * Fetch authenticated user identity from backend endpoint /users/me.
     */
    async getCurrentUser(): Promise<User> {
        const user = await this.fetchCurrentUser();
        if (user) {
            const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
            storage.setItem(USER_KEY, JSON.stringify(user));
        }
        return user;
    }

    private async fetchCurrentUser(token?: string): Promise<User> {
        const response = await apiClient.get<ApiCurrentUserResponse>("/users/me", {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            suppressUnauthorizedEvent: true,
        });

        if (!response?.data) {
            throw new AuthenticationError(
                "The authentication server returned an incomplete user profile.",
                { code: "INVALID_SERVER_RESPONSE" }
            );
        }

        return toAppUser(response.data);
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
                    details?: { fieldErrors?: Record<string, string[]> };
                };
                if (data.message) {
                    message = data.message;
                } else if (data.error) {
                    message = data.error;
                }

                fieldErrors = data.fieldErrors || data.details?.fieldErrors;
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
            const response = await apiClient.post<ApiRefreshResponse>("/auth/refresh", {
                refreshToken,
            });

            if (response?.tokens?.accessToken) {
                const user = await this.fetchCurrentUser(response.tokens.accessToken);
                const isRemembered = Boolean(
                    localStorage.getItem(TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)
                );
                this.saveSession(response.tokens.accessToken, user, isRemembered, response.tokens.refreshToken);
                return {
                    success: response.success,
                    token: response.tokens.accessToken,
                    refreshToken: response.tokens.refreshToken,
                    user,
                };
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
