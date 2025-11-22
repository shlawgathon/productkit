"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  // TODO: Add form submission handler for MongoDB integration
  // Example structure:
  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   const formData = new FormData(e.currentTarget);
  //   const email = formData.get("email") as string;
  //   const password = formData.get("password") as string;
  //   
  //   // MongoDB integration will go here
  //   // await fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
  // };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
           {/* Logo */}
           <div className="relative h-16 w-16 overflow-hidden mb-2">
             {/* eslint-disable-next-line @next/next/no-img-element */}
               <img 
               src="/icon.png" 
               alt="ProductKit Logo" 
               className="object-contain h-full w-full"
               />
           </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Or{" "}
            <Link
              href="/signup"
              className="font-medium text-primary hover:text-primary/90"
            >
              create a new account
            </Link>
          </p>
        </div>
        
        <form 
          className="mt-8 space-y-6"
          // TODO: Add onSubmit handler when implementing MongoDB integration
          // onSubmit={handleSubmit}
        >
          <div className="space-y-4 rounded-md shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                // TODO: Add onChange handler for real-time validation if needed
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                // TODO: Add onChange handler for real-time validation if needed
              />
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full"
            onClick={(e) => {
              // Placeholder - prevent default form submission
              e.preventDefault();
              console.log("Login clicked");
              // TODO: Replace with actual form submission handler
            }}
          >
            Sign in
          </Button>
        </form>
        
         <div className="mt-6 text-center text-sm">
            <Link href="/" className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground">
                 <ArrowLeft className="h-4 w-4" />
                 Back to Home
            </Link>
        </div>
      </div>
    </div>
  );
}

