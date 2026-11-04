import MangaDex from '.';
import { fixtureAdapter } from '../../../core/testing';

jest.setTimeout(120000);

const mangadex = new MangaDex(undefined, fixtureAdapter(__dirname));

// Berserk's chapters are hosted on MangaDex; licensed titles like One Piece
// only link out, so their chapter pages 404.
const BERSERK = '801513ba-a712-498c-8f57-cae55b38cc92';

test('search: returns a filled array of manga', async () => {
  const data = await mangadex.search('berserk');
  expect(data.results).not.toEqual([]);
  expect(data.results[0].id).toBeDefined();
});

test('fetchMangaInfo: returns manga info with chapters', async () => {
  const data = await mangadex.fetchMangaInfo(BERSERK);
  expect(data.title).toBeDefined();
  expect(data.chapters).not.toEqual([]);
});

test('fetchChapterPages: returns chapter pages', async () => {
  const data = await mangadex.fetchChapterPages('6310f6a1-17ee-4890-b837-2ec1b372905b');
  expect(data).not.toEqual([]);
  expect(data[0].img).toBeDefined();
});

test('fetchPopular: returns a filled array of manga', async () => {
  const data = await mangadex.fetchPopular();
  expect(data.results).not.toEqual([]);
});
