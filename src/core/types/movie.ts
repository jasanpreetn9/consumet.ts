import { ITitle, MediaStatus, Trailer } from './common';

/**
 * Used **only** for movie/tvshow providers
 */
export enum TvType {
  TVSERIES = 'TV Series',
  MOVIE = 'Movie',
  ANIME = 'Anime',
  PEOPLE = 'People',
}

export interface IMovieEpisode {
  id: string;
  title: string;
  url?: string;
  number?: number;
  season?: number;
  description?: string;
  image?: string;
  releaseDate?: string;
  [x: string]: unknown; // other fields
}

export interface IMovieResult {
  id: string;
  title: string | ITitle;
  url?: string;
  image?: string;
  releaseDate?: string;
  type?: TvType;
  [x: string]: unknown; // other unkown fields
}

export interface IMovieInfo extends IMovieResult {
  cover?: string;
  recommendations?: IMovieResult[];
  genres?: string[];
  description?: string;
  rating?: number;
  status?: MediaStatus;
  duration?: string;
  production?: string;
  casts?: string[];
  tags?: string[];
  totalEpisodes?: number;
  trailer?: Trailer;
  seasons?: { season: number; image?: string; episodes: IMovieEpisode[] }[];
  episodes?: IMovieEpisode[];
}
