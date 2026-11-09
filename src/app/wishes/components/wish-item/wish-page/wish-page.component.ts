import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCalendarPlus, faCheck, faComment, faExpand, faExternalLinkAlt, faGift, faListAlt, faPaintBrush, faUser } from '@fortawesome/free-solid-svg-icons';

import { WishItemComponent } from '../wish-item.component';
import { CursorPointerDirective } from '../../../../shared/directives/cursor-pointer.directive';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ActionListComponent } from '../action-list/action-list.component';
import { WishBannerComponent } from '../wish-banner/wish-banner.component';
import { ImageViewComponent } from '../../../../images/components/image-view/image-view.component';
import { WishCallToActionButtonComponent } from '../wish-call-to-action-button/wish-call-to-action-button.component';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
    selector: 'gimmi-wish-page',
    templateUrl: './wish-page.component.html',
    styleUrls: ['./wish-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointerDirective, RouterLink, FaIconComponent, ActionListComponent, WishBannerComponent, ImageViewComponent, WishCallToActionButtonComponent, CurrencyPipe, DatePipe]
})
export class WishPageComponent extends WishItemComponent implements OnInit {
  protected route = inject(ActivatedRoute);
  private changeDetector = inject(ChangeDetectorRef);

  wishID: string;
  listIcon: IconDefinition = faListAlt;
  calendarIcon: IconDefinition = faCalendarPlus;
  userIcon: IconDefinition = faUser;
  linkIcon: IconDefinition = faExternalLinkAlt;
  giftIcon: IconDefinition = faGift;
  colorIcon: IconDefinition = faPaintBrush;
  sizeIcon: IconDefinition = faExpand;
  textIcon: IconDefinition = faComment;
  doneIcon: IconDefinition = faCheck;

  ngOnInit(): void {
    this.wishService.selectedWish.subscribe(selectedWish => {
      this.wish = selectedWish;
      // WishItemComponent erft een gewone @Input() wish: deze subscribe moet de weergave zelf verversen.
      this.changeDetector.markForCheck();
    });
    super.ngOnInit();
  }

}