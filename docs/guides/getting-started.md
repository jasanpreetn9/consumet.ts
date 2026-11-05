<h1 align="center">consumet.ts</h1>

## Getting Started

This guide installs consumet.ts and walks through a first search, from finding a manga to getting its page images.

### Installation

consumet.ts requires [Node.js](https://nodejs.org/) 24.22.2 or later.

v2 isn't on npm yet. The `@consumet/extensions` package there is the old 1.x code, so build v2 from source instead:

```sh
git clone -b v2 https://github.com/jasanpreetn9/consumet.ts.git
cd consumet.ts
npm install
npm run build
```

Then, in your own project, install it by path:

```sh
npm install /path/to/consumet.ts
```

It still installs under the name `@consumet/extensions`, so the imports below work as written.

### Your first search

Every provider belongs to a category (`ANIME`, `MANGA` or `MOVIES`). Create a provider, then call its methods:

```ts
// ESM
import { MANGA } from '@consumet/extensions';
// CommonJS
// const { MANGA } = require('@consumet/extensions');

const mangapill = new MANGA.MangaPill();

// 1. Search. Each result has an id you pass to the next call.
const { results } = await mangapill.search('One Piece');
console.log(results[0]);

// 2. Get the manga's details and chapter list.
const info = await mangapill.fetchMangaInfo(results[0].id);
console.log(info.title, info.chapters!.length);

// 3. Get the page images for a chapter.
const pages = await mangapill.fetchChapterPages(info.chapters![0].id);
console.log(pages[0].img);
```

Anime works the same way: `search`, then `fetchAnimeInfo`, then `fetchEpisodeServers` and `fetchEpisodeSources` for the stream. See the [anime guide](./anime.md).

### Switching providers

Providers in a category share the same core methods, so switching sites is usually a one-line change:

```ts
const mangadex = new MANGA.MangaDex();
const { results } = await mangadex.search('One Piece');
```

Ids are specific to each provider, though. Don't pass an id from one provider to another.

To see every provider in code, use `PROVIDERS_LIST`:

```ts
import { PROVIDERS_LIST } from '@consumet/extensions';

console.log(PROVIDERS_LIST.MANGA.map(provider => provider.name));
// [ 'MangaDex', 'ComicK', 'MangaHere', 'MangaPill', 'WeebCentral' ]
```

### Handling errors

When a request fails, the provider throws a `ProviderError` that says which provider, URL and HTTP status failed:

```ts
import { MANGA, ProviderError } from '@consumet/extensions';

try {
  await new MANGA.MangaDex().fetchMangaInfo('not-a-real-id');
} catch (err) {
  if (err instanceof ProviderError) {
    console.log(err.provider); // 'MangaDex'
    console.log(err.status); // 404
    console.log(err.url);
  }
}
```

Requests time out after 20 seconds.

### Using a proxy

Some sites block certain regions or servers. Pass a proxy when you create a provider, or call `setProxy` later:

```ts
const mangadex = new MANGA.MangaDex({ url: 'https://my-proxy.example.com/' });

// Rotate between several proxies (every 5 seconds by default), with an API key sent as X-API-Key:
mangadex.setProxy({
  url: ['https://proxy-1.example.com/', 'https://proxy-2.example.com/'],
  key: 'my-key',
  rotateInterval: 5000,
});
```

The target URL is added straight onto the end of the proxy URL, so with `https://my-proxy.example.com/` a request goes to `https://my-proxy.example.com/https://api.mangadex.org/...`. For proxies that take the target as a query parameter, end the proxy URL with the parameter and set `encodeUrl: true`:

```ts
mangadex.setProxy({ url: 'https://my-proxy.example.com/get?url=', encodeUrl: true });
```

### Next steps

- [Anime providers](./anime.md)
- [Manga providers](./manga.md)
- Each provider's README, linked from those guides, shows every method with example output.

For bugs and questions, open an [issue](https://github.com/jasanpreetn9/consumet.ts/issues).

<p align="end">(<a href="../README.md">back to table of contents</a>)</p>
