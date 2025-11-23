"use client";

import { ProductCard, type Product } from "@/components/dashboard/product-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FAB } from "@/components/dashboard/fab";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      try {
        const data = await api.getProducts();
        // Backend returns { products: [...] }
        const mappedProducts = (data.products || []).map((p: any) => ({
          id: p._id,
          name: p.name,
          slug: p.name.toLowerCase().replace(/ /g, '-'),
          status: mapStatus(p.status),
          thumbnailUrl: p.originalImages?.[0] || "",
          lastModified: new Date(p.updatedAt).toLocaleDateString(),
          generatedAssets: p.generatedAssets ? {
            arModelUrl: p.generatedAssets.arModelUrl,
          } : undefined,
          shopifyStorefrontUrl: p.shopifyStorefrontUrl,
        }));
        setProducts(mappedProducts);
      } catch (error: any) {
        console.error("Failed to fetch products", error);
        if (error.message?.includes('Unable to connect to server')) {
            setProducts([
                {
                    id: 'mock-1',
                    name: 'Mock Product 1',
                    slug: 'mock-product-1',
                    status: 'active',
                    thumbnailUrl: 'https://via.placeholder.com/300',
                    lastModified: new Date().toLocaleDateString(),
                    shopifyStorefrontUrl: '#'
                },
                {
                    id: 'mock-2',
                    name: 'Mock Product 2',
                    slug: 'mock-product-2',
                    status: 'draft',
                    thumbnailUrl: 'https://via.placeholder.com/300',
                    lastModified: new Date().toLocaleDateString(),
                }
            ]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  const mapStatus = (backendStatus: string): "active" | "draft" | "generating" => {
    switch (backendStatus) {
      case "COMPLETED":
        return "active";
      case "DRAFT":
      case "ERROR":
        return "draft";
      default:
        return "generating";
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading products...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your AI-generated product assets.
          </p>
        </div>
      </div>

      {products.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}

      <FAB />
    </div>
  );
}
