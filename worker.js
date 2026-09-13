export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/rapidpay/create-checkout" && request.method === "POST") {
      try {
        const body = await request.json();

        const email = String(body.email || body.customerEmail || "").trim();
        const mobile = String(body.mobile || body.customerMobile || "").trim();
        const amount = Number(body.amount);

        if (!email || !mobile || !Number.isFinite(amount) || amount <= 0) {
          return json({ error: "Please provide a valid email, mobile number and amount." }, 400);
        }

        const clientId = env.RAPID_TEST_CLIENT_ID;
        const clientSecret = env.RAPID_TEST_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          return json({ error: "Rapid Gateway credentials are not configured." }, 500);
        }

        const basicAuth = btoa(`${clientId}:${clientSecret}`);

        const tokenResponse = await fetch(
          "https://secure.rapid-gateway.com/oauth2/token",
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${basicAuth}`,
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "grant_type=client_credentials"
          }
        );

        const tokenText = await tokenResponse.text();

        if (!tokenResponse.ok) {
          return json({
            error: "Rapid Gateway authentication failed.",
            details: tokenText.substring(0, 500)
          }, 502);
        }

        const tokenData = JSON.parse(tokenText);
        const accessToken = tokenData.access_token;

        if (!accessToken) {
          return json({ error: "No access token was returned by Rapid Gateway." }, 502);
        }

        const basketId =
          "LH-" + Date.now() + "-" + crypto.randomUUID().slice(0, 8);

        const checkoutResponse = await fetch(
          "https://secure.rapid-gateway.com/v1/checkout-sessions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "X-Environment": "TEST"
            },
            body: JSON.stringify({
              merchantId: 1684,
              amount: amount,
              currency: "PKR",
              basketId: basketId,
              customerEmail: email,
              customerMobile: mobile
            })
          }
        );

        const checkoutText = await checkoutResponse.text();

        if (!checkoutResponse.ok) {
          return json({
            error: "Unable to create Rapid Gateway checkout session.",
            details: checkoutText.substring(0, 500)
          }, 502);
        }

        const checkoutData = JSON.parse(checkoutText);

        return json({
          success: true,
          sessionId: checkoutData.sessionId,
          clientSecret: checkoutData.clientSecret,
          publishableKey: checkoutData.publishableKey,
          amount: amount,
          currency: "PKR",
          basketId: basketId
        });

      } catch (error) {
        return json({
          error: "Server error while creating checkout.",
          details: String(error.message || error)
        }, 500);
      }
    }

    if (url.pathname === "/api/rapidpay/health") {
      return json({
        ok: true,
        service: "Learning Hub Rapid Gateway",
        environment: "TEST"
      });
    }

    return env.ASSETS.fetch(request);
  }
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
