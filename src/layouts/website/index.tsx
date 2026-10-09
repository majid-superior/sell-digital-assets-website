// src/layouts/website/index.tsx
import React from "react";
import { Header, type HeaderProps } from "./Header.tsx";
import { Navbar, type NavbarProps } from "./Navbar.tsx";
import { Body, type BodyProps } from "./Body.tsx";
import { Footer, type FooterProps } from "./Footer.tsx";

export interface IndexProps {
    headerProps?: HeaderProps;
    navbarProps?: NavbarProps;
    bodyProps?: BodyProps;
    footerProps?: FooterProps;
    children?: React.ReactNode;
}

export const Index: React.FC<IndexProps> = ({
    headerProps,
    navbarProps,
    bodyProps,
    footerProps,
    children,
}) => {
    return (
        <div className="min-h-screen flex flex-col bg-background text-on-surface transition-colors duration-200">
            {/* Header with Navbar */}
            <Header {...headerProps}>
                <Navbar tone={headerProps?.variant === "overlay" ? "dark" : "theme"} {...navbarProps} />
            </Header>

            {/* Main Content Body */}
            <Body withBackgroundDecorations {...bodyProps}>
                {children}
            </Body>

            {/* Footer */}
            <Footer {...footerProps} />
        </div>
    );
};

export default Index;
