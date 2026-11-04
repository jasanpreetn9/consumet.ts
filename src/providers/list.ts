import { ANIME, MANGA, MOVIES } from '.';
import { AnimeParser, MangaParser, MovieParser } from '../core';

const instantiate = <T>(category: Record<string, new () => T>): T[] =>
  Object.values(category).map(Provider => new Provider());

/**
 * One instance of every provider, by category. Built on first access so
 * importing the package doesn't construct every provider up front.
 */
export const PROVIDERS_LIST = {
  get ANIME(): AnimeParser[] {
    return instantiate<AnimeParser>(ANIME);
  },
  get MANGA(): MangaParser[] {
    return instantiate<MangaParser>(MANGA);
  },
  get MOVIES(): MovieParser[] {
    return instantiate<MovieParser>(MOVIES);
  },
};
