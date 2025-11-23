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
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

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
        href: "/dashboard/onboarding",
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

  return (
    <aside
      className="fixed left-0 top-16 bottom-0 z-40 hidden w-64 transition-all md:block"
      style={{ backgroundColor: 'var(--sidebar-background)' }}
    >
      <div className="flex h-full flex-col py-6">
        {/* Navigation Sections */}
        <nav className="flex-1 space-y-6 px-3">
          {navSections.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {section.title && (
                <div
                  className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider"
                  style={{ color: '#B8B5D1' }}
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
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
                      style={
                        isActive
                          ? {
                            backgroundColor: 'var(--sidebar-accent)',
                            color: '#FBFEFB'
                          }
                          : { color: '#B8B5D1' }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)';
                          e.currentTarget.style.color = '#FBFEFB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#B8B5D1';
                        }
                      }}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Section */}
        <div className="px-3 pt-4 border-t" style={{ borderColor: 'var(--sidebar-border)' }}>
          <Link
            href="/help"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
            style={{ color: '#B8B5D1' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)';
              e.currentTarget.style.color = '#FBFEFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#B8B5D1';
            }}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Help & Support</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
