"use client";

import { useState, useEffect } from "react";
import { ProgressRing } from "@/components/status/progress-ring";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Analyzing product images", duration: 2000 },
  { id: 2, label: "Generating 3D geometry", duration: 3000 },
  { id: 3, label: "Applying textures and materials", duration: 2500 },
  { id: 4, label: "Rendering scene variations", duration: 3500 },
  { id: 5, label: "Finalizing assets", duration: 1500 },
];

export default function StatusPage() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) return;

    const totalDuration = steps.reduce((acc, step) => acc + step.duration, 0);
    let accumulatedTime = 0;

    const interval = setInterval(() => {
      accumulatedTime += 100;
      const newProgress = Math.min((accumulatedTime / totalDuration) * 100, 100);
      setProgress(newProgress);

      // Calculate current step based on progress
      let timeTracker = 0;
      for (let i = 0; i < steps.length; i++) {
        timeTracker += steps[i].duration;
        if (accumulatedTime < timeTracker) {
          setCurrentStepIndex(i);
          break;
        }
      }

      if (accumulatedTime >= totalDuration) {
        setIsComplete(true);
        setCurrentStepIndex(steps.length - 1);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isComplete]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Gradient Mesh Animation (Simplified) */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md space-y-12 text-center">
        <div className="space-y-4">
            <div className="mx-auto w-fit relative">
                <ProgressRing progress={progress} size={160} strokeWidth={12} />
                {isComplete && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full animate-in fade-in zoom-in">
                        <Check className="h-16 w-16 text-green-500" />
                    </div>
                )}
            </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isComplete ? "Generation Complete!" : "Creating Magic..."}
          </h1>
          <p className="text-muted-foreground">
            {isComplete 
                ? "Your product assets are ready to view." 
                : "Our AI is processing your images to create stunning product assets."}
          </p>
        </div>

        <div className="space-y-4 text-left bg-card/50 backdrop-blur-sm rounded-xl p-6 border shadow-sm">
          {steps.map((step, index) => {
            const isCompleted = index < currentStepIndex || isComplete;
            const isCurrent = index === currentStepIndex && !isComplete;

            return (
              <div key={step.id} className="flex items-center gap-4">
                <div className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                    isCompleted ? "bg-primary border-primary text-primary-foreground" :
                    isCurrent ? "border-primary text-primary animate-pulse" : "border-muted-foreground/30 text-transparent"
                )}>
                  {isCompleted && <Check className="h-3 w-3" />}
                  {isCurrent && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <span className={cn(
                    "text-sm font-medium transition-colors",
                    isCompleted ? "text-foreground" : 
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                {isCurrent && <Loader2 className="h-3 w-3 animate-spin ml-auto text-muted-foreground" />}
              </div>
            );
          })}
        </div>

        {isComplete && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Link href="/dashboard">
              <Button size="lg" className="w-full gap-2 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                <Sparkles className="h-4 w-4" />
                View Generated Assets
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
