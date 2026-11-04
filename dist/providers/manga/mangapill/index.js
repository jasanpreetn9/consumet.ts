"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const core_1 = require("../../../core");
class MangaPill extends core_1.MangaParser {
    name = 'MangaPill';
    baseUrl = 'https://mangapill.com';
    /**
     *
     * @param query Search query
     */
    search = async (query) => {
        const { data } = await this.client.get(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
        const $ = (0, cheerio_1.load)(data);
        const results = $('div.container div.my-3.justify-end > div')
            .map((i, el) => ({
            id: $(el).find('a').attr('href')?.split('/manga/')[1],
            title: $(el).find('div > a > div').text().trim(),
            image: $(el).find('a img').attr('data-src'),
        }))
            .get();
        return {
            results: results,
        };
    };
    fetchMangaInfo = async (mangaId) => {
        const mangaInfo = {
            id: mangaId,
            title: '',
        };
        const { data } = await this.client.get(`${this.baseUrl}/manga/${mangaId}`);
        const $ = (0, cheerio_1.load)(data);
        mangaInfo.title = $('div.container div.my-3 div.flex-col div.mb-3 h1').text().trim();
        mangaInfo.description = $('div.container div.my-3  div.flex-col p.text--secondary')
            .text()
            .split('\n')
            .join(' ');
        mangaInfo.releaseDate = $('div.container div.my-3 div.flex-col div.gap-3.mb-3 div:contains("Year")')
            .text()
            .split('Year\n')[1]
            .trim();
        mangaInfo.genres = $('div.container div.my-3 div.flex-col div.mb-3:contains("Genres")')
            .text()
            .split('\n')
            .filter((genre) => genre !== 'Genres' && genre !== '')
            .map(genre => genre.trim());
        mangaInfo.chapters = $('div.container div.border-border div#chapters div.grid-cols-1 a')
            .map((i, el) => ({
            id: $(el).attr('href')?.split('/chapters/')[1],
            title: $(el).text().trim(),
            chapter: $(el).text().split('Chapter ')[1],
        }))
            .get();
        return mangaInfo;
    };
    fetchChapterPages = async (chapterId) => {
        const { data } = await this.client.get(`${this.baseUrl}/chapters/${chapterId}`);
        const $ = (0, cheerio_1.load)(data);
        const chapterSelector = $('chapter-page');
        const pages = chapterSelector
            .map((i, el) => ({
            img: $(el).find('div picture img').attr('data-src'),
            page: parseFloat($(el).find(`div[data-summary] > div`).text().split('page ')[1]),
        }))
            .get();
        return pages;
    };
}
// (async () => {
//   const manga = new MangaPill();
//   const search = await manga.search('one piece');
//   const info = await manga.fetchMangaInfo(search.results[1].id);
//   const pages = await manga.fetchChapterPages(info.chapters![0].id);
//   console.log(pages);
// })();
exports.default = MangaPill;
//# sourceMappingURL=index.js.map