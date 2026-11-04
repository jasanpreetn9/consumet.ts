export const capitalizeFirstLetter = (s: string) => s?.charAt(0).toUpperCase() + s.slice(1);

export const substringBefore = (str: string, toFind: string) => {
  const index = str.indexOf(toFind);
  return index == -1 ? '' : str.substring(0, index);
};
