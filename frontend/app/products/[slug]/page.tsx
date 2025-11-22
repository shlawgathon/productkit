"use client";

import { useState } from "react";
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        {/* Main Content - Gallery */}
        <div className="lg:col-span-2 space-y-4">
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
