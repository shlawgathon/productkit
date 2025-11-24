
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    _id: string;
    email: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    bio?: string;
    shopifyStoreUrl?: string;
    shopifyAccessToken?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('accessToken');
            setToken(storedToken);

            if (storedToken) {
                try {
                    // Validate token and get user info
                    await api.checkValid();
                    const userData = await api.getUser();
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                } catch (error) {
                    console.error("Auth check failed", error);

                    api.clearTokens();
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem('user');
                    if (pathname !== '/login' && pathname !== '/signup') {
                        router.push('/login');
                    }
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, [router, pathname]);

    const login = async (credentials: any) => {
        try {
            const response = await api.login(credentials);
            api.setTokens(response.token, response.refreshToken);
            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            router.push('/dashboard');
        } catch (error) {
            throw error;
        }
    };

    const register = async (credentials: any) => {
        try {
            const response = await api.register(credentials);
            api.setTokens(response.token, response.refreshToken);
            setUser(response.user);
            setToken(response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            router.push('/dashboard/onboarding');
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await api.logout();
        } catch (e) {
            console.error("Logout failed", e);
        }
        api.clearTokens();
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, updateUser: setUser }}>
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
