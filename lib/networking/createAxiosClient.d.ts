import { AxiosRequestConfig } from "axios";
import { CreateAuthStoreResult } from "./createAuthenticationStore";
import { GetAuthHeaderFunction } from "./initializeSimpleNetworking";
export declare type AxiosOptions = {
    axiosConfig?: AxiosRequestConfig;
    refresh: (token: string) => Promise<string>;
    attemptRefreshOnStatusCodes?: number[];
    defaultHeaders?: {
        [name: string]: string;
    };
    getAuthHeader?: GetAuthHeaderFunction;
};
export default function createAxiosClient({ axiosConfig, refresh, attemptRefreshOnStatusCodes, authStore, defaultHeaders, getAuthHeader }: AxiosOptions & {
    authStore: CreateAuthStoreResult;
}): import("axios").AxiosInstance;
