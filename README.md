<p align="center"><img src="https://consumet.org/images/consumetlogo.png" width="175"/></p>

<h1 align="center"> consumet.ts </h1>

<p align="center">
  A Node.js library for searching anime and manga sites and getting info, chapters and streams from them.
</p>

<p align="center">
  <a href="https://github.com/jasanpreetn9/consumet.ts/actions/workflows/nodejs-ci.yml">
    <img src="https://github.com/jasanpreetn9/consumet.ts/actions/workflows/nodejs-ci.yml/badge.svg?branch=v2" alt="CI">
  </a>
  <a href="./CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome">
  </a>
  <a href="./LICENSE">
    <img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg" alt="License: GPL-3.0">
  </a>
</p>

> [!IMPORTANT]
> **You're looking at v2, which is still in progress and not on npm yet.**
> The `@consumet/extensions` package on npm is the original consumet.ts 1.x line, not this code. To use v2 today, [install it from source](#installation). The 1.x code in this repository lives on the [`v1.x`](https://github.com/jasanpreetn9/consumet.ts/tree/v1.x) branch.

<h2> Table of Contents </h2>

- [What's happening in v2](#whats-happening-in-v2)
- [Providers](#providers)
- [Installation](#installation)
- [Usage](#usage)
- [Coming from 1.x](#coming-from-1x)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## What's happening in v2

consumet.ts gives you one API across many sites: create a provider, call `search`, then fetch details, chapters or streams. Sites change, go down and get blocked all the time, and by late 2026 most of the 1.x providers no longer worked. v2 is a cleanup focused on keeping what's left reliable:

- **Only working providers.** Every provider whose site was down, blocked or changed was removed, along with the code only it used. [docs/status.md](./docs/status.md) records why each one went.
- **A narrower scope.** v2 covers anime, manga and movies. The other 1.x categories (books, comics, light novels, meta, news) were dropped.
- **A simpler layout.** The shared framework lives in `src/core/` and each provider is a self-contained folder in `src/providers/`, so adding or fixing a provider doesn't mean reading the rest of the codebase.
- **Clearer errors.** Failed requests throw a `ProviderError` that says which provider, URL and HTTP status failed.
- **Tests that run offline.** Each provider's tests replay recorded responses, so CI checks the code without depending on the sites being up.
- **New providers.** ReAnime is the first one added in v2.

Expect breaking changes until 2.0.0 is released. See [Coming from 1.x](#coming-from-1x) for what has changed so far.

## Providers

| Category | Providers                                            |
| -------- | ---------------------------------------------------- |
| Anime    | ReAnime                                              |
| Manga    | ComicK, MangaDex, MangaHere, MangaPill, WeebCentral |
| Movies   | None right now                                       |

Each provider's README (linked from the [anime](./docs/guides/anime.md) and [manga](./docs/guides/manga.md) guides) lists its methods and example output.

> [!NOTE]
> ReAnime's streams are encrypted, so the `.m3u8` it returns won't play in a standard HLS player as is. Its [README](./src/providers/anime/reanime/README.md#playing-the-stream) explains how to proxy and decrypt it.

## Installation

consumet.ts requires [Node.js](https://nodejs.org/) 24.22.2 or later.

Until v2 is on npm, build it from source:

```bash
git clone -b v2 https://github.com/jasanpreetn9/consumet.ts.git
```

```bash
cd consumet.ts && npm install && npm run build
```

Then install it into your project by path:

```bash
npm install /path/to/consumet.ts
```

## Usage

Search MangaPill and read the first chapter of the top result:

```ts
import { MANGA } from '@consumet/extensions';

const mangapill = new MANGA.MangaPill();

const { results } = await mangapill.search('One Piece');
const info = await mangapill.fetchMangaInfo(results[0].id);
const pages = await mangapill.fetchChapterPages(info.chapters![0].id);

console.log(pages[0].img);
```

Every provider in a category has the same core methods, so switching sites is a one-line change. See the [getting started guide](./docs/guides/getting-started.md) for more.

**Handling errors.** Failed requests throw a `ProviderError`:

```ts
import { MANGA, ProviderError } from '@consumet/extensions';

try {
  await new MANGA.MangaDex().fetchMangaInfo('not-a-real-id');
} catch (err) {
  if (err instanceof ProviderError) console.log(err.provider, err.status, err.url);
}
```

**Using a proxy.** Pass a proxy when you create a provider, or call `setProxy` later. The target URL is added onto the end of the proxy URL. Give it an array of URLs to rotate between them:

```ts
const mangadex = new MANGA.MangaDex({ url: 'https://my-proxy.example.com/' });
```

The [getting started guide](./docs/guides/getting-started.md#using-a-proxy) covers rotation, API keys and query-parameter proxies.

**Listing providers.** `PROVIDERS_LIST` has one instance of every provider, by category:

```ts
import { PROVIDERS_LIST } from '@consumet/extensions';

console.log(PROVIDERS_LIST.MANGA.map(provider => provider.name));
```

## Coming from 1.x

- **Removed providers.** Every 1.x provider whose site was down, blocked or changed is gone; [docs/status.md](./docs/status.md) shows why each one went.
- **Removed categories.** v2 covers anime, manga and movies only. The books, comics, light novels, meta (AniList, TMDB), news and others categories were removed.
- **Errors.** Request failures now throw `ProviderError` instead of a plain `Error` or an axios error.
- **Types.** A few unused types were removed: `IAnimeEpisodeV2`, `StreamingServers`, `WatchListType`, `Topics`, `IPeopleResult`, `IStaff` and `IRoles`.

## Documentation

- [Getting started](./docs/guides/getting-started.md)
- [Anime](./docs/guides/anime.md)
- [Manga](./docs/guides/manga.md)
- [Movies](./docs/guides/movies.md)
- [Provider status](./docs/status.md): why removed providers were removed

## Contributing

New providers and fixes are welcome. [CONTRIBUTING.md](./CONTRIBUTING.md) walks through the project layout, the provider template and how to record test fixtures. To ask for a provider, open a [provider request](https://github.com/jasanpreetn9/consumet.ts/issues/new?labels=provider+request&template=provider-request.yml).

For bugs and questions, open an [issue](https://github.com/jasanpreetn9/consumet.ts/issues).

## License

Licensed under [GPL-3.0](./LICENSE). Based on the original consumet.ts and its contributors' work.
