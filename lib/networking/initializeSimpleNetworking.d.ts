import axios from "axios";
import { AuthStoreOptions, CreateAuthStoreResult } from "./createAuthenticationStore";
import { AxiosOptions } from "./createAxiosClient";
export declare type GetAuthHeaderFunction = (accessToken: string) => {
    headerKey: string;
    headerValue: string;
};
export default function initializeSimpleNetworking({ axiosOptions, authStoreOptions, getAuthHeader, }: {
    axiosOptions: AxiosOptions;
    authStoreOptions?: AuthStoreOptions;
    getAuthHeader?: GetAuthHeaderFunction;
}): {
    useAuthStore: CreateAuthStoreResult;
    axiosClient: ReturnType<typeof axios.create>;
};
