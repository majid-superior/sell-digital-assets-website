// src/features/dashboard/components/DashboardFooter.tsx
import React from "react";
import { Link } from "react-router-dom";

export const DashboardFooter: React.FC = () => {
    return (
        <footer className="w-full bg-surface border-t border-outline-variant/30 py-4 px-4 sm:px-6 lg:px-8 text-xs text-on-surface-variant transition-colors duration-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                {/* Copyright & Platform */}
                <div className="flex items-center gap-2">
                    <span>© {new Date().getFullYear()} AssetDrop Inc. All rights reserved.</span>
                    <span className="hidden md:inline text-outline-variant">•</span>
                    <span className="hidden md:inline-flex items-center gap-1.5 text-emerald-500 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        System Active
                    </span>
                </div>

                {/* Helpful Links */}
                <div className="flex items-center gap-4">
                    <Link to="/explore" className="hover:text-primary transition-colors">
                        Marketplace
                    </Link>
                    <a
                        href="#support"
                        onClick={(e) => e.preventDefault()}
                        className="hover:text-primary transition-colors cursor-pointer"
                    >
                        Support
                    </a>
                    <a
                        href="#terms"
                        onClick={(e) => e.preventDefault()}
                        className="hover:text-primary transition-colors cursor-pointer"
                    >
                        Terms
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default DashboardFooter;

