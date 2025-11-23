import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <main className="flex flex-col items-center gap-8 text-center px-4">
        <div className="relative h-24 w-24 overflow-hidden mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="ProductKit Logo"
            className="object-contain h-full w-full"
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          ProductKit
        </h1>

        <p className="max-w-md text-lg text-muted-foreground">
          Generate stunning product assets with AI.
          Create, manage, and export your product visuals in seconds.
        </p>

        <div className="flex gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
