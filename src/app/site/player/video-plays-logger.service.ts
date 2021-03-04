import {Injectable} from '@angular/core';
import {VideoService} from '../videos/video.service';
import {Video} from '../../models/video';

@Injectable({
    providedIn: 'root'
})
export class VideoPlaysLoggerService {
    private loggedVideos: number[] = [];
    constructor(private videos: VideoService) {}

    public log(video: Video) {
        if ( ! video || this.hasBeenPlayed(video)) return;
        this.loggedVideos.push(video.id);
        this.videos.logPlay(video).subscribe(() => {}, () => {});
    }

    /**
     * Clear last video, if it matches specified video.
     * This will allow this video plays to be incremented again.
     */
    public clearPlayedVideo(video: Video) {
        if ( ! video) return;
        this.loggedVideos.splice(this.loggedVideos.indexOf(video.id), 1);
    }

    /**
     * Check if current user has already incremented plays of specified video.
     */
    private hasBeenPlayed(video: Video): boolean {
        return this.loggedVideos.indexOf(video.id) > -1;
    }
}
