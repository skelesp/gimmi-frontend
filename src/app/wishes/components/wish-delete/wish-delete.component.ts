import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from 'src/app/shared/services/notification.service';

import { Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';

@Component({
    selector: 'gimmi-wish-delete',
    templateUrl: './wish-delete.component.html',
    styleUrls: ['./wish-delete.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointerDirective]
})
export class WishDeleteComponent {
  activeModal = inject(NgbActiveModal);
  private wishService = inject(WishService);
  private notificationService = inject(NotificationService);

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
