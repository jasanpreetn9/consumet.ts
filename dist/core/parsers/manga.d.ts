import BaseProvider from '../provider';
import { IMangaInfo, IMangaChapterPage } from '../types';
declare abstract class MangaParser extends BaseProvider {
    protected readonly category = "MANGA";
    /**
     * takes manga id
     *
     * returns manga info with chapters
     */
    abstract fetchMangaInfo(mangaId: string, ...args: any): Promise<IMangaInfo>;
    /**
     * takes chapter id
     *
     * returns chapter (image links)
     */
    abstract fetchChapterPages(chapterId: string, ...args: any): Promise<IMangaChapterPage[]>;
}
export default MangaParser;
