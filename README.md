# ProductKit

![ProductKit Logo](Product-Kit_Logo.jpg)

An agentic platform to automatically generate product listings for user-facing pages, Shopify integrations, and FAQ/documentation.

## Description

ProductKit is an intuitive, all-in-one toolkit for product designers, small businesses, and others to easily set up and maintain their storefront.

The configuration of a typical storefront (Shopify, in this case) could take up to multiple weeks. We automate the following:

- Product documentation generation
- Product image showcase in multiple scenes, with a consistent background and 4K quality
- Product video showcase
- Product interactive 3D model showcase
- Auto sync/propagation to your Shopify storefront

We do this with the following pipeline:

**PDF Manual Parsing:** NVIDIA Nemotron NIM parses uploaded PDF manuals to extract technical specifications and product details, enriching the AI-generated marketing copy with accurate information from documentation.

**Image Gen:** Image name, description, and content are fed into Anthropic's Claude Sonnet 4.5 to get a textual representation of the image and generate N number of dynamically generated prompts for the new showcase images. Showcase images are sent (prompt + img) to FLUX.2.

**Video:** Veo2 on fal.ai is used to generate a showcase video based on the original images submitted along with the product.

**3D Model:** omnipart on fal.ai is used to stitch together and generate a 3D model (.glb) and visualize it on the website using ThreeJS.

**Storage & Deployment:** MongoDB is used as the backing store, DigitalOcean is used for deployment and blob storage, Vercel's NextJS is used for the frontend, and Kotlin is used for the backend.

## Tech Stack

BFL (FLUX.2), fal.ai (media model APIs), Anthropic (Claude Sonnet 4.5 via API for text generation), NVIDIA (codegen and documentation via NIM), Vercel (Next.js frontend), DigitalOcean (deployment & S3/Spaces object storage)

## Getting Started

### Public Instance

Visit our public instance: [ProductKit](https://productkit.liftgate.io)

### Local Development

1. Install dependencies in `frontend`:

```bash
   bun install
```

2. Configure your frontend API server with a `.env` file in the `frontend` directory:

```properties
   NEXT_PUBLIC_API_URL=https://prod-api-pkit.liftgate.io
   NEXT_PUBLIC_WS_URL=wss://prod-api-pkit.liftgate.io
```

3. Ensure you have a MongoDB instance running locally (if running fully local)

4. Start the Ktor backend in `backend` with a `.env` file:

```properties
   # fal.ai
   FAL_KEY=my:key
   # DigitalOcean Spaces
   DO_SPACES_KEY=MYKEY
   DO_SPACES_SECRET=my/secret
   DO_SPACES_BUCKET=productkit
   DO_SPACES_ENDPOINT=https://sfo3.digitaloceanspaces.com
   # Anthropic API
   ANTHROPIC_API_KEY=sk-ant-api03-my-key
```
