import {Injectable} from '@angular/core';
import {Video} from '../../../models/video';
import {LazyLoaderService} from '@common/core/utils/lazy-loader.service';
import {Settings} from '@common/core/config/settings.service';
import {PlayerQualityVariantOptions} from './shaka-strategy.service';
import {Subject} from 'rxjs';

declare const Plyr: any;

@Injectable({
    providedIn: 'root'
})
export class PlyrStrategyService {
    public player: any;
    public playbackEnded$ = new Subject();

    constructor(
        private lazyLoader: LazyLoaderService,
        private settings: Settings,
    ) {}

    public loadSource(videoEl: HTMLVideoElement, video: Video, variantOptions?: PlayerQualityVariantOptions): Promise<void> {
        return this.initPlayer(videoEl, video, variantOptions).then(() => {
            if (video && video.type !== 'stream') {
                this.player.source = this.buildSource(video);
            }
        });
    }

    public loadAssets(): Promise<any> {
        return Promise.all([
            this.lazyLoader.loadAsset('js/plyr.min.js', {type: 'js'}),
            this.lazyLoader.loadAsset('css/plyr.css', {type: 'css'}),
        ]);
    }

    private initPlayer(videoEl: HTMLVideoElement, video: Video, variantOptions?: PlayerQualityVariantOptions): Promise<void> {
        if (this.player) {
            return Promise.resolve();
        } else {
            return this.loadAssets().then(() => {
                const plyrOptions = {
                    autoplay: true,
                    quality: {},
                    // plyr doesn't allow "auto" quality for whatever reason,
                    // need to use zero for auto quality and translate it
                    i18n: {qualityLabel: {0: 'Auto'}}
                };
                if (variantOptions && variantOptions.variants.length) {
                    plyrOptions.quality = {
                        default: variantOptions.variants[0].quality,
                        forced: true,
                        onChange: variantOptions.onChange,
                        options: variantOptions.variants.map(qv => qv.quality)
                    };
                }
                this.player = new Plyr(videoEl, plyrOptions);
                this.player.on('ended', () => {
                    this.playbackEnded$.next();
                });
            });
        }
    }

    public stop() {
        this.player && this.player.stop();
    }

    public alreadyLoaded() {
        return !!this.player;
    }

    public supported(video: Video) {
        return video.type === 'video' ||
            video.type === 'stream' ||
            (video.type === 'embed' && this.embedSupportedByPlyr(video.url));
    }

    private buildSource(video: Video) {
        if (video.type === 'embed') {
            return {
                type: 'video',
                poster: video.thumbnail,
                sources: [{
                    src: video.url,
                    provider: this.isYoutube(video.url) ? 'youtube' : 'vimeo',
                }],
            };
        } else {
            const tracks = (video.captions || []).map((caption, i) => {
                return {
                    kind: 'captions',
                    label: caption.name,
                    srclang: caption.language,
                    src: caption.url ? caption.url : this.settings.getBaseUrl() + 'secure/caption/' + caption.id,
                    default: i === 0,
                };
            });
            return {
                type: 'video',
                captions: {active: false},
                title: video.name,
                sources: [
                    {src: video.url},
                ],
                poster: video.thumbnail,
                tracks,
            };
        }
    }

    private isYoutube(url: string): boolean {
        return url.includes('youtube.com');
    }

    private isVimeo(url: string): boolean {
        return url.includes('vimeo.com');
    }

    private embedSupportedByPlyr(url: string): boolean {
        return this.isYoutube(url) || this.isVimeo(url);
    }

    public destroy() {
        this.player && this.player.destroy();
        this.player = null;
    }
}
