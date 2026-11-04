"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("./http");
/**
 * Base class for every provider. Category parsers (`MangaParser`, ...) extend
 * it, and providers extend those, so a provider never needs to touch this file.
 */
class BaseProvider {
    /**
     * Languages the provider serves, in
     * [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) format.
     */
    languages = 'en';
    /** Set to `true` if the provider **only** serves NSFW content. */
    isNSFW = false;
    /** Logo URL (128x128px preferred), if the provider has one. */
    logo;
    /** Set to `false` if the provider is down or not working. */
    isWorking = true;
    /** HTTP client for all requests. Applies the proxy, a timeout, and error tagging. */
    client;
    proxy = new http_1.ProxyRouter();
    /**
     * @param proxyConfig Proxy to send requests through (optional)
     * @param adapter Custom axios adapter, e.g. for fixtures in tests (optional)
     */
    constructor(proxyConfig, adapter) {
        this.client = (0, http_1.createHttpClient)(() => this.name, this.proxy);
        if (proxyConfig)
            this.setProxy(proxyConfig);
        if (adapter)
            this.setAxiosAdapter(adapter);
    }
    /** Set or change the proxy. Pass an array of URLs to rotate between them. */
    setProxy(proxyConfig) {
        this.proxy.set(proxyConfig);
    }
    /** Set or change the axios adapter. */
    setAxiosAdapter(adapter) {
        this.client.defaults.adapter = adapter;
    }
    /** Where the provider lives in the public API, e.g. `MANGA.MangaDex`. */
    get classPath() {
        return `${this.category}.${this.constructor.name}`;
    }
    /** Provider metadata. */
    get stats() {
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
    get toString() {
        return this.stats;
    }
}
exports.default = BaseProvider;
//# sourceMappingURL=provider.js.map