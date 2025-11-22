import { NextResponse } from 'next/server';

// Mock data for demonstration purposes since we don't have a live Shopify store with this data
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

    // In a real implementation, we would use the Shopify Admin API to fetch metaobjects
    // filtered by the product ID.

    /*
    const query = `
      query {
        metaobjects(type: "product_review", first: 50) {
          edges {
            node {
              id
              rating: field(key: "rating") { value }
              title: field(key: "title") { value }
              body: field(key: "body") { value }
              product: field(key: "product") { value }
              authorDisplayName: field(key: "author_display_name") { value }
              submittedAt: field(key: "submitted_at") { value }
              appVerificationStatus: field(key: "app_verification_status") { value }
            }
          }
        }
      }
    `;
    
    const response = await fetch(`https://${process.env.SHOPIFY_SHOP_DOMAIN}/admin/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN!,
      },
      body: JSON.stringify({ query }),
    });
    
    const data = await response.json();
    // Filter and map data here...
    */

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({ reviews: MOCK_REVIEWS });
}
