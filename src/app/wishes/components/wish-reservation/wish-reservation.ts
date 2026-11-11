import { Component, Input, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormField, form, required, submit } from '@angular/forms/signals';
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
    imports: [CursorPointer, FormField]
})
export class WishReservation {
  activeModal = inject(NgbActiveModal);
  private wishService = inject(WishService);
  private notificationService = inject(NotificationService);

  @Input() wish: Wish;
  /** The occasion stays empty (`''`) until the visitor picks one. */
  protected readonly reservation = signal({
    handoverDate: new Date().toISOString().substring(0, 10),
    reason: '' as Schema<'Occasion'> | ''
  });
  protected readonly reservationForm = form(this.reservation, path => {
    required(path.handoverDate, { message: 'De overhandigingsdatum is een verplicht veld.' });
    required(path.reason, { message: 'De gelegenheid is een verplicht veld.' });
  });
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

  protected saveReservation(event: Event): Promise<boolean> {
    event.preventDefault();
    return submit(this.reservationForm, async () => {
      const { handoverDate, reason } = this.reservation();
      this.wishService.addReservation(this.wish, { handoverDate, occasion: reason as Schema<'Occasion'> }).subscribe(wish =>
        this.notificationService.showNotification(
          `Wens ${wish.title} is gereserveerd. U hoeft dit perfecte cadeau enkel nog te kopen en af te geven!`,
          'success',
          'Gereserveerd'
        ));
      this.activeModal.close();
    });
  }

}
