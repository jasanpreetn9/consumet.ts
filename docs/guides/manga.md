<h1 align="center">consumet.ts</h1>

<h2>MANGA</h2>

The `MANGA` category has providers for searching manga, getting their details and chapter lists, and getting the page images for a chapter.

```ts
import { MANGA } from '@consumet/extensions';

const mangapill = new MANGA.MangaPill();
```

## Methods

Every manga provider has these methods. Some providers add extra parameters or methods (MangaDex, for example, has `fetchPopular` and `fetchLatestUpdates`); check the provider's README.

| Method                         | Returns                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `search(query, page?)`         | A page of results. Each has an `id` for `fetchMangaInfo`.   |
| `fetchMangaInfo(mangaId)`      | Details and the chapter list. Each chapter has an `id`.     |
| `fetchChapterPages(chapterId)` | The chapter's pages, in order, each with an `img` URL.      |

A typical flow:

```ts
const { results } = await mangapill.search('One Piece');
const info = await mangapill.fetchMangaInfo(results[0].id);
const pages = await mangapill.fetchChapterPages(info.chapters![0].id);

console.log(pages[0].img);
```

Some image hosts reject requests without a `Referer`. If a page has a `headerForImage`, send it when you load the image.

## Properties

| Property    | Description                                                         |
| ----------- | ------------------------------------------------------------------- |
| `name`      | The provider's name, e.g. `'MangaPill'`.                            |
| `isWorking` | `false` if the provider is known to be broken.                      |
| `isNSFW`    | `true` if the provider only serves NSFW content.                    |
| `classPath` | Where the provider lives in the API, e.g. `'MANGA.MangaPill'`.      |
| `stats`     | All of the above, plus `baseUrl`, `lang` and `logo`, in one object. |

Every provider also has `setProxy(config)`; see [using a proxy](./getting-started.md#using-a-proxy).

## Manga Providers

In alphabetical order:

- [ComicK](../../src/providers/manga/comick/README.md)
- [MangaDex](../../src/providers/manga/mangadex/README.md): official API. Lists only English chapters hosted on MangaDex.
- [MangaHere](../../src/providers/manga/mangahere/README.md)
- [MangaPill](../../src/providers/manga/mangapill/README.md)
- [WeebCentral](../../src/providers/manga/weebcentral/README.md)

<p align="end">(<a href="../README.md">back to table of contents</a>)</p>
