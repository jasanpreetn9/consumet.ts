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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderError = exports.PROVIDERS_LIST = exports.MOVIES = exports.MANGA = exports.ANIME = void 0;
var providers_1 = require("./providers");
Object.defineProperty(exports, "ANIME", { enumerable: true, get: function () { return providers_1.ANIME; } });
Object.defineProperty(exports, "MANGA", { enumerable: true, get: function () { return providers_1.MANGA; } });
Object.defineProperty(exports, "MOVIES", { enumerable: true, get: function () { return providers_1.MOVIES; } });
var list_1 = require("./providers/list");
Object.defineProperty(exports, "PROVIDERS_LIST", { enumerable: true, get: function () { return list_1.PROVIDERS_LIST; } });
var errors_1 = require("./core/errors");
Object.defineProperty(exports, "ProviderError", { enumerable: true, get: function () { return errors_1.ProviderError; } });
__exportStar(require("./core/types"), exports);
//# sourceMappingURL=index.js.map