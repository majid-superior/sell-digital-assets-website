// src/layouts/website/pages/signIn.tsx
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTheme } from "@majid-superior/sell-digital-assets-theme/react";
import { Icons } from "@/lib/icons/index.ts";
import { Button } from "@majid-superior/sell-digital-assets-theme/components";
import { signInSchema, type SignInFormData } from "@/features/auth/schemas/signInSchema.ts";
import { useSignInMutation } from "@/features/auth/hooks/useSignInMutation.ts";
import { AuthenticationError } from "@/features/auth/types.ts";

export const SignInPage: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);

    const signInMutation = useSignInMutation();

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false,
        },
        mode: "onBlur",
    });

    const isPending = isSubmitting || signInMutation.isPending;

    const onSubmit = async (data: SignInFormData) => {
        try {
            const response = await signInMutation.mutateAsync(data);

            // Determine redirect target:
            // 1. Previous route if redirected from protected route
            // 2. Creator dashboard if seller
            // 3. Marketplace home for buyers
            const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
            if (from && from !== "/signin" && from !== "/signup") {
                void navigate(from, { replace: true });
            } else if (response.user.role === "seller") {
                void navigate("/seller", { replace: true });
            } else {
                void navigate("/", { replace: true });
            }
        } catch (error: unknown) {
            // Error notification is triggered by useSignInMutation's onError callback.
            // In addition, if the backend returned field-specific errors, highlight those fields:
            if (error instanceof AuthenticationError && error.fieldErrors) {
                for (const [field, messages] of Object.entries(error.fieldErrors)) {
                    if ((field === "email" || field === "password") && messages && messages.length > 0) {
                        setError(field, {
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
                                Welcome back
                            </h1>
                            <p className="text-xs sm:text-sm text-on-surface-variant">
                                Sign in to access your digital assets, downloads, and creator dashboard.
                            </p>
                        </div>

                        {/* Error Alert if mutation fails */}
                        {signInMutation.isError && (
                            <div
                                role="alert"
                                className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs sm:text-sm flex items-start gap-2.5"
                            >
                                <span className="font-bold shrink-0">
                                    {signInMutation.error?.code === "NO_RESPONSE" || signInMutation.error?.code === "NETWORK_OFFLINE"
                                        ? "Connection Error:"
                                        : signInMutation.error?.code === "TIMEOUT"
                                        ? "Timeout:"
                                        : signInMutation.error?.code === "SERVER_ERROR"
                                        ? "Server Error:"
                                        : "Error:"}
                                </span>
                                <span>{signInMutation.error?.message || "Sign in failed. Please verify your credentials."}</span>
                            </div>
                        )}

                        {/* Social Auth Providers */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => toast.info("Google Authentication", { description: "Google OAuth sign-in will be enabled soon." })}
                                    className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-surface border border-outline-variant/40 hover:bg-surface-container-high hover:border-outline-variant transition-all cursor-pointer shadow-2xs"
                                    aria-label="Sign in with Google"
                                    title="Sign in with Google"
                                >
                                    <Icons.Google size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toast.info("GitHub Authentication", { description: "GitHub OAuth sign-in will be enabled soon." })}
                                    className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-surface border border-outline-variant/40 hover:bg-surface-container-high hover:border-outline-variant transition-all cursor-pointer shadow-2xs text-on-surface"
                                    aria-label="Sign in with GitHub"
                                    title="Sign in with GitHub"
                                >
                                    <Icons.Github size={18} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toast.info("X Authentication", { description: "X OAuth sign-in will be enabled soon." })}
                                    className="flex items-center justify-center py-2.5 px-3 rounded-xl bg-surface border border-outline-variant/40 hover:bg-surface-container-high hover:border-outline-variant transition-all cursor-pointer shadow-2xs text-on-surface"
                                    aria-label="Sign in with X"
                                    title="Sign in with X"
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
                                    Or continue with email
                                </span>
                            </div>
                        </div>

                        {/* Credentials Form */}
                        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4" noValidate>
                            {/* Email */}
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="signin-email"
                                    className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                                >
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
                                        <Icons.Mail size={16} />
                                    </div>
                                    <input
                                        id="signin-email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        aria-invalid={!!errors.email}
                                        aria-describedby={errors.email ? "email-error" : undefined}
                                        disabled={isPending}
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
                                <div className="flex items-center justify-between">
                                    <label
                                        htmlFor="signin-password"
                                        className="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
                                    >
                                        Password
                                    </label>
                                    <a
                                        href="#forgot"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toast.success("Password Reset Email Sent", { description: "Instructions have been sent to your email address." });
                                        }}
                                        className="text-xs text-primary font-medium hover:underline"
                                    >
                                        Forgot password?
                                    </a>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant/60">
                                        <Icons.Lock size={16} />
                                    </div>
                                    <input
                                        id="signin-password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        placeholder="••••••••••••"
                                        aria-invalid={!!errors.password}
                                        aria-describedby={errors.password ? "password-error" : undefined}
                                        disabled={isPending}
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
                            </div>

                            {/* Remember Me */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        disabled={isPending}
                                        {...register("rememberMe")}
                                        className="w-4 h-4 rounded-sm border-outline-variant text-primary focus:ring-primary accent-primary cursor-pointer disabled:opacity-50"
                                    />
                                    <span className="text-xs text-on-surface-variant">Remember this device for 30 days</span>
                                </label>
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
                                Sign In
                            </Button>
                        </form>

                        {/* Switch to Sign Up */}
                        <div className="pt-2 text-center text-xs sm:text-sm text-on-surface-variant">
                            <span>Don&apos;t have an account? </span>
                            <Link
                                to="/signup"
                                className="text-primary font-semibold hover:underline"
                            >
                                Create an account
                            </Link>
                        </div>
                    </div>

                    {/* Subtle Footnote */}
                    <p className="text-center text-[11px] text-on-surface-variant/70 mt-6 px-4">
                        By continuing, you agree to AssetDrop&apos;s{" "}
                        <Link to="/terms" className="underline hover:text-on-surface">Terms of Service</Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="underline hover:text-on-surface">Privacy Policy</Link>.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default SignInPage;
