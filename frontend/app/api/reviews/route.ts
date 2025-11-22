import { NextResponse } from 'next/server';
import { fal } from "@fal-ai/client";

// Mock data representing reviews fetched from Shopify (e.g., via SPR metafields)
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

  // 1. Fetch reviews (Mocking the Shopify SPR Metafield fetch here)
  // In a real scenario: GET /admin/products/<PRODUCT_ID>/metafields.json?namespace=spr&key=reviews
  const reviews = MOCK_REVIEWS;

  // 2. Prepare data for AI Analysis
  const reviewsText = reviews.map(r => `Rating: ${r.rating}/5\nTitle: ${r.title}\nReview: ${r.body}`).join("\n\n");

  let aiAnalysis = null;

  // 3. Call Fal.ai for LLM Analysis
  // Ensure you have FAL_KEY in your .env file
  if (process.env.FAL_KEY) {
    try {
      const result = await fal.subscribe("fal-ai/llama-3-70b-instruct", {
        input: {
          prompt: `You are an expert product analyst. Analyze the following customer reviews for a product.
                    
                    Reviews:
                    ${reviewsText}
                    
                    Provide a JSON object with the following fields:
                    - summary: A concise summary of the general sentiment (1-2 sentences).
                    - keywords: An array of 3-5 short key themes or keywords (strings).
                    - improvement: A sentence describing a key area for improvement, if any.
                    
                    Return ONLY the JSON object, no other text.`,
          max_tokens: 512,
          temperature: 0.1
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      // Parse the JSON result from the LLM
      // The model might return the JSON string directly or wrapped in markdown code blocks
      let jsonString = result.data.output || "{}"; // Adjust based on actual model output structure
      // Clean up potential markdown formatting
      jsonString = jsonString.replace(/```json/g, "").replace(/```/g, "").trim();

      try {
        aiAnalysis = JSON.parse(jsonString);
      } catch (e) {
        console.error("Failed to parse AI response:", e);
        // Fallback if parsing fails
        aiAnalysis = {
          summary: "Analysis available but format was invalid.",
          keywords: ["Error"],
          improvement: "Could not parse AI response."
        };
      }

    } catch (error) {
      console.error("Fal.ai API error:", error);
      // Fallback on error
    }
  } else {
    console.warn("FAL_KEY not found. Skipping AI analysis.");
  }

  // Fallback mock analysis if AI failed or key missing
  if (!aiAnalysis) {
    aiAnalysis = {
      summary: "Customers generally appreciate the design and quality (AI analysis disabled - missing API key).",
      keywords: ["Design", "Quality", "Mock Data"],
      improvement: "Enable Fal.ai API key to see real insights."
    };
  }

  return NextResponse.json({
    reviews: reviews,
    analytics: aiAnalysis
  });
}
