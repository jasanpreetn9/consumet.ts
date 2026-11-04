"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeUnpack = exports.substringBefore = exports.capitalizeFirstLetter = void 0;
const capitalizeFirstLetter = (s) => s?.charAt(0).toUpperCase() + s.slice(1);
exports.capitalizeFirstLetter = capitalizeFirstLetter;
const substringBefore = (str, toFind) => {
    const index = str.indexOf(toFind);
    return index == -1 ? '' : str.substring(0, index);
};
exports.substringBefore = substringBefore;
const safeUnpack = (packedSource) => {
    try {
        // 1. Extract arguments using Regex
        // Matches: }('...', radix, count, 'keywords'
        const argsRegex = /}\s*\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\./;
        const match = argsRegex.exec(packedSource);
        if (!match)
            throw new Error('Invalid Packer format or unable to parse safely.');
        let [_, p, aStr, cStr, kStr] = match;
        const a = parseInt(aStr); // Radix
        const c = parseInt(cStr); // Count
        let k = kStr.split('|'); // Keywords
        // 2. Base62 Helper (The 'e' function in packer)
        const base62 = (n) => {
            const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            return n < a ? chars[n] : base62(Math.floor(n / a)) + chars[n % a];
        };
        // 3. Dictionary Fill (Logic: if k[i] is empty, it maps to base62(i))
        // However, standard packer usually provides full dictionary or handles empty slots dynamically.
        // Simple optimization: standard packer replaces based on index.
        const dict = {};
        for (let i = 0; i < c; i++) {
            const key = base62(i);
            const word = k[i] || key; // Fallback if empty
            dict[key] = word;
        }
        // 4. Substitution
        // Regex: /\b\w+\b/g but compliant with packer generated tokens
        return p.replace(/\b\w+\b/g, word => {
            return dict[word] || word;
        });
    }
    catch (err) {
        throw new Error(`Failed to unpack script: ${err}`);
    }
};
exports.safeUnpack = safeUnpack;
//# sourceMappingURL=index.js.map