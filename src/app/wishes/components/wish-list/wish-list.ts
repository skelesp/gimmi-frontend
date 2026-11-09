import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Person } from 'src/app/people/models/person.model';
import { wishStatus } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { NgbNav, NgbNavItem, NgbNavItemRole, NgbNavLink, NgbNavLinkBase, NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { CursorPointer } from '../../../shared/directives/cursor-pointer';

import { WishCreateCard } from '../wish-create-card/wish-create-card';
import { WishCard } from '../wish-item/wish-card/wish-card';
import { FilterOnStatePipe } from '../../pipes/filter-on-state-pipe';

@Component({
    selector: 'gimmi-wish-list',
    templateUrl: './wish-list.html',
    styleUrls: ['./wish-list.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgbNav, NgbNavItem, NgbNavItemRole, NgbNavLink, NgbNavLinkBase, CursorPointer, NgbAlert, WishCreateCard, WishCard, FilterOnStatePipe]
})
export class WishList implements OnChanges {
  private wishService = inject(WishService);

  @Input() receiver : Person;
  readonly wishes = toSignal(this.wishService.wishes);
  readonly wishlistFilter = signal<wishStatus[]>(undefined);
  readonly loading = signal(false);
  activeTab = "Open";
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.receiver) {
      this.loading.set(true);
      this.wishService.getWishlist(this.receiver).subscribe(
        _ => {
          this.loading.set(false);
          this.setWishlistFilter('Open');
        }
      );
    }
  }

  setWishlistFilter(filter: string) {
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
