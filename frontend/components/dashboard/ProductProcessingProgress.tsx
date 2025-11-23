"use client";

import { useEffect } from "react";
import { useProductStatus } from "@/hooks/useProductStatus";

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
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                {progress === 100 ? (
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                ) : (
                                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                            </div>
                            {isConnected && progress < 100 && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {progress === 100 ? "Processing Complete!" : "Processing Product"}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {progress}%
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out rounded-full relative overflow-hidden"
                            style={{ width: `${progress}%` }}
                        >
                            {/* Animated shine effect */}
                            {progress < 100 && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                            )}
                        </div>
                    </div>

                    {/* Status stages */}
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span className={progress >= 20 ? "text-blue-600 dark:text-blue-400 font-medium" : ""}>
                            Processing
                        </span>
                        <span className={progress >= 40 ? "text-blue-600 dark:text-blue-400 font-medium" : ""}>
                            Images
                        </span>
                        <span className={progress >= 60 ? "text-blue-600 dark:text-blue-400 font-medium" : ""}>
                            Copy
                        </span>
                        <span className={progress >= 85 ? "text-blue-600 dark:text-blue-400 font-medium" : ""}>
                            Shopify
                        </span>
                        <span className={progress === 100 ? "text-green-600 dark:text-green-400 font-medium" : ""}>
                            Done
                        </span>
                    </div>
                </div>

                {/* Completion message */}
                {progress === 100 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            Refreshing page...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
