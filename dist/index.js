"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaFormat = exports.TvType = exports.MediaStatus = exports.StreamingServers = exports.SubOrSub = exports.Genres = exports.Topics = exports.PROVIDERS_LIST = exports.MOVIES = exports.MANGA = exports.ANIME = void 0;
const providers_1 = require("./providers");
Object.defineProperty(exports, "ANIME", { enumerable: true, get: function () { return providers_1.ANIME; } });
Object.defineProperty(exports, "MANGA", { enumerable: true, get: function () { return providers_1.MANGA; } });
Object.defineProperty(exports, "MOVIES", { enumerable: true, get: function () { return providers_1.MOVIES; } });
const providers_list_1 = require("./utils/providers-list");
Object.defineProperty(exports, "PROVIDERS_LIST", { enumerable: true, get: function () { return providers_list_1.PROVIDERS_LIST; } });
const models_1 = require("./models");
Object.defineProperty(exports, "StreamingServers", { enumerable: true, get: function () { return models_1.StreamingServers; } });
Object.defineProperty(exports, "MediaStatus", { enumerable: true, get: function () { return models_1.MediaStatus; } });
Object.defineProperty(exports, "SubOrSub", { enumerable: true, get: function () { return models_1.SubOrSub; } });
Object.defineProperty(exports, "TvType", { enumerable: true, get: function () { return models_1.TvType; } });
Object.defineProperty(exports, "Genres", { enumerable: true, get: function () { return models_1.Genres; } });
Object.defineProperty(exports, "Topics", { enumerable: true, get: function () { return models_1.Topics; } });
Object.defineProperty(exports, "MediaFormat", { enumerable: true, get: function () { return models_1.MediaFormat; } });
//# sourceMappingURL=index.js.map