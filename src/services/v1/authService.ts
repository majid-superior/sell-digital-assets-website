// src/services/v1/authService.ts
import { apiClient, ApiError, NetworkError, TimeoutError } from "@/services/api.ts";
import {
    AuthenticationError,
    type SignInCredentials,
    type SignUpCredentials,
    type AuthResponse,
} from "@/features/auth/types.ts";
import type { User, UserRole } from "@/types/user.ts";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";
export const LAST_ACTIVITY_KEY = "auth_last_activity";

class AuthService {
    /**
     * Normalizes backend user representation to marketplace User interface.
     */
    normalizeUser(user: Partial<User> & { name?: string; role?: string; roles?: string[]; role_id?: number }): User {
        const displayName = user.displayName || user.name || user.email?.split("@")[0] || "User";
        const username = user.username || user.name?.toLowerCase().replace(/\s+/g, "") || user.email?.split("@")[0] || "user";
        
        let role: UserRole = "buyer";
        const rawRole = (user.role || "").toLowerCase().trim();
        if (user.role_id === 1 || rawRole === "admin") {
            role = "admin";
        } else if (user.role_id === 2 || rawRole === "seller") {
            role = "seller";
        } else if (user.role_id === 3 || rawRole === "buyer" || rawRole === "customer") {
            role = "buyer";
        }

        const rolesList: string[] = Array.isArray(user.roles) && user.roles.length > 0
            ? user.roles
            : role === "seller"
            ? ["seller", "buyer"]
            : role === "admin"
            ? ["admin", "seller", "buyer"]
            : [role];

        return {
            id: String(user.id || ""),
            email: user.email || "",
            username,
            displayName,
            name: user.name || displayName,
            role,
            roles: rolesList,
            role_id: user.role_id,
            avatarUrl: user.avatarUrl,
            sellerProfile: user.sellerProfile,
            createdAt: user.createdAt || new Date().toISOString(),
            status: user.status || "active",
        };
    }

    /**
     * Submit sign in request to backend endpoint /api/v1/auth/signin.
     * Pure production implementation communicating directly with the backend API.
     */
    async signIn(credentials: SignInCredentials): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<AuthResponse>("/api/v1/auth/signin", credentials);
            const token = response?.token || response?.tokens?.accessToken;
            const refreshToken = response?.refreshToken || response?.tokens?.refreshToken;

            if (!response || !token || !response.user) {
                throw new AuthenticationError(
                    "The authentication server returned an incomplete response. Missing authentication token or user identity.",
                    { code: "INVALID_SERVER_RESPONSE" }
                );
            }

            const normalizedUser = this.normalizeUser(response.user);
            const authResponse: AuthResponse = {
                ...response,
                token,
                refreshToken,
                user: normalizedUser,
            };

