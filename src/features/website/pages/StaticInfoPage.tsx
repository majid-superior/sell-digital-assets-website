import React from "react";
import { Link } from "react-router-dom";
import { Icons } from "@/lib/icons/index.ts";
import { Card } from "@/components/ui/index.ts";

export interface StaticInfoPageProps {
    title: string;
    description?: string;
    category?: string;
}

export const StaticInfoPage: React.FC<StaticInfoPageProps> = ({
    title,
    description,
    category = "Information & Legal",
}) => {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-8">
            {/* Header */}
            <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    <Icons.FileText size={14} />
                    <span>{category}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
                    {title}
                </h1>
                <p className="text-base text-on-surface-variant max-w-2xl">
                    {description ||
                        `Official documentation, standards, and guidelines for the ${title.toLowerCase()} policy.`}
                </p>
            </div>

            {/* Content Container */}
            <Card className="p-8 sm:p-10 space-y-6 bg-surface border border-outline-variant/30 shadow-xs">
                <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
                    <p>
                        This section outlines our policies, requirements, and compliance standards governing digital asset distributions, marketplace operations, and platform transactions.
                    </p>
                    <p>
                        All creators, developers, and purchasers utilizing our marketplace agree to comply with verified intellectual property licenses, export controls, and secure code distribution standards.
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-container/60 border border-outline-variant/20 flex items-start gap-3">
                    <Icons.Security size={20} className="text-primary shrink-0 mt-0.5" />
                    <div className="text-xs text-on-surface-variant space-y-1">
                        <span className="font-semibold text-on-surface block">Enterprise Compliance Guaranteed</span>
                        <span>
                            For enterprise contracts, custom license agreements, or legal questions, please reach out directly to our compliance and legal engineering team.
                        </span>
                    </div>
                </div>

                <div className="pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-xs text-on-surface-variant">
                        Last revised: {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </span>
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant/40 hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors"
                    >
                        <Icons.Back size={14} />
                        <span>Return to Marketplace</span>
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default StaticInfoPage;

