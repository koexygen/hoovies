import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import {Episode} from '../../../../models/episode';
import {TitleUrlsService} from '../../title-urls.service';
import {TitlePageService} from '../../title-page-container/title-page.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'current-next-episode-panel',
    templateUrl: './current-next-episode-panel.component.html',
    styleUrls: ['./current-next-episode-panel.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CurrentNextEpisodePanelComponent implements OnInit, OnDestroy {
    private changeSub: Subscription;
    constructor(
        private urls: TitleUrlsService,
        public titlePage: TitlePageService,
        private cd: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        this.changeSub = this.titlePage.changed$.subscribe(() => {
            this.cd.markForCheck();
        });
    }

    ngOnDestroy() {
        this.changeSub.unsubscribe();
    }

    public getEpisodeUrl(episode: Episode) {
        return this.urls.episode(this.titlePage.title, episode.season_number, episode.episode_number);
    }
}
