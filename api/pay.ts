import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Serverless function that proxies the CinetPay payment initialization.
 * This avoids CORS issues when calling CinetPay API from the browser.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Allow only POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    const apikey = process.env.VITE_CINETPAY_API_KEY;
    const site_id = process.env.VITE_CINETPAY_SITE_ID;

    if (!apikey || !site_id) {
        return res.status(500).json({ error: "CinetPay credentials not configured on server." });
    }

    try {
        const body = req.body;

        const payload = {
            apikey,
            site_id,
            transaction_id: body.transaction_id,
            amount: body.amount,
            currency: body.currency || "XOF",
            description: body.description,
            return_url: body.return_url,
            notify_url: body.notify_url,
            channels: "ALL",
            lang: "FR",
            customer_id: body.transaction_id,
            customer_name: body.customer_name,
            customer_surname: body.customer_surname,
            customer_email: body.customer_email || "client@vanaeroport.com",
            customer_phone_number: body.customer_phone_number,
            customer_address: body.customer_address || "Abidjan",
            customer_city: body.customer_city || "Abidjan",
            customer_country: "CI",
            customer_state: "CI",
            customer_zip_code: "00225",
        };

        console.log("CinetPay payload:", { ...payload, apikey: payload.apikey ? "***" : "MISSING" });

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

        if (result.code !== "201" && result.code !== 201) {
            return res.status(200).json({
                ...result,
                _debug: {
                    payload_sent: { ...payload, apikey: "***" },
                    site_id_type: typeof site_id,
                    amount_type: typeof payload.amount
                }
            });
        }

        // Return the raw CinetPay response to the client
        return res.status(200).json(result);
    } catch (error: any) {
        console.error("CinetPay proxy error:", error);
        return res.status(500).json({
            error: error.message || "Internal server error calling CinetPay",
        });
    }
}
