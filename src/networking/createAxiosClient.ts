import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { UseBoundStore, StoreApi } from "zustand";
import { CreateAuthStoreResult } from "./createAuthenticationStore";
import { GetAuthHeaderFunction } from "./initializeSimpleNetworking";

export type AxiosOptions = {
    axiosConfig?: AxiosRequestConfig,
    refresh: (token: string)=>Promise<string>,
    attemptRefreshOnStatusCodes?: number[],
    defaultHeaders?: {[name: string]: string},
    getAuthHeader?: GetAuthHeaderFunction
}

function shortenData(data: {[key: string]: any} | string) {
    if(typeof data == 'string') return data.slice(0, 400)
    var r: any = {};
    console.log("Data: ")
    console.log(typeof data);
    for(var key in data) {
        r[key] = JSON.stringify(data[key])
    }
    return r
}

export default function createAxiosClient({
    axiosConfig,
    refresh,
    attemptRefreshOnStatusCodes=[401, 498],
    authStore,
    defaultHeaders,
    getAuthHeader
}: AxiosOptions & {
    authStore: CreateAuthStoreResult
}) {
    const defaultAxiosConfig: AxiosRequestConfig = {
        ...axiosConfig,
        headers: {
            'Content-Type': 'application/json',
            ...axiosConfig?.headers, 
        },
    }
    axios.defaults.headers.common = {
        'Content-Type': 'application/json',
        ...defaultHeaders,
    }
    
    const axiosClient = axios.create(defaultAxiosConfig);

    if(defaultHeaders) {
        axiosClient.interceptors.request.use(config=>{
            config.headers = {
                ...config.headers,
                ...defaultHeaders,
            }
            return config;
        })
    }
    
    // Authentication Interceptor - Automatically add the token to request header if it exists and the user is logged in.
    axiosClient.interceptors.request.use(config => {
        const authStoreState = authStore.getState();
        if (authStoreState.isLoggedIn && authStoreState.token) {
            if(getAuthHeader) {
                const {headerKey, headerValue} = getAuthHeader(authStoreState.token);
                config.headers = {
                    ...config.headers,
                    [headerKey]: headerValue
                }
            } else {
                config.headers = {
                    ...config.headers,
                    'authorization': 'Bearer ' + authStoreState.token,
                }
            }
           
        }
        return config;
    })

    // logging
    axiosClient.interceptors.request.use((config) => {
        console.log(`REQUEST - ${config.method} ${config.url}`);
        return config;
    })

    axiosClient.interceptors.response.use(response=>{
        const {config} = response;
        
        console.log(`SUCCESSFUL RESPONSE - ${config.method} ${config.url}`);
        return response;
    })

    // Handle refreshing 
    const isRetryingLoginRef: {
        value: boolean,
        retryingPromise: null | Promise<AxiosRequestConfig>,
    } = {
        value: false,
        retryingPromise: null, // Use this to stall requests 
    }

    // Stall requests when a refresh attempt is happening
    axiosClient.interceptors.request.use(async (config) => {
        if (isRetryingLoginRef.retryingPromise) await isRetryingLoginRef.retryingPromise;
        return config;
    })

    const onUnauthorizedRequest = async (config: AxiosRequestConfig) => {
        if (isRetryingLoginRef.value) return;

        isRetryingLoginRef.value = true;
        
        if (!authStore.getState().refreshToken) {
            console.log("Couldn't refresh, no refresh token.");
            isRetryingLoginRef.value = false;
            throw new Error("Unauthorized request, couldn't attempt refresh.")
        }

        isRetryingLoginRef.retryingPromise = new Promise((resolve, reject) => {
            function done(failed = false) {
                isRetryingLoginRef.value = false;
                isRetryingLoginRef.retryingPromise = null;
                if (failed) {
                    reject();
                    authStore.getState().logout();
                    throw "Unauthorized request and refresh failed."
                } else {
                    resolve(axiosClient(config));
                };
            }
            if (!authStore.getState().refreshToken) {
                console.log("No refresh token. Failed refresh.")
                done(true);
                return;
            }
            const refreshToken = authStore.getState().refreshToken!;
            refresh(refreshToken).then(token => {
                console.log("Refreshed with token " + refreshToken)
                authStore.getState().setAccessToken(token);
                done();
            }).catch((e) => {

                if(axios.isAxiosError(e)) {
                    logAxiosError(e);
                } else {
                    console.log("Refresh failed with non axios error: ")
                    console.log(JSON.stringify(e, null, 4));
                }
                done(true);
            });
        })
        return await isRetryingLoginRef.retryingPromise;
    }

    async function logReport(config: AxiosRequestConfig, name: string,) {
        const report: any = {};
        if (config.data) {
            try {
                report.dataKeys = Object.keys(JSON.parse(config.data));
            } catch {
                report.dataKeys = Object.keys(config.data)
            }
        };
        console.log("Config headers in log report: " + config.headers)
        report.headers = config.headers;
        report.method = config.method;
        report.url = config.url;
        if(config.baseURL)
            report.baseUrl = config.baseURL;
        console.log(name + " Report: ")
        console.log(JSON.stringify(report, null, 4))
    }

    // Handle errors.
    async function logAxiosError(error: AxiosError) {
        if(!axios.isAxiosError(error)) {
            console.log("Non axios error: ")
            try {
                console.log(JSON.stringify(error, null, 4));
            } catch {
                console.log(error);
            }
            return;
        }
        if(!error.config) {
            console.log("Error had no config...")
            return
        }
        const report: {[key: string]: any} = {};
        report.request = {} 
        report.request.headers = error.config.headers;
        report.request.data = shortenData(error.config.data);
        try {
            report.response = {
                data:  JSON.parse(shortenData(typeof error.response?.data=='string'?JSON.parse(error.response.data):error.response?.data)), 
                headers: error.response?.headers,
                code: error.response?.status
            }
        } catch (e) {
            console.log("Networking Error Handler - Couldn't parse json for response report, raw data is ")
            console.log(error.response?.data)
        }
       
        // For easier copy / pasting
        console.log("Axios Error Report:")
        console.log(JSON.stringify(report, null, 4))
    }

    axiosClient.interceptors.response.use(undefined, async (error: AxiosError) => {
        if ('response' in error && error.response && (attemptRefreshOnStatusCodes.includes(error.response.status))) {
            if(!authStore.getState().refreshToken) {
                logAxiosError(error);
                throw error
            };

            if(isRetryingLoginRef.value) {
                await isRetryingLoginRef.retryingPromise;
                axiosClient(error.config);
                return;
            }
            
            return await onUnauthorizedRequest(error.config);
        } else {
            await logAxiosError(error);
            throw error;
        }
    })
    return axiosClient;
}

