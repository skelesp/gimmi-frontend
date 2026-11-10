import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotificationService } from 'src/app/shared/services/notification.service';
import type { Schema } from 'src/app/core/api/api-types';
import { Wish } from '../../models/wish.model';
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
  private wishService = inject(WishService);
  private notificationService = inject(NotificationService);

  @Input() wish: Wish;
  reservationForm: FormGroup<{
    handoverDate: FormControl<string>;
    reason: FormControl<Schema<'Occasion'> | null>;
  }>;
  /** The occasions of the contract with their label; an unknown value from the server counts as `other`. */
  readonly reasonOptions: { value: Schema<'Occasion'>; label: string }[] = [
    { value: 'birthday', label: 'Verjaardag' },
    { value: 'saint-nicholas', label: 'Sinterklaas' },
    { value: 'christmas', label: 'Kerstmis' },
    { value: 'new-year', label: 'Nieuwjaar' },
    { value: 'housewarming', label: 'Housewarming' },
    { value: 'birth', label: 'Geboorte' },
    { value: 'wedding', label: 'Huwelijk' },
    { value: 'farewell-colleague', label: 'Afscheid collega' },
    { value: 'farewell', label: 'Afscheid' },
    { value: 'communion', label: 'Communie / Lentefeest' },
    { value: 'parents-day', label: 'Vader/moederdag' },
    { value: 'other', label: 'Andere reden' }
  ];

  ngOnInit(): void {
    this.reservationForm = new FormGroup({
      'handoverDate': new FormControl(new Date().toISOString().substring(0, 10), { nonNullable: true, validators: Validators.required }), //https://stackoverflow.com/questions/45330319/angular2-setting-date-field-on-reactive-form
      'reason': new FormControl<Schema<'Occasion'> | null>(null, Validators.required)
    })
  }

  saveReservation() {
    this.wishService.addReservation(this.wish, {
      handoverDate: this.reservationForm.getRawValue().handoverDate,
      occasion: this.reservationForm.getRawValue().reason
    }).subscribe( wish => this.notificationService.showNotification(
    `Wens ${wish.title} is gereserveerd. U hoeft dit perfecte cadeau enkel nog te kopen en af te geven!`,
      'success',
      'Gereserveerd'
    ));

    this.activeModal.close();
  }

}
