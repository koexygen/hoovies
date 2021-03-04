import {Title} from './title';
import {VideoCaption} from '../site/captions/caption';

export class Video {
    id: number;
    name: string;
    description?: string;
    url: string;
    type: 'video'|'stream'|'embed'|'external';
    category: 'full'|'trailer'|'clip'|'featurette'|'teaser';
    thumbnail?: string;
    source: 'local'|'tmdb';
    quality: string;
    approved: boolean;
    title?: Title;
    user_id: number;
    positive_votes?: number;
    negative_votes?: number;
    season: number;
    episode: number;
    title_id: number;
    captions?: VideoCaption[];
    favicon?: string;
    plays_count?: number;
    reports_count?: number;
    score?: number;

    constructor(params: object = {}) {
        for (const name in params) {
            this[name] = params[name];
        }
    }
}
