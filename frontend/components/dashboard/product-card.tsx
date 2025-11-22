"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MoreHorizontal, Edit, ExternalLink, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface Product {
  id: string;
  name: string;
  slug: string;
  status: "active" | "draft" | "generating" | "error";
  thumbnailUrl: string;
  lastModified: string;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = () => {
    // In a real app, this would call an API
    console.log("Deleting product:", product.id);
    setShowDeleteDialog(false);
  };

  return (
    <>
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
            <Link href={`/onboarding?slug=${product.slug}`}>
              <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={`/products/${product.id}`}>
              <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="icon"
              variant="destructive"
              className="h-9 w-9 rounded-full"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge
              variant="outline"
              className={cn(
                "shadow-sm backdrop-blur-md bg-white/90 border-0",
                product.status === "active" && "text-green-600 font-medium",
                product.status === "generating" && "text-blue-600 font-medium",
                product.status === "error" && "text-red-600 font-medium",
                product.status === "draft" && "text-gray-600 font-medium",
              )}
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              <span className="font-semibold text-foreground"> {product.name} </span>
              and remove all generated assets from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
