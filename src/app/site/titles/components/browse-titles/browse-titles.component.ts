import {
    ChangeDetectionStrategy,
    Component,
    NgZone,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {BehaviorSubject, Subscription} from 'rxjs';
import {Title} from '../../../../models/title';
import {ActivatedRoute, Params, Router} from '@angular/router';
import {debounceTime, filter, finalize, map} from 'rxjs/operators';
import {InfiniteScroll} from '@common/core/ui/infinite-scroll/infinite.scroll';
import {
    CountryListItem,
    LanguageListItem,
    ValueLists
} from '@common/core/services/value-lists.service';
import {BreakpointsService} from '@common/core/ui/breakpoints.service';
import {Settings} from '@common/core/config/settings.service';
import {TITLE_SORT_OPTIONS} from './select-options/title-sort-options';
import {TitlesService} from '../../titles.service';
import {PaginationResponse} from '@common/core/types/pagination/pagination-response';

interface FormValues {
    type: 'movie'|'series'|null;
    genre: string[];
    released: string[];
    score: string[];
    country: string;
    language: string;
    runtime: string;
    certification: string[];
    order: string;
    onlyStreamable: boolean,
}

@Component({
    selector: 'browse-titles',
    templateUrl: './browse-titles.component.html',
    styleUrls: ['./browse-titles.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrowseTitlesComponent extends InfiniteScroll implements OnInit, OnDestroy {
    public countries: CountryListItem[] = [];
    public languages: LanguageListItem[] = [];
    public genres: string[] = this.settings.getJson('browse.genres');
    public certifications: string[] = this.settings.getJson('browse.ageRatings');
    public sortOptions = TITLE_SORT_OPTIONS;
    public yearSliderMin: number;
    public yearSliderMax: number;
    private formSub: Subscription;

    public loading$ = new BehaviorSubject<boolean>(false);
    public pagination$ = new BehaviorSubject<PaginationResponse<Title>>(null);
    public anyFilterActive$ = new BehaviorSubject<boolean>(false);
    public threshold = 300;

    public form = this.fb.group({
        type: [],
        genre: [],
        released: [],
        score: [],
        country: [],
        language: [],
        runtime: [],
        certification: [],
        order: [],
        onlyStreamable: [],
    });

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        public breakpoints: BreakpointsService,
        public settings: Settings,
        private router: Router,
        private titles: TitlesService,
        private valueLists: ValueLists,
        protected zone: NgZone,
    ) {
        super();
        this.yearSliderMin = this.settings.get('browse.year_slider_min', 1880);
        this.yearSliderMax = this.settings.get('browse.year_slider_max', this.currentYear());
    }

    ngOnInit() {
        super.ngOnInit();
        this.loadFilterOptions();

        // reload titles when form is updated
        this.formSub = this.form.valueChanges
            .pipe(debounceTime(50))
            .subscribe(value => {
                this.reloadTitles(value);
            });

        // reset form when query params change. this will only
        // occur if user clicks on a link to browse page.
        this.route.queryParams
            .pipe(
                filter(() => !this.router.getCurrentNavigation()?.extras.state?.skipFormUpdate),
                map(params => this.queryParamsToFormValues(params))
            )
            .subscribe(params => {
                this.form.reset(params);
            });
    }

    ngOnDestroy() {
        this.formSub.unsubscribe();
        super.ngOnDestroy();
    }

    public clearAllFilters() {
        this.router.navigate([], {queryParams: {}, replaceUrl: true});
    }

    public currentYear(): number {
        return (new Date()).getFullYear() + 3;
    }

    protected loadMoreItems() {
        this.loading$.next(true);
        const filters = {
            ...this.formValuesToQueryParams(this.form.value),
            page: this.pagination$.value.current_page + 1,
        };
        return this.titles.getAll({...filters, perPage: 16})
            .pipe(finalize(() => this.loading$.next(false)))
            .subscribe(response => {
                this.pagination$.next({
                    ...response.pagination,
                    data: [...this.pagination$.value.data, ...response.pagination.data]
                });
            });
    }

    protected canLoadMore() {
        return this.pagination$?.value?.current_page < this.pagination$?.value?.last_page;
    }

    protected isLoading() {
        return this.loading$.value;
    }

    private reloadTitles(formValues: FormValues) {
        this.loading$.next(true);

        const queryParams = this.formValuesToQueryParams(formValues);

        // "onlyStreamable" should not count as active filter
        this.anyFilterActive$.next(
            Object.keys(queryParams).filter(k => k !== 'onlyStreamable').length > 0
        );

        // apply specified filters as query params to current url
        this.router.navigate([], {queryParams, replaceUrl: true, state: {skipFormUpdate: true}});

        return this.titles.getAll({...queryParams, perPage: 16})
            .pipe(finalize(() => this.loading$.next(false)))
            .subscribe(response => {
                this.pagination$.next(response.pagination);
            });
    }

    private loadFilterOptions() {
        this.valueLists.get(['countries', 'languages']).subscribe(response => {
            this.languages = response.languages;
            this.countries = response.countries;
        });
    }

    private formValuesToQueryParams(formValues: FormValues) {
        const filtered = {};
        // filter out null and max values.
        // filters with these values are at maximum range. Rating at
        // (1 to 10) for example so we can remove this filter completely
        const maxValues = ['1,255', '1.0,10.0', '1880,' + this.currentYear()];
        Object.keys(formValues).forEach(key => {
            const value = formValues[key],
                isEmpty = Array.isArray(value) && !value.length;
            if (value && !isEmpty && maxValues.indexOf(value) === -1) {
                filtered[key] = value;
            }
        });

        // convert arrays to comma string
        Object.keys(filtered).forEach(key => {
            filtered[key] = Array.isArray(filtered[key]) ?
                filtered[key].join(',') :
                filtered[key];
        });

        return filtered;
    }

    private queryParamsToFormValues(queryParams: Params) {
        const formValues = {} as any;
        const keys = ['genre', 'released', 'score', 'runtime'];
        Object.keys(queryParams).forEach(key => {
            if ( ! queryParams[key]) return;
            if (keys.indexOf(key) > -1 && !Array.isArray(queryParams[key])) {
                formValues[key] = queryParams[key].split(',');
            } else if (queryParams[key] === 'true') {
                formValues[key] = true;
            } else if (queryParams[key] === 'false') {
                formValues[key] = false;
            } else {
                formValues[key] = queryParams[key];
            }
        });
        // get default option from settings, if none specified
        if ( ! formValues.onlyStreamable) {
            formValues.onlyStreamable = !!this.settings.get('browse.streamable_filter_state', false);
        }
        return formValues;
    }
}
