"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDERS_LIST = void 0;
const providers_1 = require("../providers");
// List of providers
exports.PROVIDERS_LIST = {
    ANIME: [],
    MANGA: [
        new providers_1.MANGA.WeebCentral(),
        new providers_1.MANGA.MangaHere(),
        new providers_1.MANGA.MangaPill(),
        new providers_1.MANGA.MangaDex(),
        new providers_1.MANGA.ComicK(),
    ],
    MOVIES: [],
};
//# sourceMappingURL=providers-list.js.map