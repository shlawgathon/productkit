"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, Share2, Edit, MoreHorizontal, Copy, Check, Trash2, ShoppingBag, Video as VideoIcon, Play, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import GlbViewer from "@/components/dashboard/GlbViewer";
import { ProductProcessingProgress } from "@/components/dashboard/ProductProcessingProgress";
import { ShopifyIcon } from "@/components/icons/shopify-icon";
import { formatStatus, getStatusColorClass } from "@/lib/format-status";
import { cn } from "@/lib/utils";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());

  // Edit state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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



  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageUrl)) {
        newSet.delete(imageUrl);
      } else {
        newSet.add(imageUrl);
      }
      return newSet;
    });
  };

  const downloadSelected = async () => {
    const urls = Array.from(selectedImages);
    for (const url of urls) {
      const link = document.createElement('a');
      link.href = url;
      link.download = url.split('/').pop() || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const handleProcessingComplete = () => {
    // Refresh the page to show updated product data
    window.location.reload();
  };

  const startEditingTitle = () => {
    setEditedTitle(product.name);
    setIsEditingTitle(true);
  };

  const startEditingDescription = () => {
    setEditedDescription(product.description || "");
    setIsEditingDescription(true);
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditedTitle("");
  };

  const cancelEditingDescription = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
  };

  const saveTitle = async () => {
    if (!editedTitle.trim()) {
      return; // Don't save empty titles
    }

    setIsSaving(true);
    try {
      const updated = await api.updateProduct(id, { name: editedTitle.trim() });
      setProduct(updated);
      setIsEditingTitle(false);
      setEditedTitle("");
    } catch (error) {
      console.error("Failed to update title", error);
      alert("Failed to update title. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveDescription = async () => {
    setIsSaving(true);
    try {
      const updated = await api.updateProduct(id, { description: editedDescription.trim() });
      setProduct(updated);
      setIsEditingDescription(false);
      setEditedDescription("");
    } catch (error) {
      console.error("Failed to update description", error);
      alert("Failed to update description. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-3xl font-bold tracking-tight bg-transparent border-b-2 border-primary focus:outline-none flex-1 min-w-0"
                  autoFocus
                  disabled={isSaving}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') cancelEditingTitle();
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={saveTitle}
                  disabled={isSaving || !editedTitle.trim()}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={cancelEditingTitle}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={startEditingTitle}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </>
            )}
            <Badge variant="outline" className={cn("h-6", getStatusColorClass(product.status))}>
              {formatStatus(product.status)}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {product.shopifyStorefrontUrl && (
            <Button variant="outline" size="sm" className="gap-2 text-green-700 border-green-200 bg-green-50 hover:bg-green-100" asChild>
              <a href={product.shopifyStorefrontUrl} target="_blank" rel="noopener noreferrer">
                <ShopifyIcon className="h-4 w-4" />
                View on Shopify
              </a>
            </Button>
          )}
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
                className="object-contain"
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
                  className="object-contain bg-muted"
                />
                {index < (product.generatedAssets?.heroImages?.length || 0) && (
                  <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded">
                    AI
                  </div>
                )}
                {/* Selection Checkbox */}
                <div className="absolute top-2 left-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="icon"
                    variant={selectedImages.has(image) ? "default" : "secondary"}
                    className="h-6 w-6 rounded-md"
                    onClick={() => toggleImageSelection(image)}
                  >
                    {selectedImages.has(image) ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <div className="h-3 w-3 border-2 border-current rounded-sm" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Product Infographic */}
          {product.generatedAssets?.infographicUrl && (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-orange-600 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                  </div>
                  <h3 className="font-semibold text-lg">Product Infographic</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2 ml-8">
                  AI-generated product manual with technical specs and features
                </p>
              </div>
              <div className="p-6">
                <div className="relative w-full rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={product.generatedAssets.infographicUrl}
                    alt={`${product.name} Infographic`}
                    width={1200}
                    height={800}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          )}

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

          {/* Product Video Preview */}
          {product.generatedAssets?.videoUrl && (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-600 text-white">
                    <VideoIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-lg">Product Showcase Video</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-2 ml-8">
                  AI-generated cinematic product showcase
                </p>
              </div>
              <div className="p-6">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-black relative group">
                  <video
                    src={product.generatedAssets.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    poster={product.generatedAssets.heroImages?.[0] || product.originalImages?.[0]}
                  />
                </div>
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
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">Description</span>
                  {!isEditingDescription && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={startEditingDescription}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {isEditingDescription ? (
                  <div className="space-y-2">
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="w-full min-h-[100px] p-2 text-sm leading-relaxed bg-muted/30 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      autoFocus
                      disabled={isSaving}
                      placeholder="Enter product description..."
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                        onClick={cancelEditingDescription}
                        disabled={isSaving}
                      >
                        <X className="h-3 w-3" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 gap-1 bg-green-600 hover:bg-green-700"
                        onClick={saveDescription}
                        disabled={isSaving}
                      >
                        <Save className="h-3 w-3" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="leading-relaxed">{product.description || "No description"}</p>
                )}
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Generated Assets</h3>
              <Button
                variant="default"
                size="sm"
                className="h-8 gap-2 px-3"
                onClick={downloadSelected}
                disabled={selectedImages.size === 0}
              >
                <Download className="h-3.5 w-3.5" />
                Download {selectedImages.size > 0 && `(${selectedImages.size})`}
              </Button>
            </div>
            <div className="space-y-3">

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

              {/* Video Asset */}
              {product.generatedAssets?.videoUrl && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                      MP4
                    </div>
                    <div>
                      <p className="font-medium text-sm">Showcase Video</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={product.generatedAssets.videoUrl} download>
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Infographic Asset */}
              {product.generatedAssets?.infographicUrl && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">
                      PNG
                    </div>
                    <div>
                      <p className="font-medium text-sm">Infographic</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={product.generatedAssets.infographicUrl} download>
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
