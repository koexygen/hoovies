import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import {Subscription} from 'rxjs';
import {GroupedCredits, TitleCredit} from '../../../../models/title';
import {TitleUrlsService} from '../../title-urls.service';
import {TitlePageService} from '../../title-page-container/title-page.service';

@Component({
    selector: 'full-credits-page',
    templateUrl: './full-credits-page.component.html',
    styleUrls: ['./full-credits-page.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullCreditsPageComponent implements OnInit, OnDestroy {
    public groupedCredits: GroupedCredits = {};
    private changeSub: Subscription;

    constructor(
        public titlePage: TitlePageService,
        public urls: TitleUrlsService,
        private cd: ChangeDetectorRef,
    ) {
        this.groupedCredits = this.groupCredits(this.titlePage.getTitleOrEpisodeCredits());
    }

    ngOnInit() {
        this.changeSub = this.titlePage.changed$.subscribe(() => {
            this.cd.markForCheck();
        });
    }

    ngOnDestroy() {
        this.changeSub.unsubscribe();
    }

    public trackByFn(_: number, title: TitleCredit) {
        return title.id;
    }

    private groupCredits(credits: TitleCredit[]) {
        return credits.reduce((h, a) => {
            return Object.assign(h, {[a.pivot.department]: (h[a.pivot.department] || []).concat(a)});
        }, {});
    }
}
