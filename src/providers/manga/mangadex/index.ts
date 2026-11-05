import {
  IMangaChapter,
  IMangaChapterPage,
  IMangaInfo,
  IMangaResult,
  ISearch,
  MangaParser,
  MediaStatus,
  capitalizeFirstLetter,
  substringBefore,
} from '../../../core';

type Localized = Record<string, string>;

interface Relationship {
  id: string;
  type: string;
  attributes?: { fileName?: string };
}

interface Manga {
  id: string;
  attributes: {
    title: Localized;
    altTitles: Localized[];
    description: Localized;
    status: string;
    year: number | null;
    contentRating: string;
    lastVolume: string | null;
    lastChapter: string | null;
    tags: { attributes: { group: string; name: Localized } }[];
  };
  relationships: Relationship[];
}

interface Chapter {
  id: string;
  attributes: {
    title: string | null;
    chapter: string | null;
    volume: string | null;
    pages: number;
  };
}

type Params = Record<string, string | number | string[]>;

const MAX_LIMIT = 100;
const MAX_OFFSET = 10000;
const FEED_PAGE_SIZE = 500;

/** English if there is one, otherwise the first language listed. */
const localized = (text: Localized | undefined): string | undefined =>
  text ? (text.en ?? Object.values(text)[0]) : undefined;

const tagsIn = (manga: Manga, group: string): string[] =>
  manga.attributes.tags.filter(tag => tag.attributes.group === group).map(tag => tag.attributes.name.en);

class MangaDex extends MangaParser {
  override readonly name = 'MangaDex';
  protected override baseUrl = 'https://mangadex.org';
  protected override logo = 'https://pbs.twimg.com/profile_images/1391016345714757632/xbt_jW78_400x400.jpg';

  private readonly apiUrl = 'https://api.mangadex.org';

  override fetchMangaInfo = async (mangaId: string): Promise<IMangaInfo> => {
    const { data } = await this.client.get(`${this.apiUrl}/manga/${mangaId}`, {
      params: { 'includes[]': ['cover_art'] },
    });
    const manga: Manga = data.data;

    return {
      id: manga.id,
      title: localized(manga.attributes.title)!,
      altTitles: manga.attributes.altTitles,
      description: manga.attributes.description,
      genres: tagsIn(manga, 'genre'),
      themes: tagsIn(manga, 'theme'),
      status: capitalizeFirstLetter(manga.attributes.status) as MediaStatus,
      releaseDate: manga.attributes.year ?? undefined,
      image: this.coverUrl(manga),
      chapters: (await this.fetchAllChapters(mangaId)).map((chapter): IMangaChapter => ({
        id: chapter.id,
        title: chapter.attributes.title || chapter.attributes.chapter || '',
        chapterNumber: chapter.attributes.chapter ?? undefined,
        volumeNumber: chapter.attributes.volume ?? undefined,
        pages: chapter.attributes.pages,
      })),
    };
  };

  /**
   * @currently only supports english
   */
  override fetchChapterPages = async (chapterId: string): Promise<IMangaChapterPage[]> => {
    const { data } = await this.client.get(`${this.apiUrl}/at-home/server/${chapterId}`);

    return data.chapter.data.map((file: string) => ({
      img: `${data.baseUrl}/data/${data.chapter.hash}/${file}`,
      page: parseInt(substringBefore(file, '-').replace(/[^0-9.]/g, '')),
    }));
  };

  /**
   * @param query search query
   * @param page page number (default: 1)
   * @param limit limit of results to return (default: 20) (max: 100) (min: 1)
   */
  override search = async (
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<ISearch<IMangaResult>> =>
    this.fetchList({ title: query, 'order[relevance]': 'desc' }, page, limit);

  fetchRandom = async (): Promise<ISearch<IMangaResult>> => {
    const { data } = await this.client.get(`${this.apiUrl}/manga/random`, {
      params: { 'includes[]': ['cover_art'] },
    });
    return { currentPage: 1, results: [this.toResult(data.data)] };
  };

  fetchRecentlyAdded = async (page: number = 1, limit: number = 20): Promise<ISearch<IMangaResult>> =>
    this.fetchList(
      {
        'contentRating[]': ['safe', 'suggestive', 'erotica'],
        'order[createdAt]': 'desc',
        hasAvailableChapters: 'true',
      },
      page,
      limit,
    );

  fetchLatestUpdates = async (page: number = 1, limit: number = 20): Promise<ISearch<IMangaResult>> =>
    this.fetchList({ 'order[latestUploadedChapter]': 'desc' }, page, limit);

  fetchPopular = async (page: number = 1, limit: number = 20): Promise<ISearch<IMangaResult>> =>
    this.fetchList(
      {
        'order[followedCount]': 'desc',
        'contentRating[]': ['safe', 'suggestive'],
        hasAvailableChapters: 'true',
      },
      page,
      limit,
    );

  /** Pages through `/manga` with the given filters. Covers come back in the same request. */
  private fetchList = async (params: Params, page: number, limit: number): Promise<ISearch<IMangaResult>> => {
    if (page <= 0) throw new Error('Page number must be greater than 0');
    if (limit > MAX_LIMIT) throw new Error(`Limit must be less than or equal to ${MAX_LIMIT}`);
    const offset = limit * (page - 1);
    if (offset >= MAX_OFFSET) throw new Error('not enough results');

    const { data } = await this.client.get(`${this.apiUrl}/manga`, {
      params: { ...params, 'includes[]': ['cover_art'], limit, offset },
    });

    return {
      currentPage: page,
      hasNextPage: offset + limit < Math.min(data.total, MAX_OFFSET),
      totalResults: data.total,
      results: data.data.map((manga: Manga) => this.toResult(manga)),
    };
  };

  /**
   * Every English chapter that MangaDex hosts. Chapters that only link to an
   * official site (e.g. MangaPlus for One Piece) are left out: they have no
   * pages here, so fetchChapterPages would 404 on them.
   */
  private fetchAllChapters = async (mangaId: string): Promise<Chapter[]> => {
    const chapters: Chapter[] = [];
    for (let offset = 0; ; offset += FEED_PAGE_SIZE) {
      const { data } = await this.client.get(`${this.apiUrl}/manga/${mangaId}/feed`, {
        params: {
          'translatedLanguage[]': ['en'],
          'order[volume]': 'desc',
          'order[chapter]': 'desc',
          includeExternalUrl: 0,
          limit: FEED_PAGE_SIZE,
          offset,
        },
      });
      chapters.push(...data.data);
      if (!data.data.length || chapters.length >= data.total) return chapters;
    }
  };

  private coverUrl = (manga: Manga): string | undefined => {
    const fileName = manga.relationships.find(rel => rel.type === 'cover_art')?.attributes?.fileName;
    return fileName ? `${this.baseUrl}/covers/${manga.id}/${fileName}` : undefined;
  };

  private toResult = (manga: Manga): IMangaResult => ({
    id: manga.id,
    title: localized(manga.attributes.title)!,
    altTitles: manga.attributes.altTitles,
    description: localized(manga.attributes.description),
    status: manga.attributes.status as MediaStatus,
    releaseDate: manga.attributes.year ?? undefined,
    contentRating: manga.attributes.contentRating,
    lastVolume: manga.attributes.lastVolume,
    lastChapter: manga.attributes.lastChapter,
    image: this.coverUrl(manga),
  });
}

export default MangaDex;
