import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Person } from 'src/app/people/models/person.model';
import { NotificationService } from 'src/app/shared/services/notification.service';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { IReservation, Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { CursorPointer } from '../../../shared/directives/cursor-pointer';


@Component({
    selector: 'gimmi-wish-reservation',
    templateUrl: './wish-reservation.html',
    styleUrls: ['./wish-reservation.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, FormsModule, ReactiveFormsModule]
})
export class WishReservation implements OnInit {
  activeModal = inject(NgbActiveModal);
  private auth = inject(AuthStore);
  private wishService = inject(WishService);
  private notificationService = inject(NotificationService);

  @Input() wish: Wish;
  reservationForm: FormGroup<{
    handoverDate: FormControl<string>;
    reason: FormControl<string | null>;
  }>;
  readonly reasonOptions: string[] = ['Verjaardag', 'Sinterklaas', 'Kerstmis', 'Nieuwjaar', 'Housewarming', 'Geboorte', 'Huwelijk', 'Afscheid collega', 'Afscheid', 'Communie / Lentefeest', 'Vader/moederdag', 'Andere reden']

  ngOnInit(): void {
    this.reservationForm = new FormGroup({
      'handoverDate': new FormControl(new Date().toISOString().substring(0, 10), { nonNullable: true, validators: Validators.required }), //https://stackoverflow.com/questions/45330319/angular2-setting-date-field-on-reactive-form
      'reason': new FormControl<string | null>(null, Validators.required)
    })
  }

  saveReservation() {
    const reservation: IReservation = { 
      reason: this.reservationForm.value.reason,
      handoverDate: new Date(this.reservationForm.value.handoverDate),
      amount: 1,
      reservedBy: new Person(
        this.auth.user().id, 
        this.auth.user().firstName, 
        this.auth.user().lastName
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
