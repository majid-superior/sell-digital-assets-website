// src/features/auth/hooks/useSignUpMutation.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authService } from "@/services/v1/authService.ts";
import { queryKeys } from "@/services/queryKeys.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import {
    AuthenticationError,
    type SignUpCredentials,
    type AuthResponse,
} from "@/features/auth/types.ts";

export const useSignUpMutation = () => {
    const queryClient = useQueryClient();
    const { setSession } = useAuth();

    return useMutation<AuthResponse, AuthenticationError, SignUpCredentials>({
        mutationFn: (credentials: SignUpCredentials) => authService.signUp(credentials),
        onSuccess: (data) => {
            // Update global auth context
            setSession(data.user, data.token);

            // Invalidate user queries to ensure cached profile data updates
            void queryClient.invalidateQueries({ queryKey: queryKeys.auth.currentUser() });

            toast.success("Account Created!", {
                description: `Welcome to AssetDrop, ${data.user.displayName || data.user.email}!`,
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
                case "USER_EXISTS":
                    title = "Account Already Exists";
                    duration = 6000;
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
                default:
                    title = "Registration Failed";
                    break;
            }

            toast.error(title, {
                description: error.message || "An unexpected error occurred while creating your account.",
                duration,
            });
        },
    });
};

export default useSignUpMutation;
