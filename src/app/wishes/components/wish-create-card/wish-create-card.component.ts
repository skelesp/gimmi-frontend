import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Person } from 'src/app/people/models/person.model';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { WishPopupComponent } from '../wish-item/wish-popup/wish-popup.component';
import { ImageViewComponent } from '../../../images/components/image-view/image-view.component';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-wish-create-card',
    templateUrl: './wish-create-card.component.html',
    styleUrls: ['./wish-create-card.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ImageViewComponent, CursorPointerDirective, FaIconComponent]
})
export class WishCreateCardComponent implements OnInit {
  @Input() receiver : Person;
  plusIcon : IconDefinition = faPlus;
  currentUser: User;

  constructor( 
    private modalService : NgbModal,
    private wishService : WishService,
    private userService : UserService,
    private notificationService: NotificationService ) { }

  ngOnInit(): void {
    this.currentUser = this.userService.currentUser;
  }

  openCreateWish () {
    const wishCreatePopup = this.modalService.open(WishPopupComponent);
    wishCreatePopup.componentInstance.mode = 'create';

    (wishCreatePopup.result as Promise<Wish>)
      .then( wish => {
        wish.createdBy = new Person(this.currentUser.id, this.currentUser.firstName, this.currentUser.lastName);
        wish.receiver = this.receiver;
        this.wishService.create(wish).subscribe(wish =>
          this.notificationService.showNotification(
            `De wens '${wish.title}' werd toegevoegd aan deze lijst.`,
            'success',
            'Wens toegevoegd'
          )
        );
      })
      .catch( reason => this.handlePopupDismissal(reason) );
  }

  private handlePopupDismissal (reason : any) : void {
    if (reason === ModalDismissReasons.ESC) reason = 'ESC pressed';
    else if (reason === ModalDismissReasons.BACKDROP_CLICK) reason = 'Backdrop click';

    console.warn(`Wish Create popup is closed: ${reason}`);
  }

}
