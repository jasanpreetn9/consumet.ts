import {
  AnimeParser,
  IAnimeEpisode,
  IAnimeInfo,
  IAnimeResult,
  IEpisodeServer,
  ISearch,
  MediaFormat,
  MediaStatus,
  SubOrSub,
} from '../../../core';
import { decodeFlixSegment, decryptFlixPlaylist, extractFlixCloud, FlixCloudSource } from './flixcloud';

/** ReAnime's video servers. Both point to FlixCloud; HD-2 is usually more reliable. */
export type ReAnimeServer = 'HD-1' | 'HD-2';

interface Titles {
  english?: string;
  romaji?: string;
  native?: string;
}

interface SearchItem {
  anime_id: string;
  anilist_id?: number;
  title: Titles;
  cover_image?: { extra_large?: string; large?: string };
  format?: string;
  status?: string;
  genres?: string[];
  season_year?: number;
  episodes?: number;
  subbed?: number;
  dubbed?: number;
  average_score?: number;
}

interface AnimeDetail extends SearchItem {
  mal_id?: number;
  description?: string;
  banner_image?: string;
  synonyms?: string[];
  season?: string;
  country_of_origin?: string;
  is_adult?: boolean;
  is_licensed?: boolean;
  episodes_total?: number;
  studios?: { name: string; is_main: boolean }[];
  start_date?: { year?: number; month?: number; day?: number };
  end_date?: { year?: number; month?: number; day?: number };
  trailer?: { id: string; site: string; thumbnail?: string };
}

interface Episode {
  episode_number: number;
  title?: string;
  description?: string;
  thumbnail?: string;
  aired?: string;
  is_filler?: boolean;
  subbed?: boolean;
  dubbed?: boolean;
  playable?: boolean;
}

interface Server {
  serverName: string;
  dataLink: string;
  dataType: string;
}

const EPISODE_PAGE_SIZE = 1000;
const SEARCH_PAGE_SIZE = 20;

const STATUS: Record<string, MediaStatus> = {
  Finished: MediaStatus.COMPLETED,
  Releasing: MediaStatus.ONGOING,
  'Not Yet Released': MediaStatus.NOT_YET_AIRED,
  Cancelled: MediaStatus.CANCELLED,
  Hiatus: MediaStatus.HIATUS,
};

const preferredTitle = (title: Titles): string => title.english || title.romaji || title.native || '';

/**
 * ReAnime (reanime.to). Uses the site's JSON API for search, info and
 * episodes; streams come from FlixCloud embeds.
 *
 * Episode ids have the form `<anilistId>/<episode>`, e.g. `154587/1`.
 *
 * FlixCloud playlists are XOR-encrypted, so the returned `.m3u8` won't play in
 * a standard HLS player as is. Proxy the playlist responses through
 * `decryptFlixPlaylist(body, source.playlistKey)`, and segments through
 * `decodeFlixSegment`. Both are exported from this module.
 */
class ReAnime extends AnimeParser {
  override readonly name = 'ReAnime';
  protected override baseUrl = 'https://reanime.to';
  protected override readonly isDubAvailableSeparately = true;

  /** Decrypts a FlixCloud playlist body with the source's `playlistKey`. */
  static readonly decryptPlaylist = decryptFlixPlaylist;

  /** Restores a FlixCloud video segment (strips the fake image header, undoes the XOR mask). */
  static readonly decodeSegment = decodeFlixSegment;

  private get apiUrl(): string {
    return `${this.baseUrl}/api`;
  }

  private get headers() {
    return { headers: { Referer: `${this.baseUrl}/` } };
  }

  /**
   * @param query Search query
   * @param page Page number (default: 1)
   */
  override search = async (query: string, page: number = 1): Promise<ISearch<IAnimeResult>> => {
    page = Math.max(1, page);
    const { data } = await this.client.get(`${this.apiUrl}/v1/search`, {
      ...this.headers,
      params: { q: query, limit: SEARCH_PAGE_SIZE, offset: (page - 1) * SEARCH_PAGE_SIZE },
    });

    const results: SearchItem[] = data.results ?? [];
    const total: number | undefined = data.total;
    return {
      currentPage: page,
      hasNextPage:
        total !== undefined ? page * SEARCH_PAGE_SIZE < total : results.length === SEARCH_PAGE_SIZE,
      totalPages: total !== undefined ? Math.ceil(total / SEARCH_PAGE_SIZE) : undefined,
      totalResults: total,
      results: results.map(item => this.toResult(item)),
    };
  };

