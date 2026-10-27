import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { authService, LAST_ACTIVITY_KEY } from "./authService.ts";
import { apiClient, ApiError, NetworkError } from "@/services/api.ts";
import type { User } from "@/types/user.ts";
import type { AuthResponse } from "@/features/auth/types.ts";

function createStorageMock() {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = String(value);
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        get length() {
            return Object.keys(store).length;
        },
        key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    };
}

const mockLocalStorage = createStorageMock();
const mockSessionStorage = createStorageMock();
const eventListeners: Record<string, ((e: Event) => void)[]> = {};

const mockWindow = {
    addEventListener: vi.fn((event: string, listener: (e: Event) => void) => {
        if (!eventListeners[event]) eventListeners[event] = [];
        eventListeners[event].push(listener);
    }),
    removeEventListener: vi.fn((event: string, listener: (e: Event) => void) => {
        if (eventListeners[event]) {
            eventListeners[event] = eventListeners[event].filter((l) => l !== listener);
        }
    }),
    dispatchEvent: vi.fn((event: Event) => {
        const listeners = eventListeners[event.type] || [];
        listeners.forEach((l) => l(event));
        return true;
    }),
    location: {
        origin: "http://localhost:5173",
        pathname: "/",
        search: "",
    },
};

const mockUser: User = {
    id: "usr-seller-1",
    url: "",
    email: "seller@platform.internal",
    name: "Elite Seller",
    displayName: "Elite Seller",
    role: "seller",
    roles: ["seller", "buyer"],
    createdAt: new Date().toISOString(),
    status: "active",
};

