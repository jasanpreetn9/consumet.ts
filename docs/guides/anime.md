<h1 align="center">consumet.ts</h1>

<h2>ANIME</h2>

The `ANIME` category has providers for searching anime, getting their details and episode lists, and getting streaming links.

```ts
import { ANIME } from '@consumet/extensions';

const reanime = new ANIME.ReAnime();
```

## Methods

Every anime provider has these methods. Some providers add extra parameters or methods; check the provider's README.

| Method                           | Returns                                                       |
| -------------------------------- | ------------------------------------------------------------- |
| `search(query, page?)`           | A page of results. Each has an `id` for `fetchAnimeInfo`.     |
| `fetchAnimeInfo(animeId)`        | Details and the episode list. Each episode has an `id`.       |
| `fetchEpisodeServers(episodeId)` | The video servers for an episode.                             |
| `fetchEpisodeSources(episodeId)` | The stream URLs, subtitles and headers needed to play it.     |

A typical flow:

```ts
const { results } = await reanime.search('Frieren');
const info = await reanime.fetchAnimeInfo(results[0].id);
const sources = await reanime.fetchEpisodeSources(info.episodes![0].id);

console.log(sources.sources[0].url);
```

Some streams need the `headers` in the response (often a `Referer`) to play. Send them with every playlist and segment request.

## Properties

| Property                   | Description                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `name`                     | The provider's name, e.g. `'ReAnime'`.                                                |
| `isWorking`                | `false` if the provider is known to be broken.                                        |
| `isNSFW`                   | `true` if the provider only serves NSFW content.                                      |
| `classPath`                | Where the provider lives in the API, e.g. `'ANIME.ReAnime'`.                          |
| `stats`                    | All of the above, plus `baseUrl`, `lang` and `logo`, in one object.                   |

Every provider also has `setProxy(config)`; see [using a proxy](./getting-started.md#using-a-proxy).

## Anime Providers

- [ReAnime](../../src/providers/anime/reanime/README.md): sub and dub, from reanime.to. Its streams are encrypted and need a small proxy to play; its README explains how.

> The 1.x anime providers were removed because their sites are unreachable, blocked, or have changed. See [status](../status.md) for details.

<p align="end">(<a href="../README.md">back to table of contents</a>)</p>
