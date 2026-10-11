// src/features/dashboard/pages/DashboardOverviewPage.tsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.ts";
import { Icons } from "@/lib/icons/index.ts";
import { Badge, Button } from "@/components/ui/index.ts";
import { StatCard } from "../components/StatCard.tsx";

export const DashboardOverviewPage: React.FC = () => {
    const { user } = useAuth();
    const isSeller = user?.role === "seller";

    const userName = user?.displayName || user?.name || user?.email?.split("@")[0] || "User";

    return (
        <div className="space-y-8 animate-fade-in">
            {/* 1. Welcome Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-outline-variant/30 p-6 sm:p-8">
                <div className="relative z-10 max-w-2xl space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge variant={isSeller ? "primary" : "secondary"} size="sm">
                            {isSeller ? "Merchant Account" : "Buyer Account"}
                        </Badge>
                        <span className="text-xs text-on-surface-variant">• Active Session</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
                        Welcome back, {userName}!
                    </h1>

                    <p className="text-sm text-on-surface-variant leading-relaxed">
                        {isSeller
                            ? "Here is an overview of your store's sales performance, digital inventory, and customer purchases."
                            : "Access your purchased digital products, download license keys, and manage your account invoices."}
                    </p>

                    <div className="pt-2 flex flex-wrap items-center gap-3">
                        {isSeller ? (
                            <>
                                <Link
                                    to="/dashboard/products"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity shadow-xs"
                                >
                                    <Icons.Plus size={16} />
                                    <span>Add New Product</span>
                                </Link>
                                <Link
                                    to="/dashboard/sales"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-sm font-semibold hover:bg-surface-container-high transition-colors"
                                >
                                    <Icons.Analytics size={16} />
                                    <span>View Sales Analytics</span>
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    to="/dashboard/purchases"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity shadow-xs"
                                >
                                    <Icons.Download size={16} />
                                    <span>My Downloads</span>
                                </Link>
                                <Link
                                    to="/explore"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-outline-variant/40 text-on-surface text-sm font-semibold hover:bg-surface-container-high transition-colors"
                                >
                                    <Icons.Explore size={16} />
                                    <span>Browse Store</span>
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Ambient glow accent */}
                <div
                    aria-hidden="true"
                    className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-primary/20 blur-3xl pointer-events-none"
                />
            </div>

            {/* 2. Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {isSeller ? (
                    <>
                        <StatCard
                            label="Total Revenue"
                            value="$12,450.00"
                            change="+14.2%"
                            changeType="positive"
                            description="vs last 30 days"
                            icon={Icons.CreditCard}
                        />
                        <StatCard
                            label="Active Products"
                            value="18"
                            change="+3"
                            changeType="positive"
                            description="new this month"
                            icon={Icons.Package}
                        />
                        <StatCard
                            label="Total Sales"
                            value="142"
                            change="+28"
                            changeType="positive"
                            description="orders completed"
                            icon={Icons.Cart}
                        />
                        <StatCard
                            label="Store Rating"
                            value="4.9"
                            description="from 88 verified buyers"
                            icon={Icons.Rating}
                        />
                    </>
                ) : (
                    <>
                        <StatCard
                            label="Purchased Assets"
                            value="7"
                            description="lifetime assets owned"
                            icon={Icons.Download}
                        />
                        <StatCard
                            label="Active Downloads"
                            value="7"
                            change="Up to date"
                            changeType="positive"
                            description="latest version ready"
                            icon={Icons.Package}
                        />
                        <StatCard
                            label="Total Invested"
                            value="$284.00"
                            description="across 7 orders"
                            icon={Icons.CreditCard}
                        />
                        <StatCard
                            label="Saved in Wishlist"
                            value="12"
                            description="items saved for later"
                            icon={Icons.Heart}
                        />
                    </>
                )}
            </div>

            {/* 3. Dynamic Section: Recent Activity / Purchases */}
            <div className="rounded-3xl bg-surface border border-outline-variant/30 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-base sm:text-lg font-bold text-on-surface">
                            {isSeller ? "Recent Orders & Sales" : "Recent Purchased Assets"}
                        </h2>
                        <p className="text-xs text-on-surface-variant">
                            {isSeller
                                ? "Latest transactions generated across your digital catalog."
                                : "Your recently acquired assets ready for immediate download."}
                        </p>
                    </div>

                    <Link
                        to={isSeller ? "/dashboard/orders" : "/dashboard/purchases"}
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                    >
                        <span>View All</span>
                        <Icons.Next size={14} />
                    </Link>
                </div>

                {isSeller ? (
                    /* Seller Orders Table */
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs font-semibold text-on-surface-variant border-b border-outline-variant/20">
                                <tr>
                                    <th className="py-3 px-2">Order ID</th>
                                    <th className="py-3 px-2">Product</th>
                                    <th className="py-3 px-2">Customer</th>
                                    <th className="py-3 px-2">Date</th>
                                    <th className="py-3 px-2">Amount</th>
                                    <th className="py-3 px-2 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                                {[
                                    { id: "ORD-9281", product: "Cyberpunk 3D Character Pack", customer: "dave.m@example.com", date: "Today, 14:20", amount: "$49.00" },
                                    { id: "ORD-9280", product: "Neon UI Dashboard Kit", customer: "sarah.k@example.com", date: "Yesterday", amount: "$35.00" },
                                    { id: "ORD-9279", product: "Lo-Fi Audio Loop Collection", customer: "alex.r@example.com", date: "Oct 08, 2026", amount: "$24.00" },
                                ].map((row) => (
                                    <tr key={row.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="py-3 px-2 font-mono text-xs text-on-surface-variant">{row.id}</td>
                                        <td className="py-3 px-2 font-medium">{row.product}</td>
                                        <td className="py-3 px-2 text-xs text-on-surface-variant">{row.customer}</td>
                                        <td className="py-3 px-2 text-xs text-on-surface-variant">{row.date}</td>
                                        <td className="py-3 px-2 font-semibold">{row.amount}</td>
                                        <td className="py-3 px-2 text-right">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500">
                                                Completed
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Buyer Purchases Cards */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { title: "NextGen 3D Sci-Fi Vehicles", version: "v2.1", date: "Oct 10, 2026", size: "1.4 GB", license: "Standard Commercial" },
                            { title: "Minimalist Tailwind UI Components", version: "v1.4", date: "Oct 04, 2026", size: "45 MB", license: "Extended License" },
                            { title: "Cinematic Soundscapes & Foley Vol. 1", version: "v1.0", date: "Sep 28, 2026", size: "820 MB", license: "Royalty Free" },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between space-y-4 hover:border-outline-variant/60 transition-all"
                            >
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                                        <span>{item.version}</span>
                                        <span className="text-[10px] uppercase font-bold text-primary">{item.license}</span>
                                    </div>
                                    <h3 className="font-bold text-on-surface text-sm sm:text-base line-clamp-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-on-surface-variant">
                                        Purchased {item.date} • {item.size}
                                    </p>
                                </div>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full gap-2 text-xs"
                                    onClick={() => alert(`Initiating download for ${item.title}`)}
                                >
                                    <Icons.Download size={14} />
                                    <span>Download Files</span>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardOverviewPage;

