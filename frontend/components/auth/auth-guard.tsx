"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if auth token exists
    const checkAuth = () => {
      console.log("[AuthGuard] Starting auth check");

      // Debug: Check localStorage
      const localToken = localStorage.getItem('accessToken');
      console.log("[AuthGuard] localStorage accessToken:", localToken ? "Present" : "Missing");

      // Debug: Check cookies (just in case)
      const cookies = document.cookie;
      console.log("[AuthGuard] All cookies:", cookies);

      if (!localToken) {
        console.log("[AuthGuard] No token found, redirecting to login");
        // Get redirect from URL or default to dashboard
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get("redirect") || "/dashboard";
        router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
        setIsAuthenticated(false);
      } else {
        console.log("[AuthGuard] Token found, allowing access");
        setIsAuthenticated(true);
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

