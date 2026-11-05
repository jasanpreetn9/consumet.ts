import Anikage from '.';
import { SubOrSub } from '../../../core';
import { fixtureAdapter } from '../../../core/testing';

jest.setTimeout(120000);

const anikage = new Anikage(undefined, fixtureAdapter(__dirname));

const FRIEREN = 'zMLNvt6MtV';
const FRIEREN_EP1 = 'zMLNvt6MtV/1';

test('search: returns anime with AniList ids', async () => {
  const data = await anikage.search('frieren');
  expect(data.results).not.toEqual([]);
  expect(data.results[0].id).toBe(FRIEREN);
  expect(data.results[0].anilistId).toBe(154587);
});

test('fetchAnimeInfo: returns anime info with episodes', async () => {
  const data = await anikage.fetchAnimeInfo(FRIEREN);
  expect(data.title).toBeTruthy();
  expect(data.malId).toBe(52991);
  expect(data.episodes!.length).toBeGreaterThan(0);
  expect(data.episodes![0].id).toBe(FRIEREN_EP1);
});

test('fetchEpisodeServers: returns sub and dub servers', async () => {
  const sub = await anikage.fetchEpisodeServers(FRIEREN_EP1);
  expect(sub.map(server => server.name)).toContain('koto');
  const dub = await anikage.fetchEpisodeServers(FRIEREN_EP1, SubOrSub.DUB);
  expect(dub).not.toEqual([]);
});

test('fetchEpisodeSources: returns a proxied HLS stream', async () => {
  const data = await anikage.fetchEpisodeSources(FRIEREN_EP1);
  expect(data.sources[0].url).toMatch(/^https:\/\/og\.bakayaro\.live\/m3u8\//);
  expect(data.sources[0].isM3U8).toBe(true);
  expect(data.subtitles!.length).toBeGreaterThan(0);
});
