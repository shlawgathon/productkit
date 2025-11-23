"use client";

import { useEffect, useRef, useState } from "react";

interface StatusUpdate {
    type: string;
    status: string;
    progress: number;
    message: string;
}

export function useProductStatus(productId: string, enabled: boolean = true) {
    const [status, setStatus] = useState<StatusUpdate | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!enabled || !productId) return;

        const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
        const wsUrl = `${WS_URL}/ws/products/${productId}/status`;

        console.log(`[WebSocket] Connecting to ${wsUrl}`);

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("[WebSocket] Connected");
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as StatusUpdate;
                console.log("[WebSocket] Received:", data);
                setStatus(data);
            } catch (error) {
                console.error("[WebSocket] Failed to parse message:", error);
            }
        };

        ws.onerror = (error) => {
            console.error("[WebSocket] Error:", error);
        };

        ws.onclose = () => {
            console.log("[WebSocket] Disconnected");
            setIsConnected(false);
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
                ws.close();
            }
        };
    }, [productId, enabled]);

    return { status, isConnected };
}
