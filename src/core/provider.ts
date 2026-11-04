import { AxiosAdapter, AxiosInstance } from 'axios';

import { createHttpClient, ProxyRouter } from './http';
import { IProviderStats, ProxyConfig } from './types';

export type ProviderCategory = 'ANIME' | 'MANGA' | 'MOVIES';

/**
 * Base class for every provider. Category parsers (`MangaParser`, ...) extend
 * it, and providers extend those, so a provider never needs to touch this file.
 */
abstract class BaseProvider {
  /** Name of the provider, e.g. `MangaDex`. */
  abstract readonly name: string;

  /** The main URL of the provider. */
  protected abstract readonly baseUrl: string;

  /** Set by the category parser, e.g. `MANGA`. */
  protected abstract readonly category: ProviderCategory;

  /**
   * Languages the provider serves, in
   * [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format.
   */
  protected readonly languages: string[] | string = 'en';

  /** Set to `true` if the provider **only** serves NSFW content. */
  readonly isNSFW: boolean = false;

  /** Logo URL (128x128px preferred), if the provider has one. */
  protected readonly logo?: string;

  /** Set to `false` if the provider is down or not working. */
  readonly isWorking: boolean = true;

  /** HTTP client for all requests. Applies the proxy, a timeout, and error tagging. */
  protected readonly client: AxiosInstance;

  private readonly proxy = new ProxyRouter();

  /**
   * @param proxyConfig Proxy to send requests through (optional)
   * @param adapter Custom axios adapter, e.g. for fixtures in tests (optional)
   */
  constructor(proxyConfig?: ProxyConfig, adapter?: AxiosAdapter) {
    this.client = createHttpClient(() => this.name, this.proxy);
    if (proxyConfig) this.setProxy(proxyConfig);
    if (adapter) this.setAxiosAdapter(adapter);
  }

  /** Search the provider. */
  abstract search(query: string, ...args: any[]): Promise<unknown>;

  /** Set or change the proxy. Pass an array of URLs to rotate between them. */
  setProxy(proxyConfig: ProxyConfig): void {
    this.proxy.set(proxyConfig);
  }

  /** Set or change the axios adapter. */
  setAxiosAdapter(adapter: AxiosAdapter): void {
    this.client.defaults.adapter = adapter;
  }

  /** Where the provider lives in the public API, e.g. `MANGA.MangaDex`. */
  get classPath(): string {
    return `${this.category}.${this.constructor.name}`;
  }

  /** Provider metadata. */
  get stats(): IProviderStats {
    return {
      name: this.name,
      baseUrl: this.baseUrl,
      lang: this.languages,
      isNSFW: this.isNSFW,
      logo: this.logo,
      classPath: this.classPath,
      isWorking: this.isWorking,
    };
  }

  /** @deprecated Use `stats` instead. */
  get toString(): IProviderStats {
    return this.stats;
  }
}

export default BaseProvider;
