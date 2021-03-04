import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter, HostBinding,
    Input,
    Output,
    ViewEncapsulation
} from '@angular/core';
import {Title} from '../../../models/title';
import {Person} from '../../../models/person';
import {TitleUrlsService} from '../../titles/title-urls.service';
import {MEDIA_TYPE} from '../../media-type';
import {PlayerOverlayService} from '../../player/player-overlay.service';

@Component({
    selector: 'media-grid',
    templateUrl: './media-grid.component.html',
    styleUrls: [
        './media-grid.component.scss',
        './portrait-media-grid.component.scss',
        './landscape-media-grid.component.scss'
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaGridComponent {
    @Input() items: (Title|Person)[] = [];
    @Input() mode: 'landscape'|'portrait' = 'portrait';
    @Input() showPlayButton = false;
    @Output() actionClick = new EventEmitter();
    @HostBinding('class') get modeClass() {
        return `${this.mode}-media-grid`;
    }

    public trackByFn = (i: number, item: Title|Person) => item.id;

    constructor(
        public urls: TitleUrlsService,
        private playerOverlay: PlayerOverlayService,
    ) {}

    public isPerson(item: Title|Person) {
        return item.type === MEDIA_TYPE.PERSON;
    }

    public playVideo(title: Title) {
        this.playerOverlay.open(title.videos[0], title);
    }
}
