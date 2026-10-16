// src/utils/currency.ts
import { organizationService } from "@/services/v1/organizationService.ts";

export function formatCurrency(
    amount: number | string,
    currency?: string,
    locale: string = "en-US"
): string {
    const num = typeof amount === "string" ? parseFloat(amount) : Number(amount || 0);
    const resolvedCurrency = currency || organizationService.getCachedOrganization()?.defaultCurrency || "USD";
    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: resolvedCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(isNaN(num) ? 0 : num);
    } catch {
        const symbol = organizationService.getCachedOrganization()?.currencySymbol || resolvedCurrency;
        return `${symbol} ${(isNaN(num) ? 0 : num).toFixed(2)}`;
    }
}
