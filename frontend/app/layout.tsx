import type { Metadata } from "next";
import { Instrument_Sans, Funnel_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { NotificationProvider } from "@/components/notification-provider";
import { SidebarProvider } from "@/components/layout/sidebar-context";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  display: "swap",
});

const funnelDisplay = Funnel_Display({
  variable: "--font-funnel-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProductKit",
  description: "AI-powered product asset generation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${funnelDisplay.variable} antialiased`}>
        <AuthProvider>
          <NotificationProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
