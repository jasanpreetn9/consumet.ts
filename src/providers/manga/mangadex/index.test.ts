import MangaDex from '.';
import { fixtureAdapter } from '../../../core/testing';

jest.setTimeout(120000);

const mangadex = new MangaDex(undefined, fixtureAdapter(__dirname));

// Berserk's chapters are hosted on MangaDex. Most of One Piece's English
// chapters only link out to MangaPlus.
const BERSERK = '801513ba-a712-498c-8f57-cae55b38cc92';
const ONE_PIECE = 'a1c7c817-4e59-43b7-9365-09675a149a6f';

test('search: returns manga with covers', async () => {
  const data = await mangadex.search('berserk');
  expect(data.results).not.toEqual([]);
  expect(data.results[0].id).toBeDefined();
  expect(data.results[0].image).toMatch(/^https:\/\/mangadex\.org\/covers\//);
});

test('fetchMangaInfo: returns manga info with chapters', async () => {
  const data = await mangadex.fetchMangaInfo(BERSERK);
  expect(data.title).toBeDefined();
  expect(data.image).toMatch(/^https:\/\/mangadex\.org\/covers\//);
  expect(data.chapters).not.toEqual([]);
});

test('fetchMangaInfo: leaves out chapters hosted elsewhere', async () => {
  const data = await mangadex.fetchMangaInfo(ONE_PIECE);
  for (const chapter of data.chapters!) expect(chapter.pages).toBeGreaterThan(0);
});

test('fetchChapterPages: returns chapter pages', async () => {
  const data = await mangadex.fetchChapterPages('6310f6a1-17ee-4890-b837-2ec1b372905b');
  expect(data).not.toEqual([]);
  expect(data[0].img).toBeDefined();
});

test('fetchPopular: returns a filled array of manga', async () => {
  const data = await mangadex.fetchPopular();
  expect(data.results).not.toEqual([]);
  expect(data.hasNextPage).toBe(true);
});
