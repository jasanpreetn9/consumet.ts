<h1 align="center">consumet.ts</h1>

## Getting Started

Hello! Thank you for checking out consumet.ts!

This document aims to be a gentle introduction to the library and its usage.

Let's start!

### Installation
consumet.ts requires [Node.js](https://nodejs.org/) 24.22.2 or later.

Install with npm:
```sh
npm i @consumet/extensions
```
Install with yarn:
```sh
yarn add @consumet/extensions
```

### Usage

**Example** - searching for manga using the MangaPill provider.
```ts
// ESM
import { MANGA } from "@consumet/extensions"
// CommonJS
const { MANGA } = require("@consumet/extensions");

const main = async () => {
  // Create a new instance of the MangaPill provider
  const mangapill = new MANGA.MangaPill();
  // Search for a manga. In this case, "One Piece"
  const results = await mangapill.search("One Piece");
  // Print the results
  console.log(results);
  // Get the first manga info
  const firstManga = results.results[0];
  const mangaInfo = await mangapill.fetchMangaInfo(firstManga.id);
  // Print the info
  console.log(mangaInfo);
  // Get the pages of the first chapter
  const pages = await mangapill.fetchChapterPages(mangaInfo.chapters![0].id);
  console.log(pages);
};

main();
```
*see also [MANGA documentation](./manga.md#manga) for more information.*\
Awesome, that was easy.

if you want to use different providers, you can check the providers list [here](https://consumet.org/extensions/list/) or in [json format](https://github.com/consumet/providers-status/blob/main/providers-list.json).

if you have any questions, please join the [discord server](https://discord.gg/qTPfvMxzNH) or open an [issue](https://github.com/jasanpreetn9/consumet.ts/issues).

<p align="end">(<a href="https://github.com/jasanpreetn9/consumet.ts/blob/master/docs">back to table of contents</a>)</p>


