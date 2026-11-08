import { Component, Input } from '@angular/core';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { Person } from 'src/app/people/models/person.model';
import { CommunicationService, MailInfo } from 'src/app/shared/services/communication.service';
import { NotificationService } from 'src/app/shared/services/notification.service';

@Component({
    selector: 'gimmi-mail-to-button',
    templateUrl: './mail-to-button.component.html',
    styleUrls: ['./mail-to-button.component.css'],
    standalone: false
})
export class MailToButtonComponent {
  @Input() url: string;
  @Input() person: Person;
  mailIcon: IconDefinition = faEnvelope;
  hideMailInfo: boolean = true;
  mailAddresses: string;
  
  constructor(
    private communicationService: CommunicationService,
    private notificationService: NotificationService
  ) { }

  send () {
    this.hideMailInfo = true;
    
    let mailTo: string[] = this.mailAddresses.split(",");
    mailTo.forEach((email ) => {
      let urlInMail: string = this.url + "?e=" + encodeURIComponent(email);
      let mailInfo: MailInfo = {
        to: email,
        subject: `[GIMMI] ${this.person.fullName} nodigt je uit.`,
        html: `<html>
        <body>Hallo,<br /> <br />
        ${this.person.fullName} nodigt je met veel plezier uit op Gimmi. Klik <a href="${urlInMail}">hier</a> of kopieer de link: ${urlInMail}<br /><br />
        Op deze manier kan je ${this.person.firstName} echt gelukkig maken met het perfecte cadeau! <br /> <br />
        En nog meer goed nieuws: als je op de link van ${this.person.firstName} klikt maken we voor jou ook dadelijk een lijstje aan. 
        Hierop kan je je eigen droomcadeau’s plaatsen en kan je tactvol aan je famillie en vrienden laten weten hoe ze jou gelukkig kunnen maken.<br /><br />
        Veel plezier!<br />Het Gimmi team</body></html>`
      }
      this.communicationService.sendMail(mailInfo);
    });
  }
}
