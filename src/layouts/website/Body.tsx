// src/layouts/website/Body.tsx
import React from "react";
import { Outlet } from "react-router-dom";

export type ContainerSize = "default" | "wide" | "narrow" | "full";

export interface BodyProps {
    children?: React.ReactNode;
    containerSize?: ContainerSize;
    className?: string;
    containerClassName?: string;
    withBackgroundDecorations?: boolean;
    disablePadding?: boolean;
}

const CONTAINER_SIZE_CLASSES: Record<ContainerSize, string> = {
    default: "max-w-7xl mx-auto",
    wide: "max-w-screen-2xl mx-auto",
    narrow: "max-w-4xl mx-auto",
    full: "w-full",
};

export const Body: React.FC<BodyProps> = ({
    children,
    containerSize = "default",
    className = "",
    containerClassName = "",
    withBackgroundDecorations = false,
    disablePadding = false,
}) => {
    return (
        <main
            role="main"
            // overflow-hidden removed from main — it was masking real overflow issues.
            // min-h-0 prevents flex children from overflowing the flex column.
            className={`flex-1 w-full min-h-0 relative bg-background text-on-surface ${className}`}
        >
            {/* Ambient Background Decorative Glows — overflow-hidden scoped here only */}
            {withBackgroundDecorations && (
                <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none overflow-hidden -z-10"
                >
                    <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
                    <div className="absolute top-1/3 -right-40 w-96 h-96 rounded-full bg-tertiary/10 blur-3xl" />
                    <div className="absolute -bottom-40 left-1/3 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />
                </div>
            )}

            {/* Content Container */}
            <div
                className={`${CONTAINER_SIZE_CLASSES[containerSize]} ${disablePadding ? "" : "px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10"
                    } ${containerClassName}`}
            >
                {children ? children : <Outlet />}
            </div>
        </main>
    );
};

export default Body;
