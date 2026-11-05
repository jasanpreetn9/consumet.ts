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

interface Titles {
  english?: string | null;
  romaji?: string | null;
  native?: string | null;
}

interface Anime {
  slug: string;
  anilistId?: number;
  malId?: number;
  title: Titles;
  coverImage?: { extraLarge?: string; large?: string };
  bannerImage?: string | null;
  format?: string;
  status?: string;
  season?: string;
  year?: number;
  totalEpisodes?: number;
  averageScore?: number;
  genres?: string[];
  isAdult?: boolean;
  subCount?: number;
  dubCount?: number;
}

interface AnimeDetail extends Anime {
  description?: string;
  synonyms?: string[];
  countryOfOrigin?: string;
  trailerId?: string;
  studios?: { name: string }[];
  episodeCount?: number;
}

interface Episode {
  number: number;
  title?: string;
  description?: string;
  image?: string;
  airDate?: string;
  isFiller?: boolean;
}

interface Server {
  id: string;
  default?: boolean;
  subTypes?: string[];
}

interface Sources {
  sources?: { url: string; quality?: string; label?: string; isM3U8?: boolean }[];
  subtitles?: { file: string; label?: string; kind?: string; default?: boolean }[];
  intro?: { start: number; end: number };
  outro?: { start: number; end: number };
  embedOptions?: { key: string; label?: string; url?: string }[];
}

/** Anikage hands out opaque tokens that are paths on its own stream proxy. */
const STREAM_PROXY = 'https://og.bakayaro.live';

const STATUS: Record<string, MediaStatus> = {
  FINISHED: MediaStatus.COMPLETED,
  RELEASING: MediaStatus.ONGOING,
  NOT_YET_RELEASED: MediaStatus.NOT_YET_AIRED,
  CANCELLED: MediaStatus.CANCELLED,
  HIATUS: MediaStatus.HIATUS,
};

/**
 * Anikage (anikage.cc). Uses the site's JSON API. Its servers return HLS
 * playlists served through Anikage's own proxy, so they play without extra
 * headers.
 *
 * Episode ids have the form `<slug>/<episode>`, e.g. `zMLNvt6MtV/1`.
 */
class Anikage extends AnimeParser {
  override readonly name = 'Anikage';
  protected override baseUrl = 'https://anikage.cc';
  protected override readonly isDubAvailableSeparately = true;

  private get apiUrl(): string {
    return `${this.baseUrl}/api/media/anime`;
  }

  /**
   * @param query Search query. The site returns one page of best matches.
   */
  override search = async (query: string): Promise<ISearch<IAnimeResult>> => {
    const { data } = await this.client.get(`${this.apiUrl}/search`, { params: { q: query } });
    const results: Anime[] = data?.data ?? [];
    return {
      currentPage: 1,
      hasNextPage: false,
      totalResults: data?.total ?? results.length,
      results: results.map(anime => this.toResult(anime)),
    };
  };

  /**
   * @param animeId Anikage slug from search results, e.g. `zMLNvt6MtV`
   */
  override fetchAnimeInfo = async (animeId: string): Promise<IAnimeInfo> => {
    const [{ data }, { data: episodes }] = await Promise.all([
      this.client.get(`${this.apiUrl}/${encodeURIComponent(animeId)}`),
      this.client.get<Episode[]>(`${this.apiUrl}/${encodeURIComponent(animeId)}/episodes`),
    ]);
    const anime: AnimeDetail = data.anime;

    return {
      ...this.toResult(anime),
      malId: anime.malId,
      description: anime.description,
      synonyms: anime.synonyms,
      season: anime.season,
      countryOfOrigin: anime.countryOfOrigin,
      isAdult: anime.isAdult,
      studios: anime.studios?.map(studio => studio.name),
      trailer: anime.trailerId
        ? {
            id: anime.trailerId,
            site: 'youtube',
            url: `https://www.youtube.com/watch?v=${anime.trailerId}`,
          }
        : undefined,
      hasSub: (anime.subCount ?? 0) > 0,
      hasDub: (anime.dubCount ?? 0) > 0,
      totalEpisodes: anime.totalEpisodes ?? anime.episodeCount ?? episodes.length,
      episodes: (episodes ?? []).map((episode): IAnimeEpisode => ({
        id: `${anime.slug}/${episode.number}`,
        number: episode.number,
        title: episode.title,
        description: episode.description,
        image: episode.image,
        releaseDate: episode.airDate,
        isFiller: episode.isFiller,
        isSubbed: episode.number <= (anime.subCount ?? 0),
        isDubbed: episode.number <= (anime.dubCount ?? 0),
        url: `${this.baseUrl}/watch/${anime.slug}/${episode.number}`,
      })),
    };
  };

