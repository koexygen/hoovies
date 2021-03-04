import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import {FormControl} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {TitleUrlsService} from '../../title-urls.service';
import {TitlePageService} from '../../title-page-container/title-page.service';
import {CurrentUser} from '@common/auth/current-user';

@Component({
    selector: 'season-page',
    templateUrl: './season-page.component.html',
    styleUrls: ['./season-page.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SeasonPageComponent implements OnInit {
    public seasonModel = new FormControl();

    constructor(
        public titlePage: TitlePageService,
        private route: ActivatedRoute,
        private router: Router,
        private cd: ChangeDetectorRef,
        public urls: TitleUrlsService,
        public currentUser: CurrentUser,
    ) {}

    ngOnInit() {
        this.titlePage.changed$.subscribe(() => {
            this.cd.markForCheck();
        });

        this.route.params.subscribe(params => {
            this.seasonModel.setValue(+params.seasonNumber);
        });

        this.seasonModel.valueChanges.subscribe(seasonNum => {
            if (this.titlePage.activeSeason.number !== seasonNum) {
                this.router.navigate(this.urls.season(this.titlePage.title, seasonNum));
            }
        });
    }
}
