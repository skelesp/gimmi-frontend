import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Wish } from 'src/app/wishes/models/wish.model';
import { WishService } from 'src/app/wishes/services/wish.service';
import { CursorPointer } from '../../../../shared/directives/cursor-pointer';

@Component({
    selector: 'gimmi-change-wish-reservation',
    templateUrl: './change-wish-reservation.html',
    styleUrls: ['./change-wish-reservation.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer]
})
export class ChangeWishReservation implements OnInit {
  activeModal = inject(NgbActiveModal);
  private wishService = inject(WishService);
  private notificationService = inject(NotificationService);

  @Input() wish: Wish;

  ngOnInit(): void {
  }

  cancelReservation () {
    this.wishService.deleteReservation(this.wish).subscribe(wish =>
      this.notificationService.showNotification(
        `Je reservatie van ${wish.title} voor ${wish.receiver.firstName} is verwijderd.`,
        'info',
        'Reservatie geannuleerd')
    );
    this.activeModal.close();
  }
}
