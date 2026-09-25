// src/routes/AppRoutes.tsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/layouts/website/index.tsx";
import Page from "@/layouts/website/page.tsx";
import ServerPage from "@/layouts/website/pages/server.tsx";
import ErrorPage from "@/layouts/website/pages/error.tsx";
import SignInPage from "@/layouts/website/pages/signIn.tsx";
import SignUpPage from "@/layouts/website/pages/signUp.tsx";

export const AppRoutes: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Home / Index — has its own full layout shell */}
                <Route path="/" element={<Index />} />

                {/* Standalone Auth Pages — no header, no footer */}
                <Route path="/signin" element={<SignInPage />} />
                <Route path="/signup" element={<SignUpPage />} />

                {/* Server Error page */}
                <Route path="/server" element={<ServerPage />} />

                {/* 404 Not Found fallback — must be last */}
                <Route path="*" element={<ErrorPage />} />

                {/* All other pages share the Website Page Layout (Header + Navbar + Footer) */}
                <Route element={<Page />}>
                    {/* Static & Generic Pages */}
                    {/* e.g. <Route path="/privacy" element={<PrivacyPage />} /> */}
                    {/* e.g. <Route path="/terms" element={<TermsPage />} /> */}


                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;
