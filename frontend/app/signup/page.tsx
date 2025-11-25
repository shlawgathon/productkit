"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { useState, useRef, useEffect } from "react";

export default function SignUpPage() {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Access Code State
  const [code, setCode] = useState(["", "", "", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const chars = value.split("").slice(0, 8);
      const newCode = [...code];
      chars.forEach((c, i) => {
        if (index + i < 8) newCode[index + i] = c.toUpperCase();
      });
      setCode(newCode);
      const nextEmptyIndex = newCode.findIndex(c => c === "");
      const focusIndex = nextEmptyIndex === -1 ? 7 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);

    if (value && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").toUpperCase();
    const chars = pastedData.split("").slice(0, 8);
    const newCode = [...code];
    chars.forEach((c, i) => {
      newCode[i] = c;
    });
    setCode(newCode);
    const nextEmptyIndex = newCode.findIndex(c => c === "");
    const focusIndex = nextEmptyIndex === -1 ? 7 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    // Access code is now in the hidden input
    const accessCode = formData.get("accessCode") as string;

    try {
      await register({ email, password, accessCode });
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020817] text-white p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6 backdrop-blur-sm border border-white/10">
            <div className="relative h-10 w-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="ProductKit Logo"
                className="object-contain h-full w-full brightness-0 invert"
              />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-center">
            Sign up for ProductKit
          </h2>
          <p className="mt-2 text-gray-400 text-center">
            Create your account to get started
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-200">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-200">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                className="h-12 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500 focus:ring-purple-500/20"
                placeholder="Create a password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">
              Access Code
            </Label>
            <div className="flex gap-2 justify-between">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { inputRefs.current[index] = el }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  onPaste={handleCodePaste}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                />
              ))}
            </div>
            <input type="hidden" name="accessCode" value={code.join("")} />
          </div>

            <div className="space-y-2">
              <Label htmlFor="accessCode" className="text-[#2C2A4A] font-medium">
                Access Code
              </Label>
              <Input
                id="accessCode"
                name="accessCode"
                type="text"
                required
                className="h-11 border-gray-300 focus:border-[#BAA5FF] focus:ring-[#BAA5FF]"
                placeholder="Enter your access code"
              />
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <p>To get an one time use access code, please Connect with Subham or Jerry and DM them, or email (this will be a one time thing for account creation):</p>
                <p>
                  <a href="mailto:jerry.x0930@gmail.com" className="text-[#2C2A4A] hover:text-[#BAA5FF] transition-colors">jerry.x0930@gmail.com</a>
                  {" or "}
                  <a href="mailto:subhamktech@gmail.com" className="text-[#2C2A4A] hover:text-[#BAA5FF] transition-colors">subhamktech@gmail.com</a>
                </p>
                <p>
                  LinkedIn:{" "}
                  <a href="https://linkedin.com/in/xiaojerry" target="_blank" rel="noopener noreferrer" className="text-[#2C2A4A] hover:text-[#BAA5FF] transition-colors">in/xiaojerry</a>
                  {" and "}
                  <a href="https://linkedin.com/in/subhamkts" target="_blank" rel="noopener noreferrer" className="text-[#2C2A4A] hover:text-[#BAA5FF] transition-colors">in/subhamkts</a>
                </p>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-12 bg-white text-black hover:bg-gray-200 font-semibold text-lg transition-all"
            disabled={isLoading}
          >
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:text-purple-300 font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}