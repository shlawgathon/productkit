"use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-white/70 backdrop-blur-lg transition-all">
      <div className="flex h-full items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="relative h-8 w-8 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo.png" 
                alt="ProductKit Logo" 
                className="object-contain h-full w-full"
              />
            </div>
            <span className="text-lg font-semibold tracking-tight hidden md:block">
              ProductKit
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
            {/* Search placeholder */}
            <div className="hidden md:flex items-center relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input 
                    type="search" 
                    placeholder="Search products..." 
                    className="h-9 w-64 rounded-full border border-input bg-transparent pl-9 pr-4 text-sm outline-none focus:border-primary transition-colors"
                />
            </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          </Button>
          
          <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 ring-2 ring-white cursor-pointer" />
        </div>
      </div>
    </header>
  );
}
