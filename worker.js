export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/safepay/health") {
      return json({ ok: true, service: "Learning Hub Safepay", environment: "sandbox" });
    }
    if (url.pathname === "/api/safepay/create-checkout" && request.method === "POST") {
      try {
        const secret = env.SAFEPAY_SECRET_KEY;
        const merchantApiKey = env.SAFEPAY_MERCHANT_API_KEY;
        if (!secret || !merchantApiKey) {
          return json({ error: "Safepay sandbox credentials are not configured in Cloudflare. Add SAFEPAY_SECRET_KEY and SAFEPAY_MERCHANT_API_KEY." }, 503);
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
          if (!course || course.length > 180 || ![1000, 1500].includes(duration) ||
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
            amountPkr = count * duration;
            if (plan === "monthly") amountPkr = Math.round(amountPkr * 0.9);
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

        // Safepay's optional customer-prefill step. The returned customer token
        // is attached to both the payment tracker and hosted checkout URL.
        const nameParts = customerName.trim().split(/\s+/);
        const firstName = nameParts.shift() || customerName;
        const lastName = nameParts.join(" ") || firstName;
        const apiBase = "https://sandbox.api.getsafepay.com";
        const headers = {
          "X-SFPY-MERCHANT-SECRET": secret,
          "Content-Type": "application/json"
        };
        const customerResponse = await fetch(apiBase + "/user/customers/v1/", {
          method: "POST",
          headers,
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            email,
            phone_number: mobile,
            country: "PK",
            is_guest: true
          })
        });
        const customerText = await customerResponse.text();
        let customerData;
        try { customerData = JSON.parse(customerText); } catch {
          return json({ error: "Safepay returned an unreadable customer response." }, 502);
        }
        const customerToken = customerData?.data?.token;
        if (!customerResponse.ok || !customerToken || customerData?.status?.message !== "success") {
          return json({ error: "Safepay could not create the customer profile.", details: customerData?.status?.errors || customerData?.message || "Request failed." }, 502);
        }

        // Safepay expects the amount in the currency's lowest denomination (PKR paisa).
        const amount = Math.round(amountPkr * 100);
        const orderId = "LH-" + Date.now() + "-" + crypto.randomUUID().replace(/-/g, "").slice(0, 8);

        const trackerResponse = await fetch(apiBase + "/order/payments/v3/", {
          method: "POST",
          headers,
          body: JSON.stringify({
            merchant_api_key: merchantApiKey,
            user: customerToken,
            intent: "CYBERSOURCE",
            mode: "payment",
            entry_mode: "raw",
            currency: "PKR",
            amount,
            metadata: { order_id: orderId },
            include_fees: false
          })
        });
        const trackerText = await trackerResponse.text();
        let trackerData;
        try { trackerData = JSON.parse(trackerText); } catch {
          return json({ error: "Safepay returned an unreadable payment-session response." }, 502);
        }
        const tracker = trackerData?.data?.tracker?.token;
        if (!trackerResponse.ok || !tracker || trackerData?.status?.message !== "success") {
          return json({ error: "Safepay could not create the payment session.", details: trackerData?.status?.errors || trackerData?.message || "Request failed." }, 502);
        }

        const passportResponse = await fetch(apiBase + "/client/passport/v1/token", {
          method: "POST",
          headers
        });
        const passportText = await passportResponse.text();
        let passportData;
        try { passportData = JSON.parse(passportText); } catch {
          return json({ error: "Safepay returned an unreadable authentication-token response." }, 502);
        }
        const tbt = passportData?.data;
        if (!passportResponse.ok || !tbt) {
          return json({ error: "Safepay could not create the checkout authentication token.", details: passportData?.status?.errors || "Request failed." }, 502);
        }

        const checkoutParams = new URLSearchParams({
          environment: "sandbox",
          tracker,
          tbt,
          source: "hosted",
          user_id: customerToken,
          order_id: orderId,
          redirect_url: "https://learninghubtutoring.com/order/complete",
          cancel_url: "https://learninghubtutoring.com/order/cancel"
        });
        const checkoutUrl = "https://sandbox.api.getsafepay.com/embedded/?" + checkoutParams.toString();
        return json({ success: true, checkoutUrl, orderId, tracker, amount: amountPkr, currency: "PKR", status: "pending", description });
      } catch (error) {
        return json({ error: "Server error while creating Safepay checkout.", details: String(error?.message || error) }, 500);
      }
    }

    if (url.pathname === "/api/safepay/webhook" && request.method === "POST") {
      const webhookSecret = env.SAFEPAY_WEBHOOK_SECRET;
      if (!webhookSecret) return json({ error: "Webhook secret is not configured." }, 503);
      try {
        const rawBody = await request.text();
        const supplied = request.headers.get("X-SFPY-SIGNATURE") || "";
        const key = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(webhookSecret),
          { name: "HMAC", hash: "SHA-512" },
          false,
          ["sign"]
        );
        const digest = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
        const expected = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
        const received = supplied.replace(/^sha512=/i, "").trim().toLowerCase();
        if (!received || received.length !== expected.length) return json({ error: "Invalid webhook signature." }, 401);
        let mismatch = 0;
        for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ received.charCodeAt(i);
        if (mismatch !== 0) return json({ error: "Invalid webhook signature." }, 401);
        const event = JSON.parse(rawBody);
        const eventToken = String(event?.token || "");
        const eventType = String(event?.type || "");
        const tracker = String(event?.data?.tracker || "");
        const supabaseUrl = String(env.SUPABASE_URL || "").replace(/\\/$/, "");
        const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
        if (!eventToken || !eventType) return json({ error: "Webhook event is missing its unique token or type." }, 400);
        if (!supabaseUrl || !supabaseKey) return json({ error: "Webhook database credentials are not configured." }, 503);
        const storeResponse = await fetch(supabaseUrl + "/rest/v1/safepay_webhook_events", {
          method: "POST",
          headers: {
            "apikey": supabaseKey,
            "Authorization": "Bearer " + supabaseKey,
            "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates,return=minimal"
          },
          body: JSON.stringify({
            event_token: eventToken,
            event_type: eventType,
            tracker: tracker || null,
            order_id: event?.data?.metadata?.order_id || null,
            payload: event
          })
        });
        if (!storeResponse.ok) {
          console.error("Safepay webhook storage failed", storeResponse.status);
          return json({ error: "Could not store webhook event." }, 500);
        }
        if (eventType === "payment.succeeded" || eventType === "payment.failed" || eventType === "payment.refunded") {
          console.log("Safepay webhook received", JSON.stringify({
            token: event?.token || null,
            type: eventType,
            tracker,
            state: event?.data?.state || null,
            order_id: event?.data?.metadata?.order_id || null
          }));
        } else {
          console.log("Safepay webhook received", JSON.stringify({ token: event?.token || null, type: eventType }));
        }
        return json({ received: true });
      } catch (error) {
        return json({ error: "Invalid webhook payload." }, 400);
      }
    }

    if (url.pathname === "/api/safepay/status" && request.method === "GET") {
      const secret = env.SAFEPAY_SECRET_KEY;
      const tracker = String(url.searchParams.get("tracker") || "");
      if (!secret) return json({ error: "Safepay secret is not configured." }, 503);
      if (!/^track_[A-Za-z0-9-]{10,100}$/.test(tracker)) return json({ error: "Invalid tracker." }, 400);
      try {
        const response = await fetch("https://sandbox.api.getsafepay.com/reporter/api/v1/payments/" + encodeURIComponent(tracker), {
          headers: { "X-SFPY-MERCHANT-SECRET": secret }
        });
        const data = await response.json();
        if (!response.ok) return json({ error: "Unable to retrieve Safepay payment status." }, 502);
        const state = data?.data?.tracker?.state || "UNKNOWN";
        return json({ tracker, state, paid: state === "TRACKER_ENDED", status: data?.status?.message || "unknown" });
      } catch (error) {
        return json({ error: "Unable to verify the Safepay payment.", details: String(error?.message || error) }, 502);
      }
    }

    if (url.pathname === "/order/complete") {
      return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment status | Learning Hub</title><style>body{font:16px Arial;background:#f7f1e7;color:#211b12;display:grid;place-items:center;min-height:100vh;margin:0}.card{background:#fffdfa;border:1px solid #e4d2ae;border-radius:18px;padding:32px;max-width:520px;margin:20px;text-align:center}h1{font:700 28px Georgia;color:#8b6726}p{line-height:1.6}</style><main class="card"><h1>Checking your payment</h1><p id="message">Please wait while we verify your Safepay payment securely.</p><p><a href="/billing.html">Return to Learning Hub</a></p></main><script>const tracker=new URLSearchParams(location.search).get("tracker");const msg=document.getElementById("message");if(!tracker){msg.textContent="Your return was received, but no payment reference was provided. Please contact Learning Hub support."; }else{fetch("/api/safepay/status?tracker="+encodeURIComponent(tracker)).then(r=>r.json()).then(d=>{msg.textContent=d.paid?"Payment completed successfully. Thank you for choosing Learning Hub.":"Payment status: "+(d.state||"Pending")+". If you completed payment, please allow time for confirmation or contact support.";}).catch(()=>msg.textContent="We could not verify the payment just now. Please contact Learning Hub support before retrying.");}</script></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store" } });
    }
    if (url.pathname === "/order/cancel") {
      return Response.redirect("https://learninghubtutoring.com/billing.html?payment=cancelled", 302);
    }

    // Static assets remain unchanged.
    return env.ASSETS.fetch(request);
  }
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store" } });
}