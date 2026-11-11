import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCalendarPlus, faCheck, faComment, faExpand, faExternalLinkAlt, faGift, faListAlt, faPaintBrush, faUser } from '@fortawesome/free-solid-svg-icons';

import { WishItem } from '../wish-item';
import { CursorPointer } from '../../../../shared/directives/cursor-pointer';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ActionList } from '../action-list/action-list';
import { WishBanner } from '../wish-banner/wish-banner';
import { ImageView } from '../../../../images/components/image-view/image-view';
import { WishCallToActionButton } from '../wish-call-to-action-button/wish-call-to-action-button';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
    selector: 'gimmi-wish-page',
    templateUrl: './wish-page.html',
    styleUrls: ['./wish-page.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, RouterLink, FaIconComponent, ActionList, WishBanner, ImageView, WishCallToActionButton, CurrencyPipe, DatePipe]
})
export class WishPage extends WishItem implements OnInit {
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
      // WishItem erft een gewone @Input() wish: deze subscribe moet de weergave zelf verversen.
      this.changeDetector.markForCheck();
    });
    super.ngOnInit();
  }

}