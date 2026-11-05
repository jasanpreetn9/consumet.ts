import AniWave from '.';
import { SubOrSub } from '../../../core';
import { fixtureAdapter } from '../../../core/testing';

jest.setTimeout(120000);

const aniwave = new AniWave(undefined, fixtureAdapter(__dirname));

const FRIEREN = 'sousou-no-frieren-74575';
const FRIEREN_EP1 = '74575/1';

test('search: returns a filled array of anime', async () => {
  const data = await aniwave.search('frieren');
  expect(data.results).not.toEqual([]);
  expect(data.results.map(result => result.id)).toContain(FRIEREN);
});

test('fetchAnimeInfo: returns anime info with episodes', async () => {
  const data = await aniwave.fetchAnimeInfo(FRIEREN);
  expect(data.title).toBeTruthy();
  expect(data.genres).toContain('Fantasy');
  expect(data.totalEpisodes).toBe(28);
  expect(data.episodes!.length).toBeGreaterThan(0);
  expect(data.episodes![0].id).toBe(FRIEREN_EP1);
  expect(data.episodes![0].title).toBeTruthy();
});

test('fetchEpisodeServers: returns sub and dub servers', async () => {
  const sub = await aniwave.fetchEpisodeServers(FRIEREN_EP1);
  expect(sub.length).toBeGreaterThan(0);
  expect(sub[0].name).toBeTruthy();
  const dub = await aniwave.fetchEpisodeServers(FRIEREN_EP1, SubOrSub.DUB);
  expect(dub.length).toBeGreaterThan(0);
});

test('fetchEpisodeSources: returns an embed URL', async () => {
  const data = await aniwave.fetchEpisodeSources(FRIEREN_EP1);
  expect(data.sources).toEqual([]);
  expect(data.embedURL).toMatch(/^https:\/\//);
});
