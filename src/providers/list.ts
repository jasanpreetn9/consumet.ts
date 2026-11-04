import { MANGA } from '.';

// List of providers
export const PROVIDERS_LIST = {
  ANIME: [],
  MANGA: [
    new MANGA.WeebCentral(),
    new MANGA.MangaHere(),
    new MANGA.MangaPill(),
    new MANGA.MangaDex(),
    new MANGA.ComicK(),
  ],
  MOVIES: [],
};
