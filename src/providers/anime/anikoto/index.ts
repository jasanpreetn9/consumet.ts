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

const STATUS: Record<string, MediaStatus> = {
  'Finished Airing': MediaStatus.COMPLETED,
  'Currently Airing': MediaStatus.ONGOING,
  'Not yet aired': MediaStatus.NOT_YET_AIRED,
};

/**
 * Anikoto (anikototv.to). Scrapes the site's pages and AJAX endpoints.
 *
 * Anikoto's video servers are MegaPlay players that only hand an encrypted
 * stream URL to their own page, so `fetchEpisodeSources` returns an
 * `embedURL` to show in an iframe, plus intro and outro times.
 *
 * Anime ids are the slugs in Anikoto's URLs, e.g.
 * `frieren-beyond-journey-s-end-c6fbj`. Episode ids have the form
 * `<anikoto id>/<episode>`, e.g. `6351/1`.
 */
class Anikoto extends AnimeParser {
  override readonly name = 'Anikoto';
  protected override baseUrl = 'https://anikototv.to';
  protected override readonly isDubAvailableSeparately = true;

  private get ajax() {
    return { headers: { 'X-Requested-With': 'XMLHttpRequest' } };
  }

  /**
   * @param query Search query
   * @param page Page number (default: 1)
   */
  override search = async (query: string, page: number = 1): Promise<ISearch<IAnimeResult>> => {
    const { data } = await this.client.get(`${this.baseUrl}/search`, { params: { keyword: query, page } });
    const $ = load(data);

    const results = $('#list-items .item')
      .map((_, el): IAnimeResult => {
        const item = $(el);
        const link = item.find('a.name');
        const slug = this.slugFrom(link.attr('href'));
        return {
          id: slug,
          title: link.text().trim(),
          japaneseTitle: link.attr('data-jp'),
          url: `${this.baseUrl}/watch/${slug}`,
          image: item.find('.poster img').attr('src'),
          type: item.find('.poster .meta .right').text().trim() as MediaFormat,
          sub: this.count(item.find('.ep-status.sub').text()),
          dub: this.count(item.find('.ep-status.dub').text()),
          episodes: this.count(item.find('.ep-status.total').text()),
        };
      })
      .get()
      .filter(result => result.id);

    return {
      currentPage: page,
      hasNextPage: $('.pagination a[rel="next"]').length > 0,
      results,
    };
  };

  /**
   * @param animeId Anikoto slug from search results, e.g. `frieren-beyond-journey-s-end-c6fbj`
   */
  override fetchAnimeInfo = async (animeId: string): Promise<IAnimeInfo> => {
    const { data } = await this.client.get(`${this.baseUrl}/watch/${encodeURIComponent(animeId)}`);
    const $ = load(data);
    const info = $('#w-info');
    const internalId = $('#w-rating').attr('data-id');
    if (!internalId) throw new Error(`[${this.name}] No anime id on the page for '${animeId}'`);

    const meta = (label: string) => this.metaField($, info, label);
    const episodes = await this.fetchEpisodes(internalId);
    const [season, year] = meta('Premiered').split(/\s+/);

    return {
      id: animeId,
      malId: episodes.malId,
      title: info.find('h1.title').text().trim(),
      japaneseTitle: info.find('h1.title').attr('data-jp'),
      url: `${this.baseUrl}/watch/${animeId}`,
      image: info.find('.poster img').attr('src'),
      description: info.find('.synopsis .content').text().trim(),
      type: (meta('Type') || undefined) as MediaFormat | undefined,
      status: STATUS[meta('Status')] ?? MediaStatus.UNKNOWN,
      season: season?.toUpperCase() || undefined,
      releaseDate: year,
      genres: this.metaLinks($, info, 'Genres'),
      studios: this.metaLinks($, info, 'Studios'),
      rating: parseFloat(meta('MAL')) || undefined,
      hasSub: info.find('.meta .sub').length > 0,
      hasDub: info.find('.meta .dub').length > 0,
      totalEpisodes: this.count(meta('Episodes')) ?? episodes.list.length,
      episodes: episodes.list,
    };
  };

