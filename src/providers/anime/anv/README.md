<h1> ANV </h1>

```ts
import { ANIME } from '@consumet/extensions';

const anv = new ANIME.ANV();
```

ANV ([anv.to](https://anv.to)) has a catalog API for search and info, and an episode API that returns HLS streams. Results include AniList and MyAnimeList ids. The streams only play with the `headers` returned alongside them; see [Playing the stream](#playing-the-stream).

<h2>Methods</h2>

- [search](#search)
- [fetchAnimeInfo](#fetchanimeinfo)
- [fetchEpisodeServers](#fetchepisodeservers)
- [fetchEpisodeSources](#fetchepisodesources)
- [Playing the stream](#playing-the-stream)

### search

<h4>Parameters</h4>

| Parameter       | Type     | Description                 |
| --------------- | -------- | --------------------------- |
| query           | `string` | Query to search for.        |
| page (optional) | `number` | Page number (default: `1`). |

```ts
anv.search('frieren').then(data => console.log(data));
```

Returns a promise that resolves to [`ISearch<IAnimeResult>`](../../../core/types/common.ts):

```js
{
  currentPage: 1,
  hasNextPage: false,
  totalPages: 1,
  totalResults: 3,
  results: [
    {
      id: 'frieren-beyond-journey-s-end-c6fbj',
      anilistId: 154587,
      malId: 52991,
      title: "Frieren: Beyond Journey's End",
      romajiTitle: 'Sousou no Frieren',
      url: 'https://anv.to/anime/frieren-beyond-journey-s-end-c6fbj',
      image: 'https://cdn.anipixcdn.co/thumbnail/bb6d2babd7797d94d8f4a8600bc9b44e.jpg',
      cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg',
      type: 'TV',
      status: 'Completed',
      genres: ['Adventure', 'Fantasy', ...],
      releaseDate: '2023',
      rating: 94,
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
anv.fetchAnimeInfo('frieren-beyond-journey-s-end-c6fbj').then(data => console.log(data));
```

Returns a promise that resolves to [`IAnimeInfo`](../../../core/types/anime.ts):

```js
{
  id: 'frieren-beyond-journey-s-end-c6fbj',
  anilistId: 154587,
  malId: 52991,
  title: "Frieren: Beyond Journey's End",
  description: 'During their decade-long quest to defeat the Demon King...',
  season: 'FALL',
  studios: ['Madhouse'],
  totalEpisodes: 28,
  episodes: [
    {
      id: 'frieren-beyond-journey-s-end-c6fbj/1',
      number: 1,
      title: "The Journey's End",
      image: 'https://cdn.anipixcdn.co/thumbnail/bb6d2babd7797d94d8f4a8600bc9b44e.jpg',
      url: 'https://anv.to/anime/frieren-beyond-journey-s-end-c6fbj-episode-1'
    },
    {...}
  ],
  ...
}
```

Episode ids have the form `<anime id>/<episode>`. For a series still airing, the list stops at the latest released episode.

### fetchEpisodeServers

<h4>Parameters</h4>

| Parameter           | Type       | Description                                                                    |
| ------------------- | ---------- | ------------------------------------------------------------------------------ |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `frieren-beyond-journey-s-end-c6fbj/1`. |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.                                    |

```ts
anv.fetchEpisodeServers('frieren-beyond-journey-s-end-c6fbj/1').then(data => console.log(data));
```

Returns a promise that resolves to [`IEpisodeServer[]`](../../../core/types/streaming.ts):

```js
[
  { name: 'Orange', url: 'https://anv.to/stream/b4hrI5sN...' },
  { name: 'Pear', url: 'https://anv.to/stream/HwuECVyt...' },
  { name: 'Banana', url: 'https://anv.to/stream/HwuECVyt...' }
]
```

### fetchEpisodeSources

<h4>Parameters</h4>

| Parameter           | Type       | Description                                                                    |
| ------------------- | ---------- | ------------------------------------------------------------------------------ |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `frieren-beyond-journey-s-end-c6fbj/1`. |
| server (optional)   | `string`   | Server name from `fetchEpisodeServers` (default: the first one).               |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.                                    |

```ts
anv.fetchEpisodeSources('frieren-beyond-journey-s-end-c6fbj/1').then(data => console.log(data));
```

Returns a promise that resolves to [`ISource`](../../../core/types/streaming.ts):

```js
{
  headers: {
    Referer: 'https://anv.to/anime/frieren-beyond-journey-s-end-c6fbj-episode-1',
    Cookie: 'shiro_watch=...'
  },
  sources: [{ url: 'https://anv.to/stream/b4hrI5sN...', quality: 'auto', isM3U8: true }],
  subtitles: [{ url: 'https://anv.to/stream/HEH151yL...', lang: 'Arabic' }, {...}],
  intro: { start: 0, end: 96.252 }
}
```

ANV's episode API needs the AniList id, which ANV only exposes in AniList banner image URLs. Titles without an AniList banner throw an error here.

### Playing the stream

ANV only serves a stream to requests that send both the `Referer` and the `Cookie` from `headers`. A browser can't set those on its own, so serve the playlist, its segments and the subtitles through a small proxy that adds `headers` to every request. If playback starts failing, call `fetchEpisodeSources` again to get a fresh cookie.

<p align="end">(<a href="../../../../docs/guides/anime.md">back to anime providers list</a>)</p>
