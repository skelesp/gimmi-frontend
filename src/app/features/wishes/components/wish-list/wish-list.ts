import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, effect, inject, signal } from '@angular/core';
import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { WishStatus } from '../../wish';
import { WishesData } from '../../wishes-data';
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap';

import { WishCreateCard } from '../wish-create-card/wish-create-card';
import { WishCard } from '../wish-item/wish-card/wish-card';
import { FilterOnStatePipe } from '../../pipes/filter-on-state-pipe';

@Component({
    selector: 'gimmi-wish-list',
    templateUrl: './wish-list.html',
    styleUrls: ['./wish-list.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbAlert, WishCreateCard, WishCard, FilterOnStatePipe]
})
export class WishList implements OnChanges {
  private wishService = inject(WishesData);
  private problems = inject(ProblemNotifier);

  @Input() receiver : { id: string; firstName: string };
  readonly wishes = this.wishService.wishes;
  readonly loading = this.wishService.listLoading;
  readonly wishlistFilter = signal<WishStatus[]>(undefined);
  readonly activeTab = signal("Open");

  constructor() {
    effect(() => {
      const error = this.wishService.listError();
      if (!error) return;
      // A resource wraps what the request threw.
      const cause = error instanceof ApiProblem ? error : (error as { cause?: unknown }).cause;
      if (cause instanceof ApiProblem) this.problems.show(cause);
      else console.error(error);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.receiver) {
      this.wishService.showList(this.receiver.id);
      this.setWishlistFilter('Open');
    }
  }

  setWishlistFilter(filter: string) {
    this.activeTab.set(filter === 'Received' ? 'Received' : 'Open');
    switch (filter) {
      case 'Received':
        this.wishlistFilter.set(['fulfilled']);
        break;
      case 'Open':
      default:
        this.wishlistFilter.set(['open', 'received', 'reserved']);
        break;
    }
  }
}
