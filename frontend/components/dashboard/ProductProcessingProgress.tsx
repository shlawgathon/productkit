"use client";

import { useEffect, useState, useMemo } from "react";
import { useProductStatus, JobStep } from "@/hooks/useProductStatus";
import { CheckCircle2, Clock, AlertCircle, Flame, Zap, Box, FileText, ShoppingBag, Video, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductProcessingProgressProps {
    productId: string;
    currentStatus: string;
    onComplete?: () => void;
}

const getStepStyle = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("init")) return { color: "#94a3b8", icon: Zap, label: "Init" }; // Slate
    if (n.includes("image")) return { color: "#a855f7", icon: ImageIcon, label: "Images" }; // Purple
    if (n.includes("copy")) return { color: "#3b82f6", icon: FileText, label: "Copy" }; // Blue
    if (n.includes("model")) return { color: "#f97316", icon: Box, label: "3D Model" }; // Orange
    if (n.includes("shopify")) return { color: "#10b981", icon: ShoppingBag, label: "Shopify" }; // Emerald
    if (n.includes("video")) return { color: "#ec4899", icon: Video, label: "Video" }; // Pink
    if (n.includes("infographic")) return { color: "#f59e0b", icon: FileText, label: "Info" }; // Amber
    return { color: "#71717a", icon: Zap, label: name }; // Zinc
};

function TraceBlock({ step, minStartTime, totalDuration }: { step: JobStep; minStartTime: number; totalDuration: number }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (step.status === "RUNNING") {
            const interval = setInterval(() => setNow(Date.now()), 30);
            return () => clearInterval(interval);
        }
    }, [step.status]);

    if (!step.startTime) return null;

    const startOffset = step.startTime - minStartTime;
    const duration = step.endTime ? (step.endTime - step.startTime) : (now - step.startTime);

    // Calculate percentages
    const leftPercent = (startOffset / totalDuration) * 100;
    const widthPercent = Math.max(0.5, (duration / totalDuration) * 100);

    const durationSeconds = (duration / 1000).toFixed(2);
    const style = getStepStyle(step.name);
    const Icon = style.icon;

    return (
        <div className="relative h-14 w-full mb-1">
            {/* Start Time Label */}
            <div
                className="absolute top-0 text-[10px] font-mono text-gray-500 -translate-x-1/2"
                style={{ left: `${leftPercent}%` }}
            >
                {(startOffset / 1000).toFixed(3)}s
            </div>

            {/* The Block */}
            <div
                className="absolute top-4 h-8 rounded-sm bg-[#2d2d2d] border-l-[3px] flex items-center justify-center overflow-hidden transition-all duration-100 ease-linear shadow-sm"
                style={{
                    left: `${leftPercent}%`,
                    width: `${widthPercent}%`,
                    borderColor: style.color,
                    minWidth: "24px" // Ensure visibility even if very short
                }}
            >
                <span className="text-[10px] font-mono font-medium text-gray-300 px-1 truncate">
                    {durationSeconds}s
                </span>

                {/* Active Pulse */}
                {step.status === "RUNNING" && (
                    <div className="absolute inset-0 bg-white/5 animate-pulse" />
                )}
            </div>

            {/* Step Label */}
            <div
                className="absolute top-12 text-[10px] font-medium text-gray-400 flex items-center gap-1 -translate-x-0"
                style={{ left: `${leftPercent}%` }}
            >
                {/* <Icon className="w-3 h-3" style={{ color: style.color }} /> */}
                <span style={{ color: step.status === "RUNNING" ? style.color : undefined }}>
                    {style.label}
                </span>
            </div>
        </div>
    );
}

function TraceView({ steps }: { steps: JobStep[] }) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const hasRunning = steps.some(s => s.status === "RUNNING");
        if (hasRunning) {
            const interval = setInterval(() => setNow(Date.now()), 100);
            return () => clearInterval(interval);
        }
    }, [steps]);

    const minStartTime = useMemo(() => {
        const starts = steps.map(s => s.startTime).filter(Boolean) as number[];
        return starts.length > 0 ? Math.min(...starts) : Date.now();
    }, [steps]);

    const maxEndTime = useMemo(() => {
        const ends = steps.map(s => s.endTime || (s.startTime ? now : undefined)).filter(Boolean) as number[];
        return ends.length > 0 ? Math.max(...ends) : minStartTime + 1000;
    }, [steps, now, minStartTime]);

    const totalDuration = Math.max(1000, maxEndTime - minStartTime);

    return (
        <div className="bg-[#09090b] rounded-lg p-4 border border-[#27272a] font-sans select-none">
            {/* Ruler */}
            <div className="flex justify-between text-[10px] font-mono text-[#52525b] mb-6 border-b border-[#27272a] pb-1">
                <span>0.000s</span>
                <span>{(totalDuration / 1000).toFixed(3)}s</span>
            </div>

            {/* Traces */}
            <div className="relative space-y-2">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex justify-between pointer-events-none opacity-5">
                    <div className="w-px h-full bg-white" />
                    <div className="w-px h-full bg-white" />
                    <div className="w-px h-full bg-white" />
                    <div className="w-px h-full bg-white" />
                    <div className="w-px h-full bg-white" />
                </div>

                {steps.filter(s => s.status !== "PENDING").map((step) => (
                    <TraceBlock
                        key={step.id}
                        step={step}
                        minStartTime={minStartTime}
                        totalDuration={totalDuration}
                    />
                ))}

                {steps.every(s => s.status === "PENDING") && (
                    <div className="text-center py-8 text-xs text-[#52525b] animate-pulse">
                        Initializing trace...
                    </div>
                )}
            </div>
        </div>
    );
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
        currentStatus === "SYNCING_SHOPIFY" ||
        currentStatus === "POST_COMPLETION_ASSETS"
    );

    useEffect(() => {
        if (status?.status === "COMPLETED" && onComplete) {
            const timer = setTimeout(() => {
                onComplete();
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [status?.status, onComplete]);

    if ((currentStatus === "COMPLETED" || currentStatus === "DRAFT" || currentStatus === "ERROR") && !status) {
        return null;
    }

    const progress = status?.progress ?? 0;
    const steps = status?.steps ?? [];

    return (
        <div className="fixed top-20 right-6 z-50 w-full max-w-lg transition-all duration-300 ease-in-out">
            <div className={cn(
                "bg-[#09090b] rounded-xl shadow-2xl border border-[#27272a] overflow-hidden transition-all duration-300",
                isCollapsed ? "w-auto inline-block float-right" : "w-full"
            )}>
                {/* Minimal Header */}
                <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#27272a]/50 transition-colors"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <div className="flex items-center gap-3">
                        {progress === 100 ? (
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        ) : status?.status === "ERROR" ? (
                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        ) : (
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                        )}
                        <span className="text-xs font-mono text-gray-400">
                            {progress === 100 ? "TRACE_COMPLETE" : "TRACE_ACTIVE"}
                        </span>
                    </div>
                    <div className="text-xs font-mono text-gray-500">
                        {progress}%
                    </div>
                </div>

                {/* Content */}
                {!isCollapsed && (
                    <div className="p-3 pt-0">
                        <TraceView steps={steps} />
                    </div>
                )}
            </div>
        </div>
    );
}
