// src/features/dashboard/pages/SalesPage.tsx
import React from "react";
import { StatCard } from "../components/StatCard.tsx";
import { Icons } from "@/lib/icons/index.ts";

export const SalesPage: React.FC = () => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-on-surface">Sales & Financial Analytics</h1>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                    Track your marketplace revenue, payout cycles, conversion metrics, and fee breakdowns.
                </p>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Gross Revenue"
                    value="$12,450.00"
                    change="+14.2%"
                    changeType="positive"
                    description="all-time sales"
                    icon={Icons.CreditCard}
                />
                <StatCard
                    label="Platform Fees"
                    value="$1,245.00"
                    description="10% marketplace fee"
                    icon={Icons.FileText}
                />
                <StatCard
                    label="Available Payout"
                    value="$3,820.00"
                    change="Ready"
                    changeType="positive"
                    description="cleared for withdrawal"
                    icon={Icons.Analytics}
                />
                <StatCard
                    label="Avg. Order Value"
                    value="$36.20"
                    change="+4.8%"
                    changeType="positive"
                    description="per customer transaction"
                    icon={Icons.Cart}
                />
            </div>

            {/* Performance breakdown card */}
            <div className="rounded-3xl bg-surface border border-outline-variant/30 p-6 space-y-4">
                <h2 className="text-base sm:text-lg font-bold text-on-surface">Top Performing Products</h2>
                <div className="space-y-3">
                    {[
                        { name: "Cyberpunk 3D Character Pack", sales: 48, revenue: "$2,352.00", share: "38%" },
                        { name: "Neon UI Dashboard Kit", sales: 62, revenue: "$2,170.00", share: "35%" },
                        { name: "Lo-Fi Audio Loop Collection", sales: 32, revenue: "$768.00", share: "18%" },
                    ].map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between gap-4">
                            <div>
                                <p className="font-semibold text-sm text-on-surface">{item.name}</p>
                                <p className="text-xs text-on-surface-variant">{item.sales} units sold</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm text-emerald-500">{item.revenue}</p>
                                <p className="text-xs text-on-surface-variant">{item.share} of total store revenue</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SalesPage;

