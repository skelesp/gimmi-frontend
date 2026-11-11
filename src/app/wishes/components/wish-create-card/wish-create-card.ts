import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Person } from 'src/app/people/models/person.model';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { CurrentUser } from 'src/app/core/auth/auth-store';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { WishPopup } from '../wish-item/wish-popup/wish-popup';
import { ImageView } from '../../../images/components/image-view/image-view';
import { CursorPointer } from '../../../shared/directives/cursor-pointer';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-wish-create-card',
    templateUrl: './wish-create-card.html',
    styleUrls: ['./wish-create-card.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [ImageView, CursorPointer, FaIconComponent]
})
export class WishCreateCard implements OnInit {
  private modalService = inject(NgbModal);
  private wishService = inject(WishService);
  private auth = inject(AuthStore);
  private notificationService = inject(NotificationService);

  @Input() receiver : Person;
  plusIcon : IconDefinition = faPlus;
  currentUser: CurrentUser;

  ngOnInit(): void {
    this.currentUser = this.auth.user();
  }

  openCreateWish () {
    const wishCreatePopup = this.modalService.open(WishPopup);
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

  private handlePopupDismissal (reason: unknown) : void {
    if (reason === ModalDismissReasons.ESC) reason = 'ESC pressed';
    else if (reason === ModalDismissReasons.BACKDROP_CLICK) reason = 'Backdrop click';

    console.warn(`Wish Create popup is closed: ${reason}`);
  }

}
