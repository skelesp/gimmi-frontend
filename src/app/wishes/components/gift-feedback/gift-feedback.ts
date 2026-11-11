import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import type { Schema } from 'src/app/core/api/api-types';

import { Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { CursorPointer } from '../../../shared/directives/cursor-pointer';
import { NgbRating } from '@ng-bootstrap/ng-bootstrap/rating';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-gift-feedback',
    templateUrl: './gift-feedback.html',
    styleUrls: ['./gift-feedback.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, FormsModule, ReactiveFormsModule, NgbRating, FaIconComponent]
})
export class GiftFeedback implements OnInit {
  activeModal = inject(NgbActiveModal);

  @Input() wish: Wish;
  giftFeedbackForm: FormGroup<{
    satisfaction: FormControl<number | null>;
    receivedOn: FormControl<string>;
    message: FormControl<string | null>;
    putBackOnList: FormControl<boolean>;
  }>;
  hoveredRate: number;
  selectedRate: number;
  satisfactionLevels: string[] = ['Duid je tevredenheid aan...','Helemaal niet blij', 'Niet blij', 'Neutraal', 'Blij', 'Heel blij'];
  ratingIcon = faThumbsUp;
  maxDate: string = new Date().toISOString().slice(0, 10);

  ngOnInit(): void {
    const defaultReceivedDate = new Date(this.wish.reservation.reservationDate).toISOString().slice(0, 10);
    this.giftFeedbackForm = new FormGroup({
      'satisfaction': new FormControl<number | null>(null, [Validators.required]),
      'receivedOn': new FormControl(defaultReceivedDate, { nonNullable: true, validators: [Validators.required] }),
      'message': new FormControl<string | null>(null),
      'putBackOnList': new FormControl(false, { nonNullable: true })
    });
  }

  saveGiftFeedback() {
    const giftFeedback: Schema<'FulfillmentRequest'> = {
      satisfaction: this.giftFeedbackForm.value.satisfaction,
      receivedOn: this.giftFeedbackForm.getRawValue().receivedOn,
      message: this.giftFeedbackForm.value.message,
      putBackOnList: this.giftFeedbackForm.value.putBackOnList
    };

    this.activeModal.close(giftFeedback);
  }

}
