<h1> Anikoto </h1>

```ts
import { ANIME } from '@consumet/extensions';

const anikoto = new ANIME.Anikoto();
```

Anikoto ([anikototv.to](https://anikototv.to)) is scraped from its pages and AJAX endpoints. Its video servers are MegaPlay players that only hand an encrypted stream URL to their own page, so `fetchEpisodeSources` returns an `embedURL` to show in an iframe, not a direct stream.

<h2>Methods</h2>

- [search](#search)
- [fetchAnimeInfo](#fetchanimeinfo)
- [fetchEpisodeServers](#fetchepisodeservers)
- [fetchEpisodeSources](#fetchepisodesources)

### search

<h4>Parameters</h4>

| Parameter       | Type     | Description                 |
| --------------- | -------- | --------------------------- |
| query           | `string` | Query to search for.        |
| page (optional) | `number` | Page number (default: `1`). |

```ts
anikoto.search('frieren').then(data => console.log(data));
```

Returns a promise that resolves to [`ISearch<IAnimeResult>`](../../../core/types/common.ts):

```js
{
  currentPage: 1,
  hasNextPage: false,
  results: [
    {
      id: 'frieren-beyond-journey-s-end-c6fbj',
      title: "Frieren: Beyond Journey's End",
      japaneseTitle: 'Sousou no Frieren',
      url: 'https://anikototv.to/watch/frieren-beyond-journey-s-end-c6fbj',
      image: 'https://cdn.anipixcdn.co/thumbnail/bb6d2babd7797d94d8f4a8600bc9b44e.jpg',
      type: 'TV',
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
anikoto.fetchAnimeInfo('frieren-beyond-journey-s-end-c6fbj').then(data => console.log(data));
```

Returns a promise that resolves to [`IAnimeInfo`](../../../core/types/anime.ts):

```js
{
  id: 'frieren-beyond-journey-s-end-c6fbj',
  malId: 52991,
  title: "Frieren: Beyond Journey's End",
  description: 'During their decade-long quest to defeat the Demon King...',
  type: 'TV',
  status: 'Completed',
  season: 'FALL',
  releaseDate: '2023',
  genres: ['Adventure', 'Fantasy', 'Shounen', 'Drama'],
  studios: ['Madhouse'],
  rating: 9.36,
  hasSub: true,
  hasDub: true,
  totalEpisodes: 28,
  episodes: [
    {
      id: '6351/1',
      number: 1,
      title: "The Journey's End",
      isSubbed: true,
      isDubbed: true,
      releaseDate: '2024-10-18T09:15:13.000Z'
    },
    {...}
  ],
  ...
}
```

Episode ids have the form `<Anikoto's internal id>/<episode>`, e.g. `6351/1`. `releaseDate` on an episode is when Anikoto added it, not when it aired.

### fetchEpisodeServers

<h4>Parameters</h4>

| Parameter           | Type       | Description                                      |
| ------------------- | ---------- | ------------------------------------------------ |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `6351/1`. |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.      |

```ts
anikoto.fetchEpisodeServers('6351/1').then(data => console.log(data));
```

Returns a promise that resolves to [`IEpisodeServer[]`](../../../core/types/streaming.ts). Each `url` is an opaque link id that `fetchEpisodeSources` exchanges for a player URL:

```js
[
  { name: 'HD-1', url: 'MTF1dkFtaW9BRTZP...', serverId: '323' },
  { name: 'Vidstream-2', url: 'MTF1dkFtaW9BRTZP...', serverId: 'e54' },
  {...}
]
```

### fetchEpisodeSources

<h4>Parameters</h4>

| Parameter           | Type       | Description                                                      |
| ------------------- | ---------- | ---------------------------------------------------------------- |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `6351/1`.                 |
| server (optional)   | `string`   | Server name from `fetchEpisodeServers` (default: the first one). |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.                      |

```ts
anikoto.fetchEpisodeSources('6351/1').then(data => console.log(data));
```

Returns a promise that resolves to [`ISource`](../../../core/types/streaming.ts) with no direct sources:

```js
{
  sources: [],
  embedURL: 'https://megaplay.buzz/stream/s-2/107257/sub?s=tcdn',
  intro: { start: 0, end: 89 },
  outro: { start: 1460, end: 1549 }
}
```

Show `embedURL` in an iframe. If you need a direct stream, try [ANV](../anv/README.md) or [Anikage](../anikage/README.md): they draw on the same backend, so they usually have the same episodes.

<p align="end">(<a href="../../../../docs/guides/anime.md">back to anime providers list</a>)</p>
