"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Share2, Edit, MoreHorizontal, Copy, Check, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import GlbViewer from "@/components/dashboard/GlbViewer";
import { ProductProcessingProgress } from "@/components/dashboard/ProductProcessingProgress";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await api.getProduct(id);
        setProduct(data);
        // Set active image to first generated hero image, or first original image
        const firstImage = data.generatedAssets?.heroImages?.[0] || data.originalImages?.[0];
        if (firstImage) {
          setActiveImage(firstImage);
        }
      } catch (error) {
        console.error("Failed to fetch product", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [sentimentAnalysis, setSentimentAnalysis] = useState<any>({
    summary: "No reviews available for analysis yet.",
    keywords: [],
    improvement: "N/A"
  });

  // Fetch reviews on mount
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await api.getReviews(id);
        setReviews(data.reviews || []);
        setSentimentAnalysis(data.analytics || {
          summary: "No reviews available for analysis yet.",
          keywords: [],
          improvement: "N/A"
        });
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

  // Calculate analytics
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessingComplete = () => {
    // Refresh the page to show updated product data
    window.location.reload();
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading product...</div>;
  }

  if (!product) {
    return <div className="p-8 text-center">Product not found</div>;
  }

  // Combine original and generated images for the gallery
  const allImages = [
    ...(product.generatedAssets?.heroImages || []),
    ...(product.originalImages || [])
  ];

  return (
    <div className="space-y-8 pb-20">
      {/* Processing Progress Bar */}
      <ProductProcessingProgress
        productId={id}
        currentStatus={product.status}
        onComplete={handleProcessingComplete}
      />
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <span>Products</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <Badge variant="outline" className="h-6">{product.status}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {product.shopifyStorefrontUrl && (
            <Button variant="outline" size="sm" className="gap-2 text-green-700 border-green-200 bg-green-50 hover:bg-green-100" asChild>
              <a href={product.shopifyStorefrontUrl} target="_blank" rel="noopener noreferrer">
                <ShoppingBag className="h-4 w-4" />
                View on Shopify
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="default" size="sm" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Product
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content - Gallery */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video relative overflow-hidden rounded-xl border bg-muted">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">No image</div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {allImages.map((image: string, index: number) => (
              <div
                key={index}
                className={`aspect-square relative overflow-hidden rounded-lg border cursor-pointer transition-all ${activeImage === image ? 'ring-2 ring-primary ring-offset-2' : 'hover:opacity-80'}`}
                onClick={() => setActiveImage(image)}
              >
                <Image
                  src={image}
                  alt={`${product.name} view ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {index < (product.generatedAssets?.heroImages?.length || 0) && (
                  <div className="absolute top-1 right-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                    AI
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* AI Analytics Section */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div
              className="p-6 border-b bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 cursor-pointer hover:bg-blue-100/50 transition-colors"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-600 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  </div>
                  <h3 className="font-semibold text-lg">AI Customer Insights</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{averageRating}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-400"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    <span className="ml-1">({reviews.length})</span>
                  </div>
                  {showAnalytics ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted-foreground"><path d="m18 15-6-6-6 6" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-muted-foreground"><path d="m6 9 6 6 6-6" /></svg>
                  )}
                </div>
              </div>
              {!showAnalytics && (
                <p className="text-sm text-muted-foreground mt-2 ml-8">
                  Click to view analysis based on {reviews.length} customer reviews
                </p>
              )}
            </div>

            {showAnalytics && (
              <div className="p-6 grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sentiment Summary</h4>
                  <p className="text-sm leading-relaxed">{loadingReviews ? "Analyzing reviews..." : sentimentAnalysis.summary}</p>
                </div>
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Key Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {loadingReviews ? (
                      <span className="text-sm text-muted-foreground">Loading...</span>
                    ) : (
                      sentimentAnalysis.keywords.map((keyword: string, i: number) => (
                        <Badge key={i} variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                          {keyword}
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                <div className="md:col-span-2 pt-4 border-t">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 text-amber-900 border border-amber-100">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 mt-0.5 shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    <div>
                      <span className="font-medium block text-sm mb-1">Area for Improvement</span>
                      <p className="text-sm opacity-90">{loadingReviews ? "Analyzing..." : sentimentAnalysis.improvement}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}\n          </div>

          {/* 3D AR Model Preview */}
          {product.generatedAssets?.arModelUrl && (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-purple-600 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg">3D AR Model Preview</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2 ml-8">
                  Interactive 3D model - drag to rotate, scroll to zoom
                </p>
              </div>
              <div className="p-6">
                <GlbViewer
                  url={product.generatedAssets.arModelUrl}
                  width="100%"
                  height={500}
                />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Details & Assets */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-4">Product Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Description</span>
                <p className="leading-relaxed">{product.description || "No description"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block mb-1">Created</span>
                  <p>{new Date(product.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Last Modified</span>
                  <p>{new Date(product.updatedAt).toLocaleDateString()}</p>
                </div>
                {product.shopifyStorefrontUrl && (
                  <div className="col-span-2 pt-2 border-t mt-2">
                    <span className="text-muted-foreground block mb-1">Shopify Link</span>
                    <a href={product.shopifyStorefrontUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate block">
                      {product.shopifyStorefrontUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-4">Generated Assets</h3>
            <div className="space-y-3">
              {/* Hero Images */}
              {product.generatedAssets?.heroImages && product.generatedAssets.heroImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Hero Images ({product.generatedAssets.heroImages.length})</p>
                  {product.generatedAssets.heroImages.map((imageUrl: string, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                          IMG
                        </div>
                        <div>
                          <p className="font-medium text-sm">Hero Image {idx + 1}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{imageUrl}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <a href={imageUrl} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AR Model */}
              {product.generatedAssets?.arModelUrl && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                      USDZ
                    </div>
                    <div>
                      <p className="font-medium text-sm">AR Model</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={product.generatedAssets.arModelUrl} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* No assets message */}
              {(!product.generatedAssets?.heroImages || product.generatedAssets.heroImages.length === 0) &&
                !product.generatedAssets?.arModelUrl && (
                  <p className="text-sm text-muted-foreground">No assets generated yet.</p>
                )}
            </div>
          </div>

          {/* Marketing Copy Section */}
          {product.generatedAssets?.productCopy && product.generatedAssets.productCopy.headline && (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Marketing Copy</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1"
                  onClick={() => handleCopy(
                    `${product.generatedAssets.productCopy.headline}\n\n${product.generatedAssets.productCopy.subheadline}\n\n${product.generatedAssets.productCopy.description}`
                  )}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy All"}
                </Button>
              </div>

              <div className="space-y-4">
                {/* Headline */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Headline</p>
                  <p className="text-lg font-bold">{product.generatedAssets.productCopy.headline}</p>
                </div>

                {/* Subheadline */}
                {product.generatedAssets.productCopy.subheadline && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Subheadline</p>
                    <p className="text-sm font-medium text-muted-foreground">{product.generatedAssets.productCopy.subheadline}</p>
                  </div>
                )}

                {/* Description */}
                {product.generatedAssets.productCopy.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm leading-relaxed">{product.generatedAssets.productCopy.description}</p>
                  </div>
                )}

                {/* Features */}
                {product.generatedAssets.productCopy.features && product.generatedAssets.productCopy.features.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Features</p>
                    <ul className="space-y-1">
                      {product.generatedAssets.productCopy.features.map((feature: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {product.generatedAssets.productCopy.benefits && product.generatedAssets.productCopy.benefits.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Benefits</p>
                    <ul className="space-y-1">
                      {product.generatedAssets.productCopy.benefits.map((benefit: string, idx: number) => (
                        <li key={idx} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
