// src/features/dashboard/pages/OrdersPage.tsx
import React from "react";
import { Badge } from "@/components/ui/index.ts";
import { useAuth } from "@/hooks/useAuth.ts";
import { toast } from "sonner";

interface OrderRecord {
    id: string;
    product: string;
    date: string;
    amount: string;
    status: "paid" | "completed" | "processing";
    paymentMethod: string;
}

const MOCK_ORDERS: OrderRecord[] = [
    {
        id: "INV-2026-081",
        product: "NextGen 3D Sci-Fi Vehicles Pack",
        date: "Oct 10, 2026",
        amount: "$49.00",
        status: "paid",
        paymentMethod: "Credit Card (•••• 4242)",
    },
    {
        id: "INV-2026-074",
        product: "Minimalist Tailwind UI Components Kit",
        date: "Oct 04, 2026",
        amount: "$35.00",
        status: "completed",
        paymentMethod: "PayPal",
    },
    {
        id: "INV-2026-061",
        product: "Cinematic Soundscapes & Foley Vol. 1",
        date: "Sep 28, 2026",
        amount: "$24.00",
        status: "paid",
        paymentMethod: "Credit Card (•••• 1092)",
    },
];

export const OrdersPage: React.FC = () => {
    const { user } = useAuth();
    const isSeller = user?.role === "seller";

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-on-surface">
                    {isSeller ? "Customer Orders" : "Orders & Invoices"}
                </h1>
                <p className="text-xs sm:text-sm text-on-surface-variant">
                    {isSeller
                        ? "View completed checkout orders and generate itemized sales invoices."
                        : "Your complete order purchase receipts, invoice records, and proof of payment."}
                </p>
            </div>

            <div className="rounded-2xl bg-surface border border-outline-variant/30 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/80 bg-surface-container-low border-b border-outline-variant/20">
                            <tr>
                                <th className="py-3.5 px-4">Invoice #</th>
                                <th className="py-3.5 px-4">Product</th>
                                <th className="py-3.5 px-4">Date</th>
                                <th className="py-3.5 px-4">Payment</th>
                                <th className="py-3.5 px-4">Total</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                            {MOCK_ORDERS.map((order) => (
                                <tr key={order.id} className="hover:bg-surface-container-low/50 transition-colors">
                                    <td className="py-3.5 px-4 font-mono text-xs text-primary font-bold">{order.id}</td>
                                    <td className="py-3.5 px-4 font-medium">{order.product}</td>
                                    <td className="py-3.5 px-4 text-xs text-on-surface-variant">{order.date}</td>
                                    <td className="py-3.5 px-4 text-xs text-on-surface-variant">{order.paymentMethod}</td>
                                    <td className="py-3.5 px-4 font-bold">{order.amount}</td>
                                    <td className="py-3.5 px-4">
                                        <Badge variant="success" size="sm">
                                            {order.status.toUpperCase()}
                                        </Badge>
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => toast.success(`Downloading PDF Invoice for ${order.id}`)}
                                            className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                                        >
                                            PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrdersPage;

