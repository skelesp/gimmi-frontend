import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WishesRoutingModule } from './wishes-routing.module';
import { WishListComponent } from './components/wish-list/wish-list.component';
import { SharedModule } from '../shared/shared.module';
import { FilterOnStatePipe } from './pipes/filter-on-state.pipe';
import { WishItemComponent } from './components/wish-item/wish-item.component';
import { WishCardComponent } from './components/wish-item/wish-card/wish-card.component';
import { WishBannerComponent } from './components/wish-item/wish-banner/wish-banner.component';
import { WishCallToActionButtonComponent } from './components/wish-item/wish-call-to-action-button/wish-call-to-action-button.component';
import { WishReservationComponent } from './components/wish-reservation/wish-reservation.component';
import { ChangeWishReservationComponent } from './components/wish-reservation/change-wish-reservation/change-wish-reservation.component';
import { GiftFeedbackComponent } from './components/gift-feedback/gift-feedback.component';
import { ActionListComponent } from './components/wish-item/action-list/action-list.component';
import { ActionListItemComponent } from './components/wish-item/action-list/action-list-item/action-list-item.component';
import { WishDeleteComponent } from './components/wish-delete/wish-delete.component';
import { WishPopupComponent } from './components/wish-item/wish-popup/wish-popup.component';
import { WishCreateCardComponent } from './components/wish-create-card/wish-create-card.component';
import { WishPageComponent } from './components/wish-item/wish-page/wish-page.component';

@NgModule({
    imports: [
        CommonModule,
        SharedModule,
        WishesRoutingModule,
        WishListComponent, FilterOnStatePipe, WishItemComponent, WishCardComponent, WishBannerComponent, WishCallToActionButtonComponent, WishReservationComponent, ChangeWishReservationComponent, GiftFeedbackComponent, ActionListComponent, ActionListItemComponent, WishDeleteComponent, WishPopupComponent, WishCreateCardComponent, WishPageComponent
    ],
    exports: [
        WishListComponent,
        WishReservationComponent
    ]
})
export class WishesModule { }
