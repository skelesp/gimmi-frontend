import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from 'src/app/shared/services/notification.service';

import { Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';

@Component({
    selector: 'gimmi-wish-delete',
    templateUrl: './wish-delete.component.html',
    styleUrls: ['./wish-delete.component.css'],
    standalone: false
})
export class WishDeleteComponent {
  @Input() wish: Wish;

  constructor(
    public activeModal: NgbActiveModal,
    private wishService: WishService,
    private notificationService: NotificationService
  ) { }

  executeDeletion() {
    this.activeModal.close();
    this.wishService.delete(this.wish).subscribe( (deletedWish) =>
      this.notificationService.showNotification(
        `Wens "${deletedWish.title}" is verwijderd.`,
        "success",
        "Wens verwijderd"
      )
    );
  }

}
