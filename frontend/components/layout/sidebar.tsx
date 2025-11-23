"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  PlusCircle,
  Settings,
  Package,
  Bell,
  Activity,
  Users,
  FileText,
  HelpCircle,
  Palette,
  ChevronLeft
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar-context";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      {
        title: "Your Products",
        href: "/dashboard",
        icon: LayoutGrid,
      },
    ],
  },
  {
    title: "Actions",
    items: [
      {
        title: "Create Product",
        href: "/onboarding",
        icon: PlusCircle,
      },
    ],
  },
  {
    title: "Configuration",
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
      }
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggleSidebar } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 bottom-0 z-40 hidden transition-all duration-300 md:block bg-(--sidebar-background) border-r border-border",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="relative flex h-full flex-col py-6">
        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform", isCollapsed && "rotate-180")} />
        </button>

        {/* Navigation Sections */}
        <nav className="flex-1 space-y-6 px-3">
          {navSections.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {section.title && !isCollapsed && (
                <div
                  className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-(--sidebar-section-header)"
                >
                  {section.title}
                </div>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-(--sidebar-accent) text-(--sidebar-accent-foreground)"
                          : "text-(--sidebar-section-header) hover:bg-(--sidebar-accent) hover:text-(--sidebar-accent-foreground)",
                        isCollapsed && "justify-center px-2"
                      )}
                      title={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
