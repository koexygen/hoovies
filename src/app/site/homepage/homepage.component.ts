import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {List} from '../../models/list';
import {Settings} from '@common/core/config/settings.service';
import {CurrentUser} from '@common/auth/current-user';
import {TitleUrlsService} from '../titles/title-urls.service';
import {ActivatedRoute} from '@angular/router';

@Component({
    selector: 'homepage',
    templateUrl: './homepage.component.html',
    styleUrls: ['./homepage.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class HomepageComponent implements OnInit {
    public lists$ = new BehaviorSubject<List[]>([]);
    public sliderList: List;

    constructor(
        public settings: Settings,
        public currentUser: CurrentUser,
        public urls: TitleUrlsService,
        private route: ActivatedRoute,
    ) {}

    ngOnInit() {
        this.route.data.subscribe(data => {
            this.sliderList = data.api.lists.shift();
            this.lists$.next(data.api.lists);
        });
    }
}
