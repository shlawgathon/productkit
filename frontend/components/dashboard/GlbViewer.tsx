"use client";

import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Loader2, AlertCircle, Maximize2 } from "lucide-react";

function Model({ url, scale = 1.5 }: { url: string; scale?: number }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} scale={scale} />;
}

interface GlbViewerProps {
    url: string;
    width?: number | string;
    height?: number | string;
    className?: string;
    initialZoom?: 'close' | 'normal';
}

function ErrorFallback() {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <span className="text-sm">Failed to load 3D model</span>
        </div>
    );
}

export default function GlbViewer({
    url,
    width = "100%",
    height = 400,
    className,
    initialZoom = 'normal'
}: GlbViewerProps) {
    const [error, setError] = useState(false);
    
    // Adjust camera and model based on zoom level
    // 'normal' is for detail page (closer), 'close' is for thumbnails (pulled back)
    const cameraPosition: [number, number, number] = initialZoom === 'close' ? [0, 0, 4] : [0, 0, 2.5];
    const modelScale = initialZoom === 'close' ? 2 : 3;
    const minDistance = initialZoom === 'close' ? 1.5 : 0.8;

    if (error) {
        return (
            <div
                className={`relative overflow-hidden rounded-xl border bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 ${className}`}
                style={{ width, height }}
            >
                <ErrorFallback />
            </div>
        );
    }

    return (
        <div
            className={`relative overflow-hidden rounded-xl border bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-lg ${className}`}
            style={{ width, height }}
        >
            <Suspense
                fallback={
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <span className="text-sm font-medium">Loading 3D Model...</span>
                        </div>
                    </div>
                }
            >
                <Canvas
                    dpr={[1, 2]}
                    shadows
                    onError={() => setError(true)}
                    gl={{ antialias: true, alpha: true }}
                >
                    <PerspectiveCamera makeDefault position={cameraPosition} fov={50} />

                    {/* Lighting Setup */}
                    <ambientLight intensity={0.5} />
                    <spotLight
                        position={[10, 10, 10]}
                        angle={0.15}
                        penumbra={1}
                        intensity={1}
                        castShadow
                    />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />

                    {/* Environment */}
                    <Environment preset="studio" />

                    {/* Model */}
                    <Model url={url} scale={modelScale} />

                    {/* Controls */}
                    <OrbitControls
                        makeDefault
                        autoRotate
                        autoRotateSpeed={0.5}
                        enableDamping
                        dampingFactor={0.05}
                        minDistance={minDistance}
                        maxDistance={10}
                        minPolarAngle={Math.PI / 4}
                        maxPolarAngle={Math.PI / 1.5}
                    />
                </Canvas>
            </Suspense>

            <div className="absolute bottom-3 right-3 flex gap-2">
                <div className="px-3 py-1.5 bg-black/60 text-white text-xs rounded-lg backdrop-blur-md pointer-events-none flex items-center gap-1.5">
                    <Maximize2 className="h-3 w-3" />
                    <span>Drag to rotate</span>
                </div>
            </div>
        </div>
    );
}
