
"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { useRouter, usePathname } from 'next/navigation';

interface User {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profileImage?: string;
    bio?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (credentials: any) => Promise<void>;
    register: (credentials: any) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => void;
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
            const hasBypassCookie = document.cookie.includes('auth-token=dev-bypass-token');

            if (token) {
                try {
                    // Validate token and get user info
                    await api.checkValid();
                    const userData = await api.getUser();
                    setUser(userData);
                    localStorage.setItem('user', JSON.stringify(userData));
                } catch (error) {
                    console.error("Auth check failed", error);
                    
                    if (hasBypassCookie) {
                        console.log("Auth failed but bypass cookie found, using mock user");
                        setUser({
                            _id: 'dev-user',
                            email: 'dev@example.com',
                            firstName: 'Dev',
                            lastName: 'User'
                        });
                        setIsLoading(false);
                        return;
                    }

                    api.clearTokens();
                    setUser(null);
                    localStorage.removeItem('user');
                    if (pathname !== '/login' && pathname !== '/register') {
                        router.push('/login');
                    }
                }
            } else if (hasBypassCookie) {
                // Don't auto-login on public auth pages if we only have the bypass cookie
                // This allows testing the login flow
                if (pathname !== '/login' && pathname !== '/register') {
                    console.log("No token but bypass cookie found, using mock user");
                    setUser({
                        _id: 'dev-user',
                        email: 'dev@example.com',
                        firstName: 'Dev',
                        lastName: 'User'
                    });
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
            localStorage.setItem('user', JSON.stringify(response.user));
            router.push('/dashboard');
        } catch (error) {
            const hasBypassCookie = document.cookie.includes('auth-token=dev-bypass-token');
            if (hasBypassCookie) {
                console.log("Login failed but bypass cookie found, using mock user");
                const mockUser = {
                    _id: 'dev-user',
                    email: credentials.username || 'dev@example.com',
                    firstName: 'Dev',
                    lastName: 'User'
                };
                setUser(mockUser);
                localStorage.setItem('user', JSON.stringify(mockUser));
                router.push('/dashboard');
                return;
            }
            throw error;
        }
    };

    const register = async (credentials: any) => {
        try {
            const response = await api.register(credentials);
            api.setTokens(response.token, response.refreshToken);
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
            router.push('/onboarding');
        } catch (error) {
            const hasBypassCookie = document.cookie.includes('auth-token=dev-bypass-token');
            if (hasBypassCookie) {
                console.log("Registration failed but bypass cookie found, using mock user");
                const mockUser = {
                    _id: 'dev-user',
                    email: credentials.email || 'dev@example.com',
                    firstName: 'Dev',
                    lastName: 'User'
                };
                setUser(mockUser);
                localStorage.setItem('user', JSON.stringify(mockUser));
                router.push('/onboarding');
                return;
            }
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
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser: setUser }}>
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
