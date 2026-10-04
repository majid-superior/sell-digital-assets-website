// src/layouts/website/pages/signUp.tsx
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme.ts";
import { Icons } from "@/lib/icons/index.ts";
import { Button } from "@/components/ui/index.ts";
import { signUpSchema, type SignUpFormData } from "@/features/auth/schemas/signUpSchema.ts";
import { useSignUpMutation } from "@/features/auth/hooks/useSignUpMutation.ts";
import { AuthenticationError } from "@/features/auth/types.ts";

export const SignUpPage: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const signUpMutation = useSignUpMutation();

    const {
        register,
        handleSubmit,
        control,
        setValue,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            role: "buyer",
            agreeTerms: false,
        },
        mode: "onBlur",
    });

    const role = useWatch({ control, name: "role" });
    const password = useWatch({ control, name: "password" }) || "";
    const isPending = isSubmitting || signUpMutation.isPending;

    // Password strength score (0-4)
    const passwordStrength = useMemo(() => {
        if (!password) return 0;
        let score = 0;
        if (password.length >= 8) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        return score;
    }, [password]);

    const strengthLabel = useMemo(() => {
        switch (passwordStrength) {
            case 1:
                return { text: "Weak", color: "bg-error text-error" };
            case 2:
                return { text: "Fair", color: "bg-amber-500 text-amber-500" };
            case 3:
                return { text: "Good", color: "bg-blue-500 text-blue-500" };
            case 4:
                return { text: "Strong", color: "bg-emerald-500 text-emerald-500" };
            default:
                return { text: "Empty", color: "bg-outline-variant text-on-surface-variant" };
        }
    }, [passwordStrength]);

    const onSubmit = async (data: SignUpFormData) => {
        try {
            await signUpMutation.mutateAsync({
                fullName: data.fullName,
                email: data.email,
                password: data.password,
                role: data.role,
            });

            void navigate("/", { replace: true });
        } catch (error: unknown) {
            if (error instanceof AuthenticationError && error.fieldErrors) {
                for (const [field, messages] of Object.entries(error.fieldErrors)) {
                    if (messages && messages.length > 0) {
                        const formField = field as keyof SignUpFormData;
                        setError(formField, {
                            type: "server",
                            message: messages[0],
                        });
                    }
                }
            }
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background text-on-surface relative overflow-hidden transition-colors duration-200">
            {/* Ambient Background Decorative Glows */}
            <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none overflow-hidden -z-10"
            >
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-tertiary/10 blur-3xl" />
                <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />
            </div>

            {/* Standalone Header Bar (No full site header) */}
            <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
                {/* Brand Logo */}
                <Link
                    to="/"
                    className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-on-surface hover:opacity-90 transition-opacity"
                >
                    <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs">
                        <Icons.Brand size={20} />
                    </div>
                    <span className="flex items-center">
                        Asset
                        <span className="text-primary-container font-extrabold">Drop</span>
                    </span>
                </Link>

                {/* Right Actions: Theme Toggle & Back Link */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                        className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors cursor-pointer"
                    >
                        {theme === "dark" ? <Icons.ThemeLight size={19} /> : <Icons.ThemeDark size={19} />}
                    </button>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high px-3 py-1.5 rounded-full transition-colors"
                    >
                        <Icons.Back size={15} />
                        <span className="hidden sm:inline">Back to Marketplace</span>
                        <span className="sm:hidden">Home</span>
                    </Link>
                </div>
            </header>

            {/* Center Content Form */}
            <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
                <div className="w-full max-w-md">
                    {/* Card Container */}
                    <div className="bg-surface-container-low/80 backdrop-blur-xl border border-outline-variant/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                        {/* Title Block */}
                        <div className="text-center space-y-1.5">
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
                                Create an account
                            </h1>
                            <p className="text-xs sm:text-sm text-on-surface-variant">
                                Join thousands of elite creators, developers, and digital designers.
                            </p>
                        </div>

                        {/* Account Intent Segmented Control */}
                        <div className="grid grid-cols-2 p-1 rounded-xl bg-surface border border-outline-variant/40">
                            <button
                                type="button"
                                onClick={() => setValue("role", "buyer")}
                                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${role === "buyer"
                                    ? "bg-primary text-on-primary shadow-xs"
                                    : "text-on-surface-variant hover:text-on-surface"
                                    }`}
                            >
                                I want to Buy
                            </button>
                            <button
                                type="button"
                                onClick={() => setValue("role", "seller")}
                                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${role === "seller"
                                    ? "bg-primary text-on-primary shadow-xs"
                                    : "text-on-surface-variant hover:text-on-surface"
                                    }`}
                            >
                                I want to Sell
                            </button>
                        </div>

                        {/* Mutation Error Alert */}
                        {signUpMutation.isError && (
                            <div
                                role="alert"
                                className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs sm:text-sm flex items-start gap-2.5"
                            >
                                <span className="font-bold shrink-0">Registration Error:</span>
                                <span>{signUpMutation.error?.message || "Sign up failed. Please check your details."}</span>
                            </div>
                        )}

                        {/* Social Sign Up Providers */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => toast.info("Google Sign-Up", { description: "Google OAuth registration will be enabled soon." })}
                                    className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-surface border border-outline-variant/40 hover:bg-surface-container-high hover:border-outline-variant transition-all cursor-pointer shadow-2xs"
                                    aria-label="Sign up with Google"
                                    title="Sign up with Google"
                                >
                                    <Icons.Google size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toast.info("GitHub Sign-Up", { description: "GitHub OAuth registration will be enabled soon." })}
                                    className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-surface border border-outline-variant/40 hover:bg-surface-container-high hover:border-outline-variant transition-all cursor-pointer shadow-2xs text-on-surface"
                                    aria-label="Sign up with GitHub"
                                    title="Sign up with GitHub"
                                >
                                    <Icons.Github size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toast.info("X Sign-Up", { description: "X OAuth registration will be enabled soon." })}
                                    className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-surface border border-outline-variant/40 hover:bg-surface-container-high hover:border-outline-variant transition-all cursor-pointer shadow-2xs text-on-surface"
                                    aria-label="Sign up with X"
                                    title="Sign up with X"
                                >
                                    <Icons.X size={17} />
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="relative flex items-center justify-center py-1">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-outline-variant/30" />
                                </div>
                                <span className="relative px-3 bg-surface-container-low text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
                                    Or register with email
                                </span>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
                            {/* Full Name */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="signup-name"
                                    className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
                                        <Icons.User size={16} />
                                    </div>
                                    <input
                                        id="signup-name"
                                        type="text"
                                        autoComplete="name"
                                        placeholder="Alex Rivera"
                                        disabled={isPending}
                                        aria-invalid={!!errors.fullName}
                                        aria-describedby={errors.fullName ? "name-error" : undefined}
                                        {...register("fullName")}
                                        className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-surface border text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden transition-all disabled:opacity-50 ${errors.fullName
                                            ? "border-error focus:border-error focus:ring-1 focus:ring-error"
                                            : "border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary"
                                            }`}
                                    />
                                </div>
                                {errors.fullName && (
                                    <p id="name-error" role="alert" className="text-xs text-error font-medium mt-1">
                                        {errors.fullName.message}
                                    </p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="signup-email"
                                    className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
                                        <Icons.Mail size={16} />
                                    </div>
                                    <input
                                        id="signup-email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        disabled={isPending}
                                        aria-invalid={!!errors.email}
                                        aria-describedby={errors.email ? "email-error" : undefined}
                                        {...register("email")}
                                        className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-surface border text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden transition-all disabled:opacity-50 ${errors.email
                                            ? "border-error focus:border-error focus:ring-1 focus:ring-error"
                                            : "border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary"
                                            }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p id="email-error" role="alert" className="text-xs text-error font-medium mt-1">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="signup-password"
                                    className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
                                        <Icons.Lock size={16} />
                                    </div>
                                    <input
                                        id="signup-password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="new-password"
                                        placeholder="Minimum 8 characters"
                                        disabled={isPending}
                                        aria-invalid={!!errors.password}
                                        aria-describedby={errors.password ? "password-error" : undefined}
                                        {...register("password")}
                                        className={`w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-surface border text-on-surface placeholder:text-on-surface-variant/50 focus:outline-hidden transition-all disabled:opacity-50 ${errors.password
                                            ? "border-error focus:border-error focus:ring-1 focus:ring-error"
                                            : "border-outline-variant/40 focus:border-primary focus:ring-1 focus:ring-primary"
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant/60 hover:text-on-surface cursor-pointer"
                                    >
                                        {showPassword ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
                                    </button>
                                </div>

                                {errors.password && (
                                    <p id="password-error" role="alert" className="text-xs text-error font-medium mt-1">
                                        {errors.password.message}
                                    </p>
                                )}

                                {/* Dynamic Password Strength Indicator */}
                                {password && (
                                    <div className="pt-1.5 space-y-1">
                                        <div className="flex gap-1.5 h-1 w-full">
                                            {[1, 2, 3, 4].map((step) => (
                                                <div
                                                    key={step}
                                                    className={`flex-1 rounded-full transition-all duration-300 ${passwordStrength >= step
                                                        ? strengthLabel.color.split(" ")[0]
                                                        : "bg-surface-container-high"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-on-surface-variant">
                                            <span>Strength: <strong className={strengthLabel.color.split(" ")[1]}>{strengthLabel.text}</strong></span>
                                            <span>Use numbers &amp; symbols</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Terms Agreement */}
                            <div className="pt-1">
                                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        disabled={isPending}
                                        {...register("agreeTerms")}
                                        className="mt-0.5 w-4 h-4 rounded-sm border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer disabled:opacity-50"
                                    />
                                    <span className="text-xs text-on-surface-variant leading-tight">
                                        I agree to the{" "}
                                        <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
                                        and acknowledge the{" "}
                                        <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                                    </span>
                                </label>
                                {errors.agreeTerms && (
                                    <p role="alert" className="text-xs text-error font-medium mt-1">
                                        {errors.agreeTerms.message}
                                    </p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                isLoading={isPending}
                                className="w-full justify-center"
                                rightIcon={!isPending ? <Icons.Next size={16} /> : undefined}
                            >
                                Create Account
                            </Button>
                        </form>

                        {/* Switch to Sign In */}
                        <div className="pt-2 text-center text-xs sm:text-sm text-on-surface-variant">
                            <span>Already have an account? </span>
                            <Link
                                to="/signin"
                                className="text-primary font-semibold hover:underline"
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SignUpPage;
