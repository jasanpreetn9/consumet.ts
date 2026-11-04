/**
 * Template for a new manga provider. To use it:
 *
 *   1. Copy this folder to src/providers/manga/<name>/ (lowercase name).
 *   2. Rename the class, set `name` and `baseUrl`, and fill in the selectors.
 *   3. Add one line to src/providers/manga/index.ts.
 *   4. Record fixtures: RECORD=1 yarn test src/providers/manga/<name>
 *
 * Import everything from '../../../core'. You shouldn't need to open core/.
 * Use `this.client` for every request: it applies the user's proxy, a timeout,
 * and turns failures into ProviderErrors, so you don't need try/catch.
 */
import { load } from 'cheerio';

import { IMangaChapterPage, IMangaInfo, IMangaResult, ISearch, MangaParser } from '../../../core';

class Example extends MangaParser {
  override readonly name = 'Example';
  protected override baseUrl = 'https://example.com';
  protected override logo = 'https://example.com/logo.png';

  override search = async (query: string, page: number = 1): Promise<ISearch<IMangaResult>> => {
    const { data } = await this.client.get(`${this.baseUrl}/search`, { params: { q: query, page } });
    const $ = load(data);

    const results = $('.search-result')
      .map((_, el): IMangaResult => ({
        id: $(el).find('a').attr('href')!.replace('/manga/', ''),
        title: $(el).find('.title').text().trim(),
        image: $(el).find('img').attr('src'),
      }))
      .get();

    return { currentPage: page, hasNextPage: $('.pagination .next').length > 0, results };
  };

  override fetchMangaInfo = async (mangaId: string): Promise<IMangaInfo> => {
    const { data } = await this.client.get(`${this.baseUrl}/manga/${mangaId}`);
    const $ = load(data);

    return {
      id: mangaId,
      title: $('h1').text().trim(),
      description: $('.description').text().trim(),
      image: $('.cover img').attr('src'),
      chapters: $('.chapter-list a')
        .map((_, el) => ({
          id: $(el).attr('href')!.replace('/chapter/', ''),
          title: $(el).text().trim(),
        }))
        .get(),
    };
  };

  override fetchChapterPages = async (chapterId: string): Promise<IMangaChapterPage[]> => {
    const { data } = await this.client.get(`${this.baseUrl}/chapter/${chapterId}`);
    const $ = load(data);

    return $('.page img')
      .map((i, el): IMangaChapterPage => ({ page: i + 1, img: $(el).attr('src')! }))
      .get();
  };
}

export default Example;
