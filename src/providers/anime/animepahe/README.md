<h1> AnimePahe </h1>

```ts
import { ANIME } from '@consumet/extensions';

const animepahe = new ANIME.AnimePahe();
```

AnimePahe ([animepahe.by](https://animepahe.by)) is scraped for search, info and episodes. Its streams come from the players it embeds, which are keyed by MyAnimeList id:

- **Megavid** (the default) returns a direct HLS stream, with subtitles and intro/outro times.
- **Megaplay** only returns an `embedURL` to show in an iframe.

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
animepahe.search('frieren').then(data => console.log(data));
```

Returns a promise that resolves to [`ISearch<IAnimeResult>`](../../../core/types/common.ts):

```js
{
  currentPage: 1,
  hasNextPage: false,
  results: [
    {
      id: 'frieren-beyond-journeys-end',
      title: 'Frieren: Beyond Journey’s End',
      url: 'https://animepahe.by/anime/frieren-beyond-journeys-end/',
      image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-qQTzQnEJJ3oB.jpg'
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
animepahe.fetchAnimeInfo('frieren-beyond-journeys-end').then(data => console.log(data));
```

Returns a promise that resolves to [`IAnimeInfo`](../../../core/types/anime.ts):

```js
{
  id: 'frieren-beyond-journeys-end',
  malId: 52991,
  anilistId: 154587,
  title: 'Frieren: Beyond Journey’s End',
  japaneseTitle: '葬送のフリーレン',
  synonyms: ['Frieren at the Funeral', ...],
  description: 'The adventure is over but life goes on for an elf mage...',
  type: 'TV',
  status: 'Completed',
  season: 'FALL',
  releaseDate: '2023',
  studios: ['MADHOUSE'],
  genres: ['Adventure', 'Drama', 'Fantasy'],
  totalEpisodes: 28,
  episodes: [
    { id: '52991/1', number: 1, url: 'https://animepahe.by/watch/frieren-beyond-journeys-end-ep-1/' },
    {...}
  ]
}
```

Episode ids have the form `<malId>/<episode>`. If you already have a MyAnimeList id, you can build episode ids yourself and skip `search` and `fetchAnimeInfo`.

### fetchEpisodeServers

<h4>Parameters</h4>

| Parameter           | Type       | Description                                       |
| ------------------- | ---------- | ------------------------------------------------- |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `52991/1`. |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.       |

```ts
animepahe.fetchEpisodeServers('52991/1').then(data => console.log(data));
```

Returns a promise that resolves to [`IEpisodeServer[]`](../../../core/types/streaming.ts):

```js
[
  { name: 'Megavid', url: 'https://megavid.buzz/mal/52991/1/sub' },
  { name: 'Megaplay', url: 'https://megaplay.buzz/stream/mal/52991/1/sub' }
]
```

### fetchEpisodeSources

<h4>Parameters</h4>

| Parameter           | Type       | Description                                           |
| ------------------- | ---------- | ----------------------------------------------------- |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `52991/1`.     |
| server (optional)   | `string`   | `'Megavid'` (default) or `'Megaplay'`.                |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.           |

```ts
animepahe.fetchEpisodeSources('52991/1').then(data => console.log(data));
```

Returns a promise that resolves to [`ISource`](../../../core/types/streaming.ts):

```js
{
  headers: { Referer: 'https://megavid.buzz/' },
  sources: [{ url: 'https://s-90.megavid.se/uwu/v1.FuVKDycO.../master.txt', quality: 'auto', isM3U8: true }],
  subtitles: [{ url: 'https://s-90.megavid.se/uwu/...', lang: 'English' }, {...}],
  intro: { start: 0, end: 89 },
  outro: { start: 1460, end: 1549 },
  embedURL: 'https://megavid.buzz/mal/52991/1/sub'
}
```

The playlist ends in `.txt` but is an HLS playlist. With `'Megaplay'`, `sources` is empty and only `embedURL` is set.

<p align="end">(<a href="../../../../docs/guides/anime.md">back to anime providers list</a>)</p>
