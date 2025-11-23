"use client";

import { useEffect, useState } from "react";
import { useProductStatus } from "@/hooks/useProductStatus";
import { ChevronDown, ChevronUp, Loader2, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductProcessingProgressProps {
    productId: string;
    currentStatus: string;
    onComplete?: () => void;
}

export function ProductProcessingProgress({
    productId,
    currentStatus,
    onComplete,
}: ProductProcessingProgressProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { status, isConnected } = useProductStatus(
        productId,
        currentStatus === "PROCESSING" ||
        currentStatus === "GENERATING_IMAGES" ||
        currentStatus === "GENERATING_COPY" ||
        currentStatus === "GENERATING_SITE" ||
        currentStatus === "SYNCING_SHOPIFY"
    );

    useEffect(() => {
        if (status?.status === "COMPLETED" && onComplete) {
            // Wait a moment to show the completion state
            const timer = setTimeout(() => {
                onComplete();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [status?.status, onComplete]);

    // Don't show if product is already completed or in draft
    if (currentStatus === "COMPLETED" || currentStatus === "DRAFT" || currentStatus === "ERROR") {
        return null;
    }

    const progress = status?.progress ?? 0;
    const message = status?.message ?? "Initializing...";

    return (
        <div className="fixed top-20 right-6 z-50 w-full max-w-sm transition-all duration-300 ease-in-out">
            <div 
                className={cn(
                    "bg-white/90 backdrop-blur-md dark:bg-gray-900/90 rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden transition-all duration-300",
                    isCollapsed ? "p-3" : "p-5"
                )}
            >
                {/* Header / Collapsed View */}
                <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            {progress === 100 ? (
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                            ) : (
                                <div className="relative w-8 h-8">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                        <path
                                            className="text-gray-200 dark:text-gray-700"
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="text-blue-600 dark:text-blue-500 transition-all duration-500 ease-out"
                                            strokeDasharray={`${progress}, 100`}
                                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        {isConnected && (
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col">
                            <h3 className="font-medium text-sm text-gray-900 dark:text-white leading-tight">
                                {progress === 100 ? "Complete" : "Generating Assets"}
                            </h3>
                            {isCollapsed && (
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {progress}%
                        </span>
                        <div className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </div>
                    </div>
                </div>

                {/* Expanded Content */}
                {!isCollapsed && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Progress</span>
                                <span>{message}</span>
                            </div>
                            <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-linear-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out rounded-full relative"
                                    style={{ width: `${progress}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-1">
                            {["Processing", "Images", "Copy", "Shopify"].map((step, i) => {
                                const stepProgress = (i + 1) * 25;
                                const isActive = progress >= stepProgress - 25;
                                const isCompleted = progress >= stepProgress;
                                
                                return (
                                    <div key={step} className="flex flex-col items-center gap-1">
                                        <div className={cn(
                                            "w-full h-1 rounded-full transition-colors duration-300",
                                            isCompleted ? "bg-blue-500" : isActive ? "bg-blue-200 dark:bg-blue-900" : "bg-gray-100 dark:bg-gray-800"
                                        )} />
                                        <span className={cn(
                                            "text-[10px] font-medium transition-colors duration-300",
                                            isActive ? "text-gray-900 dark:text-white" : "text-gray-400"
                                        )}>
                                            {step}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

