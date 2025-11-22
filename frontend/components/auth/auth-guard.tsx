"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if auth token exists in cookies
    const checkAuth = () => {
      const cookies = document.cookie.split(";");
      const tokenCookie = cookies.find((cookie) =>
        cookie.trim().startsWith("auth-token=")
      );
      
      if (!tokenCookie) {
        // Get redirect from URL or default to dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get("redirect") || "/dashboard";
        router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
        // TODO: Add actual token validation against backend API
        // Example: await fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${token}` } })
      }
    };

    checkAuth();
  }, [router]);

  // Show nothing while checking auth (middleware will handle redirect)
  if (isAuthenticated === false) {
    return null;
  }

  // Show loading state or children once authenticated
  return <>{children}</>;
}

