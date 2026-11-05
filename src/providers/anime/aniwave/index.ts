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
  Finished: MediaStatus.COMPLETED,
  Releasing: MediaStatus.ONGOING,
  'Currently Airing': MediaStatus.ONGOING,
  Upcoming: MediaStatus.NOT_YET_AIRED,
};

/**
 * AniWave (aniwaves.ru). Scrapes the site's pages and AJAX endpoints.
 *
 * Every AniWave server is a third-party player page, so
 * `fetchEpisodeSources` returns an `embedURL` to show in an iframe rather
 * than a direct stream.
 *
 * Anime ids are the slugs in AniWave's URLs, e.g. `sousou-no-frieren-74575`.
 * Episode ids have the form `<aniwave id>/<episode>`, e.g. `74575/1`.
 */
class AniWave extends AnimeParser {
  override readonly name = 'AniWave';
  protected override baseUrl = 'https://aniwaves.ru';
  protected override readonly isDubAvailableSeparately = true;

  private get ajax() {
    return { headers: { 'X-Requested-With': 'XMLHttpRequest' } };
  }

  /**
   * @param query Search query
   * @param page Page number (default: 1)
   */
  override search = async (query: string, page: number = 1): Promise<ISearch<IAnimeResult>> => {
    const { data } = await this.client.get(`${this.baseUrl}/filter`, { params: { keyword: query, page } });
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
          genres: item
            .find('.genre a')
            .map((_, a) => $(a).text().trim())
            .get(),
          sub: this.count(item.find('.ep-status.sub').text()),
          dub: this.count(item.find('.ep-status.dub').text()),
          episodes: this.count(item.find('.ep-status.total').text()),
        };
      })
      .get()
      .filter(result => result.id);

    const lastPage = Math.max(
      page,
      ...$('.pagination .page-link')
        .map((_, a) => this.count($(a).text()) ?? 0)
        .get(),
    );
    return { currentPage: page, hasNextPage: page < lastPage, totalPages: lastPage, results };
  };

  /**
   * @param animeId AniWave slug from search results, e.g. `sousou-no-frieren-74575`
   */
  override fetchAnimeInfo = async (animeId: string): Promise<IAnimeInfo> => {
    const { data } = await this.client.get(`${this.baseUrl}/watch/${encodeURIComponent(animeId)}`);
    const $ = load(data);
    const info = $('#w-info');
    const internalId = /-(\d+)$/.exec(animeId)?.[1] ?? $('[data-id]').first().attr('data-id');
    if (!internalId) throw new Error(`[${this.name}] No anime id on the page for '${animeId}'`);

    const field = (label: string) => this.metaRow($, info, label);
    const [season, year] = field('Premiered').text().trim().split(/\s+/);

    return {
      id: animeId,
      title: info.find('h1.title').text().trim(),
      japaneseTitle: info.find('h1.title').attr('data-jp'),
      synonyms: info
        .find('.names')
        .text()
        .split(',')
        .map(name => name.trim())
        .filter(Boolean),
      url: `${this.baseUrl}/watch/${animeId}`,
      image: info.find('.poster img').attr('src'),
      description: info.find('.synopsis .content').text().trim() || info.find('.synopsis').text().trim(),
      type: (field('Type').text().trim().toUpperCase() || undefined) as MediaFormat | undefined,
      status: STATUS[field('Status').text().trim()] ?? MediaStatus.UNKNOWN,
      season: season?.toUpperCase() || undefined,
      releaseDate: year,
      genres: this.linksIn($, field('Genres')),
      studios: this.linksIn($, field('Studios')),
      rating: parseFloat(field('Scores').text()) || undefined,
      hasSub: info.find('.meta .sub').length > 0,
      hasDub: info.find('.meta .dub').length > 0,
      totalEpisodes: this.count(field('Episodes').text().split('/').pop() ?? ''),
      episodes: await this.fetchEpisodes(internalId),
    };
  };

  /**
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `74575/1`
   * @param subOrDub `sub` or `dub` (default: `sub`)
   */
  override fetchEpisodeServers = async (
    episodeId: string,
    subOrDub: SubOrSub = SubOrSub.SUB,
  ): Promise<IEpisodeServer[]> => {
    const { internalId, episode } = this.parseEpisodeId(episodeId);
    const { data } = await this.client.get(`${this.baseUrl}/ajax/server/list`, {
      ...this.ajax,
      params: { servers: internalId, eps: episode },
    });
    const $ = load(data.result ?? '');
    const type = subOrDub === SubOrSub.DUB ? 'dub' : 'sub';

    return $(`[data-type="${type}"] li[data-link-id]`)
      .map((_, el) => ({
        name: $(el).text().trim(),
        url: $(el).attr('data-link-id')!,
        serverId: $(el).attr('data-sv-id'),
      }))
      .get();
  };

  /**
   * Returns an `embedURL` to show in an iframe.
   *
   * @param episodeId Episode id from `fetchAnimeInfo`, e.g. `74575/1`
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

    const { data } = await this.client.get(`${this.baseUrl}/ajax/sources`, {
      ...this.ajax,
      params: { id: selected.url, asi: 1, autoPlay: 1 },
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

  private fetchEpisodes = async (internalId: string): Promise<IAnimeEpisode[]> => {
    const { data } = await this.client.get(`${this.baseUrl}/ajax/episode/list/${internalId}`, this.ajax);
    const $ = load(data.result ?? '');

    return $('a[data-num]')
      .map((_, el): IAnimeEpisode => {
        const a = $(el);
        const number = Number(a.attr('data-num'));
        return {
          id: `${internalId}/${number}`,
          number,
          title: a.find('.d-title').text().trim() || undefined,
          isFiller: a.attr('data-filler') === '1',
          isSubbed: a.attr('data-sub') === '1',
          isDubbed: a.attr('data-dub') === '1',
          releaseDate: a.attr('data-aired'),
          url: `${this.baseUrl}${a.attr('href') ?? ''}`,
        };
      })
      .get();
  };

  /** The `<span>` holding the value of a "Label: value" row in the info box. */
  private metaRow = ($: CheerioAPI, info: ReturnType<CheerioAPI>, label: string) =>
    info
      .find('.bmeta .meta > div')
      .filter((_, el) => $(el).text().trim().startsWith(`${label}:`))
      .first()
      .children('span')
      .first();

  private linksIn = ($: CheerioAPI, row: ReturnType<CheerioAPI>): string[] =>
    row
      .find('a')
      .map((_, a) => $(a).text().trim())
      .get();

  private slugFrom = (href?: string): string => /\/watch\/([^/?#]+)/.exec(href ?? '')?.[1] ?? '';

  private count = (text: string): number | undefined => {
    const n = parseInt(text.replace(/[^\d]/g, ''), 10);
    return Number.isNaN(n) ? undefined : n;
  };

  private parseEpisodeId = (episodeId: string): { internalId: string; episode: string } => {
    const [internalId, episode] = episodeId.split('/');
    if (!/^\d+$/.test(internalId ?? '') || !episode)
      throw new Error(`[${this.name}] Invalid episode id '${episodeId}', expected <aniwave id>/<episode>`);
    return { internalId, episode };
  };
}

export default AniWave;
