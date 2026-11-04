/** Decodes Dean Edwards' p.a.c.k.e.r. obfuscated scripts without eval. */
export const safeUnpack = (packedSource: string): string => {
  try {
    // 1. Extract arguments using Regex
    // Matches: }('...', radix, count, 'keywords'
    const argsRegex = /}\s*\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*'((?:[^'\\]|\\.)*)'\./;
    const match = argsRegex.exec(packedSource);

    if (!match) throw new Error('Invalid Packer format or unable to parse safely.');

    let [_, p, aStr, cStr, kStr] = match;
    const a = parseInt(aStr); // Radix
    const c = parseInt(cStr); // Count
    let k = kStr.split('|'); // Keywords

    // 2. Base62 Helper (The 'e' function in packer)
    const base62 = (n: number): string => {
      const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
      return n < a ? chars[n] : base62(Math.floor(n / a)) + chars[n % a];
    };

    // 3. Dictionary Fill (Logic: if k[i] is empty, it maps to base62(i))
    // However, standard packer usually provides full dictionary or handles empty slots dynamically.
    // Simple optimization: standard packer replaces based on index.

    const dict: Record<string, string> = {};
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
  } catch (err) {
    throw new Error(`Failed to unpack script: ${err}`);
  }
};
