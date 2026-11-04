"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderError = void 0;
/**
 * Thrown for any failed HTTP request a provider makes, so callers can tell
 * which provider failed, on which URL, and with what status.
 */
class ProviderError extends Error {
    provider;
    url;
    status;
    name = 'ProviderError';
    constructor(message, 
    /** Name of the provider that made the request, e.g. `MangaDex`. */
    provider, 
    /** The URL that was requested (after any proxy rewriting). */
    url, 
    /** HTTP status code, if the server responded. */
    status, options) {
        super(message, options);
        this.provider = provider;
        this.url = url;
        this.status = status;
    }
}
exports.ProviderError = ProviderError;
//# sourceMappingURL=errors.js.map