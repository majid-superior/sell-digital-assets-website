// src/features/dashboard/components/StatCard.tsx
import React from "react";
import type { IconComponent } from "@/lib/icons/index.ts";

export interface StatCardProps {
    label: string;
    value: string | number;
    change?: string;
    changeType?: "positive" | "negative" | "neutral";
    icon: IconComponent;
    description?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    change,
    changeType = "neutral",
    icon: Icon,
    description,
}) => {
    return (
        <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 hover:border-outline-variant/60 transition-all shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant truncate">
                    {label}
                </span>
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                    <Icon size={18} />
                </div>
            </div>

            <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                    {value}
                </div>

                {(change || description) && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-on-surface-variant">
                        {change && (
                            <span
                                className={`font-semibold ${
                                    changeType === "positive"
                                        ? "text-emerald-500"
                                        : changeType === "negative"
                                        ? "text-error"
                                        : "text-on-surface-variant"
                                }`}
                            >
                                {change}
                            </span>
                        )}
                        {description && <span className="truncate">{description}</span>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatCard;

