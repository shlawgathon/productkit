import Link from "next/link";
import { Bell, Menu, Search, User, Settings, LogOut } from "lucide-react";
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
                src="/icon.png" 
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
          
          <div className="relative group">
            <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 ring-2 ring-white cursor-pointer flex items-center justify-center text-white font-bold text-xs select-none">
              JD
            </div>
            
            {/* Profile Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-white p-1 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
              <div className="px-2 py-2 border-b mb-1">
                <p className="text-sm font-medium">John Doe</p>
                <p className="text-xs text-muted-foreground truncate">john.doe@example.com</p>
              </div>
              <Link href="/settings" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link href="/settings" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <User className="h-4 w-4" />
                Profile
              </Link>
              <div className="h-px bg-gray-100 my-1" />
              <Link href="/login" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="h-4 w-4" />
                Log out
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
