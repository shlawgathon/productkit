
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

class ApiClient {
    private static instance: ApiClient;
    private accessToken: string | null = null;
    private refreshToken: string | null = null;

    private constructor() {
        if (typeof window !== 'undefined') {
            this.accessToken = localStorage.getItem('accessToken');
            this.refreshToken = localStorage.getItem('refreshToken');
        }
    }

    public static getInstance(): ApiClient {
        if (!ApiClient.instance) {
            ApiClient.instance = new ApiClient();
        }
        return ApiClient.instance;
    }

    public setTokens(accessToken: string, refreshToken: string) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        }
    }

    public clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    }

    public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const url = `${BASE_URL}${endpoint}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        console.log(`[API Request] ${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body as string) : '');

        let response;
        try {
            response = await fetch(url, { ...options, headers });
        } catch (error) {
            // Network error (server not running, no internet, etc.)
            console.warn(`[API] Network error - server may be offline:`, error);
            throw new Error('Unable to connect to server. Please check if the backend is running.');
        }

        console.log(`[API Response] ${response.status} ${url}`);

        if (response.status === 401 && this.refreshToken) {
            // Try to refresh token
            console.log('[API] Token expired, refreshing...');
            const refreshSuccess = await this.refreshAccessToken();
            if (refreshSuccess) {
                // Retry original request with new token
                headers['Authorization'] = `Bearer ${this.accessToken}`;
                try {
                    response = await fetch(url, { ...options, headers });
                } catch (error) {
                    console.warn(`[API] Network error on retry:`, error);
                    throw new Error('Unable to connect to server');
                }
            } else {
                this.clearTokens();
                window.location.href = '/login'; // Redirect to login
                throw new Error('Session expired');
            }
        }

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error(`[API Error] ${response.status} ${url}`, errorBody);
            throw new Error(errorBody.error || 'API Request Failed');
        }

        // Handle empty responses (e.g. 204 No Content)
        if (response.status === 204) {
            return {} as T;
        }

        const data = await response.json();
        console.log(`[API Data]`, data);
        return data as T;
    }

    private async refreshAccessToken(): Promise<boolean> {
        try {
            const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: this.refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                this.setTokens(data.token, data.refreshToken);
                return true;
            }
        } catch (error) {
            console.error('Failed to refresh token', error);
        }
        return false;
    }

    // Public API methods

    // Auth
    public async login(credentials: any) {
        return this.request<any>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    public async register(credentials: any) {
        return this.request<any>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    }

    // Admin Access Codes
    public async generateAccessCode() {
        return this.request<any>('/api/admin/codes', {
            method: 'POST'
        });
    }

    public async getAccessCodes() {
        return this.request<any>('/api/admin/codes');
    }

    public async logout() {
        await this.request('/api/auth/logout', { method: 'POST' });
        this.clearTokens();
    }

    public async getUser() {
        return this.request<any>('/api/auth/me');
    }

    public async checkValid() {
        return this.request<any>('/api/auth/valid');
    }

    // Products
    public async getProducts() {
        return this.request<any>('/api/products');
    }

    public async getProduct(id: string) {
        return this.request<any>(`/api/products/${id}`);
    }

    public async createProduct(data: any) {
        return this.request<any>('/api/products/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    public async updateProduct(id: string, data: any) {
        return this.request<any>(`/api/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    public async deleteProduct(id: string) {
        return this.request<any>(`/api/products/${id}`, {
            method: 'DELETE',
        });
    }

    public async regenerateProduct(id: string) {
        return this.request<any>(`/api/products/${id}/regenerate`, {
            method: 'POST'
        });
    }

    public async getProductStatus(id: string) {
        return this.request<any>(`/api/products/${id}/status`);
    }

    // Enhance product description using image URL and existing description
    public async enhanceProductDescription(imageUrl: string, description: string) {
        return this.request<any>('/api/products/enhance-description', {
            method: 'POST',
            body: JSON.stringify({ imageUrl, description }),
        });
    }



    // Settings
    public async getSettings() {
        return this.request<any>('/api/settings');
    }

    public async updateSettings(data: any) {
        return this.request<any>('/api/settings', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    public async updateBrand(data: any) {
        return this.request<any>('/api/settings/brand', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    public async updateProfile(data: any) {
        return this.request<any>('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    public async uploadFile(file: File) {
        const formData = new FormData();
        formData.append('file', file);

        const url = `${BASE_URL}/api/upload`;
        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };
        if (this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }

        let response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers,
                body: formData,
            });
        } catch (error) {
            console.warn(`[API] Upload failed - network error:`, error);
            throw new Error('Unable to connect to server for upload');
        }

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return response.json();
    }
}

export const api = ApiClient.getInstance();
