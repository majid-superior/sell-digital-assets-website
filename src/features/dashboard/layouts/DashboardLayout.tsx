// src/features/dashboard/layouts/DashboardLayout.tsx
import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { DashboardSidenav } from "../components/DashboardSidenav.tsx";
import { DashboardHeader } from "../components/DashboardHeader.tsx";
import { DashboardFooter } from "../components/DashboardFooter.tsx";

export const DashboardLayout: React.FC = () => {
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

    // Close mobile drawer on Escape key press
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && mobileDrawerOpen) {
                setMobileDrawerOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mobileDrawerOpen]);

    // Prevent body scroll when mobile drawer is open
    useEffect(() => {
        if (mobileDrawerOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileDrawerOpen]);

    return (
        <div className="min-h-screen flex bg-background text-on-surface transition-colors duration-200">
            {/* 1. Desktop Fixed Sidebar (lg+) */}
            <aside className="hidden lg:block w-64 xl:w-72 shrink-0 border-r border-outline-variant/30 sticky top-0 h-screen overflow-hidden">
                <DashboardSidenav />
            </aside>

            {/* 2. Mobile Drawer & Backdrop (< lg) */}
            {mobileDrawerOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Mobile Navigation"
                    className="fixed inset-0 z-50 lg:hidden"
                >
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
                        onClick={() => setMobileDrawerOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Sliding Drawer Container */}
                    <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] z-50 bg-surface shadow-2xl transition-transform duration-300">
                        <DashboardSidenav onClose={() => setMobileDrawerOpen(false)} />
                    </div>
                </div>
            )}

            {/* 3. Main Dashboard Workspace (Header + Body + Footer) */}
            <div className="flex-1 flex flex-col min-w-0">
                <DashboardHeader onMenuClick={() => setMobileDrawerOpen(true)} />

                {/* Dashboard Main Outlet Body */}
                <main role="main" className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                    <Outlet />
                </main>

                <DashboardFooter />
            </div>
        </div>
    );
};

export default DashboardLayout;

