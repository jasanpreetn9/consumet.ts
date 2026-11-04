"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROVIDERS_LIST = void 0;
const _1 = require(".");
const instantiate = (category) => Object.values(category).map(Provider => new Provider());
/**
 * One instance of every provider, by category. Built on first access so
 * importing the package doesn't construct every provider up front.
 */
exports.PROVIDERS_LIST = {
    get ANIME() {
        return instantiate(_1.ANIME);
    },
    get MANGA() {
        return instantiate(_1.MANGA);
    },
    get MOVIES() {
        return instantiate(_1.MOVIES);
    },
};
//# sourceMappingURL=list.js.map