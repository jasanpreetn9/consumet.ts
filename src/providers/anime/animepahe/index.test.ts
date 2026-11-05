import AnimePahe from '.';
import { SubOrSub } from '../../../core';
import { fixtureAdapter } from '../../../core/testing';

jest.setTimeout(120000);

const animepahe = new AnimePahe(undefined, fixtureAdapter(__dirname));

const FRIEREN = 'frieren-beyond-journeys-end';
const FRIEREN_EP1 = '52991/1';

test('search: returns a filled array of anime', async () => {
  const data = await animepahe.search('frieren');
  expect(data.results).not.toEqual([]);
  expect(data.results[0].id).toBe(FRIEREN);
});

test('fetchAnimeInfo: returns anime info with MAL and AniList ids', async () => {
  const data = await animepahe.fetchAnimeInfo(FRIEREN);
  expect(data.title).toBeTruthy();
  expect(data.malId).toBe(52991);
  expect(data.anilistId).toBe(154587);
  expect(data.genres).toContain('Fantasy');
  expect(data.episodes!.length).toBe(28);
  expect(data.episodes![0].id).toBe(FRIEREN_EP1);
});

test('fetchEpisodeServers: returns Megavid and Megaplay', async () => {
  const data = await animepahe.fetchEpisodeServers(FRIEREN_EP1, SubOrSub.DUB);
  expect(data.map(server => server.name)).toEqual(['Megavid', 'Megaplay']);
  expect(data[0].url).toMatch(/\/dub$/);
});

test('fetchEpisodeSources: returns a Megavid HLS stream with subtitles', async () => {
  const data = await animepahe.fetchEpisodeSources(FRIEREN_EP1);
  expect(data.sources[0].url).toMatch(/^https:\/\//);
  expect(data.sources[0].isM3U8).toBe(true);
  expect(data.subtitles!.length).toBeGreaterThan(0);
  expect(data.intro!.end).toBeGreaterThan(0);
});

test('fetchEpisodeSources: Megaplay returns only an embed URL', async () => {
  const data = await animepahe.fetchEpisodeSources(FRIEREN_EP1, 'Megaplay');
  expect(data.sources).toEqual([]);
  expect(data.embedURL).toBe('https://megaplay.buzz/stream/mal/52991/1/sub');
});
