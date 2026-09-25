// src/layouts/website/page.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import { Index, type IndexProps } from "./index.tsx";

export interface PageProps extends IndexProps {
    children?: React.ReactNode;
}

export const Page: React.FC<PageProps> = ({ children, ...props }) => {
    return (
        <Index {...props}>
            {children ?? <Outlet />}
        </Index>
    );
};

export default Page;
