import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Notifications } from 'src/app/core/notifications';
import { Wish } from 'src/app/features/wishes/models/wish.model';
import { WishesData } from 'src/app/features/wishes/wishes-data';
import { CursorPointer } from '../../../../../shared/directives/cursor-pointer';

@Component({
    selector: 'gimmi-change-wish-reservation',
    templateUrl: './change-wish-reservation.html',
    styleUrls: ['./change-wish-reservation.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer]
})
export class ChangeWishReservation implements OnInit {
  activeModal = inject(NgbActiveModal);
  private wishService = inject(WishesData);
  private notificationService = inject(Notifications);

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