  /**
   * @param animeId ReAnime id from search results, e.g. `frieren-beyond-journey-s-end-yw2a3j`
   */
  override fetchAnimeInfo = async (animeId: string): Promise<IAnimeInfo> => {
    const { data: detail } = await this.client.get<AnimeDetail>(
      `${this.apiUrl}/v1/anime/${encodeURIComponent(animeId)}`,
      this.headers,
    );
    const episodes = await this.fetchEpisodes(animeId);

    return {
      ...this.toResult(detail),
      malId: detail.mal_id,
      description: detail.description,
      cover: detail.banner_image,
      synonyms: detail.synonyms,
      season: detail.season,
      countryOfOrigin: detail.country_of_origin,
      isAdult: detail.is_adult,
      isLicensed: detail.is_licensed,
      studios: detail.studios?.map(studio => studio.name),
      startDate: detail.start_date,
      endDate: detail.end_date,
      trailer: detail.trailer
        ? {
            id: detail.trailer.id,
            site: detail.trailer.site,
            thumbnail: detail.trailer.thumbnail,
            url:
              detail.trailer.site === 'youtube'
                ? `https://www.youtube.com/watch?v=${detail.trailer.id}`
                : undefined,
          }
        : undefined,
      totalEpisodes: detail.episodes_total || episodes.length,
      episodes: episodes
        .filter(episode => episode.playable !== false)
        .map((episode): IAnimeEpisode => ({
          id: `${detail.anilist_id}/${episode.episode_number}`,
          number: episode.episode_number,
          title: episode.title,
          description: episode.description || undefined,
          image: episode.thumbnail || undefined,
          releaseDate: episode.aired,
          isFiller: episode.is_filler,
          isSubbed: episode.subbed,
          isDubbed: episode.dubbed,
          url: `${this.baseUrl}/watch/${animeId}?ep=${episode.episode_number}`,
        })),
    };
  };

  /**
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `154587/1`
   * @param subOrDub `sub` or `dub` (default: `sub`)
   */
  override fetchEpisodeServers = async (
    episodeId: string,
    subOrDub: SubOrSub = SubOrSub.SUB,
  ): Promise<IEpisodeServer[]> => {
    const servers = await this.fetchServers(episodeId);
    const type = subOrDub === SubOrSub.DUB ? 'dub' : 'sub';
    return servers
      .filter(server => server.dataType === type)
      .map(server => ({ name: server.serverName, url: server.dataLink, type: server.dataType }));
  };

  /**
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `154587/1`
   * @param server `HD-1` or `HD-2` (default: `HD-2`)
   * @param subOrDub `sub` or `dub` (default: `sub`)
   */
  override fetchEpisodeSources = async (
    episodeId: string,
    server: ReAnimeServer = 'HD-2',
    subOrDub: SubOrSub = SubOrSub.SUB,
  ): Promise<FlixCloudSource> => {
    const servers = await this.fetchEpisodeServers(episodeId, subOrDub);
    if (!servers.length) throw new Error(`[${this.name}] No ${subOrDub} servers for episode ${episodeId}`);
    const selected = servers.find(s => s.name === server) ?? servers[0];
    return extractFlixCloud(this.client, selected.url, `${this.baseUrl}/`);
  };

  private fetchServers = async (episodeId: string): Promise<Server[]> => {
    const [anilistId, episode] = episodeId.split('/');
    if (!anilistId || !episode)
      throw new Error(`[${this.name}] Invalid episode id '${episodeId}', expected <anilistId>/<episode>`);
    const { data } = await this.client.get(`${this.apiUrl}/flix/${anilistId}/${episode}`, this.headers);
    return data?.servers ?? [];
  };

  private fetchEpisodes = async (animeId: string): Promise<Episode[]> => {
    const episodes: Episode[] = [];
    for (let offset = 0; ; offset += EPISODE_PAGE_SIZE) {
      const { data } = await this.client.get(
        `${this.apiUrl}/v1/anime/${encodeURIComponent(animeId)}/episodes`,
        {
          ...this.headers,
          params: { limit: EPISODE_PAGE_SIZE, offset },
        },
      );
      const page: Episode[] = data?.data ?? [];
      episodes.push(...page);
      if (!page.length || episodes.length >= (data?.total ?? 0)) return episodes;
    }
  };

  private toResult = (item: SearchItem): IAnimeResult => ({
    id: item.anime_id,
    anilistId: item.anilist_id,
    title: preferredTitle(item.title),
    japaneseTitle: item.title.native,
    romajiTitle: item.title.romaji,
    url: `${this.baseUrl}/anime/${item.anime_id}`,
    image: item.cover_image?.extra_large ?? item.cover_image?.large,
    type: item.format as MediaFormat | undefined,
    status: item.status ? (STATUS[item.status] ?? MediaStatus.UNKNOWN) : undefined,
    genres: item.genres,
    releaseDate: item.season_year?.toString(),
    rating: item.average_score,
    sub: item.subbed,
    dub: item.dubbed,
    episodes: item.episodes,
  });
}

export default ReAnime;
