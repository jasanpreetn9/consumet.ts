"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDERS_LIST = void 0;
const providers_1 = require("../providers");
// List of providers
exports.PROVIDERS_LIST = {
    ANIME: [
    // new ANIME.AnimePahe(),
    // new ANIME.Hianime(),
    // new ANIME.AnimeKai(),
    // new ANIME.AnimeUnity(),
    // new ANIME.KickAssAnime(),
    // new ANIME.AnimeSaturn(),
    ],
    MANGA: [
        new providers_1.MANGA.WeebCentral(),
        new providers_1.MANGA.MangaHere(),
        new providers_1.MANGA.MangaPill(),
        new providers_1.MANGA.MangaDex(),
        // new MANGA.MangaReader(),
        new providers_1.MANGA.MangaKakalot(),
        new providers_1.MANGA.ComicK(),
        new providers_1.MANGA.Comix(),
    ],
    BOOKS: [],
    COMICS: [
    // new COMICS.GetComics()
    ],
    LIGHT_NOVELS: [],
    MOVIES: [
    // new MOVIES.DramaCool(),
    // new MOVIES.FlixHQ(),
    // new MOVIES.Goku(),
    // new MOVIES.SFlix(),
    // new MOVIES.HiMovies(),
    // new MOVIES.Turkish(),
    ],
    NEWS: [new providers_1.NEWS.ANN()],
    META: [new providers_1.META.Anilist(), new providers_1.META.TMDB(), new providers_1.META.Myanimelist()],
    OTHERS: [],
};
//# sourceMappingURL=providers-list.js.map