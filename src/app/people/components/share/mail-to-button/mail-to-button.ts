import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { PersonToShare } from 'src/app/people/models/person.model';
import { CursorPointer } from '../../../../shared/directives/cursor-pointer';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap/collapse';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'gimmi-mail-to-button',
    templateUrl: './mail-to-button.html',
    styleUrls: ['./mail-to-button.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CursorPointer, FaIconComponent, NgbCollapse, FormsModule]
})
export class MailToButton {
  @Input() url: string;
  @Input() person: PersonToShare;
  mailIcon: IconDefinition = faEnvelope;
  hideMailInfo = true;
  mailAddresses: string;

  /** Opens the mail app of the visitor with the invitation filled in: API v2 has no general mail endpoint. */
  send () {
    this.hideMailInfo = true;

    const recipients = (this.mailAddresses ?? '').split(',').map(email => email.trim()).filter(email => email);
    if (!recipients.length) return;

    const subject = `[GIMMI] ${this.person.fullName} nodigt je uit.`;
    const body = [
      'Hallo,',
      '',
      `${this.person.fullName} nodigt je met veel plezier uit op Gimmi. Klik op de link of kopieer ze: ${this.url}`,
      '',
      `Op deze manier kan je ${this.person.firstName} echt gelukkig maken met het perfecte cadeau!`,
      '',
      'En nog meer goed nieuws: als je op de link van ' + this.person.firstName + ' klikt maken we voor jou ook dadelijk een lijstje aan. ' +
      'Hierop kan je je eigen droomcadeau’s plaatsen en kan je tactvol aan je familie en vrienden laten weten hoe ze jou gelukkig kunnen maken.',
      '',
      'Veel plezier!',
      'Het Gimmi team'
    ].join('\r\n');
    // The addresses go in bcc: the invited people do not see each other's address.
    this.open(`mailto:?bcc=${recipients.map(encodeURIComponent).join(',')}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  }

  protected open (mailto: string) {
    window.location.href = mailto;
  }
}
