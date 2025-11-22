import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: "productId missing" }, { status: 400 });
  }

  // 1. Fetch reviews from Shopify metafields (SPR app)
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!shopDomain || !accessToken) {
    console.warn("Shopify credentials missing");
    return NextResponse.json({ error: "Shopify credentials not configured" }, { status: 500 });
  }

  const metafieldUrl = `https://${shopDomain}/admin/api/2024-04/products/${productId}/metafields.json?namespace=spr&key=reviews`;

  let reviews: any[] = [];

  try {
    const resp = await fetch(metafieldUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    });

    if (!resp.ok) {
      throw new Error(`Shopify API error ${resp.status}`);
    }

    const { metafields } = await resp.json();
    const metafieldValue = metafields?.[0]?.value ?? "";
    reviews = extractReviewsFromMetafield(metafieldValue);
  } catch (e) {
    console.error("Failed to fetch Shopify reviews:", e);
    // Continue with empty reviews; AI analysis will fallback.
  }

  // 2. Prepare text for AI analysis
  const reviewsText = reviews
    .map(
      (r) => `Rating: ${r.rating}/5\nTitle: ${r.title}\nReview: ${r.body}`
    )
    .join("\n\n");

  // 3. Call Fal.ai LLM
  let aiAnalysis: any = null;
  if (process.env.FAL_KEY) {
    try {
      const result = await fal.subscribe("fal-ai/llama-3-70b-instruct", {
        input: {
          prompt: `You are an expert product analyst. Analyze the following customer reviews for a product.\n\nReviews:\n${reviewsText}\n\nProvide a JSON object with the following fields:\n- summary: a concise 1‑2 sentence sentiment summary\n- keywords: an array of 3‑5 short key themes\n- improvement: a sentence describing a key area for improvement, if any.\nReturn ONLY the JSON object, no extra text.`,
          max_tokens: 512,
          temperature: 0.1,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      let jsonString = result?.data?.output || "{}";
      jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();
      aiAnalysis = JSON.parse(jsonString);
    } catch (error) {
      console.error("Fal.ai API error:", error);
    }
  }

  // Fallback analysis if AI not available
  if (!aiAnalysis) {
    aiAnalysis = {
      summary: "Customers generally appreciate the design and quality (AI analysis disabled).",
      keywords: ["Design", "Quality", "Mock Data"],
      improvement: "Add Fal.ai API key to enable real insights.",
    };
  }

  return NextResponse.json({ reviews, analytics: aiAnalysis });
}

// Helper to extract reviews JSON from metafield HTML.
function extractReviewsFromMetafield(html: string): any[] {
  try {
    const match = html.match(/\[\{[\s\S]*?\}\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (e) {
    console.error("Failed to parse reviews from metafield:", e);
  }
  return [];
}
