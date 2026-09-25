// src/layouts/website/pages/server.tsx
import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";

export const ServerPage: React.FC = () => {
    return (
        <section className="flex items-center justify-center px-4 py-16 sm:py-24">
            <div className="w-full max-w-lg text-center space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surface-variant text-primary">
                    <Icons.ServerError size={40} strokeWidth={1.75} />
                </div>

                <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                        500 · Server Error
                    </p>

                    <h1 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
                        Something went wrong
                    </h1>

                    <p className="mx-auto max-w-md text-base leading-7 text-on-surface-variant">
                        We&apos;re having trouble processing your request right
                        now. The server may be temporarily unavailable or
                        experiencing an unexpected problem.
                    </p>

                    <p className="mx-auto max-w-md text-sm leading-6 text-on-surface-variant">
                        Please try again in a moment. If the problem
                        continues, return to the home page and try again.
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center gap-2 rounded-full border border-outline px-5 py-2.5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-variant"
                    >
                        <span>Try Again</span>
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

export default ServerPage;
