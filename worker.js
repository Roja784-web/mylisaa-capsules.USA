/**
 * MY LISAA - Cloudflare Worker for EasyPost live shipping rates
 *
 * REQUIRED CLOUDFLARE SECRET:
 * EASYPOST_API_KEY
 *
 * IMPORTANT UNITS FOR EASYPOST PARCELS:
 * weight = ounces (oz)
 * length/width/height = inches
 */

// ============================================================
// EDIT YOUR REAL SHIPPING ORIGIN + PACKAGE DATA HERE
// ============================================================
const SHIPPING_ORIGIN = {
  street1: "REPLACE_WITH_REAL_STREET_ADDRESS",
  city: "REPLACE_WITH_REAL_CITY",
  state: "REPLACE_WITH_REAL_PROVINCE",
  zip: "REPLACE_WITH_REAL_POSTAL_CODE",
  country: "TR"
};

const ONE_PACKAGE = {
  weightOz: 0,   // REPLACE: total packed weight in OUNCES
  lengthIn: 0,   // REPLACE: package length in INCHES
  widthIn: 0,    // REPLACE: package width in INCHES
  heightIn: 0    // REPLACE: package height in INCHES
};

// During setup you can leave "*". For production, replace with your exact website origin,
// for example: "https://roja784-web.github.io"
const ALLOWED_ORIGIN = "*";
// ============================================================

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json"
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);
    if (!env.EASYPOST_API_KEY) return json({ error: "EasyPost API key is missing from Cloudflare secrets." }, 500, cors);

    if (!originConfigured() || !parcelConfigured()) {
      return json({ error: "Store shipping origin or package measurements are not configured yet." }, 500, cors);
    }

    try {
      const body = await request.json();
      const to = body?.to_address || {};
      const quantity = clampInteger(body?.quantity, 1, 20);

      if (!to.country || !to.zip || !to.city) {
        return json({ error: "Country, city, and postal/ZIP code are required." }, 400, cors);
      }

      // Simple quantity model: weight scales with quantity; box dimensions stay the same.
      // For larger orders, replace this with your actual carton logic.
      const parcel = {
        weight: ONE_PACKAGE.weightOz * quantity,
        length: ONE_PACKAGE.lengthIn,
        width: ONE_PACKAGE.widthIn,
        height: ONE_PACKAGE.heightIn
      };

      const payload = {
        shipment: {
          to_address: {
            street1: safe(to.street1, 120) || undefined,
            city: safe(to.city, 80),
            state: safe(to.state, 80) || undefined,
            zip: safe(to.zip, 24),
            country: safe(to.country, 2).toUpperCase()
          },
          from_address: SHIPPING_ORIGIN,
          parcel
        }
      };

      const auth = "Basic " + btoa(env.EASYPOST_API_KEY + ":");
      const response = await fetch("https://api.easypost.com/v2/shipments", {
        method: "POST",
        headers: { Authorization: auth, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        const message = data?.error?.message || data?.error?.errors?.[0]?.message || "EasyPost could not calculate shipping.";
        return json({ error: message }, response.status, cors);
      }

      const rates = (data.rates || [])
        .map(r => ({
          carrier: r.carrier,
          service: r.service,
          rate: Number(r.rate),
          currency: r.currency,
          delivery_days: r.delivery_days ?? r.est_delivery_days ?? null
        }))
        .filter(r => Number.isFinite(r.rate))
        .sort((a,b) => a.rate - b.rate);

      return json({ rates }, 200, cors);
    } catch (err) {
      return json({ error: "Server error calculating shipping." }, 500, cors);
    }
  }
};

function json(data, status, headers) { return new Response(JSON.stringify(data), { status, headers }); }
function safe(v, max) { return String(v ?? "").trim().slice(0, max); }
function clampInteger(v, min, max) { const n = Math.floor(Number(v)); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min; }
function originConfigured() { return !Object.values(SHIPPING_ORIGIN).some(v => String(v).includes("REPLACE_WITH")); }
function parcelConfigured() { return ONE_PACKAGE.weightOz > 0 && ONE_PACKAGE.lengthIn > 0 && ONE_PACKAGE.widthIn > 0 && ONE_PACKAGE.heightIn > 0; }
