import ComicK from '.';
import { fixtureAdapter } from '../../../core/testing';

jest.setTimeout(120000);

const comick = new ComicK(undefined, fixtureAdapter(__dirname));

test('search: returns a filled array of manga', async () => {
  const data = await comick.search('one piece');
  expect(data.results).not.toEqual([]);
  expect(data.results[0].id).toBeDefined();
});

test('fetchMangaInfo: returns manga info with chapters', async () => {
  const data = await comick.fetchMangaInfo('one-piece');
  expect(data.title).toBeDefined();
  expect(data.chapters).not.toEqual([]);
});

test('fetchChapterPages: returns chapter pages', async () => {
  const info = await comick.fetchMangaInfo('one-piece');
  const data = await comick.fetchChapterPages(info.chapters![0].id);
  expect(data).not.toEqual([]);
  expect(data[0].img).toBeDefined();
});
