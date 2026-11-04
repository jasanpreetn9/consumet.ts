# consumet.ts

consumet.ts is a Node.js TypeScript library that scrapes manga (and, when providers exist, anime and movies) from various sites and exposes them through one API. Read these instructions first, and fall back to searching the repo only when something here doesn't match what you find.

## Setup

- Node.js 24.22.2 or later, Yarn 1.22.22. Run every command from the repo root.
- `yarn install`, then `yarn build`.
- Smoke test: `node -e "const { MANGA } = require('./dist'); console.log(Object.keys(MANGA));"`

## Commands

- `yarn build` compiles `src/` to `dist/` using `tsconfig.build.json` (tests, `_template/` and `core/testing/` are excluded).
- `yarn lint` formats with Prettier.
- `yarn test` runs every test offline by replaying saved fixtures.
- `yarn test src/providers/manga/<name>` runs one provider's tests.
- `RECORD=1 yarn test src/providers/manga/<name>` re-records that provider's fixtures from the live site.

The pre-commit hook runs `yarn lint` and `yarn build`.

## Layout

```
src/
  index.ts                  public API
  core/                     framework: don't change it to add a provider
    index.ts                single entry point providers import from
    provider.ts             BaseProvider
    http.ts                 shared axios client: proxy, timeout, ProviderError
    errors.ts               ProviderError
    parsers/                MangaParser, AnimeParser, MovieParser
    types/                  common, streaming, manga, anime, movie
    utils/                  string helpers, packer unpacker
    testing/                fixtureAdapter (tests only, not published)
  providers/
    index.ts                ANIME, MANGA, MOVIES
    list.ts                 PROVIDERS_LIST (built on access)
    <category>/index.ts     registers the category's providers
    <category>/_template/   starting point for a new provider
    <category>/<name>/      index.ts, index.test.ts, fixtures/, README.md
docs/                       usage guides and status.md
```

## Adding a provider

1. Copy `src/providers/manga/_template/` to `src/providers/<category>/<name>/`.
2. Implement the class in `index.ts`, importing only from `'../../../core'`.
3. Add it to `src/providers/<category>/index.ts`.
4. Write `index.test.ts` using `fixtureAdapter(__dirname)`, then record fixtures with `RECORD=1 yarn test src/providers/<category>/<name>`.
5. Document it in its `README.md` and in `docs/guides/<category>.md`.

## Conventions

- Use `this.client` for every request. Don't create axios instances; pass per-request headers instead.
- Don't wrap provider methods in `try/catch` just to rethrow. The client already throws `ProviderError` with the provider name, URL and status.
- `dist/` is not committed; it's built when publishing.
