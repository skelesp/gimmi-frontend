import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { FormControl, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { switchMap} from 'rxjs/operators';
import { PeopleService } from 'src/app/people/service/people.service';
import { CommunicationService } from 'src/app/shared/services/communication.service';

import { IGiftFeedback, Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';
import { CursorPointerDirective } from '../../../shared/directives/cursor-pointer.directive';
import { NgbRating } from '@ng-bootstrap/ng-bootstrap/rating';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
    selector: 'gimmi-gift-feedback',
    templateUrl: './gift-feedback.component.html',
    styleUrls: ['./gift-feedback.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CursorPointerDirective, FormsModule, ReactiveFormsModule, NgbRating, FaIconComponent]
})
export class GiftFeedbackComponent implements OnInit {
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
    const giftFeedback: IGiftFeedback = {
      satisfaction: this.satisfactionLevels[this.giftFeedbackForm.value.satisfaction],
      receivedOn: new Date(this.giftFeedbackForm.getRawValue().receivedOn),
      message: this.giftFeedbackForm.value.message,
      putBackOnList: this.giftFeedbackForm.value.putBackOnList
    };

    this.activeModal.close(giftFeedback);
  }

}
