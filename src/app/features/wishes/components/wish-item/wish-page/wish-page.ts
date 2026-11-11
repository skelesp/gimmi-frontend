import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCalendarPlus, faCheck, faComment, faExpand, faExternalLinkAlt, faGift, faListAlt, faPaintBrush, faUser } from '@fortawesome/free-solid-svg-icons';

import { WishItem } from '../wish-item';
import { CursorPointer } from '../../../../../shared/directives/cursor-pointer';
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

  constructor() {
    super();
    // WishItem inherits a plain `@Input() wish`: this bridge copies the selected wish into it and refreshes the view.
    effect(() => {
      this.wish = this.wishService.selectedWish();
      this.changeDetector.markForCheck();
    });
  }

  ngOnInit(): void {
    // The action items are built from the wish, so it must be there before the first render.
    this.wish = this.wishService.selectedWish();
    super.ngOnInit();
  }

}