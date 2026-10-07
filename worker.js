export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/rapidpay/health") return json({ok:true,service:"Learning Hub Rapid Gateway",environment:"TEST"});
    if (url.pathname === "/api/rapidpay/create-checkout" && request.method === "POST") {
      try {
        const body=await request.json(); const email=String(body.email||body.customerEmail||"").trim(); const mobile=String(body.mobile||body.customerMobile||"").trim(); const amount=Number(body.amount);
        if(!email||!mobile||!Number.isFinite(amount)||amount<=0)return json({error:"Please provide a valid email, mobile number and amount."},400);
        const clientId=env.RAPID_TEST_CLIENT_ID,clientSecret=env.RAPID_TEST_CLIENT_SECRET;if(!clientId||!clientSecret)return json({error:"Rapid Gateway credentials are not configured in Cloudflare."},500);
        const tokenResponse=await fetch("https://secure.rapid-gateway.com/oauth2/token",{method:"POST",headers:{Authorization:`Basic ${btoa(`${clientId}:${clientSecret}`)}`,"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=client_credentials"});
        const tokenText=await tokenResponse.text();if(!tokenResponse.ok)return json({error:"Rapid Gateway authentication failed.",details:tokenText.substring(0,1000)},502);
        let tokenData;try{tokenData=JSON.parse(tokenText)}catch{return json({error:"Rapid Gateway returned an invalid token response.",details:tokenText.substring(0,1000)},502)}
        const accessToken=tokenData.access_token||tokenData.accessToken||tokenData.token;if(!accessToken)return json({error:"Rapid Gateway did not return an access token."},502);
        const basketId="LH-"+Date.now()+"-"+crypto.randomUUID().replace(/-/g,"").substring(0,8),siteUrl="https://learninghubtutoring.com";const form=new URLSearchParams();
        form.set("MERCHANT_ID","1684");form.set("TXNAMT",amount.toFixed(2));form.set("BASKET_ID",basketId);form.set("CUSTOMER_MOBILE_NO",mobile);form.set("CUSTOMER_EMAIL_ADDRESS",email);form.set("SUCCESS_URL",`${siteUrl}/?payment=success`);form.set("FAILURE_URL",`${siteUrl}/?payment=failed`);form.set("MERCHANT_NAME","Learning Hub");form.set("TXNDESC","Learning Hub Test Payment");form.set("CURRENCY_CODE","PKR");
        const checkoutResponse=await fetch("https://secure.rapid-gateway.com/rapid/process-transaction",{method:"POST",redirect:"manual",headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/x-www-form-urlencoded"},body:form.toString()});
        const location=checkoutResponse.headers.get("Location");if(location)return json({success:true,checkoutUrl:location,basketId,amount,currency:"PKR"});
        const checkoutText=await checkoutResponse.text();let checkoutData=null;if(checkoutText.trim()){try{checkoutData=JSON.parse(checkoutText)}catch{}}
        if(checkoutData){const checkoutUrl=checkoutData.checkoutUrl||checkoutData.checkout_url||checkoutData.redirectUrl||checkoutData.redirect_url||checkoutData.paymentUrl||checkoutData.payment_url||checkoutData.url||checkoutData.redirect;if(checkoutUrl)return json({success:true,checkoutUrl,basketId,amount,currency:"PKR"})}
        const plainUrl=checkoutText.trim().match(/https?:\/\/[^\s"'<>]+/i);if(plainUrl)return json({success:true,checkoutUrl:plainUrl[0],basketId,amount,currency:"PKR"});
        return json({error:"Rapid Gateway did not return a checkout URL.",httpStatus:checkoutResponse.status,response:checkoutText.substring(0,2000),basketId},502);
      }catch(error){return json({error:"Server error while creating checkout.",details:String(error?.message||error)},500)}
    }

    // Serve static assets directly. Cloudflare Static Assets already handles
    // extensionless HTML paths such as /about -> /about.html. Rewriting those
    // paths here caused a canonical redirect loop between /about and /about.html.
    return env.ASSETS.fetch(request);
  }
};
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=UTF-8","Cache-Control":"no-store"}})}