            this.saveSession(token, normalizedUser, credentials.rememberMe, refreshToken);
            return authResponse;
        } catch (error: unknown) {
            return this.handleAuthError(error, "signing in");
        }
    }

    /**
     * Submit registration request to backend endpoint /api/v1/auth/signup.
     */
    async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
        try {
            const payload = {
                name: credentials.name,
                email: credentials.email,
                password: credentials.password,
                role: credentials.role,
            };

            const response = await apiClient.post<AuthResponse>("/api/v1/auth/signup", payload);
            const token = response?.token || response?.tokens?.accessToken;
            const refreshToken = response?.refreshToken || response?.tokens?.refreshToken;

            if (!response || !token || !response.user) {
                throw new AuthenticationError(
                    "The registration server returned an incomplete response. Missing authentication token or user identity.",
                    { code: "INVALID_SERVER_RESPONSE" }
                );
            }

            const normalizedUser = this.normalizeUser(response.user);
            const authResponse: AuthResponse = {
                ...response,
                token,
                refreshToken,
                user: normalizedUser,
            };

            // Save new user session
            this.saveSession(token, normalizedUser, false, refreshToken);
            return authResponse;
        } catch (error: unknown) {
            return this.handleAuthError(error, "registering");
        }
    }

    /**
     * Fetch authenticated user identity from backend endpoint /api/v1/auth/me.
     */
    async getCurrentUser(): Promise<User> {
        const response = await apiClient.get<User | { data: User }>("/api/v1/auth/me");
        const rawUser: User = (response && "data" in response && response.data) ? response.data : (response as User);
        const user = this.normalizeUser(rawUser);
        const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
        storage.setItem(USER_KEY, JSON.stringify(user));
        return user;
    }

    /**
     * Shared error parser for auth endpoints.
     */
    private handleAuthError(error: unknown, action: string): never {
        if (error instanceof TimeoutError) {
            throw new AuthenticationError(
                action === "signing in"
                    ? "Unable to sign in right now. Please try again later."
                    : "The server took too long to respond. Please check your network connection and try again.",
                { code: "TIMEOUT", cause: error }
            );
        }

        if (error instanceof NetworkError) {
            throw new AuthenticationError(
                action === "signing in"
                    ? "Unable to sign in right now. Please try again later."
                    : "Unable to connect to the server. Please check your internet connection and try again.",
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
            } else if (error.status === 401) {
                code = "INVALID_CREDENTIALS";
                message = "Incorrect email or password. Please check your credentials and try again.";
            } else if (error.status === 403) {
                code = "ACCESS_FORBIDDEN";
                message = message || "Access denied. Your account may be locked or pending verification.";
            } else if (error.status === 409) {
                code = "USER_EXISTS";
                message = message || "An account with this email address already exists.";
            } else if (error.status === 429) {
                code = "RATE_LIMITED";
                message = message || "Too many attempts. Please wait a few moments before trying again.";
            } else if (error.status >= 500) {
                code = "SERVER_ERROR";
                message = action === "signing in"
                    ? "Unable to sign in right now. Please try again later."
                    : "Unable to complete registration right now. Please try again later.";
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
        const refreshToken = this.getStoredRefreshToken();
        apiClient.post("/api/v1/auth/signout", refreshToken ? { refreshToken } : {}).catch(() => {});
        this.clearSession();
        window.dispatchEvent(new CustomEvent("auth:signout"));
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
        this.updateLastActivity();
    }

    /**
     * Clear session tokens from both storages.
     */
    clearSession(): void {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    }

    /**
     * Retrieve last recorded activity timestamp (ms) across browser/PC restarts.
     */
    getLastActivity(): number | null {
        const raw = localStorage.getItem(LAST_ACTIVITY_KEY) || sessionStorage.getItem(LAST_ACTIVITY_KEY);
        if (!raw) return null;
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }

    /**
     * Persist last user activity timestamp (ms) in storage.
     */
    updateLastActivity(timestamp: number = Date.now()): void {
        try {
            const isLocal = Boolean(localStorage.getItem(TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY));
            const storage = isLocal ? localStorage : sessionStorage;
            storage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
        } catch {
            // Ignore storage write errors
        }
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
            const response = await apiClient.post<AuthResponse>("/api/v1/auth/refresh", {
                refreshToken,
            });

            const token = response?.token || response?.tokens?.accessToken;
            if (token && response?.user) {
                const normalizedUser = this.normalizeUser(response.user);
                const isRemembered = Boolean(
                    localStorage.getItem(TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)
                );
                const newRefreshToken = response.refreshToken || response?.tokens?.refreshToken || refreshToken;
                this.saveSession(
                    token,
                    normalizedUser,
                    isRemembered,
                    newRefreshToken
                );
                return {
                    ...response,
                    token,
                    refreshToken: newRefreshToken,
                    user: normalizedUser,
                };
            }
            return null;
        } catch (error: unknown) {
            // ONLY clear session if server actively rejected token with 401 or 403
            if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                this.clearSession();
                if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("auth:unauthorized"));
                }
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

    /**
     * Upgrades the authenticated buyer account to a seller/creator account.
     */
    async becomeSeller(): Promise<User> {
        const response = await apiClient.post<
            User | { data: User; user?: User; token?: string; refreshToken?: string; tokens?: { accessToken?: string; refreshToken?: string } }
        >("/api/v1/auth/become-seller", {});

        const rawUser: User = (response && "data" in response && response.data)
            ? response.data
            : (response as User);
        const user = this.normalizeUser(rawUser);

        const isRemembered = Boolean(localStorage.getItem(TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY));
        const newToken =
            (response && typeof response === "object" && "token" in response && response.token) ||
            (response && typeof response === "object" && "tokens" in response && response.tokens?.accessToken) ||
            this.getStoredToken();
        const newRefreshToken =
            (response && typeof response === "object" && "refreshToken" in response && response.refreshToken) ||
            (response && typeof response === "object" && "tokens" in response && response.tokens?.refreshToken) ||
            this.getStoredRefreshToken() ||
            undefined;

        if (newToken) {
            this.saveSession(newToken, user, isRemembered, newRefreshToken);
            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("auth:token-refreshed", {
                        detail: { token: newToken, user },
                    })
                );
            }
        } else {
            const storage = isRemembered ? localStorage : sessionStorage;
            storage.setItem(USER_KEY, JSON.stringify(user));
        }

        return user;
    }
}

export const authService = new AuthService();
export default authService;
