import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { Person } from 'src/app/people/models/person.model';
import { Wish, wishStatus } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { NgbNav, NgbNavItem, NgbNavItemRole, NgbNavLink, NgbNavLinkBase, NgbAlert } from '@ng-bootstrap/ng-bootstrap';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';

import { WishCreateCardComponent } from '../wish-create-card/wish-create-card.component';
import { WishCardComponent } from '../wish-item/wish-card/wish-card.component';
import { FilterOnStatePipe } from '../../pipes/filter-on-state.pipe';

@Component({
    selector: 'gimmi-wish-list',
    templateUrl: './wish-list.component.html',
    styleUrls: ['./wish-list.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [NgbNav, NgbNavItem, NgbNavItemRole, NgbNavLink, NgbNavLinkBase, CursorPointerDirective, NgbAlert, WishCreateCardComponent, WishCardComponent, FilterOnStatePipe]
})
export class WishListComponent implements OnInit, OnChanges {
  @Input() receiver : Person;
  @Input() wishlistFilter: wishStatus[];
  wishes: Wish[];
  loading = false;
  activeTab = "Open";
  
  constructor( 
    private wishService : WishService
  ) { }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.receiver) {
      this.loading = true;
      this.wishService.getWishlist(this.receiver).subscribe(
        _ => {
          this.loading = false;
          this.setWishlistFilter('Open');
        }
      );
    }
  }

  ngOnInit(): void {
    this.wishService.wishes.subscribe(wishes => this.wishes = wishes );
  }

  setWishlistFilter(filter: string) {
    switch (filter) {
      case 'Received':
        this.wishlistFilter = ['Fulfilled'];
        break;
      case 'Open':
      default:
        this.wishlistFilter = ['Open', 'Received', 'Reserved'];
        break;
    }
  }
}
