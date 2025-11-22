"use client";

import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, Edit, ExternalLink, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Product {
  id: string;
  name: string;
  status: "active" | "draft" | "generating" | "error";
  thumbnailUrl: string;
  lastModified: string;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
      {/* Image Container */}
      <div className="aspect-video w-full overflow-hidden bg-muted relative">
        {product.thumbnailUrl ? (
          <Image
            src={product.thumbnailUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
            No Image
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2 backdrop-blur-[2px]">
          <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full">
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="destructive" className="h-9 w-9 rounded-full">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            variant={
              product.status === "active" ? "success" : 
              product.status === "generating" ? "secondary" :
              product.status === "error" ? "destructive" : "outline"
            }
            className="shadow-sm backdrop-blur-md bg-white/90"
          >
            {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold tracking-tight text-lg leading-none mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              Edited {product.lastModified}
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
