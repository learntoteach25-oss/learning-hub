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
    if (url.pathname === "/pricing.html" || url.pathname === "/courses-and-fees.html") {
      return Response.redirect("https://learninghubtutoring.com/billing.html#lessonMode", 302);
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
            "English Language":[1000,1500],"IB Psychology":[1500,2200],"English Language":[1000,1500],"IB Psychology":[1500,2200],"English – Beginner":[800,1400],"English – Intermediate":[1000,1500],"English – Advanced":[1200,1800],"Spoken English":[1000,1500],"Conversational English":[1000,1500],"Business English":[1200,1800],"English Grammar & Writing":[1000,1500],"French":[1200,1800],"German":[1200,1800],"Spanish":[1200,1800],"Arabic":[1000,1500],"Chinese (Mandarin)":[1500,2200],"Urdu for Foreigners":[1000,1500],
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
      const assetResponse = new Response("<!doctype html>\n<html lang=\"en\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Booking & Billing | Learning Hub</title><link rel=\"icon\" href=\"assets/learning-hub-logo.png?v=approved-20260923\"><link rel=\"stylesheet\" href=\"assets/site.css?v=20261009-chat-fix-v23\"><style>\n:root{--gold:#d5aa4d;--cream:#f7f1e7;--paper:#fffdfa;--ink:#1d1710;--muted:#6a6052;--line:#e4d2ae}.billing-page{background:var(--cream)}.wrap{width:min(1080px,calc(100% - 36px));margin:auto}.mode-tabs{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:16px!important;padding:26px 0 2px!important;align-items:stretch!important}.mode-btn{width:100%!important;height:94px!important;box-sizing:border-box!important;border:1px solid var(--gold)!important;border-radius:16px!important;padding:18px 22px!important;background:#fffaf0!important;color:#111!important;text-align:left!important;cursor:pointer;display:flex!important;flex-direction:column!important;justify-content:center!important;box-shadow:0 8px 20px rgba(49,35,13,.06)!important}.mode-btn strong{display:block!important;font:700 20px/1.15 Georgia,serif!important;color:#111!important}.mode-btn span{display:block!important;margin-top:7px!important;color:#665b4d!important;font:11px/1.45 Arial!important}.mode-btn.active{background:#050505!important;border-color:var(--gold)!important;box-shadow:0 10px 24px rgba(0,0,0,.14)!important}.mode-btn.active strong{color:#edc35b!important}.mode-btn.active span{color:#fff4d8!important}.layout{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;padding:18px 0 44px;align-items:start}.layout>section,.layout>aside,.layout>aside>.panel{min-width:0;width:100%;box-sizing:border-box}.panel{background:var(--paper);border:1px solid var(--line);border-radius:18px;padding:22px;box-shadow:0 10px 28px rgba(49,35,13,.06);box-sizing:border-box}.panel h2{font:700 23px Georgia,serif;margin:0 0 5px;color:var(--ink)}.sub{font-size:12px;color:var(--muted);margin:0 0 17px}.field{margin:0 0 13px;min-width:0}.field label{display:block;font-size:11px;font-weight:800;margin:0 0 6px}.field input,.field select,.field textarea{width:100%;box-sizing:border-box;border:1px solid #dac8a5;background:#fff;border-radius:10px;padding:11px 12px;font:13px Arial;color:#241c12}.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.demo-note,.resource-note{background:#fff4d9;border:1px solid #e0bd70;border-radius:11px;padding:11px 12px;font-size:12px;margin:0 0 14px}.summary{background:#0b0a09;color:#fff;border:1px solid #2c2518;border-radius:16px;padding:18px;margin-bottom:16px}.sumrow{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:8px 0;border-bottom:1px solid #302a21;font-size:12px}.sumrow span{color:#d8d0c5}.sumrow b{text-align:right;max-width:64%;line-height:1.35}.sumrow.total{margin-top:3px;padding-top:12px;border:0;font-size:17px}.sumrow.total span,.sumrow.total b{color:#f1cf74}.paybtn{width:100%;border:0;border-radius:11px;background:linear-gradient(135deg,#f0ce72,#c9973c);padding:13px;font-weight:900;cursor:pointer;color:#171108}.status{font-size:11px;margin:10px 0 0;min-height:16px}.converter{margin-top:18px;padding:18px;border:1px solid #dec58f;border-radius:15px;background:#fffaf1}.converter-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}.converter h3{margin:0;color:#1d1710;font:700 19px Georgia,serif}.converter-badge{padding:5px 8px;border-radius:999px;background:#f4e4bd;color:#76510c;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.conversion-base{display:flex;justify-content:space-between;gap:12px;padding:11px 0;margin-bottom:12px;border-top:1px solid #eadcc0;border-bottom:1px solid #eadcc0;color:#625744;font-size:11px}.conversion-base strong{color:#1d1710}.convert-result{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 14px;border:1px solid #ead7ad;border-radius:11px;background:#fff}.convert-result span{color:#6a6052;font-size:11px}.convert-result strong{color:#1d1710;font:700 20px Georgia,serif;white-space:nowrap}.convert-note{display:block;color:#746956;font-size:9px;line-height:1.45;margin-top:9px}.hidden{display:none!important}.resource-heading{display:flex;align-items:center;gap:10px}.resource-heading:before{content:'✦';display:grid;place-items:center;width:35px;height:35px;border-radius:10px;background:#050505;color:#efc35a;font-size:17px}@media(max-width:780px){.layout,.two,.mode-tabs{grid-template-columns:1fr!important}.mode-btn{height:auto!important;min-height:84px!important}.sumrow b{max-width:58%}}\n</style></head><body class=\"billing-page\"><header></header><div class=\"wrap mode-tabs\"><button id=\"lessonTab\" class=\"mode-btn active\" type=\"button\"><strong>Lessons &amp; Programmes</strong><span>Live tutoring, curriculum support and lesson bookings.</span></button><button id=\"resourceTab\" class=\"mode-btn\" type=\"button\"><strong>Premium Digital Resources</strong><span>Stories, worksheets, study resources, exam packs and customised learning materials.</span></button></div><main class=\"wrap\">\n<div id=\"lessonMode\" class=\"layout\"><section class=\"panel\"><h2>1. Choose your learning plan</h2><p class=\"sub\">Choose your course once. The correct session fee updates automatically when you select a course and lesson duration. Your booking and payment summary stay linked to this selection.</p><div class=\"field\"><label for=\"course\">COURSE / CURRICULUM / SERVICE</label><select id=\"course\">\n<optgroup label=\"Academic Learning\"><option>Academic Tutoring</option><option>English Development</option><option>Study Skills</option><option>Specialist Learning Support</option><option>MBA Support</option><option>BBA Support</option><option>B.Ed Support</option><option>M.Ed Support</option></optgroup>\n<optgroup label=\"Language Courses\"><option>English Language</option><option>English – Beginner</option><option>English – Intermediate</option><option>English – Advanced</option><option>Spoken English</option><option>Conversational English</option><option>Business English</option><option>English Grammar &amp; Writing</option><option>French</option><option>German</option><option>Spanish</option><option>Arabic</option><option>Chinese (Mandarin)</option><option>Urdu for Foreigners</option></optgroup>\n<optgroup label=\"International Curricula & Boards\"><option>Cambridge International (CIE)</option><option>Pearson Edexcel</option><option>OxfordAQA</option><option>International Baccalaureate (IB)</option><option>IB Psychology</option><option>IGCSE</option><option>GCSE</option><option>AS &amp; A Level</option><option>Primary / Lower Secondary</option></optgroup>\n<optgroup label=\"Language Proficiency Tests\"><option>IELTS Academic</option><option>IELTS General Training</option><option>PTE Academic</option><option>PTE Core</option><option>TOEFL iBT</option><option>Cambridge English</option><option>Duolingo English Test</option><option>OET</option></optgroup>\n<optgroup label=\"Core Academic &amp; Admissions Tests\"><option>SAT</option><option>ACT</option><option>GRE General</option><option>GMAT</option></optgroup>\n<optgroup label=\"Academic Competitions &amp; Olympiads\"><option>International Olympiads</option><option>Kangaroo Competitions</option><option>Spelling &amp; Word Competitions</option><option>Debate &amp; Public Speaking</option><option>Quiz &amp; Knowledge Competitions</option></optgroup>\n<optgroup label=\"Other Learning\"><option>Quran &amp; Islamic Studies</option></optgroup></select></div><div id=\"competitionSubjectField\" class=\"field hidden\"><label for=\"competitionSubject\">COMPETITION SUBJECT / CATEGORY</label><select id=\"competitionSubject\"></select><small style=\"display:block;margin-top:7px;color:#6a6052\">Booking is for online competition preparation, not official competition entry.</small></div><div class=\"field\"><label for=\"duration\">LESSON DURATION</label><select id=\"duration\"><option value=\"25\">25 minutes</option><option value=\"50\" selected>50 minutes</option></select></div><div class=\"two\"><div class=\"field\"><label for=\"planSelect\">BOOKING PLAN</label><select id=\"planSelect\"><option value=\"demo\">Demo · 30 minutes</option><option value=\"daily\">Daily</option><option value=\"twice\" selected>Twice Weekly</option><option value=\"weekly\">Weekly</option><option value=\"monthly\">Monthly Package</option></select></div><div class=\"field\"><label for=\"classCount\">NUMBER OF CLASSES</label><select id=\"classCount\" aria-label=\"Number of classes\"><option value=\"1\">1 class</option><option value=\"2\" selected>2 classes</option><option value=\"3\">3 classes</option><option value=\"4\">4 classes</option><option value=\"5\">5 classes</option><option value=\"6\">6 classes</option><option value=\"7\">7 classes</option><option value=\"8\">8 classes</option><option value=\"9\">9 classes</option><option value=\"10\">10 classes</option><option value=\"11\">11 classes</option><option value=\"12\">12 classes</option><option value=\"13\">13 classes</option><option value=\"14\">14 classes</option><option value=\"15\">15 classes</option><option value=\"16\">16 classes</option><option value=\"17\">17 classes</option><option value=\"18\">18 classes</option><option value=\"19\">19 classes</option><option value=\"20\">20 classes</option><option value=\"21\">21 classes</option><option value=\"22\">22 classes</option><option value=\"23\">23 classes</option><option value=\"24\">24 classes</option><option value=\"25\">25 classes</option><option value=\"26\">26 classes</option><option value=\"27\">27 classes</option><option value=\"28\">28 classes</option><option value=\"29\">29 classes</option><option value=\"30\">30 classes</option><option value=\"31\">31 classes</option></select><select id=\"monthlyClassCount\" class=\"hidden\" aria-label=\"Monthly lessons package\"><option value=\"16\">16 lessons / month</option><option value=\"20\">20 lessons / month</option><option value=\"25\">25 lessons / month</option></select></div></div><div id=\"demoNote\" class=\"demo-note hidden\"><strong>Demo booking:</strong> 30-minute introductory session · fixed PKR 550.</div><div class=\"two\"><div class=\"field\"><label for=\"name\">STUDENT / CUSTOMER NAME</label><input id=\"name\"></div><div class=\"field\"><label for=\"email\">EMAIL ADDRESS</label><input id=\"email\" type=\"email\"></div></div><div class=\"two\"><div class=\"field\"><label for=\"guardian\">PARENT / GUARDIAN</label><input id=\"guardian\"></div><div class=\"field\"><label for=\"phone\">CONTACT NUMBER</label><input id=\"phone\" type=\"tel\"></div></div><div class=\"field\"><label for=\"notes\">LEARNING REQUIREMENTS / NOTES</label><textarea id=\"notes\" rows=\"3\" placeholder=\"Subject, level, curriculum, goals or preferred schedule\"></textarea></div><p class=\"account-note\" data-lh-account-link=\"lesson\" style=\"font-size:12px;line-height:1.5;color:#6a6052;margin:10px 0\">Your email links this booking to your Learning Hub student record. If you are new, a student profile is created for order management; you can set a password later using Forgot Password.</p><button class=\"paybtn\" id=\"sendInquiry\" type=\"button\">Proceed to Payment</button><p class=\"status\" id=\"inquiryStatus\"></p></section><aside><section class=\"panel\"><h2>2. Review your booking</h2><p class=\"sub\">A complete payment summary based on your current selection.</p><div class=\"summary\"><div class=\"sumrow\"><span>Course / programme</span><b id=\"sumCourse\"></b></div><div class=\"sumrow\"><span>Lesson duration</span><b id=\"sumDuration\"></b></div><div class=\"sumrow\"><span>Booking plan</span><b id=\"sumPlan\"></b></div><div class=\"sumrow\"><span>Number of lessons</span><b id=\"sumLessons\"></b></div><div class=\"sumrow\"><span>Rate per lesson</span><b id=\"sumRate\"></b></div><div class=\"sumrow\"><span>Subtotal</span><b id=\"sumSubtotal\"></b></div><div class=\"sumrow hidden\" id=\"discountRow\"><span>Monthly discount</span><b id=\"sumDiscount\"></b></div><div class=\"sumrow total\"><span>Total payable</span><b id=\"sumTotal\"></b></div></div><div class=\"converter\"><div class=\"converter-head\"><h3>PKR Currency Conversion</h3><span class=\"converter-badge\">Estimate</span></div><div class=\"conversion-base\"><span>Booking total in PKR</span><strong id=\"conversionPKR\">PKR 0</strong></div><div class=\"field\"><label for=\"currency\">CONVERT PKR TO</label><select id=\"currency\"><option value=\"USD\">USD — US Dollar</option><option value=\"GBP\">GBP — British Pound</option><option value=\"EUR\">EUR — Euro</option><option value=\"AED\">AED — UAE Dirham</option><option value=\"SAR\">SAR — Saudi Riyal</option><option value=\"AUD\">AUD — Australian Dollar</option><option value=\"CAD\">CAD — Canadian Dollar</option></select></div><div class=\"convert-result\"><span>Approximate equivalent</span><strong id=\"convertedTotal\">—</strong></div><small class=\"convert-note\">Conversion is shown for reference. Billing remains based on the PKR total above.</small></div></section></aside></div>\n<div id=\"resourceMode\" class=\"layout hidden\"><section class=\"panel\"><div class=\"resource-heading\"><h2>1. Build your resource order</h2></div><p class=\"sub\">Choose the resource you need. Customised materials can be designed around the learner’s pace, capacity, curriculum and academic goals.</p><div class=\"field\"><label for=\"resourceType\">RESOURCE CATEGORY</label><select id=\"resourceType\"><option value=\"250\">Premium Story — PKR 250 each</option><option value=\"500\">Mini Resource / Worksheet — PKR 500</option><option value=\"1000\">Standard Worksheet / Study Resource — PKR 1,000</option><option value=\"2000\">Revision / Exam Pack — PKR 2,000</option><option value=\"3500\">Extended Resource Pack — PKR 3,500</option><option value=\"quote\">Fully Customised Resource — Quote after requirements</option></select></div><div id=\"storyField\" class=\"field\"><label for=\"storyTitle\">STORY TITLE</label><input id=\"storyTitle\" placeholder=\"Enter the premium story title\"></div><div class=\"two\"><div class=\"field\"><label for=\"resourceSubject\">SUBJECT</label><input id=\"resourceSubject\" placeholder=\"e.g. English, Psychology, Mathematics\"></div><div class=\"field\"><label for=\"resourceBoard\">CURRICULUM / BOARD</label><input id=\"resourceBoard\" placeholder=\"e.g. IB, Cambridge, Edexcel\"></div></div><div class=\"two\"><div class=\"field\"><label for=\"resourceLevel\">GRADE / LEVEL</label><input id=\"resourceLevel\" placeholder=\"e.g. Grade 6, IGCSE, IB SL\"></div><div class=\"field\"><label for=\"resourceFormat\">RESOURCE FORMAT</label><select id=\"resourceFormat\"><option>PDF</option><option>Editable Word / DOCX</option><option>PDF + Editable Copy</option></select></div></div><div class=\"field\"><label for=\"resourceNotes\">RESOURCE REQUIREMENTS</label><textarea id=\"resourceNotes\" rows=\"4\" placeholder=\"Describe the learner’s needs, topic, learning goals, preferred style, number of pages or activities, etc.\"></textarea></div><div class=\"lesson-upload-box\"><div class=\"lesson-upload-head\"><span class=\"lesson-upload-icon\">↥</span><div><strong>Supporting Documents</strong><small>Optional · Add files that help us understand the resource requirements.</small></div></div><label class=\"lesson-upload-control\" for=\"resourceFiles\"><span>Choose documents or images</span><input id=\"resourceFiles\" type=\"file\" multiple accept=\".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp\"><b>Browse</b></label><div class=\"lesson-upload-meta\"><span>PDF, Word, JPG, PNG or WEBP</span><span>Reference material only</span></div><div id=\"resourceFileList\" class=\"lesson-file-list\" aria-live=\"polite\"></div></div><div class=\"two\"><div class=\"field\"><label for=\"resourceName\">CUSTOMER / STUDENT NAME</label><input id=\"resourceName\"></div><div class=\"field\"><label for=\"resourceEmail\">EMAIL ADDRESS</label><input id=\"resourceEmail\" type=\"email\"></div></div><div class=\"two\"><div class=\"field\"><label for=\"resourcePhone\">CONTACT NUMBER</label><input id=\"resourcePhone\" type=\"tel\"></div><div class=\"field\"><label for=\"resourceDeadline\">DEADLINE (OPTIONAL)</label><input id=\"resourceDeadline\" type=\"date\"></div></div><p class=\"account-note\" data-lh-account-link=\"resource\" style=\"font-size:12px;line-height:1.5;color:#6a6052;margin:10px 0\">Your email links this order to your Learning Hub student record. If you are new, a student profile is created for order management; you can set a password later using Forgot Password.</p><button class=\"paybtn\" id=\"sendResource\" type=\"button\">Proceed to Payment</button><p class=\"status\" id=\"resourceStatus\"></p></section><aside><section class=\"panel\"><h2>2. Review your resource order</h2><p class=\"sub\">Review your selected premium resource before sending the request.</p><div class=\"summary\"><div class=\"sumrow\"><span>Resource</span><b id=\"rSumType\"></b></div><div class=\"sumrow\"><span>Format</span><b id=\"rSumFormat\"></b></div><div class=\"sumrow\"><span>Subject / story</span><b id=\"rSumSubject\">—</b></div><div class=\"sumrow\"><span>Curriculum / level</span><b id=\"rSumLevel\">—</b></div><div class=\"sumrow total\"><span id=\"rTotalLabel\">Starting price</span><b id=\"rSumTotal\"></b></div></div><div class=\"resource-note\"><strong>Personalised by design.</strong><br>Custom resources are created around the learner’s individual pace, learning capacity, academic needs and goals.</div></section></aside></div>\n</main><footer></footer><script>\nconst $=id=>document.getElementById(id),params=new URLSearchParams(location.search),RECEIVER='https://script.google.com/macros/s/AKfycbzZL4U3VtVgDvzKKZHjgbvttF4kUzVGahw_m6EGbJJezJFG3fp0uPBTt-wPrk3aI4rS/exec',pkrPerUnit={USD:278,GBP:373,EUR:326,AED:75.7,SAR:74.1,AUD:184,CAD:201},planData={demo:'Demo · 30 min',daily:'Daily',twice:'Twice Weekly',weekly:'Weekly',monthly:'Monthly Package'};let currentTotal=0;function money(n){return'PKR '+Math.round(n).toLocaleString()}function setMode(mode){const r=mode==='resource';$('lessonMode').classList.toggle('hidden',r);$('resourceMode').classList.toggle('hidden',!r);$('lessonTab').classList.toggle('active',!r);$('resourceTab').classList.toggle('active',r);if(r)updateResource()}$('lessonTab').onclick=()=>setMode('lesson');$('resourceTab').onclick=()=>setMode('resource');function updateConversion(){const c=$('currency').value;$('conversionPKR').textContent=money(currentTotal);$('convertedTotal').textContent=c+' '+(currentTotal/pkrPerUnit[c]).toFixed(2)}const courseRates={\n'Academic Tutoring':[1000,1500],'English Development':[1000,1500],'Study Skills':[1000,1500],'Specialist Learning Support':[1500,2000],\n'MBA Support':[1800,2500],'BBA Support':[1200,1800],'B.Ed Support':[1500,2000],'M.Ed Support':[1800,2500],\n'English Language':[1000,1500],'IB Psychology':[1500,2200],'English – Beginner':[800,1400],'English – Intermediate':[1000,1500],'English – Advanced':[1200,1800],'Spoken English':[1000,1500],'Conversational English':[1000,1500],'Business English':[1200,1800],'English Grammar & Writing':[1000,1500],'French':[1200,1800],'German':[1200,1800],'Spanish':[1200,1800],'Arabic':[1000,1500],'Chinese (Mandarin)':[1500,2200],'Urdu for Foreigners':[1000,1500],\n'Cambridge International (CIE)':[1200,1800],'Pearson Edexcel':[1200,1800],'OxfordAQA':[1200,1800],'International Baccalaureate (IB)':[1500,2200],'IGCSE':[1200,1800],'GCSE':[1200,1800],'AS & A Level':[1500,2200],'Primary / Lower Secondary':[800,1200],\n'IELTS Academic':[1500,2200],'IELTS General Training':[1500,2200],'PTE Academic':[1500,2200],'PTE Core':[1500,2200],'TOEFL iBT':[1500,2200],'Cambridge English':[1200,1800],'Duolingo English Test':[1500,2200],'OET':[1800,2500],\n'SAT':[1800,2500],'ACT':[1800,2500],'GRE General':[2000,3000],'GMAT':[2000,3000],\n'International Olympiads':[1500,2200],'Kangaroo Competitions':[1200,1800],'Spelling & Word Competitions':[1000,1500],'Debate & Public Speaking':[1200,1800],'Quiz & Knowledge Competitions':[1000,1500],'Quran & Islamic Studies':[800,1200]\n};\nfunction refreshCourseRates(){const rates=courseRates[$('course').value]||[1000,1500],duration=$('duration');duration.options[0].value='25';duration.options[0].textContent='25 minutes';duration.options[1].value='50';duration.options[1].textContent='50 minutes';if(!['25','50'].includes(duration.value))duration.value='50';}\nfunction updateLesson(){refreshCourseRates();const key=$('planSelect').value,demo=key==='demo',monthly=key==='monthly',fixed=demo,count=$('classCount'),packageSelect=$('monthlyClassCount');count.classList.toggle('hidden',monthly);packageSelect.classList.toggle('hidden',!monthly);count.disabled=fixed||monthly;packageSelect.disabled=!monthly;const lessons=fixed?1:monthly?Number(packageSelect.value):Math.min(31,Math.max(1,Math.trunc(Number(count.value)||1)));if(monthly)count.value=String(lessons);const selectedDuration=Number($('duration').value),rates=courseRates[$('course').value]||[1000,1500],rate=selectedDuration===25?rates[0]:rates[1],subtotal=demo?550:lessons*rate,discount=monthly?subtotal*.1:0;currentTotal=subtotal-discount;$('demoNote').classList.toggle('hidden',!demo);$('sumCourse').textContent=$('course').value;$('sumDuration').textContent=demo?'30-minute demo':$('duration').selectedOptions[0].textContent.split(' — ')[0];$('sumPlan').textContent=monthly?planData[key]+' · '+lessons+' lessons · 10% discount applied':planData[key];$('sumLessons').textContent=lessons+' lesson'+(lessons===1?'':'s');$('sumRate').textContent=demo?'PKR 550 fixed':money(rate);$('sumSubtotal').textContent=money(subtotal);$('discountRow').classList.toggle('hidden',!discount);$('sumDiscount').textContent=discount?'- '+money(discount):'';$('sumTotal').textContent=money(currentTotal);updateConversion()}['planSelect','classCount','monthlyClassCount','course','duration'].forEach(id=>$(id).addEventListener('change',()=>{updateLesson();updateLessonSummaryCompetition()}));$('currency').onchange=updateConversion;function updateResource(){const s=$('resourceType'),v=s.value,story=v==='250',quote=v==='quote';$('storyField').classList.toggle('hidden',!story);$('rSumType').textContent=s.selectedOptions[0].textContent.split(' — ')[0];$('rSumFormat').textContent=$('resourceFormat').value;$('rSumSubject').textContent=(story?$('storyTitle').value:$('resourceSubject').value)||'—';$('rSumLevel').textContent=[$('resourceBoard').value,$('resourceLevel').value].filter(Boolean).join(' · ')||'—';$('rTotalLabel').textContent=quote?'Pricing':'Starting price';$('rSumTotal').textContent=quote?'Quote after requirements':money(+v)}['resourceType','resourceFormat','storyTitle','resourceSubject','resourceBoard','resourceLevel'].forEach(id=>$(id).addEventListener('input',updateResource));const competitionSubjects={\n'International Olympiads':['Mathematics','Science','English','Physics','Chemistry','Biology','Computer Science / Informatics'],\n'Kangaroo Competitions':['Mathematics','English / Linguistics','Science'],\n'Spelling & Word Competitions':['Spelling Bee','Vocabulary','Word Knowledge'],\n'Debate & Public Speaking':['Debate','Public Speaking','Impromptu Speaking','Persuasive Speaking'],\n'Quiz & Knowledge Competitions':['General Knowledge','Science Quiz','Mathematics Quiz','English Quiz','History & Geography']\n};\nfunction syncCompetitionSubject(preferred=''){const category=$('course').value,subjects=competitionSubjects[category],field=$('competitionSubjectField'),select=$('competitionSubject');field.classList.toggle('hidden',!subjects);select.innerHTML=subjects?subjects.map(subject=>{const option=document.createElement('option');option.value=subject;option.textContent=subject;return option.outerHTML}).join(''):'';if(subjects&&subjects.includes(preferred))select.value=preferred;updateLessonSummaryCompetition()}\nfunction updateLessonSummaryCompetition(){const subject=$('competitionSubjectField').classList.contains('hidden')?'':$('competitionSubject').value;if(subject)$('sumCourse').textContent=$('course').value+' — '+subject}\n$('course').addEventListener('change',()=>syncCompetitionSubject());\n$('competitionSubject').addEventListener('change',updateLessonSummaryCompetition);\nasync function submitBillingInquiry(kind){const resource=kind==='resource',button=$(resource?'sendResource':'sendInquiry'),status=$(resource?'resourceStatus':'inquiryStatus'),required=resource?['resourceName','resourceEmail','resourcePhone']:['name','email','phone'];for(const id of required){const el=$(id);if(!el.value.trim()||(el.type==='email'&&!el.checkValidity())){status.textContent='Please complete the required name, valid email and contact number before submitting.';status.style.color='#a32920';el.focus();return}}if(button.disabled)return;const original=button.textContent;button.disabled=true;button.textContent='Sending enquiry…';status.style.color='#65533a';status.textContent='Sending your enquiry. No payment will be collected.';const data=new URLSearchParams();data.set('submissionType',resource?'Premium Resource Order Enquiry':'Lesson Booking Enquiry');data.set('category',resource?'Premium Resource Orders':'Student Booking Enquiries');data.set('type',resource?'resource order enquiry':'lesson booking enquiry');data.set('source','Learning Hub Booking & Billing');data.set('enquiryStatus','Pending Review');data.set('paymentStatus','Not Paid — Gateway Pending Approval');if(resource){for(const [key,id] of Object.entries({name:'resourceName',email:'resourceEmail',phone:'resourcePhone',resourceType:'resourceType',storyTitle:'storyTitle',subject:'resourceSubject',curriculum:'resourceBoard',level:'resourceLevel',format:'resourceFormat',requirements:'resourceNotes',deadline:'resourceDeadline'}))data.set(key,$(id).value);data.set('quotedPrice',$('rSumTotal').textContent);data.set('supportingFilesStatus','No attachment upload is connected to this form')}else{for(const [key,id] of Object.entries({name:'name',email:'email',phone:'phone',guardian:'guardian',course:'course',duration:'duration',bookingPlan:'planSelect',requirements:'notes'}))data.set(key,$(id).value);data.set('lessonDuration',$('sumDuration').textContent);data.set('lessonRate',$('sumRate').textContent);data.set('duration',$('sumDuration').textContent);data.set('numberOfLessons',$('sumLessons').textContent);data.set('competitionSubject',$('competitionSubjectField').classList.contains('hidden')?'':$('competitionSubject').value);data.set('subtotal',$('sumSubtotal').textContent);data.set('discount',$('sumDiscount').textContent||'PKR 0');data.set('totalPayable',$('sumTotal').textContent);data.set('supportingFilesStatus','No attachment upload is connected to this form')}try{await fetch(RECEIVER,{method:'POST',mode:'no-cors',body:data});status.style.color='#25613b';status.textContent='Enquiry request sent. Delivery confirmation and reference ID are pending verification. No payment has been taken.';button.textContent='Enquiry sent';}catch(err){status.style.color='#a32920';status.textContent='Unable to send the enquiry. Please check your connection and try again.';button.disabled=false;button.textContent=original}}\nasync function startCheckout(kind){\n const resource=kind==='resource',button=$(resource?'sendResource':'sendInquiry'),status=$(resource?'resourceStatus':'inquiryStatus');\n const required=resource?['resourceName','resourceEmail','resourcePhone']:['name','email','phone'];\n for(const id of required){const el=$(id);if(!el.value.trim()||(el.type==='email'&&!el.checkValidity())){status.textContent='Please enter your name, a valid email address and contact number.';status.style.color='#a32920';el.focus();return}}\n if(resource&&$('resourceType').value==='quote'){submitBillingInquiry('resource');return}\n if(button.disabled)return;\n const amount=resource?Number($('resourceType').value):currentTotal;\n if(!Number.isFinite(amount)||amount<=0){status.textContent='Please select a valid priced service.';status.style.color='#a32920';return}\n const original=button.textContent;button.disabled=true;button.textContent='Connecting to secure checkout…';status.style.color='#65533a';status.textContent='Creating your secure payment session. You will be charged the displayed PKR amount if payment is completed.';\n const payload=resource?{kind:'resource',name:$('resourceName').value.trim(),email:$('resourceEmail').value.trim(),mobile:$('resourcePhone').value.trim(),resourceType:$('resourceType').value,resourceLabel:$('resourceType').selectedOptions[0].textContent,storyTitle:$('storyTitle').value.trim(),subject:$('resourceSubject').value.trim(),curriculum:$('resourceBoard').value.trim(),level:$('resourceLevel').value.trim(),format:$('resourceFormat').value,notes:$('resourceNotes').value.trim(),amount}:{kind:'lesson',name:$('name').value.trim(),email:$('email').value.trim(),mobile:$('phone').value.trim(),guardian:$('guardian').value.trim(),notes:$('notes').value.trim(),course:$('sumCourse').textContent,duration:Number($('duration').value),plan:$('planSelect').value,lessonCount:['demo'].includes($('planSelect').value)?1:$('planSelect').value==='monthly'?Number($('monthlyClassCount').value):Number($('classCount').value),amount};\n try{\n  const response=await fetch('/api/safepay/create-checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});\n  let result={};try{result=await response.json()}catch{}\n  if(!response.ok||!result.checkoutUrl)throw new Error([result.error,result.details].filter(Boolean).join(' — ')||'Safepay could not create a checkout session.');\n  const checkoutUrl=new URL(result.checkoutUrl,location.origin);\n  if(checkoutUrl.protocol!=='https:')throw new Error('The gateway returned an invalid checkout address.');\n  status.textContent='Secure checkout session created. Redirecting to Safepay…';\n  location.assign(checkoutUrl.href);\n }catch(error){status.style.color='#a32920';status.textContent=(error.message||'Unable to start checkout.')+' Please try again or contact support.';button.disabled=false;button.textContent=original}\n}\n$('sendInquiry').addEventListener('click',()=>startCheckout('lesson'));\n$('sendResource').addEventListener('click',()=>startCheckout('resource'));\nconst requested=params.get('course')||params.get('programme')||'';if(params.get('type')==='resource'){setMode('resource');const map={'Revision & Exam Pack':'2000','Subject Worksheet':'500','International Curriculum Resource':'1000','English & Communication Resource':'1000','Study Guide':'1000','Extended Resource Pack':'3500','Custom Learning Resource':'quote','Premium Story':'250'};if(map[requested])$('resourceType').value=map[requested];updateResource()}else{const competitionMatch=requested.split(' — '),requestedCategory=competitionMatch[0];if(competitionSubjects[requestedCategory]){$('course').value=requestedCategory;syncCompetitionSubject(competitionMatch.slice(1).join(' — '))}else if(requested){let option=[...$('course').options].find(option=>option.value===requested);if(!option){option=document.createElement('option');option.value=requested;option.textContent=requested;$('course').add(option)}$('course').value=requested}updateLesson();updateLessonSummaryCompetition()}\n</script><script src=\"https://code.tidio.co/7aoz1jeb789oh2rtkwr2llropicgqdar.js\" async></script><script src=\"assets/site-shell.js?v=20261104-footer-fullbleed-v2\"></script></body></html>", {
        headers: { "content-type": "text/html; charset=utf-8" }
      });
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
    const intro = document.querySelector("#lessonMode .panel > .sub");
    if (intro) intro.textContent = "Choose your course and lesson duration. The correct subject fee is calculated automatically and shown only in your booking summary.";
    const ratesByCourse = {
      "Academic Tutoring":[1000,1500],"English Development":[1000,1500],"Study Skills":[1000,1500],"Specialist Learning Support":[1500,2000],
      "MBA Support":[1800,2500],"BBA Support":[1200,1800],"B.Ed Support":[1500,2000],"M.Ed Support":[1800,2500],
      "English Language":[1000,1500],"IB Psychology":[1500,2200],"English – Beginner":[800,1400],"English – Intermediate":[1000,1500],"English – Advanced":[1200,1800],"Spoken English":[1000,1500],"Conversational English":[1000,1500],"Business English":[1200,1800],"English Grammar & Writing":[1000,1500],"French":[1200,1800],"German":[1200,1800],"Spanish":[1200,1800],"Arabic":[1000,1500],"Chinese (Mandarin)":[1500,2200],"Urdu for Foreigners":[1000,1500],
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
    const usesMinuteValues = true;
    const syncRates = () => {
      const rates = ratesByCourse[course.value] || [1000,1500];
      const minutes = duration.selectedOptions[0]?.dataset.minutes || (duration.selectedIndex === 0 ? "25" : "50");
      duration.options[0].dataset.minutes = "25"; duration.options[1].dataset.minutes = "50";
      if (usesMinuteValues) {
        duration.options[0].value = "25"; duration.options[0].textContent = "25 minutes";
        duration.options[1].value = "50"; duration.options[1].textContent = "50 minutes";
      } else {
        duration.options[0].value = String(rates[0]); duration.options[0].textContent = "25 minutes";
        duration.options[1].value = String(rates[1]); duration.options[1].textContent = "50 minutes";
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
            "English Language":[1000,1500],"IB Psychology":[1500,2200],"English – Beginner":[800,1400],"English – Intermediate":[1000,1500],"English – Advanced":[1200,1800],"Spoken English":[1000,1500],"Conversational English":[1000,1500],"Business English":[1200,1800],"English Grammar & Writing":[1000,1500],"French":[1200,1800],"German":[1200,1800],"Spanish":[1200,1800],"Arabic":[1000,1500],"Chinese (Mandarin)":[1500,2200],"Urdu for Foreigners":[1000,1500],
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

    const assetResponse = await env.ASSETS.fetch(request);
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
