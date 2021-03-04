import {
    ChangeDetectionStrategy,
    Component,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import {TitleUrlsService} from '../../site/titles/title-urls.service';
import {ListsService} from '../../site/lists/lists.service';
import {List} from '../../models/list';
import {CurrentUser} from '@common/auth/current-user';
import {Settings} from '@common/core/config/settings.service';
import {Observable} from 'rxjs';
import {DatatableService} from '../../../common/datatable/datatable.service';
import {MESSAGES} from '../../toast-messages';
import {Toast} from '../../../common/core/ui/toast.service';

@Component({
    selector: 'lists-page',
    templateUrl: './lists-page.component.html',
    styleUrls: ['./lists-page.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [ DatatableService],
})
export class ListsPageComponent implements OnInit {
    public lists$ = this.datatable.data$ as Observable<List[]>;

    constructor(
        public datatable: DatatableService<List>,
        private lists: ListsService,
        public currentUser: CurrentUser,
        public settings: Settings,
        public urls: TitleUrlsService,
        private toast: Toast,
    ) {}

    ngOnInit() {
        this.datatable.init({
            uri: ListsService.BASE_URI,
            staticParams: {
                excludeSystem: true,
                with: 'user',
                withCount: 'items',
            }
        });
    }

    public maybeDeleteSelectedLists() {
        this.datatable.confirmResourceDeletion('lists').subscribe(() => {
            this.lists.delete(this.datatable.selectedRows$.value).subscribe(() => {
                this.toast.open(MESSAGES.LIST_DELETE_SUCCESS);
                this.datatable.reset();
            });
        });
    }
}
