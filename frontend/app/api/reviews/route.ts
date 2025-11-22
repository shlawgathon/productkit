import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";
import { Buffer } from "buffer";

// Mock data fallback for when Shopify is not available
const MOCK_REVIEWS = [
    {
        id: "gid://shopify/Metaobject/1",
        rating: 5,
        title: "Absolutely love it!",
        body: "The minimalist design fits perfectly in my living room. The leather quality is top-notch.",
        author: "Sarah J.",
        date: "2023-10-25T14:30:00Z",
        verified: true
    },
    {
        id: "gid://shopify/Metaobject/2",
        rating: 4,
        title: "Great chair, but pricey",
        body: "Comfortable and looks great. Took a bit longer to arrive than expected.",
        author: "Michael B.",
        date: "2023-10-28T09:15:00Z",
        verified: true
    },
    {
        id: "gid://shopify/Metaobject/3",
        rating: 5,
        title: "Worth every penny",
        body: "I was hesitant at first, but the build quality is incredible. Highly recommend.",
        author: "Emily R.",
        date: "2023-11-02T18:45:00Z",
        verified: false
    }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: "productId missing" }, { status: 400 });
  }

  // 1. Fetch reviews from Shopify metafields (SPR app)
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  let reviews: any[] = [];

  if (shopDomain && accessToken) {
    const metafieldUrl = `https://${shopDomain}/admin/api/2024-04/products/${productId}/metafields.json?namespace=spr&key=reviews`;

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
      // Fall back to mock data
      console.log("Using mock reviews as fallback");
      reviews = MOCK_REVIEWS;
    }
  } else {
    console.warn("Shopify credentials missing, using mock data");
    reviews = MOCK_REVIEWS;
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
export async function POST(request: Request) {
  // Expect multipart/form-data with fields: productId, pdf (File), optional imageUrl
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const formData = await request.formData();
  const productId = formData.get("productId") as string | null;
  const pdfFile = formData.get("pdf") as File | null;
  const imageUrl = (formData.get("imageUrl") as string) || null;

  if (!productId) {
    return NextResponse.json({ error: "productId missing" }, { status: 400 });
  }
  if (!pdfFile) {
    return NextResponse.json({ error: "PDF file missing" }, { status: 400 });
  }

  // Fetch product info (title, description) from Shopify
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  if (!shopDomain || !accessToken) {
    console.warn("Shopify credentials missing");
    return NextResponse.json({ error: "Shopify credentials not configured" }, { status: 500 });
  }

  let productInfo: any = {};
  try {
    const prodResp = await fetch(`https://${shopDomain}/admin/api/2024-04/products/${productId}.json`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    });
    if (!prodResp.ok) throw new Error(`Shopify product fetch error ${prodResp.status}`);
    const data = await prodResp.json();
    productInfo = data.product || {};
  } catch (e) {
    console.error("Failed to fetch product info:", e);
  }

  // Convert PDF to base64
  const pdfArrayBuffer = await pdfFile.arrayBuffer();
  const pdfBase64 = Buffer.from(pdfArrayBuffer).toString("base64");

  // Build prompt for NanoBanana Pro
  const prompt = `Analyze the following product and its brochure. Provide a concise marketing summary and visual suggestions.\n\nProduct Title: ${productInfo.title || ""}\nDescription: ${productInfo.body_html || ""}\nImage URL: ${imageUrl || "(none)"}\n\nPDF (base64): ${pdfBase64}`;

  // Call Fal NanoBanana Pro model
  let nanoResult: any = null;
  if (process.env.FAL_KEY) {
    try {
      const result = await fal.subscribe("fal-ai/nanobanana-pro", {
        input: {
          prompt,
          image_url: imageUrl,
          pdf_base64: pdfBase64,
        },
        logs: true,
        onQueueUpdate: update => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map(l => l.message).forEach(console.log);
          }
        },
      });
      nanoResult = result?.data?.output || null;
    } catch (error) {
      console.error("Fal.ai NanoBanana Pro error:", error);
    }
  } else {
    console.warn("FAL_KEY not set – skipping NanoBanana Pro call.");
  }

  return NextResponse.json({
    productId,
    productInfo,
    nanoBananaProResult: nanoResult,
  });
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
