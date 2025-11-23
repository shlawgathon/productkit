"use client";

import { ProductCard, type Product } from "@/components/dashboard/product-card";
import { ProductProcessingProgress } from "@/components/dashboard/ProductProcessingProgress";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FAB } from "@/components/dashboard/fab";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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
          updatedAt: p.updatedAt, // Keep the original date for sorting
          generatedAssets: p.generatedAssets ? {
            arModelUrl: p.generatedAssets.arModelUrl,
          } : undefined,
          shopifyStorefrontUrl: p.shopifyStorefrontUrl,
        }));
        setProducts(mappedProducts);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [user]);

  // Refetch products function that can be called after deletion
  const refetchProducts = async () => {
    try {
      const data = await api.getProducts();
      const mappedProducts = (data.products || []).map((p: any) => ({
        id: p._id,
        name: p.name,
        slug: p.name.toLowerCase().replace(/ /g, '-'),
        status: mapStatus(p.status),
        thumbnailUrl: p.originalImages?.[0] || "",
        lastModified: new Date(p.updatedAt).toLocaleDateString(),
        updatedAt: p.updatedAt,
        generatedAssets: p.generatedAssets ? {
          arModelUrl: p.generatedAssets.arModelUrl,
        } : undefined,
        shopifyStorefrontUrl: p.shopifyStorefrontUrl,
      }));
      setProducts(mappedProducts);
    } catch (error) {
      console.error("Failed to refetch products", error);
    }
  };

  // Load favorites from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('favoriteProducts');
    if (stored) {
      setFavorites(new Set(JSON.parse(stored)));
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteProducts', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  };

  const mapStatus = (backendStatus: string): "active" | "draft" | "generating" | "post_completion_assets" => {
    switch (backendStatus) {
      case "COMPLETED":
        return "active";
      case "POST_COMPLETION_ASSETS":
        return "post_completion_assets";
      case "DRAFT":
      case "ERROR":
        return "draft";
      default:
        return "generating";
    }
  };

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = products.filter(p =>
        p.name.toLowerCase().includes(query)
      );
    }

    // Sort by date
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.updatedAt || 0).getTime();
      const dateB = new Date(b.updatedAt || 0).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    // Sort favorites to top
    return sorted.sort((a, b) => {
      const aFav = favorites.has(a.id) ? 1 : 0;
      const bFav = favorites.has(b.id) ? 1 : 0;
      return bFav - aFav;
    });
  }, [products, searchQuery, sortOrder, favorites]);

  const toggleSort = () => {
    setSortOrder(prev => prev === "asc" ? "desc" : "asc");
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading products...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Show processing widget for the first generating or finalizing product found */}
      {products.find(p => p.status === "generating" || p.status === "post_completion_assets") && (
        <ProductProcessingProgress
          productId={products.find(p => p.status === "generating" || p.status === "post_completion_assets")!.id}
          currentStatus="PROCESSING" // Force processing status for the widget
          onComplete={() => {
            // Refresh products when complete
            window.location.reload();
          }}
        />
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1">
            View all your registered products here.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="search"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 w-full max-w-sm rounded-lg border border-input bg-transparent px-4 text-sm outline-none focus:border-primary transition-colors"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSort}
            className="gap-2"
          >
            {sortOrder === "asc" ? (
              <>
                <ArrowUp className="h-4 w-4" />
                Date: Oldest First
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4" />
                Date: Newest First
              </>
            )}
          </Button>
        </div>
      </div>

      {filteredAndSortedProducts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={favorites.has(product.id)}
              onToggleFavorite={() => toggleFavorite(product.id)}
              onDelete={refetchProducts}
            />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
