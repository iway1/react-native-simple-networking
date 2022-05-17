"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const createAuthenticationStore_1 = require("./createAuthenticationStore");
const createAxiosClient_1 = __importDefault(require("./createAxiosClient"));
function initializeSimpleNetworking({ axiosOptions, authStoreOptions, }) {
    const useAuthStore = (0, createAuthenticationStore_1.createAuthenticationStore)(authStoreOptions ? authStoreOptions : {});
    const axiosClient = (0, createAxiosClient_1.default)({
        ...axiosOptions,
        authStore: useAuthStore,
    });
    return {
        useAuthStore,
        axiosClient,
    };
}
exports.default = initializeSimpleNetworking;
