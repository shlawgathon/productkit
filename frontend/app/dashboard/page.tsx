import { ProductCard, type Product } from "@/components/dashboard/product-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { FAB } from "@/components/dashboard/fab";

// Mock data for demonstration
const products: Product[] = [
  {
    id: "1",
    name: "Minimalist Chair",
    status: "active",
    thumbnailUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=1000",
    lastModified: "2 mins ago",
  },
  {
    id: "2",
    name: "Smart Watch",
    status: "generating",
    thumbnailUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000",
    lastModified: "1 hour ago",
  },
  {
    id: "3",
    name: "Wireless Headphones",
    status: "draft",
    thumbnailUrl: "",
    lastModified: "1 day ago",
  },
];

export default function DashboardPage() {
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
