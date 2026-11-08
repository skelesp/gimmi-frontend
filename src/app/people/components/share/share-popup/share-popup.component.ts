import { Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { Person } from 'src/app/people/models/person.model';
import { User } from 'src/app/users/models/user.model';
import { UserService } from 'src/app/users/service/user.service';
import { CursorPointerDirective } from '../../../../shared/directives/cursor-pointer.directive';
import { CopyToClipboardButtonComponent } from '../copy-to-clipboard-button/copy-to-clipboard-button.component';
import { MailToButtonComponent } from '../mail-to-button/mail-to-button.component';
import { WhatsappButtonComponent } from '../whatsapp-button/whatsapp-button.component';

@Component({
    selector: 'gimmi-share-popup',
    templateUrl: './share-popup.component.html',
    styleUrls: ['./share-popup.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [CursorPointerDirective, CopyToClipboardButtonComponent, MailToButtonComponent, WhatsappButtonComponent]
})
export class SharePopupComponent implements OnInit, OnDestroy {
  @Input() linkToShare : string;
  @Input() personToShare : Person;
  currentUser: User; currentUserSubscription: Subscription;
  message = 'Hey, op volgende link vind je mijn wensenlijst voor een cadeautje.';
  
  constructor(
    public activeModal: NgbActiveModal,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.currentUserSubscription = this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }
  
  generateMessage () : string {
    return encodeURIComponent(`${this.message} ${this.linkToShare}`);
  }
  
  ngOnDestroy(): void {
    this.currentUserSubscription.unsubscribe();
  }
}
