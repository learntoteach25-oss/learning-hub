export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/rapidpay/health") {
      return json({ ok: true, service: "Learning Hub Rapid Gateway", environment: "TEST" });
    }

    if (url.pathname === "/api/rapidpay/create-checkout" && request.method === "POST") {
      try {
        const body = await request.json();
        const email = String(body.email || body.customerEmail || "").trim();
        const mobile = String(body.mobile || body.customerMobile || "").trim();
        const amount = Number(body.amount);
        if (!email || !mobile || !Number.isFinite(amount) || amount <= 0) return json({ error: "Please provide a valid email, mobile number and amount." }, 400);
        const clientId = env.RAPID_TEST_CLIENT_ID;
        const clientSecret = env.RAPID_TEST_CLIENT_SECRET;
        if (!clientId || !clientSecret) return json({ error: "Rapid Gateway credentials are not configured in Cloudflare." }, 500);
        const basicAuth = btoa(`${clientId}:${clientSecret}`);
        const tokenResponse = await fetch("https://secure.rapid-gateway.com/oauth2/token", { method: "POST", headers: { Authorization: `Basic ${basicAuth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
        const tokenText = await tokenResponse.text();
        if (!tokenResponse.ok) return json({ error: "Rapid Gateway authentication failed.", details: tokenText.substring(0,1000) }, 502);
        let tokenData;
        try { tokenData = JSON.parse(tokenText); } catch { return json({ error: "Rapid Gateway returned an invalid token response.", details: tokenText.substring(0,1000) }, 502); }
        const accessToken = tokenData.access_token || tokenData.accessToken || tokenData.token;
        if (!accessToken) return json({ error: "Rapid Gateway did not return an access token.", details: JSON.stringify(tokenData).substring(0,1000) }, 502);
        const basketId = "LH-" + Date.now() + "-" + crypto.randomUUID().replace(/-/g, "").substring(0,8);
        const siteUrl = "https://learninghubtutoring.com";
        const form = new URLSearchParams();
        form.set("MERCHANT_ID","1684"); form.set("TXNAMT",amount.toFixed(2)); form.set("BASKET_ID",basketId); form.set("CUSTOMER_MOBILE_NO",mobile); form.set("CUSTOMER_EMAIL_ADDRESS",email); form.set("SUCCESS_URL",`${siteUrl}/?payment=success`); form.set("FAILURE_URL",`${siteUrl}/?payment=failed`); form.set("MERCHANT_NAME","Learning Hub"); form.set("TXNDESC","Learning Hub Test Payment"); form.set("CURRENCY_CODE","PKR");
        const checkoutResponse = await fetch("https://secure.rapid-gateway.com/rapid/process-transaction", { method:"POST", redirect:"manual", headers:{ Authorization:`Bearer ${accessToken}`, "Content-Type":"application/x-www-form-urlencoded" }, body:form.toString() });
        const location = checkoutResponse.headers.get("Location");
        if (location) return json({ success:true, checkoutUrl:location, basketId, amount, currency:"PKR" });
        const checkoutText = await checkoutResponse.text();
        let checkoutData=null; if(checkoutText.trim()){try{checkoutData=JSON.parse(checkoutText)}catch{checkoutData=null}}
        if(checkoutData){const checkoutUrl=checkoutData.checkoutUrl||checkoutData.checkout_url||checkoutData.redirectUrl||checkoutData.redirect_url||checkoutData.paymentUrl||checkoutData.payment_url||checkoutData.url||checkoutData.redirect;if(checkoutUrl)return json({success:true,checkoutUrl,basketId,amount,currency:"PKR"});}
        const plainUrl=checkoutText.trim().match(/https?:\/\/[^\s"'<>]+/i); if(plainUrl)return json({success:true,checkoutUrl:plainUrl[0],basketId,amount,currency:"PKR"});
        return json({error:"Rapid Gateway did not return a checkout URL.",httpStatus:checkoutResponse.status,response:checkoutText.substring(0,2000),basketId},502);
      } catch(error) { return json({error:"Server error while creating checkout.",details:String(error?.message||error)},500); }
    }

    const assetResponse = await env.ASSETS.fetch(request);
    const contentType = assetResponse.headers.get("Content-Type") || "";
    if (contentType.includes("text/html")) {
      let html = await assetResponse.text();
      const oldFooter = '<div class="copyright">© 2026 Learning Hub. All rights reserved.</div>';
      const newFooter = '<div class="copyright"><div style="color:#ddd;font-weight:600">Learning Hub – Global Education Platform</div><div style="margin-top:4px;color:#aaa;font-size:13px">Operated by Learning Hub Global Educational Services (SMC-Private) Limited</div><div style="margin-top:4px;color:#888;font-size:12px">© 2026. All rights reserved.</div></div>';

      if (url.pathname === "/" || url.pathname === "/index.html") {
        const aboutSection = `<section id="company-story" style="padding:58px 0;background:linear-gradient(180deg,#fbf8f1,#f4eee2);border-top:1px solid rgba(201,164,92,.28)"><div class="shell"><div style="max-width:900px;margin:0 auto 28px;text-align:center"><div class="eyebrow" style="color:#9a6a18">About Us</div><h2 style="font:700 clamp(30px,3vw,44px)/1.08 Georgia,serif;color:#102944;margin:8px 0 10px">Empowering Learners Across the World</h2><p style="font-size:18px;font-weight:700;color:#9a6416;margin:0 0 14px">Over a Decade of Experience. Now Online for a Greater Impact.</p><p style="color:#4f4a43;margin:0 auto;max-width:820px">For more than 15 years, we have supported learners through academic facilitation, learning support and education services across schools, homes and learning environments. Building on this experience, Learning Hub is now fully online—bringing personalised academic support, international curriculum guidance, exam preparation and carefully developed learning resources to learners worldwide at accessible rates.</p></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin:26px 0"><div style="background:#fff;border:1px solid #e2d4ba;border-radius:16px;padding:18px"><strong>Global Learner Community</strong><div style="color:#6f685e;font-size:14px;margin-top:5px">Supporting learners of different ages and backgrounds worldwide.</div></div><div style="background:#fff;border:1px solid #e2d4ba;border-radius:16px;padding:18px"><strong>International Curriculum Support</strong><div style="color:#6f685e;font-size:14px;margin-top:5px">Guidance across international programmes, examinations and academic pathways.</div></div><div style="background:#fff;border:1px solid #e2d4ba;border-radius:16px;padding:18px"><strong>Premium Learning Resources</strong><div style="color:#6f685e;font-size:14px;margin-top:5px">High-quality, curated resources designed to remain accessible and practical.</div></div><div style="background:#fff;border:1px solid #e2d4ba;border-radius:16px;padding:18px"><strong>Broader Opportunities</strong><div style="color:#6f685e;font-size:14px;margin-top:5px">Academic sourcing, guidance and education opportunities beyond individual lessons.</div></div></div><div style="display:grid;grid-template-columns:1.15fr .85fr;gap:20px;align-items:stretch"><div style="background:#fff;border:1px solid #e2d4ba;border-radius:18px;padding:24px"><h3 style="font:700 28px Georgia,serif;color:#102944;margin:0 0 14px">Our Journey</h3><p><strong style="color:#9a6416">2008–2016 · On-Site Education Services</strong><br><span style="color:#6f685e">Academic facilitation, learning support and education services across schools, homes and learning environments.</span></p><p><strong style="color:#9a6416">2016–2019 · Transition & Growth</strong><br><span style="color:#6f685e">Expanded education support, developed learning resources and strengthened our service model.</span></p><p style="margin-bottom:0"><strong style="color:#9a6416">2019–Present · Online Global Platform</strong><br><span style="color:#6f685e">Expanded online to support learners worldwide through personalised academic support, curriculum guidance, exam preparation and learning resources.</span></p></div><div style="background:#fff;border:1px solid #e2d4ba;border-radius:18px;padding:24px"><h3 style="font:700 28px Georgia,serif;color:#102944;margin:0 0 12px">Company Information</h3><p style="color:#4f4a43">Learning Hub – Global Education Platform is operated by <strong>Learning Hub Global Educational Services (SMC-Private) Limited</strong>, a company incorporated in Pakistan.</p><div style="background:#fbf6ec;border-radius:12px;padding:14px;margin-top:16px"><strong>Company Unique Identification Number (CUIN)</strong><br>0358546<br><br><strong>Registered Office</strong><br>Sindh, Pakistan</div></div></div><div style="margin-top:20px;background:#102944;color:#fff;border-radius:18px;padding:22px 26px"><strong style="font:700 24px Georgia,serif;color:#f0d58e">Our Purpose</strong><div style="margin-top:5px">To make quality education, meaningful learning opportunities and essential resources more accessible to learners everywhere.</div></div></div></section>`;
        if (!html.includes('id="company-story"')) {
          const footerMatch = html.match(/<footer\b[^>]*class=["'][^"']*footer[^"']*["'][^>]*>/i) || html.match(/<footer\b[^>]*>/i);
          if (footerMatch) html = html.replace(footerMatch[0], aboutSection + footerMatch[0]);
        }
      }

      if (html.includes(oldFooter)) html = html.replace(oldFooter,newFooter);
      const headers = new Headers(assetResponse.headers); headers.delete("content-length");
      return new Response(html,{status:assetResponse.status,statusText:assetResponse.statusText,headers});
    }
    return assetResponse;
  }
};

function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store"}})}
