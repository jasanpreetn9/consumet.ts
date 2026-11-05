import {
  AnimeParser,
  IAnimeEpisode,
  IAnimeInfo,
  IAnimeResult,
  IEpisodeServer,
  ISearch,
  ISource,
  MediaFormat,
  MediaStatus,
  SubOrSub,
} from '../../../core';

interface Media {
  id: number;
  idMal?: number | null;
  slug: string;
  title: { english?: string | null; romaji?: string | null; native?: string | null };
  synonyms?: string[];
  description?: string | null;
  coverImage?: { extraLarge?: string; large?: string };
  bannerImage?: string | null;
  format?: string | null;
  status?: string | null;
  season?: string | null;
  seasonYear?: number | null;
  episodes?: number | null;
  nextAiringEpisode?: { episode: number } | null;
  averageScore?: number | null;
  genres?: string[];
  isAdult?: boolean;
  studios?: { nodes: { name: string }[] };
  streamingEpisodes?: { title?: string; thumbnail?: string }[];
}

interface EpisodeResponse {
  status: 'ready' | 'loading' | 'unavailable';
  reason?: string;
  variants?: {
    id: string;
    label?: string;
    sources: {
      label: string;
      url: string;
      tracks?: { src: string; label?: string; language?: string; type?: string }[];
    }[];
  }[];
}

const STATUS: Record<string, MediaStatus> = {
  FINISHED: MediaStatus.COMPLETED,
  RELEASING: MediaStatus.ONGOING,
  NOT_YET_RELEASED: MediaStatus.NOT_YET_AIRED,
  CANCELLED: MediaStatus.CANCELLED,
  HIATUS: MediaStatus.HIATUS,
};

const PAGE_SIZE = 20;

/** ANV's episode API wants an AniList id, which it only exposes in AniList banner URLs. */
const anilistIdFrom = (media: Media): number | undefined => {
  const id = /anilistcdn\/media\/anime\/banner\/(\d+)-/.exec(media.bannerImage ?? '')?.[1];
  return id ? Number(id) : undefined;
};

/**
 * ANV (anv.to). Uses the site's catalog API for search and info, and its
 * episode API for HLS streams.
 *
 * Streams only play with the `headers` returned alongside them (a Referer and
 * a session cookie), so proxy them through something that sends those.
 *
 * Anime ids are ANV slugs, e.g. `frieren-beyond-journey-s-end-c6fbj`. Episode
 * ids have the form `<slug>/<episode>`.
 */
class ANV extends AnimeParser {
  override readonly name = 'ANV';
  protected override baseUrl = 'https://anv.to';
  protected override readonly isDubAvailableSeparately = true;

  /**
   * @param query Search query
   * @param page Page number (default: 1)
   */
  override search = async (query: string, page: number = 1): Promise<ISearch<IAnimeResult>> => {
    const data = await this.catalog('SearchAnime', { search: query, page, perPage: PAGE_SIZE });
    const { media, pageInfo } = data.Page;
    return {
      currentPage: pageInfo?.currentPage ?? page,
      hasNextPage: Boolean(pageInfo?.hasNextPage),
      totalPages: pageInfo?.lastPage,
      totalResults: pageInfo?.total,
      results: (media as Media[]).map(item => this.toResult(item)),
    };
  };

  /**
   * @param animeId ANV slug from search results, e.g. `frieren-beyond-journey-s-end-c6fbj`
   */
  override fetchAnimeInfo = async (animeId: string): Promise<IAnimeInfo> => {
    const media = await this.fetchMedia(animeId);
    const aired = media.nextAiringEpisode ? media.nextAiringEpisode.episode - 1 : undefined;
    const count = aired ?? media.episodes ?? media.streamingEpisodes?.length ?? 0;

    return {
      ...this.toResult(media),
      description: media.description ?? undefined,
      synonyms: media.synonyms,
      season: media.season ?? undefined,
      isAdult: media.isAdult,
      studios: media.studios?.nodes.map(studio => studio.name),
      totalEpisodes: media.episodes ?? count,
      episodes: Array.from({ length: count }, (_, i): IAnimeEpisode => {
        const number = i + 1;
        const streaming = media.streamingEpisodes?.[i];
        return {
          id: `${media.slug}/${number}`,
          number,
          title: streaming?.title?.replace(/^Episode \d+\s*[—-]\s*/, '') || undefined,
          image: streaming?.thumbnail,
          url: this.watchUrl(media.slug, number),
        };
      }),
    };
  };

  /**
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `frieren-beyond-journey-s-end-c6fbj/1`
   * @param subOrDub `sub` or `dub` (default: `sub`)
   */
  override fetchEpisodeServers = async (
    episodeId: string,
    subOrDub: SubOrSub = SubOrSub.SUB,
  ): Promise<IEpisodeServer[]> => {
    const { variant } = await this.fetchVariant(episodeId, subOrDub);
    return variant.sources.map(source => ({
      name: source.label,
      url: new URL(source.url, this.baseUrl).href,
    }));
  };

