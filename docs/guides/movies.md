<h1 align="center">consumet.ts</h1>

<h2>MOVIES</h2>

> **There are no movie providers right now.** The 1.x ones were removed because their sites are unreachable, blocked, or have changed. See [status](../status.md) for details. `MOVIES` is still exported so new providers can be added without breaking imports.

The `MOVIES` category is for providers that search movies and TV shows, get their details and episode lists, and get streaming links.

```ts
import { MOVIES } from '@consumet/extensions';

const provider = new MOVIES.<ProviderName>();
```

## Methods

Every movie provider will have these methods:

| Method                           | Returns                                                       |
| -------------------------------- | ------------------------------------------------------------- |
| `search(query, page?)`           | A page of results. Each has an `id` for `fetchMediaInfo`.     |
| `fetchMediaInfo(mediaId)`        | Details and, for TV shows, the episode list.                  |
| `fetchEpisodeServers(episodeId)` | The video servers for an episode or movie.                    |
| `fetchEpisodeSources(episodeId)` | The stream URLs, subtitles and headers needed to play it.     |

## Properties

| Property         | Description                                                                         |
| ---------------- | ----------------------------------------------------------------------------------- |
| `name`           | The provider's name.                                                                |
| `isWorking`      | `false` if the provider is known to be broken.                                      |
| `isNSFW`         | `true` if the provider only serves NSFW content.                                    |
| `classPath`      | Where the provider lives in the API, e.g. `'MOVIES.<ProviderName>'`.                |
| `stats`          | All of the above, plus `baseUrl`, `lang` and `logo`, in one object.                 |
| `supportedTypes` | A `Set` of the media types the provider has. Check one with `supportedTypes.has(type)`. |

Want to add one? See [CONTRIBUTING.md](../../CONTRIBUTING.md#writing-a-provider).

<p align="end">(<a href="../README.md">back to table of contents</a>)</p>
