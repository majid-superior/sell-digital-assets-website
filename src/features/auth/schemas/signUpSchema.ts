// src/features/auth/schemas/signUpSchema.ts
import { z } from "zod";

export const signUpSchema = z.object({
    fullName: z
        .string()
        .trim()
        .min(2, "Full name must be at least 2 characters"),
    email: z
        .string()
        .trim()
        .min(1, "Email address cannot be empty")
        .email("Please enter a valid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters"),
    role: z.enum(["buyer", "seller"]),
    agreeTerms: z.boolean().refine((val) => val === true, {
        message: "You must agree to the Terms of Service to create an account",
    }),
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
