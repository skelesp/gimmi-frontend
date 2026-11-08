import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { Wish } from 'src/app/wishes/models/wish.model';
import { WishService } from 'src/app/wishes/services/wish.service';

@Component({
    selector: 'gimmi-change-wish-reservation',
    templateUrl: './change-wish-reservation.component.html',
    styleUrls: ['./change-wish-reservation.component.css'],
    standalone: false
})
export class ChangeWishReservationComponent implements OnInit {
  @Input() wish: Wish;
  constructor(
    public activeModal: NgbActiveModal,
    private wishService: WishService,
    private notificationService: NotificationService
  ) { }

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
