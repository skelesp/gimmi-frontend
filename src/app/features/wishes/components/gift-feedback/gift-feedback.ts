import { Component, Input, OnInit, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { FormField, form, min, required, submit, validate } from '@angular/forms/signals';
import { faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import type { Schema } from 'src/app/core/api/api-types';

import { Wish } from '../../models/wish.model';
import { CursorPointer } from '../../../../shared/directives/cursor-pointer';
import { NgbRating } from '@ng-bootstrap/ng-bootstrap/rating';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-gift-feedback',
    templateUrl: './gift-feedback.html',
    styleUrls: ['./gift-feedback.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, FormField, NgbRating, FaIconComponent]
})
export class GiftFeedback implements OnInit {
  activeModal = inject(NgbActiveModal);

  @Input() wish: Wish;
  /** A satisfaction of `0` means that none was chosen yet. */
  protected readonly feedback = signal({ satisfaction: 0, receivedOn: '', message: '', putBackOnList: false });
  protected readonly maxDate: string = new Date().toISOString().slice(0, 10);
  protected readonly feedbackForm = form(this.feedback, path => {
    min(path.satisfaction, 1, { message: 'Duid aan hoe blij je bent met het cadeau.' });
    required(path.receivedOn, { message: 'De afgiftedatum moet ingevuld worden.' });
    validate(path.receivedOn, ({ value }) =>
      value() > this.maxDate ? { kind: 'future', message: 'De afgiftedatum kan niet in de toekomst liggen.' } : undefined);
  });
  protected readonly hoveredRate = signal(0);
  protected readonly satisfactionLevels: string[] = ['Duid je tevredenheid aan...','Helemaal niet blij', 'Niet blij', 'Neutraal', 'Blij', 'Heel blij'];
  protected readonly ratingIcon = faThumbsUp;

  ngOnInit(): void {
    const defaultReceivedDate = new Date(this.wish.reservation.reservationDate).toISOString().slice(0, 10);
    this.feedback.update(feedback => ({ ...feedback, receivedOn: defaultReceivedDate }));
  }

  protected setSatisfaction(rate: number): void {
    this.feedbackForm.satisfaction().value.set(rate);
    this.feedbackForm.satisfaction().markAsTouched();
  }

  protected saveGiftFeedback(event: Event): Promise<boolean> {
    event.preventDefault();
    return submit(this.feedbackForm, async () => {
      const { satisfaction, receivedOn, message, putBackOnList } = this.feedback();
      const giftFeedback: Schema<'FulfillmentRequest'> = { satisfaction, receivedOn, message: message || null, putBackOnList };
      this.activeModal.close(giftFeedback);
    });
  }

}
