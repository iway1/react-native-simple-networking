import create, { GetState, SetState, StateCreator, StoreApi, UseBoundStore } from 'zustand';
import { persist } from 'zustand/middleware';
import produce from 'immer';

export interface AuthStoreOptions {
    persistence?: {
        getItem: (key: string) => Promise<string | null> | (string | null),
        setItem: (key: string, value: string) => void | Promise<void>,
        removeItem: (key: string)=>(void | Promise<void>),
        name: string,
    },
    onTokensChange?: (tokens: {access: string, refresh: string})=>void,
    defaultCredentials?: {
        token: string,
        refreshToken: string,
    },
    browserTokenStorage?: 'none' | 'sessionStorage';
    onLogout?: ()=>void,
}

interface AuthStore {
    isLoggedIn: boolean,
    login: (token: string, refreshToken: string) => void,
    logout: () => void,
    setAccessToken: (v: string) => void,
    token: string | null,
    refreshToken: string | null,
}

const REFRESH_TOKEN_KEY = 'refreshtoken';
const ACCESS_TOKEN_KEY = 'accesstoken';

export type CreateAuthStoreResult =  UseBoundStore<AuthStore, StoreApi<AuthStore>>;

export function createAuthenticationStore(options: AuthStoreOptions): CreateAuthStoreResult{

    const sessionRefreshToken = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(REFRESH_TOKEN_KEY)?sessionStorage.getItem(REFRESH_TOKEN_KEY):null;
    const sessionAccessToken = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(ACCESS_TOKEN_KEY)?sessionStorage.getItem(ACCESS_TOKEN_KEY):null;
    const shouldUseSessionStorage = sessionRefreshToken && sessionAccessToken && options.browserTokenStorage === 'sessionStorage';
    const token = (shouldUseSessionStorage?sessionAccessToken!:(options.defaultCredentials?options.defaultCredentials.token:null));
    const refreshToken = (shouldUseSessionStorage?sessionRefreshToken!:(options.defaultCredentials?options.defaultCredentials.refreshToken:null));

    const state: StateCreator<AuthStore, SetState<AuthStore>, GetState<AuthStore>> = (set, get) => ({
        isLoggedIn: !!shouldUseSessionStorage || !!options.defaultCredentials,
        token,
        refreshToken,
        login: (token: string, refreshToken: string,) => {
            set(old => produce(old, draft => {
                draft.isLoggedIn = true;
                draft.token = token;
                draft.refreshToken = refreshToken;
            }));
            if(options.onTokensChange) options.onTokensChange({access: token, refresh: refreshToken})
        },
        logout: () => {
            console.log('Called logout in state.')
            set(old => produce(old, draft => {
                draft.isLoggedIn = false;
                draft.token = null;
                draft.refreshToken = null;
            }));
            if(options.onLogout) options.onLogout();
        },
        setAccessToken: (v: string) => {
            set({ token: v });
            if(options.onTokensChange) {
                const refreshToken = get().refreshToken;
                if(refreshToken)
                    options.onTokensChange({access: v, refresh: refreshToken})
            }
        },
    })

    const r = options.persistence ? create(persist(state, {
        name: options.persistence.name,
        getStorage: () => ({
            getItem: options.persistence!.getItem,
            setItem: options.persistence!.setItem,
            removeItem: options.persistence!.removeItem
        })
    })) : create(state);
    return r;
}