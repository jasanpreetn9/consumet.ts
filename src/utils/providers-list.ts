import { ANIME, MANGA, MOVIES } from '../providers';

// List of providers
export const PROVIDERS_LIST = {
  ANIME: [
    // new ANIME.AnimePahe(),
    // new ANIME.Hianime(),
    // new ANIME.AnimeKai(),
    // new ANIME.AnimeUnity(),
    // new ANIME.KickAssAnime(),
    // new ANIME.AnimeSaturn(),
  ],
  MANGA: [
    new MANGA.WeebCentral(),
    new MANGA.MangaHere(),
    new MANGA.MangaPill(),
    new MANGA.MangaDex(),
    // new MANGA.MangaReader(),
    new MANGA.MangaKakalot(),
    new MANGA.ComicK(),
    new MANGA.Comix(),
  ],
  MOVIES: [
    // new MOVIES.DramaCool(),
    // new MOVIES.FlixHQ(),
    // new MOVIES.Goku(),
    // new MOVIES.SFlix(),
    // new MOVIES.HiMovies(),
    // new MOVIES.Turkish(),
  ],
};