  /**
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `frieren-beyond-journey-s-end-c6fbj/1`
   * @param server Server name from `fetchEpisodeServers`, e.g. `Banana` (default: the first one)
   * @param subOrDub `sub` or `dub` (default: `sub`)
   */
  override fetchEpisodeSources = async (
    episodeId: string,
    server?: string,
    subOrDub: SubOrSub = SubOrSub.SUB,
  ): Promise<ISource> => {
    const { variant, headers, malId, episode } = await this.fetchVariant(episodeId, subOrDub);
    const source = variant.sources.find(s => s.label === server) ?? variant.sources[0];

    const intro = malId ? await this.fetchIntro(malId, episode) : undefined;
    return {
      headers,
      sources: [{ url: new URL(source.url, this.baseUrl).href, quality: 'auto', isM3U8: true }],
      subtitles: (source.tracks ?? [])
        .filter(track => track.type !== 'thumbnails')
        .map(track => ({
          url: new URL(track.src, this.baseUrl).href,
          lang: track.label ?? track.language ?? 'Unknown',
        })),
      intro,
    };
  };

  /**
   * Loads the watch page (which sets the session cookie streams need), then
   * asks the episode API for the stream variants.
   */
  private fetchVariant = async (episodeId: string, subOrDub: SubOrSub) => {
    const { slug, episode } = this.parseEpisodeId(episodeId);
    const media = await this.fetchMedia(slug);
    const anilistId = anilistIdFrom(media);
    if (!anilistId)
      throw new Error(`[${this.name}] '${slug}' has no AniList id, which ANV's episode API requires`);

    const watch = this.watchUrl(slug, episode);
    const page = await this.client.get(watch, { responseType: 'text' });
    const cookie = ([] as string[])
      .concat(page.headers['set-cookie'] ?? [])
      .map(c => c.split(';')[0])
      .join('; ');
    const headers: Record<string, string> = { Referer: watch, ...(cookie ? { Cookie: cookie } : {}) };

    const lang = subOrDub === SubOrSub.DUB ? 'dub' : 'sub';
    const { data } = await this.client.post<EpisodeResponse>(
      `${this.baseUrl}/api/episode`,
      { anilistId, malId: media.idMal ?? undefined, episode, first: true, prefer: lang },
      { headers: { ...headers, Origin: this.baseUrl } },
    );
    if (data.status !== 'ready' || !data.variants?.length)
      throw new Error(`[${this.name}] Episode ${episodeId} is ${data.reason ?? data.status}`);

    const variant = data.variants.find(v => v.id === lang);
    if (!variant?.sources.length)
      throw new Error(`[${this.name}] No ${lang} sources for episode ${episodeId}`);
    return { variant, headers, malId: media.idMal ?? undefined, episode };
  };

  private fetchIntro = async (malId: number, episode: number) => {
    const { data } = await this.client.get(`${this.baseUrl}/api/skip-times`, {
      params: { malId, episode, duration: 1440 },
    });
    return data?.intro?.end > 0 ? { start: data.intro.start, end: data.intro.end } : undefined;
  };

  private fetchMedia = async (slug: string): Promise<Media> => {
    const data = await this.catalog('AnimeDetail', { slug });
    if (!data?.Media) throw new Error(`[${this.name}] No anime found for '${slug}'`);
    return data.Media;
  };

  private catalog = async (operation: string, variables: Record<string, unknown>) => {
    const { data } = await this.client.post(`${this.baseUrl}/api/catalog`, { operation, variables });
    return data.data;
  };

  private watchUrl = (slug: string, episode: number): string =>
    `${this.baseUrl}/anime/${slug}-episode-${episode}`;

  private parseEpisodeId = (episodeId: string): { slug: string; episode: number } => {
    const at = episodeId.lastIndexOf('/');
    const slug = episodeId.slice(0, at);
    const episode = Number(episodeId.slice(at + 1));
    if (at <= 0 || !Number.isInteger(episode))
      throw new Error(`[${this.name}] Invalid episode id '${episodeId}', expected <slug>/<episode>`);
    return { slug, episode };
  };

  private toResult = (media: Media): IAnimeResult => ({
    id: media.slug,
    anilistId: anilistIdFrom(media),
    malId: media.idMal ?? undefined,
    title: media.title.english || media.title.romaji || media.title.native || media.slug,
    romajiTitle: media.title.romaji ?? undefined,
    japaneseTitle: media.title.native ?? undefined,
    url: `${this.baseUrl}/anime/${media.slug}`,
    image: media.coverImage?.extraLarge ?? media.coverImage?.large,
    cover: media.bannerImage ?? undefined,
    type: (media.format ?? undefined) as MediaFormat | undefined,
    status: media.status ? (STATUS[media.status] ?? MediaStatus.UNKNOWN) : undefined,
    genres: media.genres,
    releaseDate: media.seasonYear?.toString(),
    rating: media.averageScore ?? undefined,
    episodes: media.episodes ?? undefined,
  });
}

export default ANV;
