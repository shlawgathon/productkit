"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

export default function SignUpPage() {
  // TODO: Add form submission handler for MongoDB integration
  // Example structure:
  // const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   const formData = new FormData(e.currentTarget);
  //   const username = formData.get("username") as string;
  //   const password = formData.get("password") as string;
  //   
  //   // MongoDB integration will go here
  //   // await fetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ username, password }) })
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
            Create your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:text-primary/90"
            >
              Sign in
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
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                placeholder="johndoe"
                // TODO: Add onChange handler for real-time validation if needed
              />
              <p className="text-xs text-muted-foreground">
                Username must be 3-20 characters and contain only letters, numbers, and underscores
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
                // TODO: Add onChange handler for password strength validation if needed
              />
              <p className="text-xs text-muted-foreground">
                Password must be at least 8 characters long
              </p>
            </div>
          </div>

          <Button 
            type="submit"
            className="w-full"
            onClick={(e) => {
              // Placeholder - prevent default form submission
              e.preventDefault();
              console.log("Sign up clicked");
              // TODO: Replace with actual form submission handler
            }}
          >
            Create account
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

