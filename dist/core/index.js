"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderError = exports.MovieParser = exports.MangaParser = exports.AnimeParser = exports.BaseProvider = void 0;
// Everything a provider needs. Providers import from here, never from deeper paths.
var provider_1 = require("./provider");
Object.defineProperty(exports, "BaseProvider", { enumerable: true, get: function () { return __importDefault(provider_1).default; } });
var anime_1 = require("./parsers/anime");
Object.defineProperty(exports, "AnimeParser", { enumerable: true, get: function () { return __importDefault(anime_1).default; } });
var manga_1 = require("./parsers/manga");
Object.defineProperty(exports, "MangaParser", { enumerable: true, get: function () { return __importDefault(manga_1).default; } });
var movie_1 = require("./parsers/movie");
Object.defineProperty(exports, "MovieParser", { enumerable: true, get: function () { return __importDefault(movie_1).default; } });
var errors_1 = require("./errors");
Object.defineProperty(exports, "ProviderError", { enumerable: true, get: function () { return errors_1.ProviderError; } });
__exportStar(require("./types"), exports);
__exportStar(require("./utils"), exports);
//# sourceMappingURL=index.js.map