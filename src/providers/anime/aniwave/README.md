<h1> AniWave </h1>

```ts
import { ANIME } from '@consumet/extensions';

const aniwave = new ANIME.AniWave();
```

AniWave ([aniwaves.ru](https://aniwaves.ru)) is scraped from its pages and AJAX endpoints. Every AniWave server is a third-party player page, so `fetchEpisodeSources` returns an `embedURL` to show in an iframe, not a direct stream.

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
aniwave.search('frieren').then(data => console.log(data));
```

Returns a promise that resolves to [`ISearch<IAnimeResult>`](../../../core/types/common.ts):

```js
{
  currentPage: 1,
  hasNextPage: false,
  totalPages: 1,
  results: [
    {
      id: 'sousou-no-frieren-74575',
      title: "Frieren: Beyond Journey's End",
      japaneseTitle: 'Sousou no Frieren',
      url: 'https://aniwaves.ru/watch/sousou-no-frieren-74575',
      image: 'https://static.aniwaves.ru/resources/thumbnails/200x280/100/eafa10c549c4d0e90ee123a8886ce0ca.jpg',
      type: 'TV',
      genres: ['Adventure', 'Drama', 'Fantasy', 'Shounen'],
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
aniwave.fetchAnimeInfo('sousou-no-frieren-74575').then(data => console.log(data));
```

Returns a promise that resolves to [`IAnimeInfo`](../../../core/types/anime.ts):

```js
{
  id: 'sousou-no-frieren-74575',
  title: "Frieren: Beyond Journey's End",
  japaneseTitle: 'Sousou no Frieren',
  synonyms: ['Sousou no Frieren', 'Frieren at the Funeral', ...],
  description: 'During their decade-long quest to defeat the Demon King...',
  type: 'TV',
  status: 'Completed',
  season: 'FALL',
  releaseDate: '2023',
  genres: ['Adventure', 'Drama', 'Fantasy', 'Shounen'],
  studios: ['Madhouse'],
  rating: 9,
  hasSub: true,
  hasDub: true,
  totalEpisodes: 28,
  episodes: [
    {
      id: '74575/1',
      number: 1,
      title: "The Journey's End",
      isFiller: false,
      isSubbed: true,
      isDubbed: true,
      releaseDate: '2023-09-29T00:00:00+09:00',
      url: 'https://aniwaves.ru/watch/74575/ep-1'
    },
    {...}
  ],
  ...
}
```

Episode ids have the form `<AniWave's internal id>/<episode>`, e.g. `74575/1`. The internal id is the number at the end of the anime id.

### fetchEpisodeServers

<h4>Parameters</h4>

| Parameter           | Type       | Description                                       |
| ------------------- | ---------- | ------------------------------------------------- |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `74575/1`. |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.       |

```ts
aniwave.fetchEpisodeServers('74575/1').then(data => console.log(data));
```

Returns a promise that resolves to [`IEpisodeServer[]`](../../../core/types/streaming.ts). Each `url` is an opaque link id that `fetchEpisodeSources` exchanges for a player URL:

```js
[
  { name: 'Vidplay', url: 'a2a6d165fc6c91a5...', serverId: '4' },
  { name: 'BYFMS', url: '36b102d596bbb638...', serverId: '1' },
  { name: 'DGHG', url: '...', serverId: '...' }
]
```

### fetchEpisodeSources

<h4>Parameters</h4>

| Parameter           | Type       | Description                                                      |
| ------------------- | ---------- | ---------------------------------------------------------------- |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `74575/1`.                |
| server (optional)   | `string`   | Server name from `fetchEpisodeServers` (default: the first one). |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.                      |

```ts
aniwave.fetchEpisodeSources('74575/1').then(data => console.log(data));
```

Returns a promise that resolves to [`ISource`](../../../core/types/streaming.ts) with no direct sources:

```js
{
  sources: [],
  embedURL: 'https://play.vhscdn.to/embed-1/2d8ce1fa4de6433e...'
}
```

Show `embedURL` in an iframe. AniWave adds `intro` and `outro` when it has skip times for the episode.

<p align="end">(<a href="../../../../docs/guides/anime.md">back to anime providers list</a>)</p>
