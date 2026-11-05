import { ITitle, MediaStatus } from './common';

export interface IMangaResult {
  id: string;
  title: string | [lang: string][] | ITitle;
  altTitles?: string | string[] | Record<string, string>[];
  image?: string;
  description?: string | [lang: string][] | { [lang: string]: string };
  status?: MediaStatus;
  releaseDate?: number | string;
  [x: string]: unknown; // other fields
}

export interface IMangaChapter {
  id: string;
  title: string;
  volume?: number;
  pages?: number;
  releaseDate?: string;
  [x: string]: unknown; // other fields
}

export interface IMangaInfo extends IMangaResult {
  malId?: number | string;
  authors?: string[];
  genres?: string[];
  links?: string[];
  characters?: any[];
  recommendations?: IMangaResult[];
  chapters?: IMangaChapter[];
}

export interface IMangaChapterPage {
  img: string;
  page: number;
  [x: string]: unknown; // other fields
}