  /**
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `6351/1`
   * @param subOrDub `sub` or `dub` (default: `sub`)
   */
  override fetchEpisodeServers = async (
    episodeId: string,
    subOrDub: SubOrSub = SubOrSub.SUB,
  ): Promise<IEpisodeServer[]> => {
    const { internalId, episode } = this.parseEpisodeId(episodeId);
    const { data } = await this.client.get(`${this.baseUrl}/ajax/episode/list/${internalId}`, this.ajax);
    const $episodes = load(data.result ?? '');
    const serverIds = $episodes(`a[data-num="${episode}"]`).attr('data-ids');
    if (!serverIds) throw new Error(`[${this.name}] Episode ${episodeId} not found`);

    const { data: servers } = await this.client.get(`${this.baseUrl}/ajax/server/list`, {
      ...this.ajax,
      params: { servers: serverIds },
    });
    const $ = load(servers.result ?? '');
    const type = subOrDub === SubOrSub.DUB ? 'dub' : 'sub';

    return $(`.type[data-type="${type}"] li`)
      .map((_, el) => ({
        name: $(el).text().trim(),
        url: $(el).attr('data-link-id') ?? '',
        serverId: $(el).attr('data-sv-id'),
      }))
      .get()
      .filter(server => server.url);
  };

  /**
   * Returns an `embedURL` to show in an iframe, plus intro and outro times.
   *
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `6351/1`
   * @param server Server name from `fetchEpisodeServers` (default: the first one)
   * @param subOrDub `sub` or `dub` (default: `sub`)
   */
  override fetchEpisodeSources = async (
    episodeId: string,
    server?: string,
    subOrDub: SubOrSub = SubOrSub.SUB,
  ): Promise<ISource> => {
    const servers = await this.fetchEpisodeServers(episodeId, subOrDub);
    if (!servers.length) throw new Error(`[${this.name}] No ${subOrDub} servers for episode ${episodeId}`);
    const selected = servers.find(s => s.name === server) ?? servers[0];

    const { data } = await this.client.get(`${this.baseUrl}/ajax/server`, {
      ...this.ajax,
      params: { get: selected.url },
    });
    const result = data?.result;
    if (!result?.url) throw new Error(`[${this.name}] Server '${selected.name}' returned no player`);

    const skip = (range?: number[]) =>
      range && range[1] > 0 ? { start: range[0], end: range[1] } : undefined;
    return {
      sources: [],
      embedURL: result.url,
      intro: skip(result.skip_data?.intro),
      outro: skip(result.skip_data?.outro),
    };
  };

  private fetchEpisodes = async (internalId: string): Promise<{ list: IAnimeEpisode[]; malId?: number }> => {
    const { data } = await this.client.get(`${this.baseUrl}/ajax/episode/list/${internalId}`, this.ajax);
    const $ = load(data.result ?? '');
    let malId: number | undefined;

    const list = $('a[data-num]')
      .map((_, el): IAnimeEpisode => {
        const a = $(el);
        const number = Number(a.attr('data-num'));
        malId ??= Number(a.attr('data-mal')) || undefined;
        const timestamp = Number(a.attr('data-timestamp'));
        return {
          id: `${internalId}/${number}`,
          number,
          title: a.find('.d-title').text().trim() || undefined,
          isSubbed: a.attr('data-sub') === '1',
          isDubbed: a.attr('data-dub') === '1',
          releaseDate: timestamp ? new Date(timestamp * 1000).toISOString() : undefined,
        };
      })
      .get();

    return { list, malId };
  };

  private metaField = ($: CheerioAPI, info: ReturnType<CheerioAPI>, label: string): string => {
    const row = info
      .find('.bmeta .meta > div')
      .filter((_, el) => $(el).text().trim().startsWith(`${label}:`))
      .first();
    return row.find('span').first().text().replace(/\s+/g, ' ').trim();
  };

  private metaLinks = ($: CheerioAPI, info: ReturnType<CheerioAPI>, label: string): string[] =>
    info
      .find('.bmeta .meta > div')
      .filter((_, el) => $(el).text().trim().startsWith(`${label}:`))
      .first()
      .find('a')
      .map((_, a) => $(a).text().trim())
      .get();

  private slugFrom = (href?: string): string => /\/watch\/([^/?#]+)/.exec(href ?? '')?.[1] ?? '';

  private count = (text: string): number | undefined => {
    const n = parseInt(text.replace(/\D/g, ''), 10);
    return Number.isNaN(n) ? undefined : n;
  };

  private parseEpisodeId = (episodeId: string): { internalId: string; episode: string } => {
    const [internalId, episode] = episodeId.split('/');
    if (!/^\d+$/.test(internalId ?? '') || !episode)
      throw new Error(`[${this.name}] Invalid episode id '${episodeId}', expected <anikoto id>/<episode>`);
    return { internalId, episode };
  };
}

export default Anikoto;
