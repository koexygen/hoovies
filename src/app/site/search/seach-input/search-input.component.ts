import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {FormControl} from '@angular/forms';
import {
    catchError,
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    switchMap
} from 'rxjs/operators';
import {BehaviorSubject, Observable, of} from 'rxjs';
import {SearchProvider, SearchService} from '../search.service';
import {Title} from '../../../models/title';
import {Router} from '@angular/router';
import {Person} from '../../../models/person';
import {GetTitleResponse, TitlesService} from '../../titles/titles.service';
import {MatAutocompleteSelectedEvent} from '@angular/material/autocomplete';
import {TitleUrlsService} from '../../titles/title-urls.service';
import {MEDIA_TYPE} from '../../media-type';
import {GetPersonResponse, PeopleService} from '../../people/people.service';
import {SearchResult} from '../search-result';

@Component({
    selector: 'search-input',
    templateUrl: './search-input.component.html',
    styleUrls: ['./search-input.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class SearchInputComponent implements OnInit {
    @ViewChild('inputEl', {static: true}) inputEl: ElementRef<HTMLInputElement>;
    @Output() resultSelected: EventEmitter<Title|Person> = new EventEmitter();
    @Input() placeholder = 'Search for movies, tv shows and people...';
    @Input() label: string;
    @Input() type: MEDIA_TYPE;
    @Input() resetInputOnSelect = true;
    @Input() searchProvider: SearchProvider = null;

    public searchControl = new FormControl();
    public results$ = new BehaviorSubject<SearchResult[]>([]);

    constructor(
        private search: SearchService,
        private router: Router,
        private titles: TitlesService,
        private people: PeopleService,
        private urls: TitleUrlsService,
    ) {}

    ngOnInit() {
        this.bindToSearchQueryControl();
    }

    private bindToSearchQueryControl() {
        this.searchControl.valueChanges
            .pipe(
                debounceTime(200),
                distinctUntilChanged(),
                filter(query => typeof query === 'string'),
                switchMap(query => {
                    return this.search.everything(query, {type: this.type, limit: 8, provider: this.searchProvider});
                }),
                catchError(() => of({results: []})),
            ).subscribe(response => {
                this.results$.next(response.results);
            });
    }

    public selectResult(e: MatAutocompleteSelectedEvent) {
        this.reset();
        const shouldNavigate = !this.resultSelected.observers.length,
            result = e.option.value as SearchResult;

        if (shouldNavigate) {
            this.router.navigate(this.urls.mediaItem(result));
        } else {
            this.loadResult(result).subscribe(response => {
                const mediaItem = response['title'] || response['person'];
                this.resultSelected.emit(mediaItem);
            });
        }
    }

    private loadResult(result: SearchResult): Observable<GetPersonResponse|GetTitleResponse> {
        if (result.type === MEDIA_TYPE.PERSON) {
            return this.people.get(result.id)
                .pipe(map(response => response));
        } else {
            return this.titles.get(result.id)
                .pipe(map(response => response));
        }
    }

    private reset() {
        this.inputEl.nativeElement.blur();
        if (this.resetInputOnSelect) {
            this.searchControl.reset();
        }
    }

    public openSearchPage() {
        this.router.navigate(
            ['search'],
            {queryParams: {query: this.searchControl.value}}
        );
    }

    public isPerson(result: SearchResult): boolean {
        return result.type === MEDIA_TYPE.PERSON;
    }

    public displayFn(result: Person|Title): string {
        return result ? result.name : null;
    }

    public isSearchPage(): boolean {
        return this.router.url.includes('/search?query');
    }
}
