"use client"
import Link from "next/link";
import { Menu, User as UserIcon, Settings, LogOut, Upload, HelpCircle, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api-client";
import { useRef, useState, useEffect } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { ShopifyIcon } from "@/components/icons/shopify-icon";

export function Header() {
  const { user, logout, updateUser } = useAuth();
  // const isShopifyConnected = !!(user?.shopifyStoreUrl && user?.shopifyAccessToken);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check system preference or local storage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadRes = await api.uploadFile(file);
      const updatedUser = await api.updateProfile({ profileImage: uploadRes.url });
      updateUser(updatedUser);
    } catch (error) {
      console.error("Failed to upload profile picture", error);
    }
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const displayName = user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email || 'User';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b backdrop-blur-lg transition-all bg-background/70" style={{
      borderColor: 'var(--border)'
    }}>
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

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full"
          >
            {theme === 'light' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <div className="relative group">
            <div className="h-8 w-8 rounded-full ring-2 ring-primary cursor-pointer flex items-center justify-center text-white font-bold text-xs select-none overflow-hidden" style={{
              background: 'linear-gradient(135deg, #BAA5FF 0%, #2C2A4A 100%)'
            }}>
              {user?.profileImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50" style={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--border)'
            }}>
              <div className="px-2 py-2 border-b mb-1" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{displayName}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
              </div>

              <div
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors cursor-pointer"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Upload className="h-4 w-4" />
                Upload Photo
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />

              <Link
                href="/settings"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link
                href="/help"
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors"
                style={{ color: 'var(--text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <HelpCircle className="h-4 w-4" />
                Help & Support
              </Link>
              <div className="h-px my-1" style={{ backgroundColor: 'var(--border)' }} />
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors"
                style={{ color: 'var(--error)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
