/**
 * FlixCloud embed extractor (the video host ReAnime's servers point to).
 *
 * The embed page is a SvelteKit app whose data payload hides the stream:
 *   1. Field names are derived from `obfuscation_seed` by chained SHA-256.
 *   2. Those fields hold a token, two key fragments and an AES IV.
 *   3. `/api/m3u8/<token>` returns the AES-encrypted master URL and a third
 *      key fragment, under keys that are also SHA-256 derived.
 *   4. The page's WebAssembly module combines the three fragments into key
 *      material (and a 32-byte playlist XOR key).
 *   5. PBKDF2 + SHA-256 turn that into an AES-256-CBC key for the master URL.
 *
 * Protocol worked out with reference to UltraSrc's FlixCloud extractor.
 */
import { createDecipheriv, createHash, pbkdf2Sync } from 'node:crypto';

import { AxiosInstance } from 'axios';

import { Intro, ISource, ISubtitle } from '../../../core';

const sha256Hex = (value: string): string => createHash('sha256').update(value).digest('hex');

/** Hashes `value` three times, appending the round number each time. */
const chainHash = (value: string): string => {
  let hash = value;
  for (let round = 0; round < 3; round++) hash = sha256Hex(hash + round);
  return hash;
};

/** Field names in the payload, derived from the page's obfuscation seed. */
export const flixFieldNames = (seed: string) => {
  const e = chainHash(seed);
  const a = chainHash(e);
  return {
    key: `kf_${e.slice(8, 16)}`,
    iv: `ivf_${e.slice(16, 24)}`,
    container: `cd_${e.slice(24, 32)}`,
    array: `ad_${e.slice(32, 40)}`,
    object: `od_${e.slice(40, 48)}`,
    token: `${e.slice(48, 64)}_${e.slice(56, 64)}`,
    keyFragment2: `${a.slice(0, 16)}_${a.slice(16, 24)}`,
  };
};

/**
 * Converts a JavaScript object literal (unquoted keys, `undefined`, `void 0`)
 * to JSON so it can be parsed without evaluating any of the page's code.
 */
export const jsLiteralToJson = (literal: string): string => {
  let out = '';
  let i = 0;
  while (i < literal.length) {
    const ch = literal[i];
    if (ch === '"' || ch === "'") {
      // Copy a string literal, re-quoting single-quoted strings for JSON.
      let j = i + 1;
      let body = '';
      while (j < literal.length && literal[j] !== ch) {
        if (literal[j] === '\\') {
          body += literal[j] + literal[j + 1];
          j += 2;
        } else {
          body += literal[j] === '"' ? '\\"' : literal[j];
          j++;
        }
      }
      out += `"${ch === "'" ? body.replace(/\\'/g, "'") : body}"`;
      i = j + 1;
    } else if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < literal.length && /[\w$]/.test(literal[j])) j++;
      const word = literal.slice(i, j);
      const rest = literal.slice(j).match(/^\s*:/);
      if (rest) out += `"${word}"`;
      else if (word === 'undefined') out += 'null';
      else if (word === 'void' && /^\s*0/.test(literal.slice(j))) {
        out += 'null';
        j = literal.indexOf('0', j) + 1;
      } else out += word;
      i = j;
    } else {
      out += ch;
      i++;
    }
  }
  // Drop trailing commas, which JS allows and JSON doesn't.
  return out.replace(/,(\s*[}\]])/g, '$1');
};

const fromBase64 = (value: string): Uint8Array => new Uint8Array(Buffer.from(value, 'base64'));

interface WasmKeyExports {
  memory: WebAssembly.Memory;
  _s(seed: number): void;
  _r(frag1: number, frag2: number, frag3: number, out: number, length: number): void;
  _c(): number;
}

/** Runs the page's key-derivation module. It gets no imports, so it can only compute. */
const deriveKeyMaterial = async (
  wasmBase64: string,
  seed: string,
  fragments: [Uint8Array, Uint8Array, Uint8Array],
): Promise<{ keyMaterial: Uint8Array; playlistKey: Uint8Array }> => {
  const module = await WebAssembly.compile(Buffer.from(wasmBase64, 'base64'));
  const instance = await WebAssembly.instantiate(module, {});
  const wasm = instance.exports as unknown as WasmKeyExports;
  if (wasm.memory.buffer.byteLength === 0) wasm.memory.grow(1);

  const length = fragments[0].length;
  const base = 1000;
  const offsets = [base, base + length, base + 2 * length];
  const outOffset = base + 3 * length;

  const memory = new Uint8Array(wasm.memory.buffer);
  fragments.forEach((fragment, i) => memory.set(fragment, offsets[i]));

  wasm._s(parseInt(seed.slice(0, 8), 16));
  wasm._r(offsets[0], offsets[1], offsets[2], outOffset, length);
  const playlistKeyOffset = wasm._c();

  const after = new Uint8Array(wasm.memory.buffer);
  return {
    keyMaterial: after.slice(outOffset, outOffset + length),
    playlistKey: after.slice(playlistKeyOffset, playlistKeyOffset + 32),
  };
};

const decryptMasterUrl = (
  keyMaterial: Uint8Array,
  seed: string,
  iv: Uint8Array,
  cipher: Uint8Array,
): string => {
  const derived = pbkdf2Sync(keyMaterial, seed, 1000, 32, 'sha256');
  for (let i = 0; i < derived.length; i++) derived[i] ^= seed.charCodeAt(i % seed.length);
  const key = createHash('sha256').update(derived).digest();
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(cipher), decipher.final()]).toString('utf8');
};

