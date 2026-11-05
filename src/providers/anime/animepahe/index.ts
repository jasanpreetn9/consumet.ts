import { CheerioAPI, load } from 'cheerio';

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

/** AnimePahe's players are keyed by MyAnimeList id, so sources skip AnimePahe itself. */
const MEGAVID = 'https://megavid.buzz';
const MEGAPLAY = 'https://megaplay.buzz';

export type AnimePaheServer = 'Megavid' | 'Megaplay';

interface MegavidSource {
  status?: string;
  source?: string;
  type?: string;
  tracks?: { file: string; label?: string; kind?: string }[];
  chapters?: { title: string; start: number; end: number }[];
}

const STATUS: Record<string, MediaStatus> = {
  'Finished Airing': MediaStatus.COMPLETED,
  'Currently Airing': MediaStatus.ONGOING,
  'Not yet aired': MediaStatus.NOT_YET_AIRED,
};

/**
 * AnimePahe (animepahe.by). Scrapes the site for search, info and episodes.
 *
 * Streams come from the players AnimePahe embeds, which are keyed by
 * MyAnimeList id. `Megavid` (the default) returns a direct HLS stream;
 * `Megaplay` only returns an `embedURL` to show in an iframe.
 *
 * Anime ids are AnimePahe slugs, e.g. `frieren-beyond-journeys-end`. Episode
 * ids have the form `<malId>/<episode>`, e.g. `52991/1`.
 */
class AnimePahe extends AnimeParser {
  override readonly name = 'AnimePahe';
  protected override baseUrl = 'https://animepahe.by';
  protected override readonly isDubAvailableSeparately = true;

