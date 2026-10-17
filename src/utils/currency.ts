// src/utils/currency.ts
import { organizationService, defaultOrganization } from "@/services/v1/organizationService.ts";

export function getCurrencyInfo() {
    const org = organizationService.getCachedOrganization() || defaultOrganization;
    return {
        code: org.defaultCurrency || "PKR",
        symbol: org.currencySymbol || "₨",
    };
}

export function formatCurrency(
    amount: number | string,
    currency?: string,
    locale: string = "en-US"
): string {
    const num = typeof amount === "string" ? parseFloat(amount) : Number(amount || 0);
    const org = organizationService.getCachedOrganization() || defaultOrganization;
    const resolvedCurrency = currency || org.defaultCurrency || "PKR";
    const symbol = org.currencySymbol || (resolvedCurrency === "PKR" ? "₨" : "$");

    // Standardize platform currency output with administrator's symbol (e.g., ₨ 9.00)
    if (resolvedCurrency === org.defaultCurrency || resolvedCurrency === "PKR") {
        const formattedNumber = (isNaN(num) ? 0 : num).toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${symbol} ${formattedNumber}`;
    }

    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: resolvedCurrency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(isNaN(num) ? 0 : num);
    } catch {
        return `${symbol} ${(isNaN(num) ? 0 : num).toFixed(2)}`;
    }
}

