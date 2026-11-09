import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonToShare } from 'src/app/people/models/person.model';
import { UserService } from 'src/app/users/service/user.service';
import { CursorPointer } from '../../../../shared/directives/cursor-pointer';
import { CopyToClipboardButton } from '../copy-to-clipboard-button/copy-to-clipboard-button';
import { MailToButton } from '../mail-to-button/mail-to-button';
import { WhatsappButton } from '../whatsapp-button/whatsapp-button';

@Component({
    selector: 'gimmi-share-popup',
    templateUrl: './share-popup.html',
    styleUrls: ['./share-popup.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, CopyToClipboardButton, MailToButton, WhatsappButton]
})
export class SharePopup {
  activeModal = inject(NgbActiveModal);
  private userService = inject(UserService);

  @Input() linkToShare : string;
  @Input() personToShare : PersonToShare;
  readonly currentUser = toSignal(this.userService.currentUser$);
  message = 'Hey, op volgende link vind je mijn wensenlijst voor een cadeautje.';

  generateMessage () : string {
    return encodeURIComponent(`${this.message} ${this.linkToShare}`);
  }
}
