import {Injectable} from '@angular/core';
import {finalize} from 'rxjs/operators';
import {BehaviorSubject} from 'rxjs';
import {List} from '../models/list';
import {CurrentUser} from '@common/auth/current-user';
import {ListsService} from './lists/lists.service';
import {MESSAGES} from '../toast-messages';
import {ListItem} from './lists/types/list-item';
import {Toast} from '@common/core/ui/toast.service';
import {MinimalWatchlist} from './lists/types/minimal-watchlist';
import {Review} from '../models/review';

@Injectable({
    providedIn: 'root'
})
export class UserLibraryService {
    public lists$ = new BehaviorSubject<List[]>(null);
    public watchlist: MinimalWatchlist;
    public ratings = new Map<number, Review>();

    constructor(
        private currentUser: CurrentUser,
        private listApi: ListsService,
        private toast: Toast,
    ) {
    }

    public loadLists(): Promise<void> {
        return new Promise(resolve => {
            if (this.lists$.value) {
                return resolve();
            }
            const params = {userId: this.currentUser.get('id'), perPage: 30};
            return this.listApi.getAll(params)
                .pipe(finalize(() => resolve()))
                .subscribe(response => {
                    this.lists$.next(response.pagination.data);
                });
        });
    }

    public addToWatchlist(item: ListItem): Promise<void> {
        const listId = this.watchlist.id;
        return this.listApi.addItem(listId, item).toPromise().then(() => {
            this.toast.open(MESSAGES.WATCHLIST_ADD_SUCCESS);
            this.watchlist.items.push({id: item.id, type: item.type});
        });
    }

    public removeFromWatchlist(item: ListItem): Promise<void> {
        const listId = this.watchlist.id;
        return this.listApi.removeItem(listId, item).toPromise().then(() => {
            this.toast.open(MESSAGES.WATCHLIST_REMOVE_SUCCESS);
            const index = this.watchlist.items
                .findIndex(i => i.id === item.id && item.type === item.type);
            this.watchlist.items.splice(index, 1);
        });
    }
}
