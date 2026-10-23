import { Component } from '@angular/core';
import { WishItemComponent } from '../wish-item.component';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { WishService } from 'src/app/wishes/services/wish.service';
import { ImageService } from 'src/app/images/services/image.service';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from 'src/app/users/service/user.service';
import { PeopleService } from 'src/app/people/service/people.service';
import { CommunicationService } from 'src/app/shared/services/communication.service';

@Component({
  selector: 'gimmi-wish-card',
  templateUrl: './wish-card.component.html',
  styleUrls: ['./wish-card.component.css']
})
export class WishCardComponent extends WishItemComponent {

  constructor(
    protected modalService: NgbModal,
    protected wishService: WishService,
    protected notificationService: NotificationService,
    protected userService: UserService,
    protected imageService: ImageService,
    protected peopleService: PeopleService,
    protected communicationService: CommunicationService
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

}
