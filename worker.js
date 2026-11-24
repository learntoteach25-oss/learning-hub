export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const safepayEnvironment = String(env.SAFEPAY_ENVIRONMENT || (env.SAFEPAY_LIVE_SECRET_KEY && env.SAFEPAY_LIVE_MERCHANT_API_KEY ? "production" : "sandbox")).toLowerCase();
    const safepayLive = safepayEnvironment === "production" || safepayEnvironment === "live";
    const safepay = safepayLive ? {
      apiBase: "https://api.getsafepay.com",
      checkoutBase: "https://getsafepay.com",
      checkoutEnvironment: "production",
      secret: env.SAFEPAY_LIVE_SECRET_KEY,
      merchantApiKey: env.SAFEPAY_LIVE_MERCHANT_API_KEY,
      webhookSecret: env.SAFEPAY_LIVE_WEBHOOK_SECRET
    } : {
      apiBase: "https://sandbox.api.getsafepay.com",
      checkoutBase: "https://sandbox.api.getsafepay.com",
      checkoutEnvironment: "sandbox",
      secret: env.SAFEPAY_SECRET_KEY,
      merchantApiKey: env.SAFEPAY_MERCHANT_API_KEY,
      webhookSecret: env.SAFEPAY_WEBHOOK_SECRET
    };
    if (safepayLive && (!safepay.secret || !safepay.merchantApiKey || !safepay.webhookSecret)) {
      return json({ error: "Safepay Production credentials are incomplete." }, 503);
    }
    if (!safepayLive && (!safepay.secret || !safepay.merchantApiKey || !safepay.webhookSecret)) {
      return json({ error: "Safepay Sandbox credentials are incomplete." }, 503);
    }
    if (url.pathname === "/pricing.html" && request.method === "GET") {
      const groups = [
        { title: "Language Courses", items: [["English – Beginner",800,1400,8,12],["English – Intermediate",1000,1500,8,12],["English – Advanced",1200,1800,8,12],["Spoken English",1000,1500,8,12],["Conversational English",1000,1500,8,12],["Business English",1200,1800,8,12],["English Grammar & Writing",1000,1500,8,12],["French",1200,1800,9,14],["German",1200,1800,9,14],["Spanish",1200,1800,9,14],["Arabic",1000,1500,9,14],["Chinese (Mandarin)",1500,2200,9,14],["Urdu for Foreigners",1000,1500,9,14]] },
        { title: "English Proficiency & Test Preparation", items: [["IELTS Academic",1500,2200,12,18],["IELTS General Training",1500,2200,12,18],["PTE Academic",1500,2200,12,18],["PTE Core",1500,2200,12,18],["TOEFL iBT",1500,2200,12,18],["Cambridge English",1200,1800,10,15],["Duolingo English Test",1500,2200,12,18],["OET",1800,2500,12,18]] },
        { title: "Academic Tutoring & Learning Support", items: [["Academic Tutoring",1000,1500,10,15],["English Development",1000,1500,8,12],["Study Skills",1000,1500,10,15],["Specialist Learning Support",1500,2000,12,18],["Primary / Lower Secondary",800,1200,8,12]] },
        { title: "International Curricula & Boards", items: [["Cambridge International (CIE)",1200,1800,10,15],["Pearson Edexcel",1200,1800,10,15],["OxfordAQA",1200,1800,10,15],["International Baccalaureate (IB)",1500,2200,14,20],["IGCSE",1200,1800,10,15],["GCSE",1200,1800,10,15],["AS & A Level",1500,2200,12,18]] },
        { title: "University & Professional Education", items: [["MBA Support",1800,2500,15,22],["BBA Support",1200,1800,12,18],["B.Ed Support",1500,2000,12,18],["M.Ed Support",1800,2500,15,22]] },
        { title: "Standardised Tests & Competitions", items: [["SAT",1800,2500,15,22],["ACT",1800,2500,15,22],["GRE General",2000,3000,18,25],["GMAT",2000,3000,18,25],["International Olympiads",1500,2200,12,18],["Kangaroo Competitions",1200,1800,10,15],["Spelling & Word Competitions",1000,1500,8,12],["Debate & Public Speaking",1200,1800,10,15],["Quiz & Knowledge Competitions",1000,1500,8,12]] },
        { title: "Quran & Islamic Studies", items: [["Quran & Islamic Studies",800,1200,7,10]] }
      ];
      const data = JSON.stringify(groups).replace(/</g, "\\u003c");
      const html = [
        '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Courses &amp; Fees | Learning Hub</title><meta name="description" content="Explore Learning Hub course fees for language learning, international curricula, exam preparation and academic support.">',
        '<style>:root{--gold:#d5aa4d;--ink:#17130d;--muted:#71695d;--paper:#fffdfa;--line:#eadfc9}*{box-sizing:border-box}body{margin:0;background:#faf8f3;color:var(--ink);font-family:Arial,sans-serif}.top{background:#080808;color:#fff;padding:16px max(20px,calc((100% - 1120px)/2));display:flex;align-items:center;justify-content:space-between;gap:16px}.top img{width:145px;height:55px;object-fit:contain}.top nav{display:flex;gap:18px;flex-wrap:wrap}.top a{color:#f0d28b;text-decoration:none;font-size:13px;font-weight:700}.wrap{width:min(1120px,calc(100% - 32px));margin:0 auto;padding:38px 0 60px}.hero{text-align:center;padding:42px 20px 34px;background:#090909;color:#fff;border-radius:20px;margin-bottom:25px}.eyebrow{font-size:11px;font-weight:700;letter-spacing:.18em;color:#e8c879}.hero h1{font:700 clamp(32px,5vw,48px)/1.1 Georgia,serif;margin:12px 0;color:#fff}.hero p{max-width:700px;margin:0 auto;color:#e4ddd0;font-size:14px;line-height:1.65}.controls{display:flex;justify-content:center;gap:10px;margin:22px 0 26px;flex-wrap:wrap}.controls button{border:1px solid #d9c79f;background:#fffaf0;border-radius:999px;padding:12px 22px;font-weight:700;cursor:pointer}.controls button.active{background:#090909;color:#f0cf79;border-color:#090909}.group{background:var(--paper);border:1px solid var(--line);border-radius:15px;margin:15px 0;overflow:hidden;box-shadow:0 8px 22px #3d2e1110}.group h2{font:700 21px Georgia,serif;margin:0;padding:18px 21px;background:#f5efe3;border-bottom:1px solid var(--line)}table{width:100%;border-collapse:collapse}th,td{padding:12px 18px;border-bottom:1px solid #eee7db;text-align:left;font-size:13px}th{font-size:10px;letter-spacing:.08em;color:#756b5d;background:#fffdf8}td:nth-child(n+2),th:nth-child(n+2){text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}tr:last-child td{border-bottom:0}.note{font-size:12px;line-height:1.6;color:var(--muted);margin:18px 4px}.cta{text-align:center;margin:28px}.cta a{display:inline-block;background:#080808;color:#f1d080;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:700}.foot{text-align:center;background:#090909;color:#ddd2bd;padding:24px 16px;font-size:11px;line-height:1.8}.foot a{color:#f0d28b}@media(max-width:620px){.top{padding:12px 16px;display:block;text-align:center}.top img{height:48px}.top nav{justify-content:center;gap:12px}.wrap{width:calc(100% - 22px);padding:22px 0 40px}.hero{padding:32px 15px}.group h2{font-size:18px;padding:15px}th,td{padding:10px 8px;font-size:11px}td:first-child{max-width:52%;overflow-wrap:anywhere}.controls button{padding:10px 16px}}</style></head><body>',
        '<header class="top"><a href="/"><img src="/assets/Learning_Hub_Trademark_Logo.jpg" alt="Learning Hub"></a><nav><a href="/">Home</a><a href="/?view=programmes">Programmes</a><a href="/pricing.html">Courses &amp; Fees</a><a href="/billing.html">Book Now</a></nav></header>',
        '<main class="wrap"><section class="hero"><span class="eyebrow">LEARNING HUB · COURSE CATALOGUE</span><h1>Courses &amp; Fees</h1><p>Explore personalised online learning across languages, international curricula, exam preparation and academic support. Choose a lesson duration and view the applicable session fee.</p></section>',
        '<div class="controls" role="group" aria-label="Select fee currency"><button type="button" class="active" data-currency="PKR">Pakistan · PKR</button><button type="button" data-currency="USD">International · USD</button></div><div id="feeTables"></div><p class="note" id="feeNote"></p><div class="cta"><a href="/billing.html">Book a Lesson →</a></div></main>',
        '<footer class="foot">Learning Hub Global Educational Services (SMC-Private) Limited<br>Shop No. 3, Islamic Apartment, Block 2, Gulshan-e-Iqbal, Karachi – 75300<br><a href="mailto:hublearning117@gmail.com">hublearning117@gmail.com</a> · <a href="mailto:learninghubcustomersupport@gmail.com">Customer Support</a> · +92 305 3750105<br>© 2026 Learning Hub. All rights reserved.</footer>',
        '<script>const feeData=' + data + ';let currency="PKR";const money=(n,c)=>c==="PKR"?"PKR "+Number(n).toLocaleString("en-PK"):"$"+n;function renderFees(){document.getElementById("feeTables").innerHTML=feeData.map(g=>"<section class=group><h2>"+g.title+"</h2><table><thead><tr><th>Course / Service</th><th>25 Minutes</th><th>50 Minutes</th></tr></thead><tbody>"+g.items.map(x=>"<tr><td>"+x[0]+"</td><td>"+money(currency==="PKR"?x[1]:x[3],currency)+"</td><td>"+money(currency==="PKR"?x[2]:x[4],currency)+"</td></tr>").join("")+"</tbody></table></section>").join("");document.getElementById("feeNote").textContent=currency==="PKR"?"All PKR prices are per individual online session. Eligible monthly packages receive a 10% discount. The 30-minute introductory demo is shown separately during booking. Specialised requirements may receive a customised quote.":"USD prices are indicative international session rates. Eligible monthly packages receive a 10% discount. Specialised requirements may receive a customised quote.";}document.querySelectorAll("[data-currency]").forEach(b=>b.addEventListener("click",()=>{currency=b.dataset.currency;document.querySelectorAll("[data-currency]").forEach(x=>x.classList.toggle("active",x===b));renderFees()}));renderFees();</script>',
        '</body></html>'
      ].join("");
      return new Response(html, { headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "public, max-age=300" } });
    }
    if (url.pathname === "/api/safepay/health") {
      return json({ ok: true, service: "Learning Hub Safepay", environment: safepay.checkoutEnvironment });
    }
    if (url.pathname === "/api/safepay/create-checkout" && request.method === "POST") {
      try {
        const secret = safepay.secret;
        const merchantApiKey = safepay.merchantApiKey;
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
          const courseRates = {
            "Academic Tutoring":[1000,1500],"English Development":[1000,1500],"Study Skills":[1000,1500],"Specialist Learning Support":[1500,2000],
            "MBA Support":[1800,2500],"BBA Support":[1200,1800],"B.Ed Support":[1500,2000],"M.Ed Support":[1800,2500],
            "English – Beginner":[800,1400],"English – Intermediate":[1000,1500],"English – Advanced":[1200,1800],"Spoken English":[1000,1500],"Conversational English":[1000,1500],"Business English":[1200,1800],"English Grammar & Writing":[1000,1500],"French":[1200,1800],"German":[1200,1800],"Spanish":[1200,1800],"Arabic":[1000,1500],"Chinese (Mandarin)":[1500,2200],"Urdu for Foreigners":[1000,1500],
            "Cambridge International (CIE)":[1200,1800],"Pearson Edexcel":[1200,1800],"OxfordAQA":[1200,1800],"International Baccalaureate (IB)":[1500,2200],"IGCSE":[1200,1800],"GCSE":[1200,1800],"AS & A Level":[1500,2200],"Primary / Lower Secondary":[800,1200],
            "IELTS Academic":[1500,2200],"IELTS General Training":[1500,2200],"PTE Academic":[1500,2200],"PTE Core":[1500,2200],"TOEFL iBT":[1500,2200],"Cambridge English":[1200,1800],"Duolingo English Test":[1500,2200],"OET":[1800,2500],
            "SAT":[1800,2500],"ACT":[1800,2500],"GRE General":[2000,3000],"GMAT":[2000,3000],
            "International Olympiads":[1500,2200],"Kangaroo Competitions":[1200,1800],"Spelling & Word Competitions":[1000,1500],"Debate & Public Speaking":[1200,1800],"Quiz & Knowledge Competitions":[1000,1500],"Quran & Islamic Studies":[800,1200]
          };
          if (!course || course.length > 180 || ![25, 50].includes(duration) ||
              !Object.prototype.hasOwnProperty.call(courseRates, course) ||
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
            const courseRate = courseRates[course][duration === 25 ? 0 : 1];
            amountPkr = count * courseRate;
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

        // Guest checkout is independent of existing Learning Hub accounts.
        // Always create an internal guest identity so any customer email can be
        // used, including addresses already registered as admin, teacher or student.
        const studentId = await createGuestCheckoutProfile(env, email, customerName);

        // Safepay's optional customer-prefill step. The returned customer token
        // is attached to both the payment tracker and hosted checkout URL.
        const nameParts = customerName.trim().split(/\s+/);
        const firstName = nameParts.shift() || customerName;
        const lastName = nameParts.join(" ") || firstName;
        const apiBase = safepay.apiBase;
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
          environment: safepay.checkoutEnvironment,
          tracker,
          tbt,
          source: "hosted",
          user_id: customerToken,
          order_id: orderId,
          redirect_url: "https://learninghubtutoring.com/order/complete?tracker=" + tracker,
          cancel_url: "https://learninghubtutoring.com/order/cancel?tracker=" + tracker
        });
        const orderType = kind === "lesson" ? "class" : "resource";
        const inquiry = kind === "lesson" ? {
          subject: String(body.course || "").trim(),
          curriculum: "",
          requirement_summary: [
            body.guardian ? "Parent/guardian: " + String(body.guardian).trim() : "",
            mobile ? "Contact number: " + mobile : "",
            "Customer: " + customerName,
            "Customer email: " + email,
            body.notes ? "Learning requirements: " + String(body.notes).trim() : "",
            "Booking plan: " + String(body.plan || ""),
            "Lesson count: " + String(body.lessonCount || 1),
            "Lesson duration: " + (Number(body.plan === "demo" ? 30 : body.duration)) + " minutes",
            "Rate/total payable: PKR " + amountPkr
          ].filter(Boolean).join("\\n"),
          preferred_days: "",
          lesson_duration_minutes: body.plan === "demo" ? 30 : Number(body.duration),
          lessons_count: Number(body.lessonCount || 1),
          package: String(body.plan || ""),
          budget: "PKR " + amountPkr
        } : null;
        const studentRemark = kind === "resource"
          ? [
              "Customer: " + customerName,
              "Customer email: " + email,
              "Resource type: " + String(body.resourceLabel || body.resourceType || "Digital resource"),
              mobile ? "Customer mobile: " + mobile : "",
              body.storyTitle ? "Story title: " + String(body.storyTitle) : "",
              body.subject ? "Subject: " + String(body.subject) : "",
              body.curriculum ? "Curriculum: " + String(body.curriculum) : "",
              body.level ? "Level: " + String(body.level) : "",
              body.format ? "Format: " + String(body.format) : "",
              body.notes ? "Requirements: " + String(body.notes) : ""
            ].filter(Boolean).join("\\n")
          : null;
        const records = await createCheckoutRecords(env, {
          studentId, orderId, amount: amountPkr, description, orderType, inquiry, studentRemark
        });
        await saveSafepayTracker(env, records.payment_id, tracker);

        const checkoutUrl = safepay.checkoutBase + "/embedded/?" + checkoutParams.toString();
        return json({
          success: true, checkoutUrl, orderId, tracker, amount: amountPkr, currency: "PKR",
          status: "pending", description, inquiryId: records.inquiry_id,
          paymentId: records.payment_id, invoiceId: records.invoice_id,
          serviceOrderId: records.service_order_id
        });
      } catch (error) {
        return json({ error: "Server error while creating Safepay checkout.", details: String(error?.message || error) }, 500);
      }
    }

    if (url.pathname === "/api/safepay/webhook" && request.method === "POST") {
      const webhookSecret = safepay.webhookSecret;
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
        const supabaseUrlRaw = String(env.SUPABASE_URL || "");
        const supabaseUrl = supabaseUrlRaw.endsWith("/") ? supabaseUrlRaw.slice(0, -1) : supabaseUrlRaw;
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
          if (tracker && eventType === "payment.succeeded") {
            const verifiedPaid = await verifySafepayPaid(env, tracker, safepay);
            if (!verifiedPaid) return json({ error: "Safepay has not yet confirmed this payment. Please retry the webhook." }, 503);
            await updatePaymentRecords(env, tracker, "paid");
          } else if (tracker && eventType === "payment.failed") {
            await updatePaymentRecords(env, tracker, "failed");
          } else if (tracker && eventType === "payment.refunded") {
            await updatePaymentRecords(env, tracker, "refunded");
          }
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
        console.error("Safepay webhook processing failed", String(error?.message || error));
        return json({ error: "Webhook processing failed. Safepay may retry this event." }, 500);
      }
    }

    if (url.pathname === "/api/safepay/status" && request.method === "GET") {
      const secret = safepay.secret;
      const tracker = String(url.searchParams.get("tracker") || "");
      if (!secret) return json({ error: "Safepay secret is not configured." }, 503);
      if (!/^track_[A-Za-z0-9-]{10,100}$/.test(tracker)) return json({ error: "Invalid tracker." }, 400);
      try {
        const response = await fetch(safepay.apiBase + "/reporter/api/v1/payments/" + encodeURIComponent(tracker), {
          headers: { "X-SFPY-MERCHANT-SECRET": secret }
        });
        const data = await response.json();
        if (!response.ok) return json({ error: "Unable to retrieve Safepay payment status." }, 502);
        const state = data?.data?.tracker?.state || "UNKNOWN";
        const paid = state === "TRACKER_ENDED";
        if (paid) await updatePaymentRecords(env, tracker, "paid");
        return json({ tracker, state, paid, status: data?.status?.message || "unknown" });
      } catch (error) {
        return json({ error: "Unable to verify the Safepay payment.", details: String(error?.message || error) }, 502);
      }
    }

    if (url.pathname === "/billing.html" && request.method === "GET") {
      const assetResponse = await env.ASSETS.fetch(request);
      const checkoutEnhancement = `<script>
(() => {
  const addAccountNotice = (buttonId, marker) => {
    const button = document.getElementById(buttonId);
    if (!button || document.querySelector('[data-lh-account-link="' + marker + '"]')) return;
    const note = document.createElement("p");
    note.className = "account-note";
    note.dataset.lhAccountLink = marker;
    note.style.cssText = "font-size:12px;line-height:1.5;color:#6a6052;margin:10px 0";
    note.textContent = "Your email links this order to your Learning Hub student record. If you are new, a student profile is created for order management; you can set a password later using Forgot Password.";
    button.before(note);
  };
  const enhance = () => {
    addAccountNotice("sendInquiry", "lesson");
    addAccountNotice("sendResource", "resource");
    const course = document.getElementById("course");
    const duration = document.getElementById("duration");
    if (!course || !duration) return;
    const ratesByCourse = {
      "Academic Tutoring":[1000,1500],"English Development":[1000,1500],"Study Skills":[1000,1500],"Specialist Learning Support":[1500,2000],
      "MBA Support":[1800,2500],"BBA Support":[1200,1800],"B.Ed Support":[1500,2000],"M.Ed Support":[1800,2500],
      "English – Beginner":[800,1400],"English – Intermediate":[1000,1500],"English – Advanced":[1200,1800],"Spoken English":[1000,1500],"Conversational English":[1000,1500],"Business English":[1200,1800],"English Grammar & Writing":[1000,1500],"French":[1200,1800],"German":[1200,1800],"Spanish":[1200,1800],"Arabic":[1000,1500],"Chinese (Mandarin)":[1500,2200],"Urdu for Foreigners":[1000,1500],
      "Cambridge International (CIE)":[1200,1800],"Pearson Edexcel":[1200,1800],"OxfordAQA":[1200,1800],"International Baccalaureate (IB)":[1500,2200],"IGCSE":[1200,1800],"GCSE":[1200,1800],"AS & A Level":[1500,2200],"Primary / Lower Secondary":[800,1200],
      "IELTS Academic":[1500,2200],"IELTS General Training":[1500,2200],"PTE Academic":[1500,2200],"PTE Core":[1500,2200],"TOEFL iBT":[1500,2200],"Cambridge English":[1200,1800],"Duolingo English Test":[1500,2200],"OET":[1800,2500],
      "SAT":[1800,2500],"ACT":[1800,2500],"GRE General":[2000,3000],"GMAT":[2000,3000],
      "International Olympiads":[1500,2200],"Kangaroo Competitions":[1200,1800],"Spelling & Word Competitions":[1000,1500],"Debate & Public Speaking":[1200,1800],"Quiz & Knowledge Competitions":[1000,1500],"Quran & Islamic Studies":[800,1200]
    };
    const languages = ["English – Beginner","English – Intermediate","English – Advanced","Spoken English","Conversational English","Business English","English Grammar & Writing","French","German","Spanish","Arabic","Chinese (Mandarin)","Urdu for Foreigners"];
    if (!languages.some(name => [...course.options].some(option => option.value === name))) {
      const group = document.createElement("optgroup"); group.label = "Language Courses";
      languages.forEach(name => { const option = document.createElement("option"); option.value = name; option.textContent = name; group.appendChild(option); });
      course.insertBefore(group, course.firstChild);
    }
    const usesMinuteValues = duration.options[0]?.value === "25" && duration.options[1]?.value === "50";
    const syncRates = () => {
      const rates = ratesByCourse[course.value] || [1000,1500];
      const minutes = duration.selectedOptions[0]?.dataset.minutes || (duration.selectedIndex === 0 ? "25" : "50");
      duration.options[0].dataset.minutes = "25"; duration.options[1].dataset.minutes = "50";
      if (usesMinuteValues) {
        duration.options[0].value = "25"; duration.options[0].textContent = "25 minutes — PKR " + rates[0].toLocaleString("en-PK") + " per session";
        duration.options[1].value = "50"; duration.options[1].textContent = "50 minutes — PKR " + rates[1].toLocaleString("en-PK") + " per session";
      } else {
        duration.options[0].value = String(rates[0]); duration.options[0].textContent = "25 minutes — PKR " + rates[0].toLocaleString("en-PK") + " per session";
        duration.options[1].value = String(rates[1]); duration.options[1].textContent = "50 minutes — PKR " + rates[1].toLocaleString("en-PK") + " per session";
      }
      duration.selectedIndex = minutes === "25" ? 0 : 1;
      if (typeof window.updateLesson === "function") window.updateLesson();
    };
    duration.options[0].dataset.minutes = "25"; duration.options[1].dataset.minutes = "50";
    duration.addEventListener("change", () => { duration.selectedOptions[0].dataset.minutes = duration.selectedIndex === 0 ? "25" : "50"; });
    course.addEventListener("change", syncRates);
    syncRates();
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", enhance);
  else enhance();
  const addFeeNav = () => {
    document.querySelectorAll(".desktop-nav,.mobile-nav").forEach(nav => {
      if (nav.querySelector("[data-fee-link]")) return;
      const link = document.createElement("a");
      link.href = "/pricing.html"; link.dataset.feeLink = "1"; link.textContent = "Courses & Fees";
      const book = nav.querySelector(".book-button"); nav.insertBefore(link, book || null);
    });
  };
  addFeeNav();
  new MutationObserver(addFeeNav).observe(document.body, {childList:true,subtree:true});

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const target = typeof input === "string" ? input : (input && input.url) || "";
    if (target.includes("/api/safepay/create-checkout") && init && typeof init.body === "string") {
      try {
        const payload = JSON.parse(init.body);
        if (payload.kind === "lesson") {
          payload.guardian = document.getElementById("guardian")?.value?.trim() || "";
          payload.notes = document.getElementById("notes")?.value?.trim() || "";
          const selectedCourse = document.getElementById("course")?.value || payload.course;
          const rateMap = {
            "Academic Tutoring":[1000,1500],"English Development":[1000,1500],"Study Skills":[1000,1500],"Specialist Learning Support":[1500,2000],
            "MBA Support":[1800,2500],"BBA Support":[1200,1800],"B.Ed Support":[1500,2000],"M.Ed Support":[1800,2500],
            "English – Beginner":[800,1400],"English – Intermediate":[1000,1500],"English – Advanced":[1200,1800],"Spoken English":[1000,1500],"Conversational English":[1000,1500],"Business English":[1200,1800],"English Grammar & Writing":[1000,1500],"French":[1200,1800],"German":[1200,1800],"Spanish":[1200,1800],"Arabic":[1000,1500],"Chinese (Mandarin)":[1500,2200],"Urdu for Foreigners":[1000,1500],
            "Cambridge International (CIE)":[1200,1800],"Pearson Edexcel":[1200,1800],"OxfordAQA":[1200,1800],"International Baccalaureate (IB)":[1500,2200],"IGCSE":[1200,1800],"GCSE":[1200,1800],"AS & A Level":[1500,2200],"Primary / Lower Secondary":[800,1200],
            "IELTS Academic":[1500,2200],"IELTS General Training":[1500,2200],"PTE Academic":[1500,2200],"PTE Core":[1500,2200],"TOEFL iBT":[1500,2200],"Cambridge English":[1200,1800],"Duolingo English Test":[1500,2200],"OET":[1800,2500],
            "SAT":[1800,2500],"ACT":[1800,2500],"GRE General":[2000,3000],"GMAT":[2000,3000],
            "International Olympiads":[1500,2200],"Kangaroo Competitions":[1200,1800],"Spelling & Word Competitions":[1000,1500],"Debate & Public Speaking":[1200,1800],"Quiz & Knowledge Competitions":[1000,1500],"Quran & Islamic Studies":[800,1200]
          };
          const rates = rateMap[selectedCourse] || [1000,1500];
          if (![25,50].includes(Number(payload.duration))) payload.duration = Number(payload.duration) === rates[0] ? 25 : 50;
          payload.course = selectedCourse;
        } else if (payload.kind === "resource") {
          payload.notes = document.getElementById("resourceNotes")?.value?.trim() || "";
        }
        init = { ...init, body: JSON.stringify(payload) };
      } catch (_) {}
    }
    return originalFetch(input, init);
  };
})();
</script>`;
      return new HTMLRewriter()
        .on("body", { element(element) { element.append(checkoutEnhancement, { html: true }); } })
        .transform(assetResponse);
    }

    if (url.pathname === "/order/complete") {
      return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment status | Learning Hub</title><style>body{font:16px Arial;background:#f7f1e7;color:#211b12;display:grid;place-items:center;min-height:100vh;margin:0}.card{background:#fffdfa;border:1px solid #e4d2ae;border-radius:18px;padding:32px;max-width:520px;margin:20px;text-align:center}h1{font:700 28px Georgia;color:#8b6726}p{line-height:1.6}</style><main class="card"><h1>Checking your payment</h1><p id="message">Please wait while we verify your Safepay payment securely.</p><p><a href="/billing.html">Return to Learning Hub</a></p></main><script>const tracker=new URLSearchParams(location.search).get("tracker");const msg=document.getElementById("message");if(!tracker){msg.textContent="Your return was received, but no payment reference was provided. Please contact Learning Hub support."; }else{fetch("/api/safepay/status?tracker="+encodeURIComponent(tracker)).then(r=>r.json()).then(d=>{msg.textContent=d.paid?"Payment completed successfully. Thank you for choosing Learning Hub.":"Payment status: "+(d.state||"Pending")+". If you completed payment, please allow time for confirmation or contact support.";}).catch(()=>msg.textContent="We could not verify the payment just now. Please contact Learning Hub support before retrying.");}</script></html>`, { headers: { "Content-Type": "text/html; charset=UTF-8", "Cache-Control": "no-store" } });
    }
    if (url.pathname === "/order/cancel") {
      return Response.redirect("https://learninghubtutoring.com/billing.html?payment=cancelled", 302);
    }

    // Add the fee schedule to shared site navigation without editing unrelated page assets.
    const assetResponse = await env.ASSETS.fetch(request);
    const contentType = assetResponse.headers.get("content-type") || "";
    if (request.method === "GET" && contentType.includes("text/html")) {
      const navEnhancement = '<script>(()=>{const add=()=>{document.querySelectorAll(".desktop-nav,.mobile-nav").forEach(nav=>{if(nav.querySelector("[data-fee-link]"))return;const a=document.createElement("a");a.href="/pricing.html";a.dataset.feeLink="1";a.textContent="Courses & Fees";const book=nav.querySelector(".book-button");nav.insertBefore(a,book||null);});};add();new MutationObserver(add).observe(document.body,{childList:true,subtree:true});})();<\/script>';
      return new HTMLRewriter().on("body", { element(element) { element.append(navEnhancement, { html: true }); } }).transform(assetResponse);
    }
    return assetResponse;
  }
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=UTF-8", "Cache-Control": "no-store" } });
}

