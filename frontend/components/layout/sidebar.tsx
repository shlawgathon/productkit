"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, PlusCircle, Activity, Settings, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutGrid,
  },
  {
    title: "Create Product",
    href: "/onboarding",
    icon: PlusCircle,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 bottom-0 z-40 hidden w-64 border-r bg-sidebar transition-all md:block">
      <div className="flex h-full flex-col py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>


      </div>
    </aside>
  );
}
