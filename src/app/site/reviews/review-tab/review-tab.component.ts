import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import {CrupdateReviewModalComponent} from '../crupdate-review-modal/crupdate-review-modal.component';
import {Review} from '../../../models/review';
import {Store} from '@ngxs/store';
import {BehaviorSubject, Subscription} from 'rxjs';
import {ReviewScoreType} from './review-score-type.enum';
import {filter, finalize} from 'rxjs/operators';
import {ReviewService} from '../../shared/review.service';
import {CurrentUser} from '@common/auth/current-user';
import {Toast} from '@common/core/ui/toast.service';
import {ConfirmModalComponent} from '@common/core/ui/confirm-modal/confirm-modal.component';
import {Modal} from '@common/core/ui/dialogs/modal.service';
import {
    TitlePageService,
    TitlePageTab
} from '../../titles/title-page-container/title-page.service';
import {createMap} from '@common/core/utils/create-map';
import {MEDIA_TYPE} from '../../media-type';

@Component({
    selector: 'review-tab',
    templateUrl: './review-tab.component.html',
    styleUrls: ['./review-tab.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReviewTabComponent implements OnInit, OnDestroy {
    public loading$ = new BehaviorSubject(false);
    public alreadyLoadedReviewsForThisTitle = false;
    private reviewTabSub: Subscription;
    private changeSub: Subscription;
    public reviews = new Map<number, Review>();

    constructor(
        private modal: Modal,
        private store: Store,
        public currentUser: CurrentUser,
        public reviewsApi: ReviewService,
        private toast: Toast,
        public titlePage: TitlePageService,
        private cd: ChangeDetectorRef,
    ) {}

    ngOnInit() {
        this.reviewTabSub = this.titlePage.selectedTab$.pipe(
            filter(tab => {
                return tab === TitlePageTab.reviews && !this.alreadyLoadedReviewsForThisTitle;
            })).subscribe(() => {
                this.loadReviews();
            });
        this.titlePage.changed$.subscribe(() => {
            this.alreadyLoadedReviewsForThisTitle = false;
            this.reviews.clear();
        });
    }

    ngOnDestroy() {
        this.changeSub?.unsubscribe();
        this.reviewTabSub?.unsubscribe();
    }

    private loadReviews() {
        this.loading$.next(true);
        this.alreadyLoadedReviewsForThisTitle = true;
        const params = {
            titleId: this.titlePage.title.id,
            season: this.titlePage.activeSeason?.number,
            episode: this.titlePage.activeEpisode?.episode_number,
            limit: 35,
            withTextOnly: true,
            with: 'user',
        };
        this.reviewsApi.getAll(params).pipe(
            finalize(() => this.loading$.next(false)),
        ).subscribe(response => {
            this.reviews = createMap(response.pagination.data);
            this.cd.markForCheck();
        });
    }

    public openCrupdateReviewModal() {
        const review = [...this.reviews.values()].find(r => r.user_id === this.currentUser.get('id'));
        const mediaId = this.titlePage.activeEpisode?.id || this.titlePage.title.id;
        this.modal.open(
            CrupdateReviewModalComponent,
            {review, mediaId, mediaType: this.titlePage.activeEpisode ? MEDIA_TYPE.EPISODE : MEDIA_TYPE.TITLE},
        ).beforeClosed().subscribe(newReview => {
            if (newReview) {
                this.reviews.set(newReview.id, newReview);
                this.cd.markForCheck();
            }
        });
    }

    public maybeDeleteReview(review: Review) {
        this.modal.show(ConfirmModalComponent, {
            title: 'Delete Review',
            body:  'Are you sure you want to delete your review?',
            ok:    'Delete'
        }).afterClosed().subscribe(confirmed => {
            if ( ! confirmed) return;
            this.loading$.next(true);
            return this.reviewsApi.delete([review.id])
                .pipe(finalize(() => this.loading$.next(false)))
                .subscribe(() => {
                    this.reviews.delete(review.id);
                    this.cd.markForCheck();
                });
        });
    }

    public getScoreColor(score: number): ReviewScoreType {
        if (score < 5) {
            return ReviewScoreType.LOW;
        } else if (score < 7) {
            return ReviewScoreType.MEDIUM;
        } else {
            return ReviewScoreType.HIGH;
        }
    }
}
