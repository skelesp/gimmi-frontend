import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { switchMap} from 'rxjs/operators';
import { PeopleService } from 'src/app/people/service/people.service';
import { CommunicationService } from 'src/app/shared/services/communication.service';

import { IGiftFeedback, Wish } from '../../models/wish.model';
import { WishService } from '../../services/wish.service';

@Component({
    selector: 'gimmi-gift-feedback',
    templateUrl: './gift-feedback.component.html',
    styleUrls: ['./gift-feedback.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GiftFeedbackComponent implements OnInit {
  @Input() wish: Wish;
  giftFeedbackForm : UntypedFormGroup;
  hoveredRate: number;
  selectedRate: number;
  satisfactionLevels: string[] = ['Duid je tevredenheid aan...','Helemaal niet blij', 'Niet blij', 'Neutraal', 'Blij', 'Heel blij'];
  ratingIcon = faThumbsUp;
  maxDate: string = new Date().toISOString().slice(0, 10);

  constructor( 
    public activeModal : NgbActiveModal
  ) { }

  ngOnInit(): void {
    const defaultReceivedDate = new Date(this.wish.reservation.reservationDate).toISOString().slice(0, 10);
    this.giftFeedbackForm = new UntypedFormGroup({
      'satisfaction': new UntypedFormControl(null, [Validators.required]),
      'receivedOn': new UntypedFormControl( defaultReceivedDate, [Validators.required]),
      'message': new UntypedFormControl(null),
      'putBackOnList': new UntypedFormControl(false)
    });
  }

  saveGiftFeedback() {
    const giftFeedback: IGiftFeedback = {
      satisfaction: this.satisfactionLevels[this.giftFeedbackForm.value.satisfaction],
      receivedOn: this.giftFeedbackForm.value.receivedOn,
      message: this.giftFeedbackForm.value.message,
      putBackOnList: this.giftFeedbackForm.value.putBackOnList
    };

    this.activeModal.close(giftFeedback);
  }

}
