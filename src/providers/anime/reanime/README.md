<h1> ReAnime </h1>

```ts
import { ANIME } from '@consumet/extensions';

const reanime = new ANIME.ReAnime();
```

ReAnime ([reanime.to](https://reanime.to)) has a JSON API for search, info and episodes. Its streams are hosted on FlixCloud, whose playlists are encrypted; see [Playing the stream](#playing-the-stream).

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
reanime.search('frieren').then(data => console.log(data));
```

Returns a promise that resolves to [`ISearch<IAnimeResult>`](../../../core/types/common.ts):

```js
{
  currentPage: 1,
  hasNextPage: false,
  totalPages: 1,
  totalResults: 7,
  results: [
    {
      id: 'frieren-beyond-journey-s-end-yw2a3j',
      anilistId: 154587,
      title: 'Frieren: Beyond Journey’s End',
      japaneseTitle: '葬送のフリーレン',
      romajiTitle: 'Sousou no Frieren',
      url: 'https://reanime.to/anime/frieren-beyond-journey-s-end-yw2a3j',
      image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-qQTzQnEJJ3oB.jpg',
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

| Parameter | Type     | Description                                    |
| --------- | -------- | ---------------------------------------------- |
| animeId   | `string` | Anime id, from the `id` of a search result.    |

```ts
reanime.fetchAnimeInfo('frieren-beyond-journey-s-end-yw2a3j').then(data => console.log(data));
```

Returns a promise that resolves to [`IAnimeInfo`](../../../core/types/anime.ts), with every episode (long series are fetched in pages of 1000):

```js
{
  id: 'frieren-beyond-journey-s-end-yw2a3j',
  anilistId: 154587,
  malId: 52991,
  title: 'Frieren: Beyond Journey’s End',
  description: 'The adventure is over but life goes on for an elf mage...',
  cover: 'https://s4.anilist.co/file/anilistcdn/media/anime/banner/154587-ivXNJ23SM1xB.jpg',
  season: 'FALL',
  studios: ['Toho', 'MADHOUSE', ...],
  totalEpisodes: 28,
  episodes: [
    {
      id: '154587/1',
      number: 1,
      title: 'Episode 1',
      image: 'https://img1.ak.crunchyroll.com/i/spire1-tmb/...',
      releaseDate: '2023-09-29T00:00:00Z',
      isFiller: false,
      isSubbed: true,
      isDubbed: true,
      url: 'https://reanime.to/watch/frieren-beyond-journey-s-end-yw2a3j?ep=1'
    },
    {...}
  ],
  ...
}
```

Episode ids have the form `<anilistId>/<episode>`.

### fetchEpisodeServers

<h4>Parameters</h4>

| Parameter           | Type       | Description                                         |
| ------------------- | ---------- | --------------------------------------------------- |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `154587/1`.   |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.          |

```ts
reanime.fetchEpisodeServers('154587/1').then(data => console.log(data));
```

Returns a promise that resolves to [`IEpisodeServer[]`](../../../core/types/streaming.ts):

```js
[
  { name: 'HD-1', url: 'https://flixcloud.cc/e/rjyccuaq8h5n?v=1', type: 'sub' },
  { name: 'HD-2', url: 'https://flixcloud.cc/e/rjyccuaq8h5n?v=2', type: 'sub' }
]
```

### fetchEpisodeSources

<h4>Parameters</h4>

| Parameter           | Type       | Description                                         |
| ------------------- | ---------- | --------------------------------------------------- |
| episodeId           | `string`   | Episode id from `fetchAnimeInfo`, e.g. `154587/1`.   |
| server (optional)   | `string`   | `'HD-2'` (default) or `'HD-1'`.                      |
| subOrDub (optional) | `SubOrSub` | `SubOrSub.SUB` (default) or `SubOrSub.DUB`.          |

```ts
reanime.fetchEpisodeSources('154587/1').then(data => console.log(data));
```

Returns a promise that resolves to an [`ISource`](../../../core/types/streaming.ts) with two extra fields, `playlistKey` and `videoTitle`:

```js
{
  headers: { Referer: 'https://flixcloud.cc/' },
  sources: [{ url: 'https://fetch8.flixcloud.cc/_v8/.../master.m3u8?token=...', quality: 'auto', isM3U8: true }],
  subtitles: [{ url: 'https://...vtt', lang: 'English (Full Subtitles [9volt])' }, {...}],
  intro: { start: 0, end: 90 },
  outro: { start: 1459, end: 1549 },
  embedURL: 'https://flixcloud.cc/e/rjyccuaq8h5n?v=2',
  playlistKey: 'base64...',
  videoTitle: "[LostYears] Frieren Beyond Journey's End - S01E01 (...).mkv"
}
```

The stream URL is short-lived (it carries a token), so fetch sources right before playing.

### Playing the stream

FlixCloud encrypts its playlists, so the `.m3u8` above won't play in a standard HLS player directly. Serve it through a small proxy that:

1. Fetches each playlist (master and variants) with `headers`, then returns `ReAnime.decryptPlaylist(body, playlistKey)`. Relative URIs in the playlist are relative to the original playlist URL.
2. Fetches each segment with `headers`, then returns `ReAnime.decodeSegment(bytes)`, which strips the fake image header some segments are wrapped in. Other segments pass through unchanged.
3. Fetches the AES-128 key the variant playlist names (`#EXT-X-KEY:METHOD=AES-128,URI="key.bin"`) with `headers`, and returns it as is. This is standard HLS encryption: the player decrypts the segments itself.

Segments are served with an `image/webp` content type even though they're video, so set `Content-Type: video/mp2t` on them if your player checks it.

```ts
import { ANIME } from '@consumet/extensions';

const playlist = ANIME.ReAnime.decryptPlaylist(encryptedBody, source.playlistKey); // '#EXTM3U...'
const segment = ANIME.ReAnime.decodeSegment(new Uint8Array(segmentBytes));
```

Sub and dub servers usually share one stream; the master playlist lists both audio tracks (`Native` and `English`).

If you'd rather not proxy, `embedURL` can be shown in an iframe.

<p align="end">(<a href="../../../../docs/guides/anime.md">back to anime providers list</a>)</p>
