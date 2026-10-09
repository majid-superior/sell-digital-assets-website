// src/routes/AppRoutes.tsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index, { type IndexProps } from "@/layouts/website/index.tsx";
import Page from "@/layouts/website/page.tsx";
import { Spinner } from "@/components/ui/Spinner.tsx";

const HomePage = lazy(() => import("@/features/website/pages/HomePage.tsx"));
const SignInPage = lazy(() => import("@/layouts/website/pages/signIn.tsx"));
const SignUpPage = lazy(() => import("@/layouts/website/pages/signUp.tsx"));
const ServerPage = lazy(() => import("@/layouts/website/pages/server.tsx"));
const ErrorPage = lazy(() => import("@/layouts/website/pages/error.tsx"));
const ExplorePage = lazy(() => import("@/features/website/pages/ExplorePage.tsx"));
const AssetDetailPage = lazy(() => import("@/features/website/pages/AssetDetailPage.tsx"));

/** Landing page: edge-to-edge content with the header floating over the hero. */
const LANDING_LAYOUT_PROPS: IndexProps = {
    headerProps: { variant: "overlay" },
    navbarProps: { fullWidth: true },
    bodyProps: { containerSize: "full", disablePadding: true, withBackgroundDecorations: false },
};

const RouteLoadingFallback = () => (
    <div className="min-h-[60vh] flex items-center justify-center bg-background text-on-surface">
        <Spinner size="lg" />
    </div>
);

export const AppRoutes: React.FC = () => {
    return (
        <BrowserRouter>
            <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                    {/* Home / Index — has its own full layout shell */}
                    <Route element={<Index {...LANDING_LAYOUT_PROPS} />}>
                        <Route path="/" element={<HomePage />} />
                    </Route>

                    {/* Standalone Auth Pages — no header, no footer */}
                    <Route path="/signin" element={<SignInPage />} />
                    <Route path="/signup" element={<SignUpPage />} />

                    {/* Server Error page */}
                    <Route path="/server" element={<ServerPage />} />

                    {/* Website Pages share Page Layout (Header + Navbar + Footer) */}
                    <Route element={<Page />}>
                        <Route path="/explore" element={<ExplorePage />} />
                        <Route path="/categories" element={<ExplorePage />} />
                        <Route path="/featured" element={<ExplorePage />} />
                        <Route path="/asset/:slug" element={<AssetDetailPage />} />
                    </Route>

                    {/* 404 Not Found fallback */}
                    <Route path="*" element={<ErrorPage />} />
                </Routes>
            </Suspense>
        </BrowserRouter>
    );
};

export default AppRoutes;

