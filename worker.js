export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================================================
    // HEALTH CHECK
    // =========================================================
    if (url.pathname === "/api/rapidpay/health") {
      return json({
        ok: true,
        service: "Learning Hub Rapid Gateway",
        environment: "TEST"
      });
    }

    // =========================================================
    // CREATE RAPID GATEWAY CHECKOUT
    // =========================================================
    if (
      url.pathname === "/api/rapidpay/create-checkout" &&
      request.method === "POST"
    ) {
      try {
        const body = await request.json();

        const email = String(
          body.email || body.customerEmail || ""
        ).trim();

        const mobile = String(
          body.mobile || body.customerMobile || ""
        ).trim();

        const amount = Number(body.amount);

        if (
          !email ||
          !mobile ||
          !Number.isFinite(amount) ||
          amount <= 0
        ) {
          return json(
            {
              error:
                "Please provide a valid email, mobile number and amount."
            },
            400
          );
        }

        // -------------------------------------------------------
        // RAPID GATEWAY OAUTH CREDENTIALS
        // -------------------------------------------------------
        const clientId = env.RAPID_TEST_CLIENT_ID;
        const clientSecret = env.RAPID_TEST_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
          return json(
            {
              error:
                "Rapid Gateway credentials are not configured in Cloudflare."
            },
            500
          );
        }

        // -------------------------------------------------------
        // STEP 1 — GET ACCESS TOKEN
        // -------------------------------------------------------
        const basicAuth = btoa(
          `${clientId}:${clientSecret}`
        );

        const tokenResponse = await fetch(
          "https://secure.rapid-gateway.com/oauth2/token",
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${basicAuth}`,
              "Content-Type":
                "application/x-www-form-urlencoded"
            },
            body:
              "grant_type=client_credentials"
          }
        );

        const tokenText =
          await tokenResponse.text();

        if (!tokenResponse.ok) {
          return json(
            {
              error:
                "Rapid Gateway authentication failed.",
              details:
                tokenText.substring(0, 1000)
            },
            502
          );
        }

        let tokenData;

        try {
          tokenData =
            JSON.parse(tokenText);
        } catch {
          return json(
            {
              error:
                "Rapid Gateway returned an invalid token response.",
              details:
                tokenText.substring(0, 1000)
            },
            502
          );
        }

        const accessToken =
          tokenData.access_token ||
          tokenData.accessToken ||
          tokenData.token;

        if (!accessToken) {
          return json(
            {
              error:
                "Rapid Gateway did not return an access token.",
              details:
                JSON.stringify(tokenData).substring(
                  0,
                  1000
                )
            },
            502
          );
        }

        // -------------------------------------------------------
        // STEP 2 — PROCESS TRANSACTION
        // -------------------------------------------------------

        const basketId =
          "LH-" +
          Date.now() +
          "-" +
          crypto
            .randomUUID()
            .replace(/-/g, "")
            .substring(0, 8);

        const siteUrl =
          "https://learninghubtutoring.com";

        const successUrl =
          `${siteUrl}/?payment=success`;

        const failureUrl =
          `${siteUrl}/?payment=failed`;

        /*
         * Rapid Gateway specifically requires:
         *
         * application/x-www-form-urlencoded
         *
         * Required:
         * MERCHANT_ID
         * TXNAMT
         * BASKET_ID
         * CUSTOMER_MOBILE_NO
         * CUSTOMER_EMAIL_ADDRESS
         * SUCCESS_URL
         * FAILURE_URL
         */

        const form = new URLSearchParams();

        form.set(
          "MERCHANT_ID",
          "1684"
        );

        form.set(
          "TXNAMT",
          amount.toFixed(2)
        );

        form.set(
          "BASKET_ID",
          basketId
        );

        form.set(
          "CUSTOMER_MOBILE_NO",
          mobile
        );

        form.set(
          "CUSTOMER_EMAIL_ADDRESS",
          email
        );

        form.set(
          "SUCCESS_URL",
          successUrl
        );

        form.set(
          "FAILURE_URL",
          failureUrl
        );

        form.set(
          "MERCHANT_NAME",
          "Learning Hub"
        );

        form.set(
          "TXNDESC",
          "Learning Hub Test Payment"
        );

        // PKR is the default currency.
        form.set(
          "CURRENCY_CODE",
          "PKR"
        );

        // -------------------------------------------------------
        // IMPORTANT:
        // redirect: "manual" prevents Cloudflare from following
        // Rapid Gateway's hosted-checkout redirect.
        // We need the Location header so the browser can be
        // redirected to Rapid Gateway.
        // -------------------------------------------------------

        const checkoutResponse =
          await fetch(
            "https://secure.rapid-gateway.com/rapid/process-transaction",
            {
              method: "POST",
              redirect: "manual",
              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
                "Content-Type":
                  "application/x-www-form-urlencoded"
              },
              body: form.toString()
            }
          );

        // -------------------------------------------------------
        // FIRST: CHECK HTTP REDIRECT
        // -------------------------------------------------------

        const location =
          checkoutResponse.headers.get(
            "Location"
          );

        if (location) {
          return json({
            success: true,
            checkoutUrl: location,
            basketId: basketId,
            amount: amount,
            currency: "PKR"
          });
        }

        // -------------------------------------------------------
        // SECOND: CHECK RESPONSE BODY
        // -------------------------------------------------------

        const checkoutText =
          await checkoutResponse.text();

        let checkoutData = null;

        if (checkoutText.trim()) {
          try {
            checkoutData =
              JSON.parse(checkoutText);
          } catch {
            checkoutData = null;
          }
        }

        // -------------------------------------------------------
        // POSSIBLE JSON CHECKOUT URL FIELDS
        // -------------------------------------------------------

        if (checkoutData) {
          const checkoutUrl =
            checkoutData.checkoutUrl ||
            checkoutData.checkout_url ||
            checkoutData.redirectUrl ||
            checkoutData.redirect_url ||
            checkoutData.paymentUrl ||
            checkoutData.payment_url ||
            checkoutData.url ||
            checkoutData.redirect;

          if (checkoutUrl) {
            return json({
              success: true,
              checkoutUrl: checkoutUrl,
              basketId: basketId,
              amount: amount,
              currency: "PKR"
            });
          }
        }

        // -------------------------------------------------------
        // THIRD: SOME GATEWAYS RETURN THE URL AS PLAIN TEXT
        // -------------------------------------------------------

        const plainUrl =
          checkoutText
            .trim()
            .match(
              /https?:\/\/[^\s"'<>]+/i
            );

        if (plainUrl) {
          return json({
            success: true,
            checkoutUrl: plainUrl[0],
            basketId: basketId,
            amount: amount,
            currency: "PKR"
          });
        }

        // -------------------------------------------------------
        // ERROR — RETURN THE ACTUAL GATEWAY RESPONSE
        // -------------------------------------------------------

        return json(
          {
            error:
              "Rapid Gateway did not return a checkout URL.",
            httpStatus:
              checkoutResponse.status,
            response:
              checkoutText.substring(
                0,
                2000
              ),
            basketId: basketId
          },
          502
        );

      } catch (error) {
        return json(
          {
            error:
              "Server error while creating checkout.",
            details:
              String(
                error?.message ||
                error
              )
          },
          500
        );
      }
    }

    // =========================================================
    // ALL OTHER WEBSITE REQUESTS
    // =========================================================

    return env.ASSETS.fetch(request);
  }
};


// =============================================================
// JSON RESPONSE HELPER
// =============================================================

function json(
  data,
  status = 200
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",
        "Cache-Control":
          "no-store"
      }
    }
  );
}
