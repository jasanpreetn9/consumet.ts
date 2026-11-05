import Anikoto from '.';
import { SubOrSub } from '../../../core';
import { fixtureAdapter } from '../../../core/testing';

jest.setTimeout(120000);

const anikoto = new Anikoto(undefined, fixtureAdapter(__dirname));

const FRIEREN = 'frieren-beyond-journey-s-end-c6fbj';
const FRIEREN_EP1 = '6351/1';

test('search: returns a filled array of anime', async () => {
  const data = await anikoto.search('frieren');
  expect(data.results).not.toEqual([]);
  expect(data.results[0].id).toBe(FRIEREN);
  expect(data.results[0].image).toBeTruthy();
});

test('fetchAnimeInfo: returns anime info with episodes', async () => {
  const data = await anikoto.fetchAnimeInfo(FRIEREN);
  expect(data.title).toBeTruthy();
  expect(data.malId).toBe(52991);
  expect(data.genres).toContain('Fantasy');
  expect(data.episodes!.length).toBeGreaterThan(0);
  expect(data.episodes![0].id).toBe(FRIEREN_EP1);
  expect(data.episodes![0].title).toBeTruthy();
});

test('fetchEpisodeServers: returns sub and dub servers', async () => {
  const sub = await anikoto.fetchEpisodeServers(FRIEREN_EP1);
  expect(sub).not.toEqual([]);
  const dub = await anikoto.fetchEpisodeServers(FRIEREN_EP1, SubOrSub.DUB);
  expect(dub).not.toEqual([]);
});

test('fetchEpisodeSources: returns an embed URL and skip times', async () => {
  const data = await anikoto.fetchEpisodeSources(FRIEREN_EP1);
  expect(data.sources).toEqual([]);
  expect(data.embedURL).toMatch(/^https:\/\//);
  expect(data.intro!.end).toBeGreaterThan(0);
});
