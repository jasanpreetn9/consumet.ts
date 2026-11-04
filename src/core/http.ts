import axios, { AxiosInstance } from 'axios';

import { ProviderError } from './errors';
import { ProxyConfig } from './types';

const VALID_URL = /^https?:\/\/.+/;
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_ROTATE_INTERVAL_MS = 5_000;

/**
 * Holds the active proxy settings. The HTTP client reads from it on every
 * request, so changing or rotating the proxy never adds interceptors.
 */
export class ProxyRouter {
  private urls: string[] = [];
  private timer?: ReturnType<typeof setInterval>;
  key?: string;
  encodeUrl = false;

  set(config?: ProxyConfig): void {
    this.stop();

    const urls = config?.url ? ([] as string[]).concat(config.url) : [];
    urls.forEach((url, i) => {
      if (!VALID_URL.test(url))
        throw new Error(urls.length > 1 ? `Proxy URL at index ${i} is invalid!` : 'Proxy URL is invalid!');
    });

    this.urls = urls;
    this.key = config?.key;
    this.encodeUrl = Boolean(config?.encodeUrl);

    if (urls.length > 1) {
      this.timer = setInterval(
        () => this.urls.push(this.urls.shift()!),
        config?.rotateInterval ?? DEFAULT_ROTATE_INTERVAL_MS,
      );
      // Don't keep the Node process alive just to rotate proxies.
      this.timer.unref?.();
    }
  }

  /** Stops proxy rotation, if it is running. */
  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  /** The proxy URL requests currently go through, if any. */
  get current(): string | undefined {
    return this.urls[0];
  }
}

/**
 * Creates the axios instance a provider uses for every request. It applies the
 * proxy from `proxy`, sets a default timeout, and turns failed requests into
 * `ProviderError`s tagged with the provider's name.
 */
export const createHttpClient = (providerName: () => string, proxy: ProxyRouter): AxiosInstance => {
  const client = axios.create({ timeout: DEFAULT_TIMEOUT_MS });

  client.interceptors.request.use(config => {
    const proxyUrl = proxy.current;
    if (!proxyUrl) return config;

    // Resolve baseURL + url + params into one absolute URL before wrapping it.
    const target = client.getUri(config);
    config.url = proxy.encodeUrl ? `${proxyUrl}${encodeURIComponent(target)}` : `${proxyUrl}${target}`;
    config.baseURL = undefined;
    config.params = undefined;
    config.headers.set('x-api-key', proxy.key ?? '');
    return config;
  });

  client.interceptors.response.use(
    response => {
      // CORS proxies like allorigins wrap the body as { contents: "..." }.
      if (
        proxy.current &&
        proxy.encodeUrl &&
        response.data &&
        typeof response.data === 'object' &&
        'contents' in response.data
      ) {
        response.data = response.data.contents;
      }
      return response;
    },
    error => {
      if (!axios.isAxiosError(error)) throw error;
      const status = error.response?.status;
      const url = error.config ? client.getUri(error.config) : undefined;
      const method = error.config?.method?.toUpperCase() ?? 'GET';
      throw new ProviderError(
        `[${providerName()}] ${error.message} (${method} ${url ?? 'unknown URL'})`,
        providerName(),
        url,
        status,
        { cause: error },
      );
    },
  );

  return client;
};
