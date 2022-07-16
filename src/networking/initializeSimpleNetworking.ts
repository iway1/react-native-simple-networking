import axios from "axios";
import { AuthStoreOptions, createAuthenticationStore, CreateAuthStoreResult } from "./createAuthenticationStore";
import createAxiosClient, { AxiosOptions } from "./createAxiosClient";

export type GetAuthHeaderFunction = (accessToken: string)=>{headerKey: string, headerValue: string};

export default function initializeSimpleNetworking({
    axiosOptions,
    authStoreOptions,
    getAuthHeader,
} : {
    axiosOptions: AxiosOptions,
    authStoreOptions?: AuthStoreOptions,
    getAuthHeader?: GetAuthHeaderFunction
}) : {
    useAuthStore: CreateAuthStoreResult,
    axiosClient: ReturnType<typeof axios.create>,
    
} {
    const useAuthStore = createAuthenticationStore(authStoreOptions?authStoreOptions:{});
    const axiosClient = createAxiosClient({
        ...axiosOptions,
        authStore: useAuthStore,
        getAuthHeader
    });
    return {
        useAuthStore,
        axiosClient,
    };
}