import axios from "axios";
import { AuthStoreOptions, CreateAuthStoreResult } from "./createAuthenticationStore";
import { AxiosOptions } from "./createAxiosClient";
export default function initializeSimpleNetworking({ axiosOptions, authStoreOptions, }: {
    axiosOptions: AxiosOptions;
    authStoreOptions?: AuthStoreOptions;
}): {
    useAuthStore: CreateAuthStoreResult;
    axiosClient: ReturnType<typeof axios.create>;
};
