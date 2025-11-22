"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Share2, Edit, MoreHorizontal, Copy, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { use } from "react";

// ... imports

// Mock data generator based on slug
const getProduct = (slug: string) => ({
  id: "1", // Mock ID
  name: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '), // Reconstruct name from slug
  description: "A sleek, modern minimalist chair designed for comfort and style. Features premium leather upholstery and a solid oak frame. Perfect for contemporary living spaces and offices.",
  status: "active",
  lastModified: "2 mins ago",
  images: [
    "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1503602642458-2321114458c4?auto=format&fit=crop&q=80&w=1000",
    "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&q=80&w=1000",
  ],
  generatedCopy: {
    title: "Elevate Your Space with the Minimalist Chair",
    shortDescription: "Experience the perfect blend of form and function with our Minimalist Chair. Crafted from premium materials for lasting comfort.",
    features: [
      "Premium leather upholstery",
      "Solid oak frame construction",
      "Ergonomic design for maximum comfort",
      "Available in multiple finishes"
    ]
  }
});

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const product = getProduct(slug);
  const [activeImage, setActiveImage] = useState(product.images[0]);
  const [copied, setCopied] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Fetch reviews on mount
  useEffect(() => {
    fetch(`/api/reviews?productId=${product.id}`)
      .then(res => res.json())
      .then(data => {
        setReviews(data.reviews);
        setLoadingReviews(false);
      })
      .catch(err => {
        console.error("Failed to fetch reviews", err);
        setLoadingReviews(false);
      });
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate analytics
  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  // Dynamic "AI" simulation based on actual reviews
  const sentimentAnalysis = (() => {
    if (reviews.length === 0) return {
      summary: "No reviews available for analysis yet.",
      keywords: [],
      improvement: "N/A"
    };

    const allText = reviews.map(r => r.body + " " + r.title).join(" ").toLowerCase();

    // Simple keyword extraction simulation
    const potentialKeywords = ["comfortable", "quality", "sleek", "modern", "great", "love", "perfect", "leather", "design", "sturdy"];
    const foundKeywords = potentialKeywords
      .filter(w => allText.includes(w))
      .slice(0, 5)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1));

    // Determine summary based on rating and keywords
    const avg = parseFloat(averageRating);
    let summary = "Customer feedback is limited.";
    if (avg >= 4.8) summary = "Customers are overwhelmingly positive, frequently praising the exceptional quality and design.";
    else if (avg >= 4.0) summary = "The majority of customers are satisfied, highlighting the product's aesthetic and comfort.";
    else if (avg >= 3.0) summary = "Reviews are generally positive, though some customers have mixed feelings about the value.";
    else summary = "Recent feedback indicates some customers are facing issues with the product.";

    // Identify improvements (mock logic looking for negative context words)
    const negativeContexts = ["shipping", "delay", "price", "expensive", "color", "size"];
    const foundIssues = negativeContexts.filter(w => allText.includes(w));
    const improvement = foundIssues.length > 0
      ? `Some users noted concerns regarding ${foundIssues.join(", ")}.`
      : "No significant recurring complaints found.";

    return {
      summary,
      keywords: foundKeywords.length > 0 ? foundKeywords : ["Design", "Quality"],
      improvement
    };
  })();

  const [showAnalytics, setShowAnalytics] = useState(false);

  return (
    <div className="space-y-8 pb-20">
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
            <Badge variant="success" className="h-6">Active</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
        {/* Main Content - Gallery & Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-video relative overflow-hidden rounded-xl border bg-muted">
              <Image
                src={activeImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
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
                </div>
              ))}
            </div>
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
                      sentimentAnalysis.keywords.map((keyword, i) => (
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
            )}
          </div>
        </div>

        {/* Sidebar - Details & Assets */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-4">Product Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground block mb-1">Description</span>
                <p className="leading-relaxed">{product.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground block mb-1">Created</span>
                  <p>Oct 24, 2023</p>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Last Modified</span>
                  <p>{product.lastModified}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold mb-4">Generated Assets</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    3D
                  </div>
                  <div>
                    <p className="font-medium text-sm">GLB Model</p>
                    <p className="text-xs text-muted-foreground">24.5 MB</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-md bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">
                    USDZ
                  </div>
                  <div>
                    <p className="font-medium text-sm">AR Model</p>
                    <p className="text-xs text-muted-foreground">18.2 MB</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Marketing Copy</h3>
              <Button variant="ghost" size="sm" className="h-8 gap-1" onClick={() => handleCopy(product.generatedCopy.shortDescription)}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-sm italic text-muted-foreground">
              "{product.generatedCopy.shortDescription}"
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
