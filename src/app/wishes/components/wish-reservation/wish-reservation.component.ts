import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Person } from 'src/app/people/models/person.model';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { UserService } from 'src/app/users/service/user.service';
import { IReservation, Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';

@Component({
  selector: 'gimmi-wish-reservation',
  templateUrl: './wish-reservation.component.html',
  styleUrls: ['./wish-reservation.component.css']
})
export class WishReservationComponent implements OnInit {
  @Input() wish: Wish;
  reservationForm: UntypedFormGroup;
  readonly reasonOptions: string[] = ['Verjaardag', 'Sinterklaas', 'Kerstmis', 'Nieuwjaar', 'Housewarming', 'Geboorte', 'Huwelijk', 'Afscheid collega', 'Afscheid', 'Communie / Lentefeest', 'Vader/moederdag', 'Andere reden']

  constructor( 
    public activeModal: NgbActiveModal,
    private userService: UserService,
    private wishService: WishService,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    this.reservationForm = new UntypedFormGroup({
      'handoverDate': new UntypedFormControl(new Date().toISOString().substring(0, 10), Validators.required), //https://stackoverflow.com/questions/45330319/angular2-setting-date-field-on-reactive-form
      'reason': new UntypedFormControl(null, Validators.required)
    })
  }

  saveReservation() {
    let reservation: IReservation = { 
      reason: this.reservationForm.value.reason,
      handoverDate: new Date(this.reservationForm.value.handoverDate),
      amount: 1,
      reservedBy: new Person(
        this.userService.currentUser.id, 
        this.userService.currentUser.firstName, 
        this.userService.currentUser.lastName
        ),
      reservationDate: new Date()
    }

    this.wishService.addReservation(
      this.wish,
      reservation
    ).subscribe( wish => this.notificationService.showNotification(
    `Wens ${wish.title} is gereserveerd. U hoeft dit perfecte cadeau enkel nog te kopen en af te geven!`,
      'success',
      'Gereserveerd'
    ));

    this.activeModal.close(reservation);
  }

}
