import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ApiProblem } from 'src/app/core/api/api-problem';
import { ProblemNotifier } from 'src/app/core/api/problem-notifier';
import { Person } from 'src/app/people/models/person.model';
import { wishStatus } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
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
  private wishService = inject(WishService);
  private problems = inject(ProblemNotifier);

  @Input() receiver : Person;
  readonly wishes = toSignal(this.wishService.wishes);
  readonly wishlistFilter = signal<wishStatus[]>(undefined);
  readonly loading = signal(false);
  readonly activeTab = signal("Open");
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.receiver) {
      this.loading.set(true);
      this.wishService.getWishlist(this.receiver).subscribe({
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
        this.wishlistFilter.set(['Fulfilled']);
        break;
      case 'Open':
      default:
        this.wishlistFilter.set(['Open', 'Received', 'Reserved']);
        break;
    }
  }
}
