import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="font-[var(--font-funnel-display)] relative flex min-h-screen flex-col bg-[#1A1828] text-white overflow-hidden">
      {/* Background Gradient Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="ProductKit Logo"
              className="object-contain h-full w-full"
            />
          </div>
          <span className="text-xl font-bold">ProductKit</span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button className="bg-[#BAA5FF] text-[#1A1828] hover:bg-[#BAA5FF]/90 gap-2">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-tight">
            AI-Powered
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#BAA5FF] via-purple-400 to-indigo-400">
              Product Creation
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-300">
            AI-powered product asset generation so your creative teams never miss a beat.
            Generate stunning visuals, marketing copy, and 3D models in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center items-center pt-8">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-[#BAA5FF] text-[#1A1828] hover:bg-[#BAA5FF]/90 text-lg px-8 py-6 gap-2 font-semibold"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Feature Preview - Mock UI Element */}
          <div className="pt-16 pb-8">
            <div className="relative mx-auto max-w-4xl">
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#2C2A4A]/80 to-[#1A1828]/80 backdrop-blur-xl p-8 shadow-2xl">
                {/* Mock Interface Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                      <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                    </div>
                    <div className="text-xs text-gray-400">ProductKit Dashboard</div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="h-32 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-white/10 animate-pulse"></div>
                    <div className="h-32 rounded-lg bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-white/10 animate-pulse delay-75"></div>
                    <div className="h-32 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-indigo-600/20 to-purple-600/20 blur-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>© 2025 ProductKit. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
