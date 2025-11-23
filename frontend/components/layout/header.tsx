"use client"
import Link from "next/link";
import { Menu, User as UserIcon, Settings, LogOut, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { api } from "@/lib/api-client";
import { useRef } from "react";
import { NotificationBell } from "@/components/notification-bell";

export function Header() {
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          <NotificationBell />

          <div className="relative group">
            <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 ring-2 ring-white cursor-pointer flex items-center justify-center text-white font-bold text-xs select-none overflow-hidden">
              {user?.profileImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.profileImage} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                getInitials()
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-white p-1 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
              <div className="px-2 py-2 border-b mb-1">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>

              <div
                className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
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

              <Link href="/settings" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <Link href="/settings" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                <UserIcon className="h-4 w-4" />
                Profile
              </Link>
              <div className="h-px bg-gray-100 my-1" />
              <button onClick={logout} className="w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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
