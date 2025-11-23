import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";

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

  // 1. Fetch reviews from Shopify using GraphQL metaobjects API
  // Required scope: read_metaobjects
  const shopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  let reviews: any[] = [];

  if (shopDomain && accessToken) {
    // Use GraphQL to fetch product review metaobjects
    const graphqlUrl = `https://${shopDomain}/admin/api/2024-04/graphql.json`;

    const query = `
      query {
        metaobjects(type: "product_review", first: 50) {
          edges {
            node {
              id
              handle
              fields {
                key
                value
              }
            }
          }
        }
      }
    `;

    try {
      const resp = await fetch(graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
        },
        body: JSON.stringify({ query }),
      });

      if (!resp.ok) {
        throw new Error(`Shopify GraphQL API error ${resp.status}`);
      }

      const result = await resp.json();

      if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        throw new Error("GraphQL query failed");
      }

      // Parse metaobjects into review format
      const metaobjects = result.data?.metaobjects?.edges || [];
      reviews = metaobjects
        .map((edge: any) => parseReviewFromMetaobject(edge.node, productId))
        .filter((review: any) => review !== null); // Filter reviews for this product

      console.log(`Fetched ${reviews.length} reviews for product ${productId}`);
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

// Helper to parse a review metaobject into a structured review object
function parseReviewFromMetaobject(node: any, targetProductId: string): any | null {
  const fields: Record<string, string> = {};

  // Convert fields array to key-value object
  node.fields.forEach((field: any) => {
    fields[field.key] = field.value;
  });

  // Check if this review is for the target product
  // The product field typically contains a product GID like "gid://shopify/Product/123"
  const reviewProductId = fields.product?.split('/').pop();

  // If productId filtering is needed and doesn't match, return null
  if (reviewProductId && reviewProductId !== targetProductId) {
    return null;
  }

  // Parse the review fields into a standardized format
  return {
    id: node.id,
    rating: parseInt(fields.rating || '0', 10),
    title: fields.title || '',
    body: fields.body || fields.content || '',
    author: fields.author || fields.author_name || 'Anonymous',
    date: fields.created_at || fields.date || new Date().toISOString(),
    verified: fields.verified === 'true' || fields.verified_buyer === 'true',
  };
}
