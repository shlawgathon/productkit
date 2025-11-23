import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Header />
      <Sidebar />
      <main className="pt-16 md:pl-[var(--sidebar-width,16rem)] min-h-screen transition-all duration-300 ease-in-out">
        <div className="container mx-auto p-6 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
