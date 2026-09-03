MY LISAA WEBSITE — START HERE
============================

I rebuilt the store from zero.

FILES FOR GITHUB PAGES
----------------------
Upload these items to your GitHub repository root:

index.html
style.css
script.js
assets/   (upload the folder and product image)

DO NOT upload your EasyPost secret key to GitHub.

BEFORE THE WEBSITE IS FINISHED
------------------------------
Open script.js and edit the section called:
EDIT YOUR STORE INFORMATION HERE

1) productPrice
   Change null to your real USD price, for example:
   productPrice: 79.00,

2) whatsappNumber
   Add it if you use WhatsApp.

3) shippingApiUrl
   After you create your Cloudflare Worker, paste its workers.dev URL here.

4) Replace assets/product-temp.png with your official high-resolution product photo.
   Keep the same filename OR change productImage inside script.js.

CLOUDFLARE SHIPPING SETUP
-------------------------
1. Create a Cloudflare Worker.
2. Copy everything from worker/worker.js into the Worker editor.
3. In worker.js, replace the shipping origin with your exact address in Türkiye.
4. Enter the REAL packed measurements for one package:
   - weight in ounces
   - length in inches
   - width in inches
   - height in inches
5. Cloudflare Worker > Settings > Variables and Secrets > Add > Secret
6. Name: EASYPOST_API_KEY
7. Value: your EasyPost API key
8. Deploy.
9. Copy the Worker URL.
10. Paste it into shippingApiUrl in your GitHub script.js.
11. Commit the change and wait for GitHub Pages to update.

IMPORTANT
---------
The temporary image is cropped from the screenshot you provided and is low resolution. Replace it before publishing professionally.

The shipping calculator cannot return accurate rates until your real Türkiye origin address and packed product measurements are entered.

The site does not make guaranteed weight-loss or disease-treatment claims.
