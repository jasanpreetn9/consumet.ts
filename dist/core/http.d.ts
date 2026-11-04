import { AxiosInstance } from 'axios';
import { ProxyConfig } from './types';
/**
 * Holds the active proxy settings. The HTTP client reads from it on every
 * request, so changing or rotating the proxy never adds interceptors.
 */
export declare class ProxyRouter {
    private urls;
    private timer?;
    key?: string;
    encodeUrl: boolean;
    set(config?: ProxyConfig): void;
    /** Stops proxy rotation, if it is running. */
    stop(): void;
    /** The proxy URL requests currently go through, if any. */
    get current(): string | undefined;
}
/**
 * Creates the axios instance a provider uses for every request. It applies the
 * proxy from `proxy`, sets a default timeout, and turns failed requests into
 * `ProviderError`s tagged with the provider's name.
 */
export declare const createHttpClient: (providerName: () => string, proxy: ProxyRouter) => AxiosInstance;
