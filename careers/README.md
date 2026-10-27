# Learning Hub Careers

Separate recruitment microsite for Learning Hub Global Educational Services (SMC-Private) Limited.

## Deploy as a separate Cloudflare Worker

1. In Cloudflare, open **Workers & Pages** and choose **Create**.
2. Choose **Connect to Git** and select this repository.
3. Select branch **careers-site**.
4. Set the project/Worker name to **learning-hub-careers**.
5. Set the root directory to **careers**.
6. Use the checked-in `wrangler.jsonc` configuration. If Cloudflare asks for a build command, leave it empty; this is a static HTML site.
7. Deploy the new Worker, then add the custom domain `careers.learninghubtutoring.com` under the new Worker’s **Settings → Domains & Routes**.

Do not change the existing `learning-hub` Worker or its root-directory settings. This careers site is contained in this folder and branch so the main website files are not modified.
