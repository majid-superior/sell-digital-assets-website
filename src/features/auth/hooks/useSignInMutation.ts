// src/features/auth/hooks/useSignInMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/services/v1/authService.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import {
    AuthenticationError,
    type SignInCredentials,
    type AuthResponse,
} from "@/features/auth/types.ts";

export const useSignInMutation = () => {
    const queryClient = useQueryClient();
    const { setSession } = useAuth();

    return useMutation<AuthResponse, AuthenticationError, SignInCredentials>({
        mutationFn: (credentials: SignInCredentials) => authService.signIn(credentials),
        onSuccess: (data) => {
            // Update global auth context
            setSession(data.user, data.token);

            // Invalidate user queries to ensure cached profile data updates
            void queryClient.invalidateQueries({ queryKey: ["auth", "currentUser"] });

            toast.success("Welcome back!", {
                description: `Signed in as ${data.user.displayName || data.user.email}`,
            });
        },
        onError: (error: AuthenticationError) => {
            let title: string;
            let duration = 4000;

            switch (error.code) {
                case "NO_RESPONSE":
                case "NETWORK_OFFLINE":
                    title = "Server Unreachable";
                    duration = 6000;
                    break;
                case "TIMEOUT":
                    title = "Request Timed Out";
                    duration = 6000;
                    break;
                case "INVALID_CREDENTIALS":
                    title = "Invalid Credentials";
                    break;
                case "VALIDATION_ERROR":
                    title = "Validation Failed";
                    break;
                case "RATE_LIMITED":
                    title = "Too Many Attempts";
                    duration = 6000;
                    break;
                case "SERVER_ERROR":
                    title = "Server Error";
                    duration = 6000;
                    break;
                case "INVALID_SERVER_RESPONSE":
                    title = "Unexpected Server Response";
                    break;
                default:
                    title = "Sign-In Failed";
                    break;
            }

            toast.error(title, {
                description: error.message || "An unexpected error occurred while signing in.",
                duration,
            });
        },
    });
};

export default useSignInMutation;
