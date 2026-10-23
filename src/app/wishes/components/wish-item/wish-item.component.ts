import { Component, Input, OnInit } from '@angular/core';
import { faBan, faGift, faStar, faLightbulb, faCartArrowDown, faThumbsUp, faTrashAlt, faGlobeEurope } from '@fortawesome/free-solid-svg-icons';
import { faClone, faComment, faEdit } from '@fortawesome/free-regular-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { switchMap } from 'rxjs/operators';

import { IGiftFeedback, Wish, WishScenario } from '../../models/wish.model';
import { WishReservationComponent } from '../wish-reservation/wish-reservation.component';
import { ChangeWishReservationComponent } from '../wish-reservation/change-wish-reservation/change-wish-reservation.component';
import { GiftFeedbackComponent } from '../gift-feedback/gift-feedback.component';
import { CTAButtonConfig } from './wish-call-to-action-button/wish-call-to-action-button.component';
import { BannerConfig } from './wish-banner/wish-banner.component';
import { ActionListItemConfig } from './action-list/action-list-item/action-list-item.component';
import { WishDeleteComponent } from '../wish-delete/wish-delete.component';
import { WishPopupComponent } from './wish-popup/wish-popup.component';
import { WishService } from '../../services/wish.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Person } from 'src/app/people/models/person.model';
import { UserService } from 'src/app/users/service/user.service';
import { ImageService } from 'src/app/images/services/image.service';
import { CommunicationService } from 'src/app/shared/services/communication.service';
import { PeopleService } from 'src/app/people/service/people.service';

@Component({
  template: '',
  styleUrls: ['./wish-item.component.css']
})
export class WishItemComponent implements OnInit {
  @Input() wish: Wish;
  wishActionItems : ActionListItemConfig[] = [];

  readonly CTAbuttonConfigs: { [key: string]: CTAButtonConfig } = {
    noButton: { text: null, icon: null },
    reserve: { text: "Reserveer", icon: faGift, onClick: this.reserve.bind(this) },
    cancel: { text: "Verwijder reservatie", icon: faBan, onClick: this.changeReservation.bind(this) },
    feedback: { text: "Geef feedback", icon: faComment, onClick: this.giveFeedback.bind(this) }
  };
  readonly bannerConfigs: { [key: string]: BannerConfig} = {
    noBanner: { text: null, backgroundColor: null, bannerIcon: null },
    yourIdea: { text: "Jouw idee", backgroundColor: 'warning', bannerIcon: faLightbulb },
    reserved: { text: "Gereserveerd", backgroundColor: 'danger', bannerIcon: faCartArrowDown },
    reservedByUser: { text: "Gereserveerd door jou", backgroundColor: 'warning', bannerIcon: faStar },
    received: { text: "Ontvangen", backgroundColor: 'danger', bannerIcon: faGift },
    givenByUser: { text: "Gegeven door jou", backgroundColor: 'warning', bannerIcon: faGift },
    fulfilled: { text: "Wens vervuld", backgroundColor: 'success', bannerIcon: faThumbsUp },
    fulfilledByUser: { text: "Wens vervuld door jou", backgroundColor: 'success', bannerIcon: faThumbsUp }
  };
  readonly actionListItemConfigs: { [key: string] : ActionListItemConfig } = {
    edit: { text: "Aanpassen", icon: faEdit, onClick: this.edit.bind(this) },
    copy: { text: "Zet op eigen lijst", icon: faClone, onClick: this.copy.bind(this) },
    delete: { text: "Verwijderen", icon: faTrashAlt, onClick: this.delete.bind(this) },
    externalSite: { text: "Externe website", icon: faGlobeEurope }
  };
  readonly wishScenarioConfig: { [key in WishScenario]: { CTAbutton: CTAButtonConfig, bannerConfig: BannerConfig} } = {
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

  constructor(
    protected modalService: NgbModal,
    protected wishService: WishService,
    protected notificationService: NotificationService,
    protected userService: UserService,
    protected imageService: ImageService,
    protected peopleService: PeopleService,
    protected communicationService: CommunicationService
  ) { }

  ngOnInit(): void {
    this.defineWishActions();
  }

  private defineWishActions(): void {
    if (!this.wish.userIsReceiver) this.wishActionItems.push(this.actionListItemConfigs.copy);
    if (this.wish.userIsReceiver || this.wish.userIsCreator) {
      this.wishActionItems.unshift(this.actionListItemConfigs.edit);
      this.wishActionItems.push(this.actionListItemConfigs.delete);
    }
    if (this.wish.url) {
      this.actionListItemConfigs.externalSite.url = this.wish.url;
      this.wishActionItems.unshift(this.actionListItemConfigs.externalSite);
    }
  }

  canShowReservationStatus() : boolean {
    return !(this.wish.scenario === 'RESERVED_INCOGNITO_FOR_USER' || this.wish.scenario === 'OPEN_WISH_CREATED_BY_USER_FOR_ANOTHER' || this.wish.scenario === 'OPEN_WISH');
  }
  
  reserve() {
    let reservationPopup = this.modalService.open(WishReservationComponent);
    reservationPopup.componentInstance.wish = this.wish;
  }

  changeReservation() {
    let cancelReservationPopup = this.modalService.open(ChangeWishReservationComponent);
    cancelReservationPopup.componentInstance.wish = this.wish;
  }

  giveFeedback() {
    let giftFeedbackPopup = this.modalService.open(GiftFeedbackComponent);
    giftFeedbackPopup.componentInstance.wish = this.wish;

    (giftFeedbackPopup.result as Promise<IGiftFeedback>).then( giftFeedback => {
      this.wishService.addGiftFeedback(this.wish, giftFeedback)
        .pipe(switchMap(wish => this.wishService.close(wish)))
        .subscribe(wish => {
          if (wish.giftFeedback.putBackOnList) this.copy();
          if (wish.giftFeedback.message) {
            this.peopleService.getEmailById(wish.reservation.reservedBy.id).subscribe(email => {
              this.communicationService.sendMail({
                to: email,
                subject: `[GIMMI] ${wish.receiver.fullName} bedankt je voor je cadeau!!`,
                html: `${wish.reservation.reservedBy.firstName} <br/><br/>
                      Je hebt onlangs op Gimmi het cadeau '${wish.title}' gereserveerd voor ${wish.receiver.fullName}. <br/>
                      Onlangs heb je dit cadeau afgegeven. Daarnet heeft ${wish.receiver.firstName} je een dankboodschap nagelaten:<br/><br/>
                      <em>${wish.giftFeedback.message}</em><br/><br/><br/>
                      Bedankt om Gimmi te gebruiken en hopelijk tot snel voor een nieuwe succesvolle cadeauzoektocht!`
              });
            })
          }
        }
        );
    });
  }
  
  edit () {
    let editPopup = this.modalService.open(WishPopupComponent);
    editPopup.componentInstance.wish = this.wish;
    editPopup.componentInstance.mode = 'edit';

    (editPopup.result as Promise<Wish>).then( wish => {
      this.wishService.update(wish).subscribe(wish => {
        console.info('Wish updated:', wish);
      });
    }).catch( err => console.warn('popup closed:', err) );
  }

  copy() {
    let copyPopup;
    let currentUser = new Person(
      this.userService.currentUser.id,
      this.userService.currentUser.firstName,
      this.userService.currentUser.lastName
    );

    copyPopup = this.modalService.open(WishPopupComponent);
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
    let wishDeletePopup = this.modalService.open(WishDeleteComponent);
    wishDeletePopup.componentInstance.wish = this.wish;
  }

}
