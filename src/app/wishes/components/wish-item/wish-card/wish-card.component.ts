import { Component, ChangeDetectionStrategy } from '@angular/core';
import { WishItemComponent } from '../wish-item.component';

import { ImageViewComponent } from '../../../../images/components/image-view/image-view.component';
import { CurrencyPipe } from '@angular/common';
import { WishBannerComponent } from '../wish-banner/wish-banner.component';
import { CursorPointerDirective } from '../../../../shared/directives/cursor-pointer.directive';
import { RouterLink } from '@angular/router';
import { ActionListComponent } from '../action-list/action-list.component';
import { WishCallToActionButtonComponent } from '../wish-call-to-action-button/wish-call-to-action-button.component';

@Component({
    selector: 'gimmi-wish-card',
    templateUrl: './wish-card.component.html',
    styleUrls: ['./wish-card.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ImageViewComponent, WishBannerComponent, CursorPointerDirective, RouterLink, ActionListComponent, WishCallToActionButtonComponent, CurrencyPipe]
})
export class WishCardComponent extends WishItemComponent {
}
