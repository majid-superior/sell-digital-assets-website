// src/features/auth/schemas/signInSchema.ts
import { z } from "zod";

export const signInSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "Email address cannot be empty")
        .email("Please enter a valid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters"),
    rememberMe: z.boolean(),
});

export type SignInFormData = z.infer<typeof signInSchema>;
