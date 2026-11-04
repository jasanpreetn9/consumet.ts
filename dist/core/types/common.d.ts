export interface IProviderStats {
    name: string;
    baseUrl: string;
    lang: string[] | string;
    isNSFW: boolean;
    logo?: string;
    classPath: string;
    isWorking: boolean;
}
export interface ProxyConfig {
    /**
     * The proxy URL
     * @example https://proxy.com
     **/
    url: string | string[];
    /**
     * X-API-Key header value (if any)
     **/
    key?: string;
    /**
     * The proxy rotation interval in milliseconds. (default: 5000)
     */
    rotateInterval?: number;
    /**
     * When true, the target URL is encoded with encodeURIComponent before
     * being appended to the proxy URL. Required for CORS proxies that
     * expect the target URL as a query parameter value.
     * @example url: 'https://whatever.fly.dev/get?url=', encodeUrl: true
     */
    encodeUrl?: boolean;
}
export interface ISearch<T> {
    currentPage?: number;
    hasNextPage?: boolean;
    totalPages?: number;
    /**
     * total results must include results from all pages
     */
    totalResults?: number;
    results: T[];
}
export interface ITitle {
    romaji?: string;
    english?: string;
    native?: string;
    userPreferred?: string;
}
export declare enum MediaStatus {
    ONGOING = "Ongoing",
    COMPLETED = "Completed",
    HIATUS = "Hiatus",
    CANCELLED = "Cancelled",
    NOT_YET_AIRED = "Not yet aired",
    UNKNOWN = "Unknown"
}
export declare enum Genres {
    ACTION = "Action",
    ADVENTURE = "Adventure",
    CARS = "Cars",
    COMEDY = "Comedy",
    DRAMA = "Drama",
    FANTASY = "Fantasy",
    HORROR = "Horror",
    MAHOU_SHOUJO = "Mahou Shoujo",
    MECHA = "Mecha",
    MUSIC = "Music",
    MYSTERY = "Mystery",
    PSYCHOLOGICAL = "Psychological",
    ROMANCE = "Romance",
    SCI_FI = "Sci-Fi",
    SLICE_OF_LIFE = "Slice of Life",
    SPORTS = "Sports",
    SUPERNATURAL = "Supernatural",
    THRILLER = "Thriller"
}
export interface Trailer {
    id: string;
    url?: string;
    site?: string;
    thumbnail?: string;
    thumbnailHash?: string | null;
}
