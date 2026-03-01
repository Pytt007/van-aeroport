import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: "0.0.0.0",
      port: 5173,
      hmr: {
        overlay: false,
      },
      // Local API simulation for development
      proxy: {},
      configureServer: (server) => {
        server.middlewares.use(async (req, res, next) => {
          console.log(`[Vite Dev Server] Request: ${req.method} ${req.url}`);
          if (req.url && req.url.startsWith("/api/pay") && req.method === "POST") {
            let body = "";
            req.on("data", (chunk) => {
              body += chunk.toString();
            });

            req.on("end", async () => {
              try {
                const data = JSON.parse(body);
                const apikey = env.VITE_CINETPAY_API_KEY;
                const site_id = env.VITE_CINETPAY_SITE_ID;

                if (!apikey || !site_id) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: "CinetPay credentials missing in .env" }));
                  return;
                }

                const payload = {
                  apikey,
                  site_id,
                  transaction_id: data.transaction_id,
                  amount: data.amount,
                  currency: data.currency || "XOF",
                  description: data.description,
                  return_url: data.return_url,
                  notify_url: data.notify_url,
                  channels: "ALL",
                  lang: "FR",
                  customer_id: data.transaction_id,
                  customer_name: data.customer_name,
                  customer_surname: data.customer_surname,
                  customer_email: data.customer_email || "client@vanaeroport.com",
                  customer_phone_number: data.customer_phone_number,
                  customer_address: data.customer_address || "Abidjan",
                  customer_city: data.customer_city || "Abidjan",
                  customer_country: "CI",
                  customer_state: "CI",
                  customer_zip_code: "00225",
                };

                const cinetpayResponse = await fetch(
                  "https://api-checkout.cinetpay.com/v2/payment",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  }
                );

                const result = await cinetpayResponse.json();
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
              } catch (error: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: error.message }));
              }
            });
            return;
          }
          next();
        });
      },
    },
    plugins: [react()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
