import Example from '.';
import { fixtureAdapter } from '../../../core/testing';

// Tests replay saved responses from ./fixtures, so they run offline.
// Record or refresh them against the live site with:
//   RECORD=1 yarn test src/providers/manga/<name>
jest.setTimeout(120000);

const example = new Example(undefined, fixtureAdapter(__dirname));

test('search: returns a filled array of manga', async () => {
  const data = await example.search('one piece');
  expect(data.results).not.toEqual([]);
  expect(data.results[0].id).toBeDefined();
});

test('fetchMangaInfo: returns manga info with chapters', async () => {
  const data = await example.fetchMangaInfo('one-piece');
  expect(data.title).toBeTruthy();
  expect(data.chapters).not.toEqual([]);
});

test('fetchChapterPages: returns chapter pages', async () => {
  const info = await example.fetchMangaInfo('one-piece');
  const data = await example.fetchChapterPages(info.chapters![0].id);
  expect(data).not.toEqual([]);
  expect(data[0].img).toBeTruthy();
});
