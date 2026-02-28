
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
 * Initiates a CinetPay payment using the REDIRECT method.
 *
 * This calls CinetPay's REST API directly via fetch (no SDK needed),
 * gets a payment_url back, and opens it in a new tab.
 *
 * Docs: https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation#integration-simple
 * API endpoint: POST https://api-checkout.cinetpay.com/v2/payment
 */
export const initializePayment = async (paymentData: PaymentData): Promise<any> => {
    const apikey = import.meta.env.VITE_CINETPAY_API_KEY;
    const site_id = import.meta.env.VITE_CINETPAY_SITE_ID;

    if (!apikey || apikey === "YOUR_CINETPAY_API_KEY") {
        throw new Error("CinetPay API Key non configurée. Vérifiez votre fichier .env");
    }
    if (!site_id || site_id === "YOUR_CINETPAY_SITE_ID") {
        throw new Error("CinetPay Site ID non configuré. Vérifiez votre fichier .env");
    }

    // Ensure amount is a multiple of 5
    const safeAmount = roundToMultipleOf5(paymentData.amount);

    // CinetPay requires public URLs (not localhost) for return_url and notify_url
    const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    const baseUrl = isLocalhost
        ? "https://vanaeroport-master.vercel.app"  // Use production URL when testing locally
        : window.location.origin;

    const payload = {
        apikey: apikey,
        site_id: site_id,
        transaction_id: paymentData.transaction_id,
        amount: safeAmount,
        currency: paymentData.currency || "XOF",
        description: paymentData.description,
        return_url: baseUrl + "/success",
        notify_url: baseUrl + "/notify",
        channels: "ALL",
        lang: "FR",
        customer_id: paymentData.transaction_id, // Required field
        customer_name: paymentData.customer_name,
        customer_surname: paymentData.customer_surname,
        customer_email: paymentData.customer_email || "client@vanaeroport.com",
        customer_phone_number: paymentData.customer_phone_number,
        customer_address: paymentData.customer_address || "Abidjan",
        customer_city: paymentData.customer_city || "Abidjan",
        customer_country: "CI",
        customer_state: "CI",
        customer_zip_code: "00225",
    };

    const response = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Erreur réseau CinetPay: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Code 201 = success, we get a payment_url
    if (result.code === "201" && result.data?.payment_url) {
        // Open payment page in new tab
        window.open(result.data.payment_url, "_blank");
        // Return a pending status — payment confirmed via webhook
        return { status: "PENDING", payment_url: result.data.payment_url };
    } else {
        // API returned an error
        throw new Error(
            result.description || result.message || `CinetPay error: ${result.code}`
        );
    }
};
