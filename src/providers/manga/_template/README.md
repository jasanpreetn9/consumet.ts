<h1> Example </h1>

```ts
import { MANGA } from '@consumet/extensions';

const example = new MANGA.Example();
```

<h2>Methods</h2>

- [search](#search)
- [fetchMangaInfo](#fetchmangainfo)
- [fetchChapterPages](#fetchchapterpages)

### search

<h4>Parameters</h4>

| Parameter       | Type     | Description                      |
| --------------- | -------- | -------------------------------- |
| query           | `string` | Query to search for.             |
| page (optional) | `number` | Page number (default: `1`).      |

```ts
example.search('one piece').then(data => console.log(data));
```

Returns a promise that resolves to `ISearch<IMangaResult>`:

```js
{
  currentPage: 1,
  hasNextPage: true,
  results: [{ id: 'one-piece', title: 'One Piece', image: 'https://...' }]
}
```

### fetchMangaInfo

<h4>Parameters</h4>

| Parameter | Type     | Description                                   |
| --------- | -------- | --------------------------------------------- |
| mangaId   | `string` | Manga id, from the `id` of a search result.   |

```ts
example.fetchMangaInfo('one-piece').then(data => console.log(data));
```

Returns a promise that resolves to `IMangaInfo`, including `chapters`.

### fetchChapterPages

<h4>Parameters</h4>

| Parameter | Type     | Description                                         |
| --------- | -------- | --------------------------------------------------- |
| chapterId | `string` | Chapter id, from the `chapters` of `fetchMangaInfo`. |

```ts
example.fetchChapterPages('one-piece-chapter-1').then(data => console.log(data));
```

Returns a promise that resolves to `IMangaChapterPage[]`:

```js
[{ page: 1, img: 'https://...' }]
```

<p align="end">(<a href="../../../../docs/guides/manga.md">back to manga providers list</a>)</p>
