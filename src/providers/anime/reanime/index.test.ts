import { AxiosInstance } from 'axios';

import ReAnime from '.';
import { SubOrSub } from '../../../core';
import { fixtureAdapter } from '../../../core/testing';
import { jsLiteralToJson } from './flixcloud';

jest.setTimeout(120000);

const reanime = new ReAnime(undefined, fixtureAdapter(__dirname));

const FRIEREN = 'frieren-beyond-journey-s-end-yw2a3j';
const FRIEREN_EP1 = '154587/1';

test('search: returns a filled array of anime', async () => {
  const data = await reanime.search('frieren');
  expect(data.results).not.toEqual([]);
  expect(data.results[0].id).toBe(FRIEREN);
  expect(data.results[0].anilistId).toBe(154587);
});

test('fetchAnimeInfo: returns anime info with episodes', async () => {
  const data = await reanime.fetchAnimeInfo(FRIEREN);
  expect(data.title).toBeTruthy();
  expect(data.malId).toBe(52991);
  expect(data.episodes!.length).toBeGreaterThan(0);
  expect(data.episodes![0].id).toBe(FRIEREN_EP1);
});

test('fetchAnimeInfo: pages through long episode lists', async () => {
  const data = await reanime.fetchAnimeInfo('one-piece-xamk74');
  expect(data.episodes!.length).toBeGreaterThan(1000);
});

test('fetchEpisodeServers: returns sub and dub servers', async () => {
  const sub = await reanime.fetchEpisodeServers(FRIEREN_EP1);
  const dub = await reanime.fetchEpisodeServers(FRIEREN_EP1, SubOrSub.DUB);
  expect(sub.map(s => s.name)).toEqual(expect.arrayContaining(['HD-1', 'HD-2']));
  expect(dub.every(s => s.type === 'dub')).toBe(true);
});

test('fetchEpisodeSources: decrypts the stream URL and playlist', async () => {
  const data = await reanime.fetchEpisodeSources(FRIEREN_EP1);
  expect(data.sources[0].url).toMatch(/^https:\/\/.+\.m3u8/);
  expect(data.sources[0].isM3U8).toBe(true);
  expect(data.playlistKey).toBeTruthy();
  expect(data.subtitles!.length).toBeGreaterThan(0);
  expect(data.intro).toBeDefined();

  // The master playlist is XOR-encrypted; the derived key must decrypt it.
  const client = (reanime as unknown as { client: AxiosInstance }).client;
  const { data: body } = await client.get(data.sources[0].url, {
    headers: data.headers,
    responseType: 'text',
  });
  expect(ReAnime.decryptPlaylist(String(body), data.playlistKey)).toMatch(/^#EXTM3U/);
});

test('jsLiteralToJson: parses object literals without evaluating them', () => {
  const literal = `{node_ids:[0,2],data:[null,{type:"data",data:{a_b:'it\\'s',"0x":1,t:"x:{y}",u:undefined,v:void 0,},}]}`;
  expect(JSON.parse(jsLiteralToJson(literal))).toEqual({
    node_ids: [0, 2],
    data: [null, { type: 'data', data: { a_b: "it's", '0x': 1, t: 'x:{y}', u: null, v: null } }],
  });
});

test('decodeSegment: strips fake image headers and the XOR mask', () => {
  const ts = Uint8Array.from([0x47, 1, 2, 3]);
  const webpHeader = Uint8Array.from([...Buffer.from('RIFF'), 0, 0, 0, 0, ...Buffer.from('WEBP')]);
  expect(ReAnime.decodeSegment(Uint8Array.from([...webpHeader, ...ts]))).toEqual(ts);

  const mask = [157, 42, 241, 71];
  const masked = ts.map((b, i) => b ^ mask[i]);
  const pngHeader = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  expect(ReAnime.decodeSegment(Uint8Array.from([...pngHeader, ...masked]))).toEqual(ts);

  expect(ReAnime.decodeSegment(ts)).toEqual(ts);
});
