import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { faBan, faGift, faStar, faLightbulb, faCartArrowDown, faThumbsUp, faTrashAlt, faGlobeEurope } from '@fortawesome/free-solid-svg-icons';
import { faClone, faComment, faEdit } from '@fortawesome/free-regular-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import type { Schema } from 'src/app/core/api/api-types';
import { Wish, WishScenario } from '../../models/wish.model';
import { WishReservation } from '../wish-reservation/wish-reservation';
import { ChangeWishReservation } from '../wish-reservation/change-wish-reservation/change-wish-reservation';
import { GiftFeedback } from '../gift-feedback/gift-feedback';
import { CTAButtonConfig } from './wish-call-to-action-button/wish-call-to-action-button';
import { BannerConfig } from './wish-banner/wish-banner';
import { ActionListItemConfig } from './action-list/action-list-item/action-list-item';
import { WishDelete } from '../wish-delete/wish-delete';
import { WishPopup } from './wish-popup/wish-popup';
import { WishService } from '../../services/wish.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Person } from 'src/app/people/models/person.model';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { ImageService } from 'src/app/images/services/image.service';

@Component({
    template: '',
    styleUrls: ['./wish-item.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishItem implements OnInit {
  protected modalService = inject(NgbModal);
  protected wishService = inject(WishService);
  protected notificationService = inject(NotificationService);
  protected auth = inject(AuthStore);
  protected imageService = inject(ImageService);

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
  readonly wishScenarioConfig: Record<WishScenario, { CTAbutton: CTAButtonConfig, bannerConfig: BannerConfig}> = {
    'OPEN_WISH': { 
      CTAbutton: this.CTAbuttonConfigs.reserve,
      bannerConfig: this.bannerConfigs.noBanner 
    },
    'OPEN_WISH_CREATED_BY_USER_FOR_ANOTHER': {
      CTAbutton: this.CTAbuttonConfigs.reserve,
      bannerConfig: this.bannerConfigs.yourIdea 
    },
    'RESERVED': {
      CTAbutton: this.CTAbuttonConfigs.noButton,
      bannerConfig: this.bannerConfigs.reserved 
    },
    'RESERVED_BY_USER': {
      CTAbutton: this.CTAbuttonConfigs.cancel,
      bannerConfig: this.bannerConfigs.reservedByUser
    },
    'RESERVED_INCOGNITO_FOR_USER': {
      CTAbutton: this.CTAbuttonConfigs.reserve,
      bannerConfig: this.bannerConfigs.noBanner
    },
    'RECEIVED': {
      CTAbutton: this.CTAbuttonConfigs.noButton,
      bannerConfig: this.bannerConfigs.received
    },
    'RECEIVED_RECEIVER': {
      CTAbutton: this.CTAbuttonConfigs.feedback,
      bannerConfig: this.bannerConfigs.received
    },
    'RECEIVED_GIVEN_BY_USER': {
      CTAbutton: this.CTAbuttonConfigs.noButton,
      bannerConfig: this.bannerConfigs.givenByUser
    },
    'FULFILLED': {
      CTAbutton: this.CTAbuttonConfigs.noButton,
      bannerConfig: this.bannerConfigs.fulfilled
    },
    'FULFILLED_BY_USER': {
      CTAbutton: this.CTAbuttonConfigs.noButton,
      bannerConfig: this.bannerConfigs.fulfilledByUser
    }
  };

  ngOnInit(): void {
    this.defineWishActions();
  }

  private defineWishActions(): void {
    if (this.wish.can('copy')) this.wishActionItems.push(this.actionListItemConfigs.copy);
    if (this.wish.can('update')) this.wishActionItems.unshift(this.actionListItemConfigs.edit);
    if (this.wish.can('delete')) this.wishActionItems.push(this.actionListItemConfigs.delete);
    if (this.wish.url) {
      this.actionListItemConfigs.externalSite.url = this.wish.url;
      this.wishActionItems.unshift(this.actionListItemConfigs.externalSite);
    }
  }

  canShowReservationStatus() : boolean {
    return !(this.wish.scenario === 'RESERVED_INCOGNITO_FOR_USER' || this.wish.scenario === 'OPEN_WISH_CREATED_BY_USER_FOR_ANOTHER' || this.wish.scenario === 'OPEN_WISH');
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

    (editPopup.result as Promise<Wish>).then( wish => {
      this.wishService.update(wish).subscribe(wish => {
        console.info('Wish updated:', wish);
      });
    }).catch( err => console.warn('popup closed:', err) );
  }

  copy() {
    const currentUser = new Person(
      this.auth.user().id,
      this.auth.user().firstName,
      this.auth.user().lastName
    );

    const copyPopup = this.modalService.open(WishPopup);
    copyPopup.componentInstance.mode = 'copy';
    copyPopup.componentInstance.wish = { 
      ...this.wish, 
      id: undefined, 
      copyOf: this.wish.id, 
      description: "", 
      // De kopie deelt het R2-beeld (sc-2911): de backend verwijdert het pas als geen enkele wens het nog gebruikt.
      image: this.imageService.heeftBeeld(this.wish.image) ? this.wish.image : null,
      createdBy: currentUser,
      receiver: currentUser
    };

    (copyPopup.result as Promise<Wish>).then(wish => {
      this.wishService.create(wish).subscribe(wish =>
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
