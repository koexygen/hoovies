import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import {TitleUrlsService} from '../../site/titles/title-urls.service';
import {Person} from '../../models/person';
import {PeopleService} from '../../site/people/people.service';
import {ImportMediaModalComponent} from '../../site/shared/import-media-modal/import-media-modal.component';
import {MEDIA_TYPE} from '../../site/media-type';
import {Router} from '@angular/router';
import {Modal} from '@common/core/ui/dialogs/modal.service';
import {CurrentUser} from '@common/auth/current-user';
import {Settings} from '@common/core/config/settings.service';
import {Observable} from 'rxjs';
import {DatatableService} from '../../../common/datatable/datatable.service';

@Component({
    selector: 'people-page',
    templateUrl: './people-page.component.html',
    styleUrls: ['./people-page.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DatatableService],
})
export class PeoplePageComponent implements OnInit {
    public people$ = this.datatable.data$ as Observable<Person[]>;

    constructor(
        private people: PeopleService,
        private modal: Modal,
        public currentUser: CurrentUser,
        public settings: Settings,
        public urls: TitleUrlsService,
        private router: Router,
        public datatable: DatatableService<Person>,
    ) {}

    ngOnInit() {
        this.datatable.init({
            uri: PeopleService.BASE_URI,
            staticParams: {
                order_by: 'popularity'
            }
        });
    }

    public maybeDeleteSelectedPeople() {
        this.datatable.confirmResourceDeletion('people').subscribe(() => {
            this.people.delete(this.datatable.selectedRows$.value).subscribe(() => {
                this.datatable.reset();
            });
        });
    }

    public openImportMediaModal() {
        this.modal.open(
            ImportMediaModalComponent,
            {mediaTypes: [MEDIA_TYPE.PERSON]},
        ).beforeClosed().subscribe(mediaItem => {
            if (mediaItem) {
                this.router.navigate(['/admin/people', mediaItem.id, 'edit']);
            }
        });
    }
}
