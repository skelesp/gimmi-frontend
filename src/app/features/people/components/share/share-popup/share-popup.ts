import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonToShare } from 'src/app/features/people/models/person.model';
import { AuthStore } from 'src/app/core/auth/auth-store';
import { CursorPointer } from '../../../../../shared/directives/cursor-pointer';
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
  private auth = inject(AuthStore);

  @Input() linkToShare : string;
  @Input() personToShare : PersonToShare;
  readonly currentUser = this.auth.user;
  message = 'Hey, op volgende link vind je mijn wensenlijst voor een cadeautje.';

  generateMessage () : string {
    return encodeURIComponent(`${this.message} ${this.linkToShare}`);
  }
}
