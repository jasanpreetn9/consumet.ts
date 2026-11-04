import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

import axios, { AxiosAdapter, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * Test helper: an axios adapter that replays saved responses from
 * `<dir>/fixtures/`, so provider tests run offline and don't break when a site
 * is down. Not part of the published package.
 *
 * Record (or refresh) a provider's fixtures against the live site with:
 *
 *   RECORD=1 yarn test src/providers/manga/<name>
 *
 * @param dir The provider's folder; pass `__dirname` from its test file.
 */
export const fixtureAdapter = (dir: string): AxiosAdapter => {
  const record = process.env.RECORD === '1';
  const live = axios.getAdapter(['http']);
  const fixturesDir = join(dir, 'fixtures');

  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const method = (config.method ?? 'get').toUpperCase();
    const url = axios.getUri(config);
    const file = join(fixturesDir, fixtureName(method, url, config.data));

    if (record) {
      let response: AxiosResponse;
      try {
        response = await live(config);
      } catch (error) {
        const failed = (error as AxiosError).response;
        if (failed) save(file, method, url, failed);
        throw error;
      }
      save(file, method, url, response);
      return response;
    }

    if (!existsSync(file)) {
      throw new Error(
        `No fixture for ${method} ${url}. Record one with: RECORD=1 yarn test ${relative(process.cwd(), dir)}`,
      );
    }

    const saved = JSON.parse(readFileSync(file, 'utf8'));
    const response: AxiosResponse = {
      data: saved.data,
      status: saved.status,
      statusText: saved.statusText ?? '',
      headers: saved.headers ?? {},
      config,
      request: {},
    };
    if (config.validateStatus && !config.validateStatus(response.status)) {
      throw new AxiosError(
        `Request failed with status code ${response.status}`,
        response.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
        config,
        response.request,
        response,
      );
    }
    return response;
  };
};

const fixtureName = (method: string, url: string, body: unknown): string => {
  const hash = createHash('sha1')
    .update(`${method} ${url} ${typeof body === 'string' ? body : JSON.stringify(body ?? '')}`)
    .digest('hex')
    .slice(0, 10);
  const { hostname, pathname } = new URL(url);
  const slug = `${hostname}${pathname}`
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
  return `${method.toLowerCase()}-${slug}-${hash}.json`;
};

const save = (file: string, method: string, url: string, response: AxiosResponse): void => {
  mkdirSync(join(file, '..'), { recursive: true });
  const contentType = response.headers?.['content-type'];
  const fixture = {
    method,
    url,
    status: response.status,
    statusText: response.statusText,
    headers: contentType ? { 'content-type': String(contentType) } : {},
    data: response.data,
  };
  writeFileSync(file, JSON.stringify(fixture, null, 2) + '\n');
};
