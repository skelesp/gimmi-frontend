import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PersonToShare } from 'src/app/people/models/person.model';
import { UserService } from 'src/app/users/service/user.service';
import { CursorPointerDirective } from '../../../../shared/directives/cursor-pointer.directive';
import { CopyToClipboardButtonComponent } from '../copy-to-clipboard-button/copy-to-clipboard-button.component';
import { MailToButtonComponent } from '../mail-to-button/mail-to-button.component';
import { WhatsappButtonComponent } from '../whatsapp-button/whatsapp-button.component';

@Component({
    selector: 'gimmi-share-popup',
    templateUrl: './share-popup.component.html',
    styleUrls: ['./share-popup.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointerDirective, CopyToClipboardButtonComponent, MailToButtonComponent, WhatsappButtonComponent]
})
export class SharePopupComponent {
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
