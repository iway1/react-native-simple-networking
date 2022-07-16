"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
function shortenData(data) {
    if (typeof data == 'string')
        return data.slice(0, 400);
    var r = {};
    console.log("Data: ");
    console.log(typeof data);
    for (var key in data) {
        r[key] = JSON.stringify(data[key]);
    }
    return r;
}
function createAxiosClient({ axiosConfig, refresh, attemptRefreshOnStatusCodes = [401, 498], authStore, defaultHeaders, getAuthHeader }) {
    const defaultAxiosConfig = {
        ...axiosConfig,
        headers: {
            'Content-Type': 'application/json',
            ...axiosConfig === null || axiosConfig === void 0 ? void 0 : axiosConfig.headers,
        },
    };
    axios_1.default.defaults.headers.common = {
        'Content-Type': 'application/json',
        ...defaultHeaders,
    };
    const axiosClient = axios_1.default.create(defaultAxiosConfig);
    if (defaultHeaders) {
        axiosClient.interceptors.request.use(config => {
            config.headers = {
                ...config.headers,
                ...defaultHeaders,
            };
            return config;
        });
    }
    // Authentication Interceptor - Automatically add the token to request header if it exists and the user is logged in.
    axiosClient.interceptors.request.use(config => {
        const authStoreState = authStore.getState();
        if (authStoreState.isLoggedIn && authStoreState.token) {
            if (getAuthHeader) {
                const { headerKey, headerValue } = getAuthHeader(authStoreState.token);
                config.headers = {
                    ...config.headers,
                    [headerKey]: headerValue
                };
            }
            else {
                config.headers = {
                    ...config.headers,
                    'authorization': 'Bearer ' + authStoreState.token,
                };
            }
        }
        return config;
    });
    // logging
    axiosClient.interceptors.request.use((config) => {
        console.log(`REQUEST - ${config.method} ${config.url}`);
        return config;
    });
    axiosClient.interceptors.response.use(response => {
        const { config } = response;
        console.log(`SUCCESSFUL RESPONSE - ${config.method} ${config.url}`);
        return response;
    });
    // Handle refreshing 
    const isRetryingLoginRef = {
        value: false,
        retryingPromise: null, // Use this to stall requests 
    };
    // Stall requests when a refresh attempt is happening
    axiosClient.interceptors.request.use(async (config) => {
        if (isRetryingLoginRef.retryingPromise)
            await isRetryingLoginRef.retryingPromise;
        return config;
    });
    const onUnauthorizedRequest = async (config) => {
        if (isRetryingLoginRef.value)
            return;
        isRetryingLoginRef.value = true;
        if (!authStore.getState().refreshToken) {
            console.log("Couldn't refresh, no refresh token.");
            isRetryingLoginRef.value = false;
            throw new Error("Unauthorized request, couldn't attempt refresh.");
        }
        isRetryingLoginRef.retryingPromise = new Promise((resolve, reject) => {
            function done(failed = false) {
                isRetryingLoginRef.value = false;
                isRetryingLoginRef.retryingPromise = null;
                if (failed) {
                    reject();
                    authStore.getState().logout();
                    throw "Unauthorized request and refresh failed.";
                }
                else {
                    resolve(axiosClient(config));
                }
                ;
            }
            if (!authStore.getState().refreshToken) {
                console.log("No refresh token. Failed refresh.");
                done(true);
                return;
            }
            const refreshToken = authStore.getState().refreshToken;
            refresh(refreshToken).then(token => {
                console.log("Refreshed with token " + refreshToken);
                authStore.getState().setAccessToken(token);
                done();
            }).catch((e) => {
                if (axios_1.default.isAxiosError(e)) {
                    logAxiosError(e);
                }
                else {
                    console.log("Refresh failed with non axios error: ");
                    console.log(JSON.stringify(e, null, 4));
                }
                done(true);
            });
        });
        return await isRetryingLoginRef.retryingPromise;
    };
    async function logReport(config, name) {
        const report = {};
        if (config.data) {
            try {
                report.dataKeys = Object.keys(JSON.parse(config.data));
            }
            catch {
                report.dataKeys = Object.keys(config.data);
            }
        }
        ;
        console.log("Config headers in log report: " + config.headers);
        report.headers = config.headers;
        report.method = config.method;
        report.url = config.url;
        if (config.baseURL)
            report.baseUrl = config.baseURL;
        console.log(name + " Report: ");
        console.log(JSON.stringify(report, null, 4));
    }
    // Handle errors.
    async function logAxiosError(error) {
        var _a, _b, _c, _d, _e;
        if (!axios_1.default.isAxiosError(error)) {
            console.log("Non axios error: ");
            try {
                console.log(JSON.stringify(error, null, 4));
            }
            catch {
                console.log(error);
            }
            return;
        }
        if (!error.config) {
            console.log("Error had no config...");
            return;
        }
        const report = {};
        report.request = {};
        report.request.headers = error.config.headers;
        report.request.data = shortenData(error.config.data);
        try {
            report.response = {
                data: JSON.parse(shortenData(typeof ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) == 'string' ? JSON.parse(error.response.data) : (_b = error.response) === null || _b === void 0 ? void 0 : _b.data)),
                headers: (_c = error.response) === null || _c === void 0 ? void 0 : _c.headers,
                code: (_d = error.response) === null || _d === void 0 ? void 0 : _d.status
            };
        }
        catch (e) {
            console.log("Networking Error Handler - Couldn't parse json for response report, raw data is ");
            console.log((_e = error.response) === null || _e === void 0 ? void 0 : _e.data);
        }
        // For easier copy / pasting
        console.log("Axios Error Report:");
        console.log(JSON.stringify(report, null, 4));
    }
    axiosClient.interceptors.response.use(undefined, async (error) => {
        if ('response' in error && error.response && (attemptRefreshOnStatusCodes.includes(error.response.status))) {
            if (!authStore.getState().refreshToken) {
                logAxiosError(error);
                throw error;
            }
            ;
            if (isRetryingLoginRef.value) {
                await isRetryingLoginRef.retryingPromise;
                axiosClient(error.config);
                return;
            }
            return await onUnauthorizedRequest(error.config);
        }
        else {
            await logAxiosError(error);
            throw error;
        }
    });
    return axiosClient;
}
exports.default = createAxiosClient;
