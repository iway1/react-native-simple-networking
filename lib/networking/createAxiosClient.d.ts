import { AxiosRequestConfig } from "axios";
import { CreateAuthStoreResult } from "./createAuthenticationStore";
export declare type AxiosOptions = {
    axiosConfig?: AxiosRequestConfig;
    refresh: (token: string) => Promise<string>;
    attemptRefreshOnStatusCodes?: number[];
    defaultHeaders?: {
        [name: string]: string;
    };
};
export default function createAxiosClient({ axiosConfig, refresh, attemptRefreshOnStatusCodes, authStore, defaultHeaders, }: AxiosOptions & {
    authStore: CreateAuthStoreResult;
}): import("axios").AxiosInstance;