  /**
   * @param query Search query. The site returns one page of best matches.
   */
  override search = async (query: string): Promise<ISearch<IAnimeResult>> => {
    const { data } = await this.client.get(`${this.baseUrl}/wp-admin/admin-ajax.php`, {
      params: { action: 'animepahe_search', q: query },
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    const $ = load(data);

    const results = $('.search-results li a')
      .map((_, el): IAnimeResult => {
        const a = $(el);
        const slug = /\/anime\/([^/]+)\/?/.exec(a.attr('href') ?? '')?.[1] ?? '';
        return {
          id: slug,
          title: a.attr('title') || a.find('.result-title').text().trim(),
          url: `${this.baseUrl}/anime/${slug}/`,
          image: a.find('img').attr('data-src') || a.find('img').attr('src'),
        };
      })
      .get()
      .filter(result => result.id);

    return { currentPage: 1, hasNextPage: false, results };
  };

  /**
   * @param animeId AnimePahe slug from search results, e.g. `frieren-beyond-journeys-end`
   */
  override fetchAnimeInfo = async (animeId: string): Promise<IAnimeInfo> => {
    const { data } = await this.client.get(`${this.baseUrl}/anime/${encodeURIComponent(animeId)}/`);
    const $ = load(data);

    const malId = /myanimelist\.net\/anime\/(\d+)/.exec(data)?.[1];
    if (!malId) throw new Error(`[${this.name}] No MyAnimeList id on the page for '${animeId}'`);
    const anilistId = /anilist\.co\/anime\/(\d+)/.exec(data)?.[1];

    const field = (label: string) => this.infoField($, label);
    const [season, year] = field('Season').split(/\s+/);
    const numbers = [
      ...new Set(
        [...data.matchAll(new RegExp(`/watch/${this.escape(animeId)}-ep-(\\d+)/`, 'g'))].map(m =>
          Number(m[1]),
        ),
      ),
    ].sort((a, b) => a - b);

    return {
      id: animeId,
      malId: Number(malId),
      anilistId: anilistId ? Number(anilistId) : undefined,
      title: $('h1 span').first().text().trim() || $('h1').first().text().trim(),
      japaneseTitle: $('h2.japanese').first().text().trim() || undefined,
      synonyms: field('Synonyms')
        .split(',')
        .map(name => name.trim())
        .filter(Boolean),
      url: `${this.baseUrl}/anime/${animeId}/`,
      image: $('.anime-poster img').attr('src'),
      description: $('.anime-synopsis p')
        .map((_, p) => $(p).text().trim())
        .get()
        .join('\n\n'),
      type: (field('Type') || undefined) as MediaFormat | undefined,
      status: STATUS[field('Status')] ?? MediaStatus.UNKNOWN,
      season: season?.toUpperCase() || undefined,
      releaseDate: year ?? (field('Aired') || undefined),
      studios: field('Studios')
        .split(',')
        .map(studio => studio.trim())
        .filter(Boolean),
      genres: $('.anime-genre li')
        .map((_, li) => $(li).text().trim())
        .get(),
      totalEpisodes: Number(field('Episode')) || numbers.length,
      episodes: numbers.map((number): IAnimeEpisode => ({
        id: `${malId}/${number}`,
        number,
        url: `${this.baseUrl}/watch/${animeId}-ep-${number}/`,
      })),
    };
  };

  /**
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `52991/1`
   * @param subOrDub `sub` or `dub` (default: `sub`)
   */
  override fetchEpisodeServers = async (
    episodeId: string,
    subOrDub: SubOrSub = SubOrSub.SUB,
  ): Promise<IEpisodeServer[]> => {
    const { malId, episode } = this.parseEpisodeId(episodeId);
    const lang = subOrDub === SubOrSub.DUB ? 'dub' : 'sub';
    return [
      { name: 'Megavid', url: `${MEGAVID}/mal/${malId}/${episode}/${lang}` },
      { name: 'Megaplay', url: `${MEGAPLAY}/stream/mal/${malId}/${episode}/${lang}` },
    ];
  };

  /**
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `52991/1`
   * @param server `Megavid` (direct HLS, default) or `Megaplay` (embed only)
   * @param subOrDub `sub` or `dub` (default: `sub`)
   */
  override fetchEpisodeSources = async (
    episodeId: string,
    server: AnimePaheServer = 'Megavid',
    subOrDub: SubOrSub = SubOrSub.SUB,
  ): Promise<ISource> => {
    const servers = await this.fetchEpisodeServers(episodeId, subOrDub);
    const player = servers.find(s => s.name === server)?.url;
    if (!player) throw new Error(`[${this.name}] Unknown server '${server}', expected Megavid or Megaplay`);

    if (server === 'Megaplay') return { sources: [], embedURL: player };

    const { data } = await this.client.get<MegavidSource>(`${player}/source`, {
      headers: { Referer: player, 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!data?.source) throw new Error(`[${this.name}] Megavid returned no stream for episode ${episodeId}`);

    const chapter = (title: string) => {
      const found = data.chapters?.find(c => c.title.toLowerCase() === title);
      return found && found.end > 0 ? { start: found.start, end: found.end } : undefined;
    };

    return {
      headers: { Referer: `${MEGAVID}/` },
      sources: [
        { url: data.source, quality: 'auto', isM3U8: data.type === 'hls' || data.type === undefined },
      ],
      subtitles: (data.tracks ?? [])
        .filter(track => track.kind !== 'thumbnails')
        .map(track => ({ url: track.file, lang: track.label ?? 'Unknown' })),
      intro: chapter('intro'),
      outro: chapter('outro'),
      embedURL: player,
    };
  };

  /** Value of a "Label: value" paragraph in the info sidebar. */
  private infoField = ($: CheerioAPI, label: string): string => {
    const p = $('.anime-info p')
      .filter((_, el) => $(el).text().trim().startsWith(`${label}:`))
      .first();
    return p.text().replace(`${label}:`, '').replace(/\s+/g, ' ').trim();
  };

  private escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  private parseEpisodeId = (episodeId: string): { malId: string; episode: string } => {
    const [malId, episode] = episodeId.split('/');
    if (!/^\d+$/.test(malId ?? '') || !episode)
      throw new Error(`[${this.name}] Invalid episode id '${episodeId}', expected <malId>/<episode>`);
    return { malId, episode };
  };
}

export default AnimePahe;
