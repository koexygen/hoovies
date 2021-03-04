import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {TitleUrlsService} from '../../site/titles/title-urls.service';
import {NewsArticle} from '../../models/news-article';
import {NewsService} from '../../site/news/news.service';
import {MESSAGES} from '../../toast-messages';
import {Modal} from '@common/core/ui/dialogs/modal.service';
import {CurrentUser} from '@common/auth/current-user';
import {Settings} from '@common/core/config/settings.service';
import {Toast} from '@common/core/ui/toast.service';
import {Observable} from 'rxjs';
import {DatatableService} from '../../../common/datatable/datatable.service';

@Component({
    selector: 'news-page',
    templateUrl: './news-page.component.html',
    styleUrls: ['./news-page.component.scss'],
    providers: [DatatableService],
    encapsulation: ViewEncapsulation.None,
})
export class NewsPageComponent implements OnInit{
    public news$ = this.datatable.data$ as Observable<NewsArticle[]>;

    constructor(
        private news: NewsService,
        private modal: Modal,
        public currentUser: CurrentUser,
        public settings: Settings,
        public urls: TitleUrlsService,
        private toast: Toast,
        public datatable: DatatableService<NewsArticle>
    ) {}

    ngOnInit() {
        this.datatable.init({
            uri: NewsService.BASE_URI,
        });
    }

    public maybeDeleteSelectedArticles() {
        this.datatable.confirmResourceDeletion('articles').subscribe(() => {
            this.news.delete(this.datatable.selectedRows$.value).subscribe(() => {
                this.toast.open(MESSAGES.NEWS_DELETE_SUCCESS);
                this.datatable.reset();
            });
        });
    }
}
