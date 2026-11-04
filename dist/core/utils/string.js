"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.substringBefore = exports.capitalizeFirstLetter = void 0;
const capitalizeFirstLetter = (s) => s?.charAt(0).toUpperCase() + s.slice(1);
exports.capitalizeFirstLetter = capitalizeFirstLetter;
const substringBefore = (str, toFind) => {
    const index = str.indexOf(toFind);
    return index == -1 ? '' : str.substring(0, index);
};
exports.substringBefore = substringBefore;
//# sourceMappingURL=string.js.map