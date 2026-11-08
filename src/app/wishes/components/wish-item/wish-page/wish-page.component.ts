import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCalendarPlus, faCheck, faComment, faExpand, faExternalLinkAlt, faGift, faListAlt, faPaintBrush, faUser } from '@fortawesome/free-solid-svg-icons';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { WishItemComponent } from '../wish-item.component';
import { WishService } from 'src/app/wishes/services/wish.service';
import { ImageService } from 'src/app/images/services/image.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from 'src/app/users/service/user.service';
import { PeopleService } from 'src/app/people/service/people.service';
import { CommunicationService } from 'src/app/shared/services/communication.service';
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
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CursorPointerDirective, RouterLink, FaIconComponent, ActionListComponent, WishBannerComponent, ImageViewComponent, WishCallToActionButtonComponent, CurrencyPipe, DatePipe]
})
export class WishPageComponent extends WishItemComponent implements OnInit {
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

  constructor(
    protected modalService: NgbModal,
    protected wishService: WishService,
    protected notificationService: NotificationService,
    protected userService: UserService,
    protected imageService: ImageService,
    protected peopleService: PeopleService,
    protected communicationService: CommunicationService,
    protected route: ActivatedRoute
  ) {
    super(
      modalService,
      wishService,
      notificationService,
      userService,
      imageService,
      peopleService,
      communicationService
    );
  }

  ngOnInit(): void {
    this.wishService.selectedWish.subscribe(selectedWish => {
      this.wish = selectedWish;
    });
    super.ngOnInit();
  }

}