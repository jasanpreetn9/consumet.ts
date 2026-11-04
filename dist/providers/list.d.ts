import { AnimeParser, MangaParser, MovieParser } from '../core';
/**
 * One instance of every provider, by category. Built on first access so
 * importing the package doesn't construct every provider up front.
 */
export declare const PROVIDERS_LIST: {
    readonly ANIME: AnimeParser[];
    readonly MANGA: MangaParser[];
    readonly MOVIES: MovieParser[];
};
