import {Component, OnInit} from '@angular/core';
import {finalize} from 'rxjs/operators';
import {MESSAGES} from '../../../toast-messages';
import {SettingsPanelComponent} from '@common/admin/settings/settings-panel.component';
import {BehaviorSubject} from 'rxjs';
import {LanguageListItem} from '@common/core/services/value-lists.service';

@Component({
    selector: 'content-settings',
    templateUrl: './content-settings.component.html',
    styleUrls: ['./content-settings.component.scss'],
    host: {'class': 'settings-panel'},
})
export class ContentSettingsComponent extends SettingsPanelComponent implements OnInit {
    public browseGenres: string[] = [];
    public ageRatings: string[] = [];
    public qualities: string[] = [];
    public defaultBrowseMaxYear: number;
    public languages$ = new BehaviorSubject<LanguageListItem[]>([]);

    ngOnInit() {
        this.browseGenres = this.settings.getJson('browse.genres', []);
        this.ageRatings = this.settings.getJson('browse.ageRatings', []);
        this.qualities = this.settings.getJson('streaming.qualities', []);
        this.defaultBrowseMaxYear = (new Date()).getFullYear() + 3;
        this.valueLists.get(['languages']).subscribe(value => {
            this.languages$.next(value.languages);
        });
    }

    public updateNews() {
        this.loading$.next(true);
        this.http.post('news/import-from-remote-provider')
            .pipe(finalize(() => this.loading$.next(false)))
            .subscribe(() => {
                this.toast.open(MESSAGES.NEWS_MANUALLY_UPDATE_SUCCESS);
            });
    }

    public updateLists() {
        this.loading$.next(true);
        this.http.post('lists/auto-update-content')
            .pipe(finalize(() => this.loading$.next(false)))
            .subscribe(() => {
                this.toast.open(MESSAGES.LISTS_MANUALLY_UPDATE_SUCCESS);
            });
    }

    public saveSettings() {
        const settings = this.state.getModified();
        settings.client['browse.genres'] = JSON.stringify(this.browseGenres);
        settings.client['browse.ageRatings'] = JSON.stringify(this.ageRatings);
        settings.client['streaming.qualities'] = JSON.stringify(this.qualities);
        super.saveSettings(settings);
    }
}
