
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    _id: string;
    email: string;
    // Add other user fields as needed
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    // We don't have a dedicated /me endpoint, but we can use /settings or just rely on the token presence + refresh
                    // For now, let's try to fetch settings to validate the token and get user info if possible,
                    // or just assume logged in if token exists and is valid (refresh will handle expiration).
                    // Ideally, the backend login response returns the user, and we should persist it or fetch it.
                    // Let's fetch settings as a proxy for "am I logged in" and getting userId.
                    // Actually, the login response gave us the user. We should probably store it in localStorage or fetch it.
                    // Since we don't have a /me, let's use getSettings which returns UserSettings, which might not have email.
                    // Let's just rely on the fact that if we have a token, we are likely logged in.
                    // A better approach for a real app is a /me endpoint.
                    // For this task, I'll assume if we can fetch settings, we are good.

                    // Wait, the login response returns `user`. I should probably store that in localStorage too for easy access on reload,
                    // or add a /me endpoint.
                    // Let's add a simple /me endpoint to the backend or just use the stored user.
                    // For now, I'll try to recover the user from localStorage if I saved it, or just fetch settings.

                    const storedUser = localStorage.getItem('user');
                    if (storedUser) {
                        setUser(JSON.parse(storedUser));
                    }

                    // Validate token by making a request
                    await api.getSettings();

                } catch (error) {
                    console.error("Auth check failed", error);
                    api.clearTokens();
                    setUser(null);
                    localStorage.removeItem('user');
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (credentials: any) => {
        const response = await api.login(credentials);
        api.setTokens(response.token, response.refreshToken);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        router.push('/dashboard');
    };

    const register = async (credentials: any) => {
        const response = await api.register(credentials);
        api.setTokens(response.token, response.refreshToken);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        router.push('/onboarding');
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch (e) {
            console.error("Logout failed", e);
        }
        api.clearTokens();
        setUser(null);
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
