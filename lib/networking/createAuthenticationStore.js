"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthenticationStore = void 0;
const zustand_1 = __importDefault(require("zustand"));
const middleware_1 = require("zustand/middleware");
const immer_1 = __importDefault(require("immer"));
const REFRESH_TOKEN_KEY = 'refreshtoken';
const ACCESS_TOKEN_KEY = 'accesstoken';
function createAuthenticationStore(options) {
    const sessionRefreshToken = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(REFRESH_TOKEN_KEY) ? sessionStorage.getItem(REFRESH_TOKEN_KEY) : null;
    const sessionAccessToken = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(ACCESS_TOKEN_KEY) ? sessionStorage.getItem(ACCESS_TOKEN_KEY) : null;
    const shouldUseSessionStorage = sessionRefreshToken && sessionAccessToken && options.browserTokenStorage === 'sessionStorage';
    const token = (shouldUseSessionStorage ? sessionAccessToken : (options.defaultCredentials ? options.defaultCredentials.token : null));
    const refreshToken = (shouldUseSessionStorage ? sessionRefreshToken : (options.defaultCredentials ? options.defaultCredentials.refreshToken : null));
    const state = (set, get) => ({
        isLoggedIn: !!shouldUseSessionStorage || !!options.defaultCredentials,
        token,
        refreshToken,
        login: (token, refreshToken) => {
            set(old => (0, immer_1.default)(old, draft => {
                draft.isLoggedIn = true;
                draft.token = token;
                draft.refreshToken = refreshToken;
            }));
            if (options.onTokensChange)
                options.onTokensChange({ access: token, refresh: refreshToken });
        },
        logout: () => {
            console.log('Called logout in state.');
            set(old => (0, immer_1.default)(old, draft => {
                draft.isLoggedIn = false;
                draft.token = null;
                draft.refreshToken = null;
            }));
            if (options.onLogout)
                options.onLogout();
        },
        setAccessToken: (v) => {
            set({ token: v });
            if (options.onTokensChange) {
                const refreshToken = get().refreshToken;
                if (refreshToken)
                    options.onTokensChange({ access: v, refresh: refreshToken });
            }
        },
    });
    const r = options.persistence ? (0, zustand_1.default)((0, middleware_1.persist)(state, {
        name: options.persistence.name,
        getStorage: () => ({
            getItem: options.persistence.getItem,
            setItem: options.persistence.setItem,
            removeItem: options.persistence.removeItem
        })
    })) : (0, zustand_1.default)(state);
    return r;
}
exports.createAuthenticationStore = createAuthenticationStore;
