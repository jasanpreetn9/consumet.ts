"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDERS_LIST = void 0;
const _1 = require(".");
// List of providers
exports.PROVIDERS_LIST = {
    ANIME: [],
    MANGA: [
        new _1.MANGA.WeebCentral(),
        new _1.MANGA.MangaHere(),
        new _1.MANGA.MangaPill(),
        new _1.MANGA.MangaDex(),
        new _1.MANGA.ComicK(),
    ],
    MOVIES: [],
};
//# sourceMappingURL=list.js.map