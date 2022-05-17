import { StoreApi, UseBoundStore } from 'zustand';
export interface AuthStoreOptions {
    persistence?: {
        getItem: (key: string) => Promise<string | null> | (string | null);
        setItem: (key: string, value: string) => void | Promise<void>;
        removeItem: (key: string) => (void | Promise<void>);
        name: string;
    };
    onTokensChange?: (tokens: {
        access: string;
        refresh: string;
    }) => void;
    defaultCredentials?: {
        token: string;
        refreshToken: string;
    };
    browserTokenStorage?: 'none' | 'sessionStorage';
    onLogout?: () => void;
}
interface AuthStore {
    isLoggedIn: boolean;
    login: (token: string, refreshToken: string) => void;
    logout: () => void;
    setAccessToken: (v: string) => void;
    token: string | null;
    refreshToken: string | null;
}
export declare type CreateAuthStoreResult = UseBoundStore<AuthStore, StoreApi<AuthStore>>;
export declare function createAuthenticationStore(options: AuthStoreOptions): CreateAuthStoreResult;
export {};
