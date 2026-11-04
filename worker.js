export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/rapidpay/health") return json({ok:true,service:"Learning Hub Rapid Gateway",environment:"TEST"});
    if (url.pathname === "/api/rapidpay/create-checkout" && request.method === "POST") {
      try {
        const body = await request.json();
        const email = String(body.email || "").trim();
        const mobile = String(body.mobile || "").trim();
        const customerName = String(body.name || "").trim();
        const kind = String(body.kind || "lesson");
        if (!customerName || customerName.length > 120 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254 || !/^[+0-9()\\s-]{7,24}$/.test(mobile)) {
          return json({error:"Please provide a valid customer name, email address and mobile number."},400);
        }

        let amount = 0;
        let description = "";
        if (kind === "lesson") {
          const duration = Number(body.duration);
          const plan = String(body.plan || "");
          const count = Number(body.lessonCount);
          const course = String(body.course || "").trim();
          if (!course || course.length > 180 || ![1000,1500].includes(duration) || !["demo","daily","twice","weekly","monthly"].includes(plan) || !Number.isInteger(count) || count < 1 || count > 31) {
            return json({error:"The selected lesson or programme details are invalid."},400);
          }
          if (plan === "demo") {
            if (count !== 1) return json({error:"Demo bookings must contain one session."},400);
            amount = 550;
          } else {
            if (plan === "monthly" && ![16,20,25].includes(count)) return json({error:"Please choose a valid monthly lesson package."},400);
            amount = count * duration;
            if (plan === "monthly") amount = Math.round(amount * 0.9 * 100) / 100;
          }
          description = `Learning Hub - ${course} - ${plan} - ${count} lesson(s)`;
        } else if (kind === "resource") {
          const resourceType = String(body.resourceType || "");
          const fixedPrices = {"250":250,"500":500,"1000":1000,"2000":2000,"3500":3500};
          if (!Object.prototype.hasOwnProperty.call(fixedPrices, resourceType)) {
            return json({error:"This resource requires a confirmed fixed price before online payment."},400);
          }
          amount = fixedPrices[resourceType];
          const label = String(body.resourceLabel || "Digital resource").replace(/[<>]/g,"").slice(0,100);
          description = `Learning Hub - ${label}`;
        } else {
          return json({error:"Unsupported checkout type."},400);
        }

        const clientId = env.RAPID_TEST_CLIENT_ID, clientSecret = env.RAPID_TEST_CLIENT_SECRET;
        if (!clientId || !clientSecret) return json({error:"Rapid Gateway TEST credentials are not configured in Cloudflare."},500);
        const tokenResponse = await fetch("https://secure.rapid-gateway.com/oauth2/token", {
          method:"POST",
          headers:{Authorization:`Basic ${btoa(`${clientId}:${clientSecret}`)}`,"Content-Type":"application/x-www-form-urlencoded"},
          body:"grant_type=client_credentials"
        });
        const tokenText = await tokenResponse.text();
        if (!tokenResponse.ok) return json({error:"Rapid Gateway authentication failed.",details:tokenText.substring(0,1000)},502);
        let tokenData;
        try { tokenData = JSON.parse(tokenText); } catch { return json({error:"Rapid Gateway returned an invalid token response."},502); }
        const accessToken = tokenData.access_token || tokenData.accessToken || tokenData.token;
        if (!accessToken) return json({error:"Rapid Gateway did not return an access token."},502);

        const basketId = "LH-" + Date.now() + "-" + crypto.randomUUID().replace(/-/g,"").substring(0,8);
        const siteUrl = "https://learninghubtutoring.com";
        const form = new URLSearchParams();
        form.set("MERCHANT_ID","1684");
        form.set("TXNAMT",amount.toFixed(2));
        form.set("BASKET_ID",basketId);
        form.set("CUSTOMER_MOBILE_NO",mobile);
        form.set("CUSTOMER_EMAIL_ADDRESS",email);
        form.set("SUCCESS_URL",`${siteUrl}/?payment=pending&order=${encodeURIComponent(basketId)}`);
        form.set("FAILURE_URL",`${siteUrl}/?payment=failed&order=${encodeURIComponent(basketId)}`);
        form.set("MERCHANT_NAME","Learning Hub");
        form.set("TXNDESC",description.slice(0,200));
        form.set("CURRENCY_CODE","PKR");
        const checkoutResponse = await fetch("https://secure.rapid-gateway.com/rapid/process-transaction", {
          method:"POST", redirect:"manual",
          headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/x-www-form-urlencoded"},
          body:form.toString()
        });
        const location = checkoutResponse.headers.get("Location");
        if (location) return json({success:true,checkoutUrl:location,basketId,amount,currency:"PKR",status:"pending"});
        const checkoutText = await checkoutResponse.text();
        let checkoutData = null;
        if (checkoutText.trim()) { try { checkoutData = JSON.parse(checkoutText); } catch {} }
        if (checkoutData) {
          const checkoutUrl = checkoutData.checkoutUrl || checkoutData.checkout_url || checkoutData.redirectUrl || checkoutData.redirect_url || checkoutData.paymentUrl || checkoutData.payment_url || checkoutData.url || checkoutData.redirect;
          if (checkoutUrl) return json({success:true,checkoutUrl,basketId,amount,currency:"PKR",status:"pending"});
        }
        const plainUrl = checkoutText.trim().match(/https?:\\/\\/[^\\s"'<>]+/i);
        if (plainUrl) return json({success:true,checkoutUrl:plainUrl[0],basketId,amount,currency:"PKR",status:"pending"});
        return json({error:"Rapid Gateway did not return a checkout URL.",httpStatus:checkoutResponse.status,response:checkoutText.substring(0,1500),basketId},502);
      } catch (error) {
        return json({error:"Server error while creating checkout.",details:String(error?.message || error)},500);
      }
    }

    // Serve static assets directly. Cloudflare Static Assets already handles
    // extensionless HTML paths such as /about -> /about.html. Rewriting those
    // paths here caused a canonical redirect loop between /about and /about.html.
    return env.ASSETS.fetch(request);
  }
};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store"}})}