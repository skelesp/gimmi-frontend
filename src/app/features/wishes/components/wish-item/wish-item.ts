import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { faBan, faGift, faStar, faLightbulb, faCartArrowDown, faThumbsUp, faTrashAlt, faGlobeEurope } from '@fortawesome/free-solid-svg-icons';
import { faClone, faComment, faEdit } from '@fortawesome/free-regular-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import type { Schema } from 'src/app/core/api/api-types';
import { Wish, WishDraft, canDo, hasRole, wishUrl } from '../../wish';
import { WishReservation } from '../wish-reservation/wish-reservation';
import { ChangeWishReservation } from '../wish-reservation/change-wish-reservation/change-wish-reservation';
import { GiftFeedback } from '../gift-feedback/gift-feedback';
import { CTAButtonConfig } from './wish-call-to-action-button/wish-call-to-action-button';
import { BannerConfig } from './wish-banner/wish-banner';
import { ActionListItemConfig } from './action-list/action-list-item/action-list-item';
import { WishDelete } from '../wish-delete/wish-delete';
import { WishPopup } from './wish-popup/wish-popup';
import { WishesData } from '../../wishes-data';
import { Notifications } from 'src/app/core/notifications';
import { AuthStore } from 'src/app/core/auth/auth-store';

@Component({
    template: '',
    styleUrls: ['./wish-item.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishItem implements OnInit {
  protected modalService = inject(NgbModal);
  protected wishService = inject(WishesData);
  protected notificationService = inject(Notifications);
  protected auth = inject(AuthStore);

  @Input() wish: Wish;
  wishActionItems : ActionListItemConfig[] = [];

  readonly CTAbuttonConfigs: Record<string, CTAButtonConfig> = {
    noButton: { text: null, icon: null },
    reserve: { text: "Reserveer", icon: faGift, onClick: this.reserve.bind(this) },
    cancel: { text: "Verwijder reservatie", icon: faBan, onClick: this.changeReservation.bind(this) },
    feedback: { text: "Geef feedback", icon: faComment, onClick: this.giveFeedback.bind(this) }
  };
  readonly bannerConfigs: Record<string, BannerConfig> = {
    noBanner: { text: null, backgroundColor: null, bannerIcon: null },
    yourIdea: { text: "Jouw idee", backgroundColor: 'warning', bannerIcon: faLightbulb },
    reserved: { text: "Gereserveerd", backgroundColor: 'danger', bannerIcon: faCartArrowDown },
    reservedByUser: { text: "Gereserveerd door jou", backgroundColor: 'warning', bannerIcon: faStar },
    received: { text: "Ontvangen", backgroundColor: 'danger', bannerIcon: faGift },
    givenByUser: { text: "Gegeven door jou", backgroundColor: 'warning', bannerIcon: faGift },
    fulfilled: { text: "Wens vervuld", backgroundColor: 'success', bannerIcon: faThumbsUp },
    fulfilledByUser: { text: "Wens vervuld door jou", backgroundColor: 'success', bannerIcon: faThumbsUp }
  };
  readonly actionListItemConfigs: Record<string, ActionListItemConfig> = {
    edit: { text: "Aanpassen", icon: faEdit, onClick: this.edit.bind(this) },
    copy: { text: "Zet op eigen lijst", icon: faClone, onClick: this.copy.bind(this) },
    delete: { text: "Verwijderen", icon: faTrashAlt, onClick: this.delete.bind(this) },
    externalSite: { text: "Externe website", icon: faGlobeEurope }
  };
  /** The banner and the call-to-action button of the wish: they follow from its status and what the viewer is to it. */
  presentation(): { CTAbutton: CTAButtonConfig, bannerConfig: BannerConfig } {
    const giver = hasRole(this.wish, 'giver');
    const receiver = hasRole(this.wish, 'receiver');
    const banners = this.bannerConfigs;
    const buttons = this.CTAbuttonConfigs;
    switch (this.wish.status) {
      case 'open':
        return { CTAbutton: buttons.reserve, bannerConfig: !receiver && hasRole(this.wish, 'creator') ? banners.yourIdea : banners.noBanner };
      case 'reserved':
        if (giver) return { CTAbutton: buttons.cancel, bannerConfig: banners.reservedByUser };
        // The receiver must not know that something is reserved on their list.
        return receiver ? { CTAbutton: buttons.reserve, bannerConfig: banners.noBanner }
          : { CTAbutton: buttons.noButton, bannerConfig: banners.reserved };
      case 'received':
        if (giver) return { CTAbutton: buttons.noButton, bannerConfig: banners.givenByUser };
        return { CTAbutton: receiver ? buttons.feedback : buttons.noButton, bannerConfig: banners.received };
      case 'fulfilled':
        return { CTAbutton: buttons.noButton, bannerConfig: giver ? banners.fulfilledByUser : banners.fulfilled };
    }
  }

  ngOnInit(): void {
    this.defineWishActions();
  }

  private defineWishActions(): void {
    if (canDo(this.wish, 'copy')) this.wishActionItems.push(this.actionListItemConfigs.copy);
    if (canDo(this.wish, 'update')) this.wishActionItems.unshift(this.actionListItemConfigs.edit);
    if (canDo(this.wish, 'delete')) this.wishActionItems.push(this.actionListItemConfigs.delete);
    const url = wishUrl(this.wish);
    if (url) {
      this.actionListItemConfigs.externalSite.url = url;
      this.wishActionItems.unshift(this.actionListItemConfigs.externalSite);
    }
  }

  canShowReservationStatus() : boolean {
    const { bannerConfig } = this.presentation();
    return bannerConfig !== this.bannerConfigs.noBanner && bannerConfig !== this.bannerConfigs.yourIdea;
  }
  
  reserve() {
    const reservationPopup = this.modalService.open(WishReservation);
    reservationPopup.componentInstance.wish = this.wish;
  }

  changeReservation() {
    const cancelReservationPopup = this.modalService.open(ChangeWishReservation);
    cancelReservationPopup.componentInstance.wish = this.wish;
  }

  giveFeedback() {
    const giftFeedbackPopup = this.modalService.open(GiftFeedback);
    giftFeedbackPopup.componentInstance.wish = this.wish;

    // The server puts the wish back on the list and mails the thank-you message to the giver.
    (giftFeedbackPopup.result as Promise<Schema<'FulfillmentRequest'>>).then(giftFeedback => {
      this.wishService.fulfill(this.wish, giftFeedback).subscribe();
    }).catch(err => console.warn('popup closed:', err));
  }
  
  edit () {
    const editPopup = this.modalService.open(WishPopup);
    editPopup.componentInstance.wish = this.wish;
    editPopup.componentInstance.mode = 'edit';

    (editPopup.result as Promise<WishDraft>).then( draft => {
      this.wishService.update(this.wish, draft).subscribe(wish => {
        console.info('Wish updated:', wish);
      });
    }).catch( err => console.warn('popup closed:', err) );
  }

  copy() {
    const copyPopup = this.modalService.open(WishPopup);
    copyPopup.componentInstance.mode = 'copy';
    // The popup starts from this wish; the copy shares its R2 image (sc-2911): the backend removes it only when no wish uses it any more.
    copyPopup.componentInstance.wish = this.wish;

    (copyPopup.result as Promise<WishDraft>).then(draft => {
      this.wishService.create(draft, this.auth.user().id).subscribe(wish =>
        this.notificationService.showNotification(
          `De wens '${wish.title}' werd toegevoegd aan je lijst.`,
          'success',
          'Wens gekopieerd'
        )
      );
    }).catch(err => console.warn('popup closed:', err));
  }

  delete() {
    const wishDeletePopup = this.modalService.open(WishDelete);
    wishDeletePopup.componentInstance.wish = this.wish;
  }

}