  /**
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `zMLNvt6MtV/1`
   * @param subOrDub `sub` or `dub` (default: `sub`)
   */
  override fetchEpisodeServers = async (
    episodeId: string,
    subOrDub: SubOrSub = SubOrSub.SUB,
  ): Promise<IEpisodeServer[]> => {
    const { slug, episode } = this.parseEpisodeId(episodeId);
    const { data } = await this.client.get(
      `${this.apiUrl}/${encodeURIComponent(slug)}/episodes/${episode}/servers`,
    );
    const type = subOrDub === SubOrSub.DUB ? 'dub' : 'sub';
    return ((data?.servers ?? []) as Server[])
      .filter(server => !server.subTypes || server.subTypes.includes(type))
      .map(server => ({
        name: server.id,
        url: this.sourcesUrl(slug, episode, server.id, type),
        isDefault: Boolean(server.default),
      }));
  };

  /**
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `zMLNvt6MtV/1`
   * @param server Server name from `fetchEpisodeServers` (default: `koto`)
   * @param subOrDub `sub` or `dub` (default: `sub`)
   */
  override fetchEpisodeSources = async (
    episodeId: string,
    server: string = 'koto',
    subOrDub: SubOrSub = SubOrSub.SUB,
  ): Promise<ISource> => {
    const { slug, episode } = this.parseEpisodeId(episodeId);
    const type = subOrDub === SubOrSub.DUB ? 'dub' : 'sub';
    const { data } = await this.client.get<Sources>(this.sourcesUrl(slug, episode, server, type));

    const sources = (data.sources ?? []).map(source => ({
      url: this.proxied(source.url, source.isM3U8 ? 'm3u8' : 'stream'),
      quality: source.quality ?? source.label ?? 'auto',
      isM3U8: Boolean(source.isM3U8),
    }));
    const embedURL = data.embedOptions?.find(option => option.url)?.url;
    if (!sources.length && !embedURL)
      throw new Error(`[${this.name}] No ${type} sources on server '${server}' for episode ${episodeId}`);

    return {
      sources,
      subtitles: (data.subtitles ?? [])
        .filter(track => track.kind !== 'thumbnails')
        .map(track => ({ url: this.proxied(track.file, 'stream'), lang: track.label ?? 'Unknown' })),
      intro: data.intro?.end ? data.intro : undefined,
      outro: data.outro?.end ? data.outro : undefined,
      embedURL,
    };
  };

  private sourcesUrl = (slug: string, episode: string, server: string, type: string): string =>
    `${this.apiUrl}/${encodeURIComponent(slug)}/episodes/${episode}/sources?provider=${encodeURIComponent(
      server,
    )}&lang=${type}`;

  private proxied = (urlOrToken: string, kind: 'm3u8' | 'stream'): string =>
    /^https?:\/\//.test(urlOrToken) ? urlOrToken : `${STREAM_PROXY}/${kind}/${urlOrToken}`;

  private parseEpisodeId = (episodeId: string): { slug: string; episode: string } => {
    const [slug, episode] = episodeId.split('/');
    if (!slug || !episode)
      throw new Error(`[${this.name}] Invalid episode id '${episodeId}', expected <slug>/<episode>`);
    return { slug, episode };
  };

  private toResult = (anime: Anime): IAnimeResult => ({
    id: anime.slug,
    anilistId: anime.anilistId,
    malId: anime.malId,
    title: anime.title.english || anime.title.romaji || anime.title.native || '',
    japaneseTitle: anime.title.native ?? undefined,
    romajiTitle: anime.title.romaji ?? undefined,
    url: `${this.baseUrl}/anime/${anime.slug}`,
    image: anime.coverImage?.extraLarge ?? anime.coverImage?.large,
    cover: anime.bannerImage ?? undefined,
    type: anime.format as MediaFormat | undefined,
    status: anime.status ? (STATUS[anime.status] ?? MediaStatus.UNKNOWN) : undefined,
    genres: anime.genres,
    releaseDate: anime.year?.toString(),
    rating: anime.averageScore,
    sub: anime.subCount,
    dub: anime.dubCount,
    episodes: anime.totalEpisodes,
  });
}

export default Anikage;