describe("Authentication & Session Lifecycle (Website)", () => {
    beforeEach(() => {
        mockLocalStorage.clear();
        mockSessionStorage.clear();
        Object.keys(eventListeners).forEach((k) => delete eventListeners[k]);

        vi.stubGlobal("localStorage", mockLocalStorage);
        vi.stubGlobal("sessionStorage", mockSessionStorage);
        vi.stubGlobal("window", mockWindow);
        vi.restoreAllMocks();
    });

    afterEach(() => {
        authService.clearSession();
        vi.unstubAllGlobals();
    });

    describe("Token Storage & Dual Engine Handling", () => {
        it("saves session in localStorage when rememberMe is true", () => {
            authService.saveSession("access-token-123", mockUser, true, "refresh-token-456");

            expect(mockLocalStorage.getItem("auth_token")).toBe("access-token-123");
            expect(mockLocalStorage.getItem("auth_refresh_token")).toBe("refresh-token-456");
            expect(mockSessionStorage.getItem("auth_token")).toBeNull();
            expect(authService.getStoredToken()).toBe("access-token-123");
            expect(authService.getStoredRefreshToken()).toBe("refresh-token-456");
        });

        it("saves session in sessionStorage when rememberMe is false", () => {
            authService.saveSession("access-token-session", mockUser, false, "refresh-token-session");

            expect(mockSessionStorage.getItem("auth_token")).toBe("access-token-session");
            expect(mockSessionStorage.getItem("auth_refresh_token")).toBe("refresh-token-session");
            expect(mockLocalStorage.getItem("auth_token")).toBeNull();
            expect(authService.getStoredToken()).toBe("access-token-session");
            expect(authService.getStoredRefreshToken()).toBe("refresh-token-session");
        });

        it("clears all tokens and activity timestamps across both storage engines on clearSession", () => {
            mockLocalStorage.setItem("auth_token", "acc-1");
            mockLocalStorage.setItem("auth_refresh_token", "ref-1");
            mockLocalStorage.setItem("auth_user", JSON.stringify(mockUser));
            mockLocalStorage.setItem(LAST_ACTIVITY_KEY, "12345678");

            mockSessionStorage.setItem("auth_token", "acc-2");
            mockSessionStorage.setItem("auth_refresh_token", "ref-2");
            mockSessionStorage.setItem("auth_user", JSON.stringify(mockUser));
            mockSessionStorage.setItem(LAST_ACTIVITY_KEY, "12345678");

            authService.clearSession();

            expect(authService.getStoredToken()).toBeNull();
            expect(authService.getStoredRefreshToken()).toBeNull();
            expect(authService.getStoredUser()).toBeNull();
            expect(authService.getLastActivity()).toBeNull();
        });
    });

    describe("Inactivity & Idle Activity Tracking", () => {
        it("updates and retrieves last activity timestamp correctly", () => {
            const timestamp = 1700000000000;
            mockLocalStorage.setItem("auth_token", "active-token");
            authService.updateLastActivity(timestamp);

            expect(authService.getLastActivity()).toBe(timestamp);
        });

        it("returns null if no last activity timestamp is stored", () => {
            expect(authService.getLastActivity()).toBeNull();
        });
    });

    describe("Automatic Refresh & Concurrent Request Deduplication", () => {
        it("deduplicates concurrent refreshSession calls into a single backend request", async () => {
            mockLocalStorage.setItem("auth_refresh_token", "valid-refresh-token");
            mockLocalStorage.setItem("auth_token", "expired-access-token");

            const mockAuthResponse: AuthResponse = {
                success: true,
                user: mockUser,
                token: "new-access-token-999",
                refreshToken: "new-refresh-token-999",
                tokens: {
                    accessToken: "new-access-token-999",
                    refreshToken: "new-refresh-token-999",
                },
            };

            const postSpy = vi.spyOn(apiClient, "post").mockImplementation(async () => {
                await new Promise((resolve) => setTimeout(resolve, 20));
                return mockAuthResponse;
            });

            // Fire 3 simultaneous refresh requests
            const [result1, result2, result3] = await Promise.all([
                authService.refreshSession(),
                authService.refreshSession(),
                authService.refreshSession(),
            ]);

            // Only ONE backend HTTP call must occur
            expect(postSpy).toHaveBeenCalledTimes(1);
            expect(result1?.token).toBe("new-access-token-999");
            expect(result2?.token).toBe("new-access-token-999");
            expect(result3?.token).toBe("new-access-token-999");

            // Storage must reflect the rotated tokens
            expect(authService.getStoredToken()).toBe("new-access-token-999");
            expect(authService.getStoredRefreshToken()).toBe("new-refresh-token-999");
        });

        it("clears session and dispatches auth:unauthorized when refresh token is rejected with 401", async () => {
            mockLocalStorage.setItem("auth_refresh_token", "revoked-or-expired-token");
            mockLocalStorage.setItem("auth_token", "expired-token");

            const unauthorizedSpy = vi.fn();
            mockWindow.addEventListener("auth:unauthorized", unauthorizedSpy);

            vi.spyOn(apiClient, "post").mockRejectedValueOnce(
                new ApiError(401, "Unauthorized", { message: "Refresh token has been revoked" })
            );

            const result = await authService.refreshSession();

            expect(result).toBeNull();
            expect(authService.getStoredToken()).toBeNull();
            expect(authService.getStoredRefreshToken()).toBeNull();
            expect(unauthorizedSpy).toHaveBeenCalledTimes(1);

            mockWindow.removeEventListener("auth:unauthorized", unauthorizedSpy);
        });

        it("preserves session tokens when refresh encounters temporary network failure", async () => {
            mockLocalStorage.setItem("auth_refresh_token", "valid-refresh-token");
            mockLocalStorage.setItem("auth_token", "current-token");

            vi.spyOn(apiClient, "post").mockRejectedValueOnce(
                new NetworkError("Failed to fetch")
            );

            const result = await authService.refreshSession();

            expect(result).toBeNull();
            // Tokens must NOT be cleared on network failure
            expect(authService.getStoredToken()).toBe("current-token");
            expect(authService.getStoredRefreshToken()).toBe("valid-refresh-token");
        });
    });

    describe("Explicit Sign Out Flow", () => {
        it("calls backend signout endpoint and clears browser session", () => {
            mockLocalStorage.setItem("auth_token", "token-to-signout");
            mockLocalStorage.setItem("auth_refresh_token", "refresh-to-signout");

            const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });
            const signoutEventSpy = vi.fn();
            mockWindow.addEventListener("auth:signout", signoutEventSpy);

            authService.signOut();

            expect(postSpy).toHaveBeenCalledWith("/api/v1/auth/signout", {
                refreshToken: "refresh-to-signout",
            });
            expect(authService.getStoredToken()).toBeNull();
            expect(authService.getStoredRefreshToken()).toBeNull();
            expect(signoutEventSpy).toHaveBeenCalledTimes(1);

            mockWindow.removeEventListener("auth:signout", signoutEventSpy);
        });
    });
});
