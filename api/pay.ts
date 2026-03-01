import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Serverless function that proxies the CinetPay payment initialization.
 * Avoids CORS issues when calling CinetPay API from the browser.
 * Doc: https://docs.cinetpay.com/api/1.0-fr/checkout/initialisation
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Allow only POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const apikey = process.env.VITE_CINETPAY_API_KEY || process.env.CINETPAY_API_KEY;
    const site_id = process.env.VITE_CINETPAY_SITE_ID || process.env.CINETPAY_SITE_ID;

    if (!apikey || !site_id) {
        console.error("Missing CinetPay credentials. Available env keys:", Object.keys(process.env).filter(k => k.includes("CINET") || k.includes("VITE")));
        return res.status(500).json({
            error: "CinetPay credentials not configured on server.",
            hint: "Set VITE_CINETPAY_API_KEY and VITE_CINETPAY_SITE_ID in Vercel environment variables."
        });
    }

    try {
        const body = req.body;

        if (!body.transaction_id || !body.amount || !body.description) {
            return res.status(400).json({ error: "Missing required fields: transaction_id, amount, description" });
        }

        // Ensure amount is a number (CinetPay requires integer, multiple of 5)
        const amount = Math.ceil(Number(body.amount) / 5) * 5;

        // Build payload strictly following CinetPay doc
        const payload: Record<string, any> = {
            apikey,
            site_id: String(site_id), // must be string
            transaction_id: String(body.transaction_id),
            amount,
            currency: body.currency || "XOF",
            description: body.description,
            channels: "ALL",
            lang: "FR",
        };

        // Optional but required for return/notify
        if (body.return_url) payload.return_url = body.return_url;
        if (body.notify_url) payload.notify_url = body.notify_url;

        // Customer info (required for credit card payments)
        if (body.customer_name) payload.customer_name = body.customer_name;
        if (body.customer_surname) payload.customer_surname = body.customer_surname;
        if (body.customer_email) payload.customer_email = body.customer_email;
        if (body.customer_id) payload.customer_id = body.customer_id;
        else if (body.transaction_id) payload.customer_id = String(body.transaction_id);

        // Phone: ensure it has country prefix (+225...)
        if (body.customer_phone_number) {
            const phone = String(body.customer_phone_number).trim();
            // Add Ivory Coast prefix if not present
            payload.customer_phone_number = phone.startsWith("+") ? phone : `+225${phone.replace(/^0/, "")}`;
        }

        if (body.customer_address) payload.customer_address = body.customer_address;
        if (body.customer_city) payload.customer_city = body.customer_city;
        if (body.customer_country) payload.customer_country = body.customer_country;
        if (body.customer_state) payload.customer_state = body.customer_state;
        if (body.customer_zip_code) payload.customer_zip_code = body.customer_zip_code;

        console.log("CinetPay payload:", {
            ...payload,
            apikey: "***",
            site_id: payload.site_id,
            amount: payload.amount,
            transaction_id: payload.transaction_id,
        });

        const cinetpayResponse = await fetch(
            "https://api-checkout.cinetpay.com/v2/payment",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );

        const result = await cinetpayResponse.json();
        console.log("CinetPay response:", result);

        return res.status(200).json(result);
    } catch (error: any) {
        console.error("CinetPay proxy error:", error);
        return res.status(500).json({
            error: error.message || "Internal server error calling CinetPay",
        });
    }
}
