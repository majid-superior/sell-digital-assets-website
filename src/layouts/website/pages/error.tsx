
// src/layouts/website/pages/error.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";

export const ErrorPage: React.FC = () => {
    return (
        <section className="flex items-center justify-center px-4 py-16 sm:py-24">
            <div className="w-full max-w-lg text-center space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-variant text-primary">
                    <Icons.NoResults size={40} strokeWidth={1.75} />
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                        404 · Page Not Found
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
                        We couldn&apos;t find that page
                    </h1>

                    <p className="mx-auto max-w-md text-base leading-7 text-on-surface-variant">
                        The page you&apos;re looking for may have been moved,
                        removed, or the address you entered may be incorrect.
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-2 rounded-full border border-outline px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-variant"
                    >
                        <Icons.Back size={16} />
                        <span>Go Back</span>
                    </button>

                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-sm transition-opacity hover:opacity-90"
                    >
                        <Icons.Home size={16} />
                        <span>Go To Home</span>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default ErrorPage;
