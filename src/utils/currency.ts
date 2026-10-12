// src/utils/currency.ts
export function formatCurrency(
    amount: number | string,
    currency: string = "USD",
    locale: string = "en-US"
): string {
    const num = typeof amount === "string" ? parseFloat(amount) : Number(amount || 0);
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(isNaN(num) ? 0 : num);
}
