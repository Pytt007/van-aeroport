
export interface PaymentData {
    transaction_id: string;
    amount: number;
    currency: string;
    description: string;
    customer_name: string;
    customer_surname: string;
    customer_phone_number: string;
    customer_email: string;
    customer_address: string;
    customer_city: string;
    customer_country: string;
    customer_state: string;
    customer_zip_code: string;
}

/**
 * Generates a safe transaction ID without special characters.
 * CinetPay forbids: #, /, $, _, &
 */
export const generateTransactionId = (): string => {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 100000000).toString();
    return `CP${timestamp}${random}`.slice(0, 24);
};

/**
 * Rounds amount up to the nearest multiple of 5 (CinetPay requirement).
 */
export const roundToMultipleOf5 = (amount: number): number => {
    return Math.ceil(amount / 5) * 5;
};

/**
 * Initiates a CinetPay payment via our serverless proxy (/api/pay).
 *
 * We route through /api/pay to avoid CORS issues when calling CinetPay
 * directly from the browser. The serverless function holds the API credentials
 * and makes the request server-side.
 */
export const initializePayment = async (paymentData: PaymentData): Promise<any> => {
    // Ensure amount is a multiple of 5
    const safeAmount = roundToMultipleOf5(paymentData.amount);

    // Build absolute URLs for return_url and notify_url (required by CinetPay)
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const baseUrl = isLocalhost
        ? "https://van-aeroport.com"
        : window.location.origin;

    // Call our serverless proxy instead of CinetPay directly (avoids CORS)
    const response = await fetch("/api/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...paymentData,
            amount: safeAmount,
            return_url: baseUrl + "/success",
            notify_url: baseUrl + "/notify",
        }),
    });

    if (!response.ok) {
        throw new Error(`Erreur proxy paiement: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Code 201 = success, we get a payment_url
    if (result.code === "201" && result.data?.payment_url) {
        // Redirection on the same tab
        window.location.href = result.data.payment_url;
        // Return a promise that never resolves to pause execution during redirection
        return new Promise(() => { });
    } else {
        throw new Error(
            result.description || result.message || `CinetPay error: ${result.code}`
        );
    }
};
