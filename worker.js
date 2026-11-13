export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/safepay/health") {
      return json({
        ok: true,
        service: "Learning Hub Safepay",
        environment: "sandbox",
        configured: Boolean(env.SAFEPAY_SECRET_KEY && env.SAFEPAY_MERCHANT_API_KEY)
      });
    }

    if (url.pathname === "/api/safepay/create-checkout" && request.method === "POST") {
      try {
        if (!env.SAFEPAY_SECRET_KEY || !env.SAFEPAY_MERCHANT_API_KEY) {
          return json({
            error: "Safepay sandbox credentials are not fully configured in Cloudflare Worker secrets."
          }, 503);
        }

        const body = await request.json();
        const email = String(body.email || "").trim();
        const mobile = String(body.mobile || "").trim();
        const customerName = String(body.name || "").trim();
        const kind = String(body.kind || "lesson");

        if (!customerName || customerName.length > 120 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
            !/^[+0-9()\s-]{7,24}$/.test(mobile)) {
          return json({ error: "Please provide a valid customer name, email address and mobile number." }, 400);
        }

        let amountPkr = 0;
        let description = "";

        if (kind === "lesson") {
          const duration = Number(body.duration);
          const plan = String(body.plan || "");
          const count = Number(body.lessonCount);
          const course = String(body.course || "").trim();

          if (!course || course.length > 180 ||
              ![1000, 1500].includes(duration) ||
              !["demo", "daily", "twice", "weekly", "monthly"].includes(plan) ||
              !Number.isInteger(count) || count < 1 || count > 31) {
            return json({ error: "The selected lesson or programme details are invalid." }, 400);
          }

          if (plan === "demo") {
            if (count !== 1) return json({ error: "Demo bookings must contain one session." }, 400);
            amountPkr = 550;
          } else {
            if (plan === "monthly" && ![16, 20, 25].includes(count)) {
              return json({ error: "Please choose a valid monthly lesson package." }, 400);
            }
            const subtotal = count * duration;
            amountPkr = plan === "monthly" ? Math.round(subtotal * 0.9) : subtotal;
          }
          description = `Learning Hub - ${course} - ${plan} - ${count} lesson(s)`;
        } else if (kind === "resource") {
          const resourceType = String(body.resourceType || "");
          const fixedPrices = { "250": 250, "500": 500, "1000": 1000, "2000": 2000, "3500": 3500 };
          if (!Object.prototype.hasOwnProperty.call(fixedPrices, resourceType)) {
            return json({ error: "This resource requires a confirmed fixed price before online payment." }, 400);
          }
          amountPkr = fixedPrices[resourceType];
          const label = String(body.resourceLabel || "Digital resource").replace(/[<>]/g, "").slice(0, 100);
          description = `Learning Hub - ${label}`;
        } else {
          return json({ error: "Unsupported checkout type." }, 400);
        }

        // Safepay amounts are supplied in the currency's lowest denomination.
        const amountMinor = Math.round(amountPkr * 100);
        if (!Number.isSafeInteger(amountMinor) || amountMinor < 1) {
          return json({ error: "The calculated payment amount is invalid." }, 400);
        }

        const orderId = "LH-" + crypto.randomUUID();
        const apiHost = "https://sandbox.api.getsafepay.com";
        const headers = {
          "X-SFPY-MERCHANT-SECRET": env.SAFEPAY_SECRET_KEY,
          "Content-Type": "application/json",
          "Accept": "application/json"
        };

        // Generate the short-lived browser token required by Safepay's hosted checkout.
        const passportResponse = await fetch(apiHost + "/client/passport/v1/token", {
          method: "POST",
          headers,
          body: JSON.stringify({})
        });
        const passportText = await passportResponse.text();
        let passportResult;
        try { passportResult = JSON.parse(passportText); } catch {
          return json({ error: "Safepay passport service returned an invalid response." }, 502);
        }
        if (!passportResponse.ok) {
          return json({ error: "Safepay authentication could not create a checkout passport.", gatewayStatus: passportResponse.status }, 502);
        }
        const tbt = typeof passportResult.data === "string"
          ? passportResult.data
          : passportResult.data?.token || passportResult.token;
        if (!tbt) return json({ error: "Safepay did not return the checkout passport token." }, 502);

        const sessionResponse = await fetch(apiHost + "/order/payments/v3/", {
          method: "POST",
          headers,
          body: JSON.stringify({
            merchant_api_key: env.SAFEPAY_MERCHANT_API_KEY,
            intent: "CYBERSOURCE",
            mode: "payment",
            entry_mode: "raw",
            currency: "PKR",
            amount: amountMinor,
            metadata: {
              order_id: orderId,
              description: description.slice(0, 200),
              customer_name: customerName,
              customer_email: email,
              customer_mobile: mobile
            },
            include_fees: false
          })
        });
        const sessionText = await sessionResponse.text();
        let sessionResult;
        try { sessionResult = JSON.parse(sessionText); } catch {
          return json({ error: "Safepay payment session service returned an invalid response." }, 502);
        }
        if (!sessionResponse.ok) {
          return json({ error: "Safepay could not create the payment session.", gatewayStatus: sessionResponse.status }, 502);
        }
        const tracker = sessionResult.tracker?.token || sessionResult.data?.tracker?.token;
        if (!tracker) return json({ error: "Safepay did not return a payment tracker." }, 502);

        const redirectUrl = "https://learninghubtutoring.com/billing.html?payment=return";
        const cancelUrl = "https://learninghubtutoring.com/billing.html?payment=cancelled";
        const checkoutUrl = new URL("/embedded/", apiHost);
        checkoutUrl.search = new URLSearchParams({
          environment: "sandbox",
          tbt,
          tracker,
          source: "hosted",
          order_id: orderId,
          redirect_url: redirectUrl,
          cancel_url: cancelUrl
        }).toString();

        return json({
          success: true,
          checkoutUrl: checkoutUrl.toString(),
          orderId,
          tracker,
          amount: amountPkr,
          currency: "PKR",
          environment: "sandbox",
          status: "pending"
        });
      } catch (error) {
        return json({
          error: "Server error while creating the Safepay sandbox checkout.",
          details: String(error?.message || error).slice(0, 300)
        }, 500);
      }
    }

    // Keep all existing static-site routing and assets behavior unchanged.
    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}
