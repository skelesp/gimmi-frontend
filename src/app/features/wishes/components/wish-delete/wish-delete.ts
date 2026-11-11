import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Notifications } from 'src/app/core/notifications';

import { Wish } from '../../models/wish.model';
import { WishesData } from '../../wishes-data';
import { CursorPointer } from '../../../../shared/directives/cursor-pointer';

@Component({
    selector: 'gimmi-wish-delete',
    templateUrl: './wish-delete.html',
    styleUrls: ['./wish-delete.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer]
})
export class WishDelete {
  activeModal = inject(NgbActiveModal);
  private wishService = inject(WishesData);
  private notificationService = inject(Notifications);

  @Input() wish: Wish;

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
