import axios from "axios";
import { AuthStoreOptions, createAuthenticationStore, CreateAuthStoreResult } from "./createAuthenticationStore";
import createAxiosClient, { AxiosOptions } from "./createAxiosClient";

export default function initializeSimpleNetworking({
    axiosOptions,
    authStoreOptions,
} : {
    axiosOptions: AxiosOptions,
    authStoreOptions?: AuthStoreOptions
}) : {
    useAuthStore: CreateAuthStoreResult,
    axiosClient: ReturnType<typeof axios.create>,
} {
    const useAuthStore = createAuthenticationStore(authStoreOptions?authStoreOptions:{});
    const axiosClient = createAxiosClient({
        ...axiosOptions,
        authStore: useAuthStore,
    });
    return {
        useAuthStore,
        axiosClient,
    };
}