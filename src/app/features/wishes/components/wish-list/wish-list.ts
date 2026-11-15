import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, inject, signal } from '@angular/core';
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
  readonly wishlistFilter = signal<WishStatus[]>(undefined);
  readonly loading = signal(false);
  readonly activeTab = signal("Open");
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.receiver) {
      this.loading.set(true);
      this.wishService.getWishlist(this.receiver.id).subscribe({
        next: () => {
          this.loading.set(false);
          this.setWishlistFilter('Open');
        },
        error: error => {
          this.loading.set(false);
          if (error instanceof ApiProblem) this.problems.show(error);
          else console.error(error);
        }
      });
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
