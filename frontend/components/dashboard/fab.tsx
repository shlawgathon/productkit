"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FAB() {
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href="/dashboard/onboarding">
              <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 bg-primary text-primary-foreground"
              >
                <Plus className="h-6 w-6" />
                <span className="sr-only">Create Product</span>
              </Button>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Create New Product</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
