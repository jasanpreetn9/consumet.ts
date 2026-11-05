import ANV from '.';
import { SubOrSub } from '../../../core';
import { fixtureAdapter } from '../../../core/testing';

jest.setTimeout(120000);

const anv = new ANV(undefined, fixtureAdapter(__dirname));

const FRIEREN = 'frieren-beyond-journey-s-end-c6fbj';
const FRIEREN_EP1 = `${FRIEREN}/1`;

test('search: returns anime with AniList and MAL ids', async () => {
  const data = await anv.search('frieren');
  expect(data.results).not.toEqual([]);
  expect(data.results[0].id).toBe(FRIEREN);
  expect(data.results[0].anilistId).toBe(154587);
  expect(data.results[0].malId).toBe(52991);
});

test('fetchAnimeInfo: returns anime info with episodes', async () => {
  const data = await anv.fetchAnimeInfo(FRIEREN);
  expect(data.title).toBeTruthy();
  expect(data.episodes!.length).toBe(28);
  expect(data.episodes![0].id).toBe(FRIEREN_EP1);
});

test('fetchEpisodeServers: returns sub and dub servers', async () => {
  const sub = await anv.fetchEpisodeServers(FRIEREN_EP1);
  expect(sub.length).toBeGreaterThan(0);
  const dub = await anv.fetchEpisodeServers(FRIEREN_EP1, SubOrSub.DUB);
  expect(dub.length).toBeGreaterThan(0);
});

test('fetchEpisodeSources: returns an HLS stream with subtitles and headers', async () => {
  const data = await anv.fetchEpisodeSources(FRIEREN_EP1);
  expect(data.sources[0].url).toMatch(/^https:\/\/anv\.to\/stream\//);
  expect(data.subtitles!.length).toBeGreaterThan(0);
  expect(data.headers!.Referer).toBe('https://anv.to/anime/frieren-beyond-journey-s-end-c6fbj-episode-1');
});
