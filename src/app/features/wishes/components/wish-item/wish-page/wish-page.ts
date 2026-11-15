import { Component, ChangeDetectionStrategy, ChangeDetectorRef, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
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
import { FullNamePipe } from 'src/app/shared/pipes/full-name-pipe';
import { EurosPipe } from '../../../pipes/euros-pipe';
import { wishUrl } from '../../../wish';

@Component({
    selector: 'gimmi-wish-page',
    templateUrl: './wish-page.html',
    styleUrls: ['./wish-page.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, RouterLink, FaIconComponent, ActionList, WishBanner, ImageView, WishCallToActionButton, CurrencyPipe, DatePipe, FullNamePipe, EurosPipe]
})
export class WishPage extends WishItem {
  protected route = inject(ActivatedRoute);
  private changeDetector = inject(ChangeDetectorRef);

  wishID: string;
  get url(): string | null { return wishUrl(this.wish); }
  listIcon: IconDefinition = faListAlt;
  calendarIcon: IconDefinition = faCalendarPlus;
  userIcon: IconDefinition = faUser;
  linkIcon: IconDefinition = faExternalLinkAlt;
  giftIcon: IconDefinition = faGift;
  colorIcon: IconDefinition = faPaintBrush;
  sizeIcon: IconDefinition = faExpand;
  textIcon: IconDefinition = faComment;
  doneIcon: IconDefinition = faCheck;

  private readonly wishId = toSignal(this.route.paramMap.pipe(map(params => params.get('wishId'))));
  readonly loading = this.wishService.selectedLoading;

  constructor() {
    super();
    effect(() => this.wishService.select(this.wishId()));
    // WishItem inherits a plain `@Input() wish`: this bridge copies the selected wish into it, builds its actions and refreshes the view.
    effect(() => {
      this.wish = this.wishService.selectedWish();
      this.defineWishActions();
      this.changeDetector.markForCheck();
    });
  }

}