async function supabaseRequest(env, path, options = {}) {
  const base = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !key) throw new Error("Supabase service credentials are not configured.");
  return fetch(base + path, {
    ...options,
    headers: {
      "apikey": key,
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}

async function createGuestCheckoutProfile(env, customerEmail, fullName) {
  // Create an internal, non-login guest identity through a restricted
  // service-role RPC. The customer's actual email is never used as an account.
  const createResponse = await supabaseRequest(env, "/rest/v1/rpc/create_guest_checkout_identity", {
    method: "POST",
    body: JSON.stringify({
      p_customer_email: customerEmail,
      p_full_name: fullName
    })
  });
  const created = await createResponse.json();
  const userId = String(created?.user_id || "");
  if (!createResponse.ok || !userId) {
    console.error("Learning Hub guest checkout identity RPC failed", createResponse.status, JSON.stringify(created).slice(0, 500));
    throw new Error("Could not prepare the guest order record. Please try again or contact support.");
  }
  const profileResponse = await supabaseRequest(
    env,
    "/rest/v1/profiles?id=eq." + encodeURIComponent(userId) + "&select=id,role,is_active"
  );
  const profiles = await profileResponse.json();
  if (!profileResponse.ok || !Array.isArray(profiles) || profiles.length !== 1 ||
      profiles[0].role !== "student" || profiles[0].is_active !== true) {
    console.error("Learning Hub guest checkout profile verification failed", profileResponse.status, JSON.stringify(profiles).slice(0, 500));
    throw new Error("Could not prepare the guest order record. Please contact support.");
  }
  return userId;
}

async function createCheckoutRecords(env, input) {
  const response = await supabaseRequest(env, "/rest/v1/rpc/create_safepay_checkout_records", {
    method: "POST",
    body: JSON.stringify({
      p_student_id: input.studentId,
      p_order_id: input.orderId,
      p_amount: input.amount,
      p_description: input.description,
      p_order_type: input.orderType,
      p_inquiry: input.inquiry,
      p_student_remark: input.studentRemark
    })
  });
  const result = await response.json();
  if (!response.ok || !result?.payment_id || !result?.invoice_id || !result?.service_order_id) {
    console.error("Learning Hub checkout record creation failed", response.status);
    throw new Error("Learning Hub could not save the order records. Please contact support before retrying.");
  }
  return result;
}

async function saveSafepayTracker(env, paymentId, tracker) {
  const response = await supabaseRequest(
    env,
    "/rest/v1/payments?id=eq." + encodeURIComponent(paymentId),
    {
      method: "PATCH",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify({ provider_reference: tracker })
    }
  );
  if (!response.ok) throw new Error("Learning Hub could not link the Safepay reference to the payment.");
}

async function verifySafepayPaid(env, tracker, safepay) {
  const secret = safepay.secret;
  if (!secret) return false;
  const response = await fetch(
    safepay.apiBase + "/reporter/api/v1/payments/" + encodeURIComponent(tracker),
    { headers: { "X-SFPY-MERCHANT-SECRET": secret } }
  );
  if (!response.ok) return false;
  const data = await response.json();
  return data?.data?.tracker?.state === "TRACKER_ENDED";
}

async function updatePaymentRecords(env, tracker, nextStatus) {
  const lookup = await supabaseRequest(
    env,
    "/rest/v1/payments?provider_reference=eq." + encodeURIComponent(tracker) + "&select=id,status"
  );
  const payments = await lookup.json();
  if (!lookup.ok || !Array.isArray(payments) || payments.length === 0) return false;
  const payment = payments[0];
  if (payment.status === "refunded" && nextStatus !== "refunded") return true;
  if (nextStatus === "failed" && (payment.status === "paid" || payment.status === "refunded")) return true;

  // Retry-safe: repair linked invoice/order state even when the payment row
  // was already updated by an earlier webhook attempt.
  if (payment.status !== nextStatus) {
    const patch = { status: nextStatus, updated_at: new Date().toISOString() };
    if (nextStatus === "paid") patch.paid_at = new Date().toISOString();
    const paymentUpdate = await supabaseRequest(
      env,
      "/rest/v1/payments?id=eq." + encodeURIComponent(payment.id),
      { method: "PATCH", headers: { "Prefer": "return=minimal" }, body: JSON.stringify(patch) }
    );
    if (!paymentUpdate.ok) throw new Error("Could not update the Learning Hub payment record.");
  }

  if (nextStatus === "paid") {
    const [invoiceUpdate, orderUpdate] = await Promise.all([
      supabaseRequest(env, "/rest/v1/invoices?payment_id=eq." + encodeURIComponent(payment.id), {
        method: "PATCH", headers: { "Prefer": "return=minimal" },
        body: JSON.stringify({ status: "paid" })
      }),
      supabaseRequest(env, "/rest/v1/service_orders?payment_id=eq." + encodeURIComponent(payment.id), {
        method: "PATCH", headers: { "Prefer": "return=minimal" },
        body: JSON.stringify({ status: "paid" })
      })
    ]);
    if (!invoiceUpdate.ok || !orderUpdate.ok) {
      throw new Error("Could not update the Learning Hub invoice and service order.");
    }
  } else if (nextStatus === "refunded") {
    const [invoiceUpdate, orderUpdate] = await Promise.all([
      supabaseRequest(env, "/rest/v1/invoices?payment_id=eq." + encodeURIComponent(payment.id), {
        method: "PATCH", headers: { "Prefer": "return=minimal" }, body: JSON.stringify({ status: "refunded" })
      }),
      supabaseRequest(env, "/rest/v1/service_orders?payment_id=eq." + encodeURIComponent(payment.id), {
        method: "PATCH", headers: { "Prefer": "return=minimal" },
        body: JSON.stringify({ status: "cancelled", admin_note: "Safepay payment refunded." })
      })
    ]);
    if (!invoiceUpdate.ok || !orderUpdate.ok) throw new Error("Could not update the refunded order records.");
  } else if (nextStatus === "failed") {
    const orderUpdate = await supabaseRequest(
      env,
      "/rest/v1/service_orders?payment_id=eq." + encodeURIComponent(payment.id),
      { method: "PATCH", headers: { "Prefer": "return=minimal" },
        body: JSON.stringify({ admin_note: "Safepay reported a failed payment. Customer may retry checkout." }) }
    );
    if (!orderUpdate.ok) throw new Error("Could not update the failed order note.");
  }
  return true;
}
