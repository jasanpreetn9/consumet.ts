/**
 * Thrown for any failed HTTP request a provider makes, so callers can tell
 * which provider failed, on which URL, and with what status.
 */
export class ProviderError extends Error {
  override readonly name = 'ProviderError';

  constructor(
    message: string,
    /** Name of the provider that made the request, e.g. `MangaDex`. */
    readonly provider: string,
    /** The URL that was requested (after any proxy rewriting). */
    readonly url?: string,
    /** HTTP status code, if the server responded. */
    readonly status?: number,
    options?: { cause?: unknown },
  ) {
    super(message, options);
  }
}