/**
 * Decrypts a FlixCloud playlist. Playlists are XOR-encrypted with the
 * 32-byte key returned as `playlistKey`; plain playlists are returned as is.
 */
export const decryptFlixPlaylist = (text: string, playlistKey: string): string => {
  const trimmed = text.trim();
  if (trimmed.startsWith('#EXTM3U')) return trimmed;
  const key = fromBase64(playlistKey);
  const bytes = Buffer.from(trimmed, 'base64');
  for (let i = 0; i < bytes.length; i++) bytes[i] ^= key[i % key.length];
  return bytes.toString('utf8');
};

const SEGMENT_XOR_MASK = [157, 42, 241, 71, 179, 142, 92, 112, 166, 25, 228, 59, 216, 98, 15, 197];
const TS_SYNC_BYTE = 0x47;

/**
 * Restores a FlixCloud video segment. Segments are disguised as WEBP or PNG
 * files: strip the fake header, then undo the XOR mask if the MPEG-TS sync
 * byte isn't already there. Other data is returned unchanged.
 */
export const decodeFlixSegment = (data: Uint8Array): Uint8Array => {
  const isWebp =
    data.length >= 12 &&
    String.fromCharCode(...data.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...data.subarray(8, 12)) === 'WEBP';
  const isPng = data.length >= 8 && data[0] === 0x89 && String.fromCharCode(...data.subarray(1, 4)) === 'PNG';
  const headerLength = isWebp ? 12 : isPng ? 8 : 0;
  if (!headerLength) return data;

  const segment = data.slice(headerLength);
  if (segment[0] !== TS_SYNC_BYTE) {
    for (let i = 0; i < segment.length; i++) segment[i] ^= SEGMENT_XOR_MASK[i & 15];
  }
  return segment;
};

export interface FlixCloudSource extends ISource {
  /** Base64 32-byte key for `decryptFlixPlaylist`. */
  playlistKey: string;
  /** Original file name of the video, if the host exposes it. */
  videoTitle?: string;
}

/** Extracts the stream from a FlixCloud embed URL (`https://flixcloud.cc/e/<id>?v=<n>`). */
export const extractFlixCloud = async (
  client: AxiosInstance,
  embedUrl: string,
  referer: string,
): Promise<FlixCloudSource> => {
  const origin = new URL(embedUrl).origin;
  const { data: html } = await client.get<string>(embedUrl, {
    headers: { Referer: referer },
    responseType: 'text',
  });

  const payload = html.match(/kit\.start\(app, element, (\{[\s\S]*?\})\);\s*\}\);/)?.[1];
  if (!payload) throw new Error('FlixCloud: embed page has no SvelteKit payload');
  const page = JSON.parse(jsLiteralToJson(payload))?.data?.[2]?.data;
  const seed: unknown = page?.obfuscation_seed;
  if (typeof seed !== 'string') throw new Error('FlixCloud: payload has no obfuscation seed');

  const fields = flixFieldNames(seed);
  const crypto = page.obfuscated_crypto_data?.[fields.container]?.[fields.array]?.[0]?.[fields.object];
  const token: string | undefined = page[fields.token];
  const keyFragment1: string | undefined = crypto?.[fields.key];
  const keyFragment2: string | undefined = page[fields.keyFragment2];
  const iv: string | undefined = crypto?.[fields.iv];
  if (!token || !keyFragment1 || !keyFragment2 || !iv || !page.w_payload) {
    throw new Error('FlixCloud: payload is missing crypto fields (the obfuscation may have changed)');
  }

  const { data: tokenData } = await client.get(`${origin}/api/m3u8/${token}`, {
    headers: { Referer: embedUrl, Accept: 'application/json, text/plain, */*' },
  });
  const encryptedUrl: string | undefined = tokenData?.[sha256Hex(token + 'vid').slice(0, 10)];
  const keyFragment3: string | undefined = tokenData?.[sha256Hex(token + 'key').slice(0, 10)];
  if (!encryptedUrl || !keyFragment3)
    throw new Error('FlixCloud: token response is missing the stream URL or key');

  const { keyMaterial, playlistKey } = await deriveKeyMaterial(page.w_payload, seed, [
    fromBase64(keyFragment1),
    fromBase64(keyFragment2),
    fromBase64(keyFragment3),
  ]);
  const masterUrl = decryptMasterUrl(keyMaterial, seed, fromBase64(iv), fromBase64(encryptedUrl)).trim();
  if (!masterUrl) throw new Error('FlixCloud: decrypted stream URL is empty');

  const subtitles: ISubtitle[] = (Array.isArray(page.subtitles) ? page.subtitles : [])
    .filter((s: any) => s?.url && s?.language)
    .map((s: any) => ({ url: s.url, lang: s.language }));

  return {
    headers: { Referer: `${origin}/` },
    sources: [{ url: masterUrl, quality: 'auto', isM3U8: true }],
    subtitles,
    intro: chapter(page.intro_chapter) ?? namedChapter(page.chapters, /^(opening|intro)$/i),
    outro: chapter(page.outro_chapter) ?? namedChapter(page.chapters, /^(ending|outro)$/i),
    embedURL: embedUrl,
    playlistKey: Buffer.from(playlistKey).toString('base64'),
    videoTitle: page.video_title,
  };
};

const chapter = (value: any): Intro | undefined =>
  value?.end ? { start: Number(value.start) || 0, end: Number(value.end) } : undefined;

const namedChapter = (chapters: any, name: RegExp): Intro | undefined =>
  chapter(Array.isArray(chapters) ? chapters.find((c: any) => name.test(c?.title ?? '')) : undefined);
