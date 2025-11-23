import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/50 p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <PlusCircle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight">
        No products created
      </h3>
      <p className="mb-8 mt-2 text-sm text-muted-foreground max-w-sm">
        You haven't created any products yet. Start by adding your first product to generate assets.
      </p>
      <Link href="/dashboard/onboarding">
        <Button size="lg" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Create Your First Product
        </Button>
      </Link>
    </div>
  );
}
