<h1> Anikage </h1>

```ts
import { ANIME } from '@consumet/extensions';

const anikage = new ANIME.Anikage();
```

Anikage ([anikage.cc](https://anikage.cc)) has a JSON API for search, info, episodes and sources. Its streams are HLS playlists served through Anikage's own proxy, so they play without extra headers. Results include AniList and MyAnimeList ids.

<h2>Methods</h2>

- [search](#search)
- [fetchAnimeInfo](#fetchanimeinfo)
- [fetchEpisodeServers](#fetchepisodeservers)
- [fetchEpisodeSources](#fetchepisodesources)

### search

<h4>Parameters</h4>

| Parameter | Type     | Description                                                |
| --------- | -------- | ---------------------------------------------------------- |
| query     | `string` | Query to search for. The site returns one page of matches. |

```ts
anikage.search('frieren').then(data => console.log(data));
```

Returns a promise that resolves to [`ISearch<IAnimeResult>`](../../../core/types/common.ts):

```js
{
  currentPage: 1,
  hasNextPage: false,
  totalResults: 9,
  results: [
    {
      id: 'zMLNvt6MtV',
      anilistId: 154587,
      malId: 52991,
      title: 'Frieren: Beyond Journey’s End',
      japaneseTitle: '葬送のフリーレン',
      romajiTitle: 'Sousou no Frieren',
      url: 'https://anikage.cc/anime/zMLNvt6MtV',
      image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg',
      cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg',
      type: 'TV',
      status: 'Completed',
      genres: ['Adventure', 'Drama', 'Fantasy'],
      releaseDate: '2023',
      rating: 91,
      sub: 28,
      dub: 28,
      episodes: 28
    },
    {...}
  ]
}
```

### fetchAnimeInfo

<h4>Parameters</h4>

| Parameter | Type     | Description                                 |
| --------- | -------- | ------------------------------------------- |
| animeId   | `string` | Anime id, from the `id` of a search result. |

```ts
anikage.fetchAnimeInfo('zMLNvt6MtV').then(data => console.log(data));
```

Returns a promise that resolves to [`IAnimeInfo`](../../../core/types/anime.ts):

```js
{
  id: 'zMLNvt6MtV',
  anilistId: 154587,
  malId: 52991,
  title: 'Frieren: Beyond Journey’s End',
  description: 'The adventure is over but life goes on for an elf mage...',
  season: 'FALL',
  studios: ['Toho', 'MADHOUSE', ...],
  trailer: { id: 'tR8YH0G67Rk', site: 'youtube', url: 'https://www.youtube.com/watch?v=tR8YH0G67Rk' },
  hasSub: true,
  hasDub: true,
  totalEpisodes: 28,
  episodes: [
    {
      id: 'zMLNvt6MtV/1',
      number: 1,
      title: "The Journey's End",
      description: "The world celebrates the Demon King's defeat...",
      image: 'https://artworks.thetvdb.com/banners/v4/episode/9350138/screencap/6516db4c3a389.jpg',
      releaseDate: '2023-09-29',
      isFiller: false,
      isSubbed: true,
      isDubbed: true,
      url: 'https://anikage.cc/watch/zMLNvt6MtV/1'
    },
    {...}
  ],
  ...
}
```

Episode ids have the form `<anime id>/<episode>`.

### fetchEpisodeServers

<h4>Parameters</h4>

| Parameter           | Type       | Description                                            |
| ------------------- | ---------- | ------------------------------------------------------ |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `zMLNvt6MtV/1`. |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.            |

```ts
anikage.fetchEpisodeServers('zMLNvt6MtV/1').then(data => console.log(data));
```

Returns a promise that resolves to [`IEpisodeServer[]`](../../../core/types/streaming.ts). `isDefault` marks the server the site picks first:

```js
[
  { name: 'koto', url: 'https://anikage.cc/api/media/anime/zMLNvt6MtV/episodes/1/sources?provider=koto&lang=sub', isDefault: true },
  { name: 'kite', url: '...', isDefault: false },
  {...}
]
```

Servers differ: most return HLS, `megg` returns MP4 files in several qualities, and `zen` only returns an `embedURL`.

### fetchEpisodeSources

<h4>Parameters</h4>

| Parameter           | Type       | Description                                            |
| ------------------- | ---------- | ------------------------------------------------------ |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `zMLNvt6MtV/1`. |
| server (optional)   | `string`   | Server name from `fetchEpisodeServers` (default: `koto`). |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.            |

```ts
anikage.fetchEpisodeSources('zMLNvt6MtV/1').then(data => console.log(data));
```

Returns a promise that resolves to [`ISource`](../../../core/types/streaming.ts):

```js
{
  sources: [{ url: 'https://og.bakayaro.live/m3u8/AccUU6Kv...', quality: 'HD-1', isM3U8: true }],
  subtitles: [{ url: 'https://og.bakayaro.live/stream/AccUU6Kv...', lang: 'Arabic' }, {...}],
  intro: { start: 3, end: 93 },
  outro: { start: 1417, end: 1507 },
  embedURL: 'https://megaplay.buzz/stream/s-2/107257/sub?s=tcdn'
}
```

The stream and subtitle URLs are tokens on Anikage's proxy, so they work in a standard HLS player as is.

<p align="end">(<a href="../../../../docs/guides/anime.md">back to anime providers list</a>)</p>
