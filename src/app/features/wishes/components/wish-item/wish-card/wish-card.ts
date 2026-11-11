import { Component, ChangeDetectionStrategy } from '@angular/core';
import { WishItem } from '../wish-item';

import { ImageView } from '../../../../images/components/image-view/image-view';
import { CurrencyPipe } from '@angular/common';
import { WishBanner } from '../wish-banner/wish-banner';
import { CursorPointer } from '../../../../../shared/directives/cursor-pointer';
import { RouterLink } from '@angular/router';
import { ActionList } from '../action-list/action-list';
import { WishCallToActionButton } from '../wish-call-to-action-button/wish-call-to-action-button';

@Component({
    selector: 'gimmi-wish-card',
    templateUrl: './wish-card.html',
    styleUrls: ['./wish-card.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ImageView, WishBanner, CursorPointer, RouterLink, ActionList, WishCallToActionButton, CurrencyPipe]
})
export class WishCard extends WishItem {
}
