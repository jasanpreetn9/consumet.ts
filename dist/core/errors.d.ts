/**
 * Thrown for any failed HTTP request a provider makes, so callers can tell
 * which provider failed, on which URL, and with what status.
 */
export declare class ProviderError extends Error {
    /** Name of the provider that made the request, e.g. `MangaDex`. */
    readonly provider: string;
    /** The URL that was requested (after any proxy rewriting). */
    readonly url?: string | undefined;
    /** HTTP status code, if the server responded. */
    readonly status?: number | undefined;
    readonly name = "ProviderError";
    constructor(message: string, 
    /** Name of the provider that made the request, e.g. `MangaDex`. */
    provider: string, 
    /** The URL that was requested (after any proxy rewriting). */
    url?: string | undefined, 
    /** HTTP status code, if the server responded. */
    status?: number | undefined, options?: {
        cause?: unknown;
    });
}
