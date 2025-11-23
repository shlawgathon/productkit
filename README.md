# ProductKit

> **Transform product images into complete e-commerce experiences with AI-powered asset generation**

ProductKit is an intelligent platform that automatically generates professional product assets, marketing content, and interactive 3D models from a single image. Built for modern e-commerce teams who need to scale their product catalog without scaling their design team.

---

## What ProductKit Does

### Automated Asset Generation

Upload a product image and ProductKit generates:

- **Professional Photography**: AI-enhanced hero images, lifestyle shots, and detail views
- **3D/AR Models**: Interactive GLB models for web and mobile AR experiences
- **Marketing Content**: Headlines, descriptions, features, benefits, and usage instructions via Claude AI
- **Product Videos**: Cinematic showcase videos powered by generative AI
- **Infographics**: Technical specification sheets and product manuals
- **Shopify Integration**: Direct sync to your storefront with automated media uploads

### Smart Asset Management

- Real-time generation progress tracking
- Multi-format downloads (PNG, GLB, PDF, MP4)
- Batch operations on product catalogs
- Version control for generated assets

### Enhanced Shopping Experience

- WebGL-optimized 3D product viewers
- Lazy-loaded high-performance rendering
- Responsive design for mobile and desktop
- Dark mode support throughout

---

## Architecture

```
productkit/
├── frontend/          Next.js 15 + React 19 + TypeScript
│   ├── app/          App router with nested layouts
│   ├── components/   Reusable UI components (shadcn/ui)
│   └── lib/          API client, utilities, and configs
│
└── backend/          Kotlin + Ktor REST API
    ├── models/       Data models and schemas
    ├── services/     AI integrations (Anthropic, FAL.ai)
    ├── jobs/         Async asset generation pipeline
    └── repositories/ MongoDB data access layer
```

### Technology Stack

**Frontend**

- Next.js 15 (App Router)
- React 19 with Server Components
- TypeScript for type safety
- Tailwind CSS for styling
- shadcn/ui component library
- React Three Fiber for 3D rendering
- Zustand for state management

**Backend**

- Kotlin + Ktor framework
- MongoDB for data persistence
- Anthropic Claude for AI content generation
- FAL.ai for image/video/3D generation
- AWS S3 / DigitalOcean Spaces for asset storage
- Shopify Admin API integration

**AI & Generation**

- Claude Sonnet 4.5 for marketing copy
- FAL.ai Flux models for image generation
- CSM 3D reconstruction for AR models
- Luma Dream Machine for product videos

---

## Quick Start

### Prerequisites

**Frontend:**

- [Bun](https://bun.sh/) (latest version)

**Backend:**

- JDK 17 or higher
- Gradle 8.x
- MongoDB 6.0+

### Environment Setup

Create `.env.local` files in both frontend and backend:

**Frontend** (`frontend/.env.local`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Backend** (`backend/.env`):

```bash
MONGODB_URI=mongodb://localhost:27017/productkit
ANTHROPIC_API_KEY=your_anthropic_key
FAL_API_KEY=your_fal_key
AWS_ACCESS_KEY=your_aws_key
AWS_SECRET_KEY=your_aws_secret
SHOPIFY_API_KEY=your_shopify_key
```

### Running the Application

**Terminal 1 - Backend:**

```bash
cd backend
./gradlew run
```

**Terminal 2 - Frontend:**

```bash
cd frontend
bun install
bun run dev
```

**Access the application:**  
Navigate to [http://localhost:3000](http://localhost:3000)

---

## Features in Detail

### AI-Powered Content Generation

**Marketing Copy via Claude AI**

- Context-aware headlines and product descriptions
- Feature/benefit extraction from images and PDFs
- Product-specific usage and maintenance instructions
- SEO-optimized content structure

**Visual Asset Pipeline**

- Hero images with professional lighting and composition
- Lifestyle photography in contextual settings
- Detail shots highlighting key features
- 360° product views for interactive experiences

**3D Model Generation**

- Single-image to GLB conversion
- Optimized for web and mobile AR
- Interactive viewer with zoom and rotation
- Proper material and lighting estimation

### Shopify Integration

Seamless sync with your Shopify store:

- Automatic product creation from generated assets
- Media upload and variant management
- Metafield support for extended attributes
- Real-time sync status tracking

### Performance Optimizations

**Lazy Loading Architecture**

- 3D models load on-demand to prevent WebGL context exhaustion
- Progressive image loading with blur-up placeholders
- Chunked asset uploads for large files
- Efficient caching strategies

**Responsive Design**

- Mobile-first component architecture
- Adaptive 3D rendering quality based on device
- Touch-optimized controls for mobile
- Breakpoint-aware layouts

---

## Development

### Project Structure

**Frontend Routing**

```
app/
├── (auth)/
│   ├── login/           Authentication pages
│   └── register/
├── dashboard/
│   ├── page.tsx         Product grid view
│   └── onboarding/      Product creation flow
├── products/[id]/       Product detail pages
└── settings/            User preferences
```

**Component Organization**

```
components/
├── ui/                  Base UI primitives (shadcn)
├── dashboard/           Dashboard-specific components
├── onboarding/          Product creation flow
└── layout/              Header, sidebar, footer
```

### API Endpoints

**Products**

```
GET    /products              List all products
POST   /products              Create new product
GET    /products/:id          Get product details
PUT    /products/:id          Update product
DELETE /products/:id          Delete product
```

**Asset Generation**

```
POST   /generate              Trigger asset generation
GET    /generate/status/:id   Check generation progress
```

**File Management**

```
POST   /upload                Upload product images/PDFs
GET    /download/:assetId     Download generated asset
```

---

## Self-Deployment

### Frontend (Vercel)

```bash
vercel --prod
```

### Backend (Docker)

```bash
docker build -t productkit-backend .
docker run -p 8080:8080 productkit-backend
```

### Environment Variables

Ensure all API keys and secrets are configured in your deployment platform.

```
NEXT_PUBLIC_API_URL=http://localhost:8080
ANTHROPIC_API_KEY=your_anthropic_key
FAL_API_KEY=your_fal_key
SHOPIFY_API_KEY=your_shopify_key
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Frontend: Prettier + ESLint
- Backend: ktlint for Kotlin formatting
- Commit messages: Conventional Commits format

---

## License

This project is proprietary software. All rights reserved.

---

## Support

For questions, issues, or feature requests:

- Open an issue on GitHub
- Contact the development team
- Check the documentation wiki

---

**Built with modern technologies for modern e-commerce**
